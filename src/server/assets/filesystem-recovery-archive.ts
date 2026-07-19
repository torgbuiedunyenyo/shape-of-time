import { randomUUID } from "node:crypto";
import { link, lstat, mkdir, open, readFile, readdir, realpath, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { assertMediaType, contentAddress, type AssetStore } from "./asset-store.js";
import { canonicalJson, digestJson, sha256 } from "../domain/digests.js";

export interface RecoveryReceipt {
  archiveId: string;
  byteLength: number;
  digest: string;
  key: string;
  mediaType: string;
  schema: "shape-of-time.asset-recovery.v1";
}

export interface RecoveryProof extends RecoveryReceipt {
  receiptDigest: string;
}

export interface RecoverySnapshot {
  archiveId: string;
  entries: RecoveryProof[];
  manifestDigest: string;
  schema: "shape-of-time.asset-recovery-snapshot.v1";
}

interface RecoveryArchiveIdentity {
  archiveId: string;
  schema: "shape-of-time.asset-recovery-archive.v1";
}

export class FilesystemRecoveryArchive {
  readonly archiveId: string;
  readonly #allowTemporaryRoot: boolean;
  readonly #configuredRoot: string;
  readonly #projectRoot: string;

  constructor(options: {
    allowTemporaryRoot?: boolean;
    archiveId: string;
    projectRoot?: string;
    root: string;
  }) {
    if (options.archiveId.trim().length === 0) throw new Error("recovery archive ID cannot be empty");
    if (!path.isAbsolute(options.root)) throw new Error("recovery archive root must be absolute");
    this.#configuredRoot = path.resolve(options.root);
    this.#projectRoot = path.resolve(options.projectRoot ?? process.cwd());
    this.#allowTemporaryRoot = options.allowTemporaryRoot === true;
    assertNoOverlap(
      this.#configuredRoot,
      this.#projectRoot,
      "paid recovery archive must be outside the project worktree and cannot contain it",
    );
    if (!this.#allowTemporaryRoot) {
      assertNoOverlap(
        this.#configuredRoot,
        path.resolve(tmpdir()),
        "paid recovery archive cannot overlap the system temporary directory",
      );
    }
    this.archiveId = options.archiveId;
  }

  async archive(bytes: Uint8Array, mediaType: string): Promise<RecoveryProof> {
    assertMediaType(mediaType);
    const root = await this.resolveRoot();
    const digest = sha256(bytes);
    const key = contentAddress(digest);
    const receipt: RecoveryReceipt = {
      archiveId: this.archiveId,
      byteLength: bytes.byteLength,
      digest,
      key,
      mediaType,
      schema: "shape-of-time.asset-recovery.v1",
    };
    const receiptDigest = digestJson(receipt);
    await writeImmutable(this.#objectPath(root, key), bytes, root);
    await writeImmutable(
      this.#receiptPath(root, key),
      new TextEncoder().encode(`${canonicalJson(receipt)}\n`),
      root,
    );
    const proof = { ...receipt, receiptDigest };
    await this.verify(proof);
    return proof;
  }

  async verify(proof: RecoveryProof): Promise<void> {
    const root = await this.resolveRoot();
    await this.#readVerified(root, proof);
  }

  async read(proof: RecoveryProof): Promise<Uint8Array> {
    const root = await this.resolveRoot();
    return this.#readVerified(root, proof);
  }

  async #readVerified(root: string, proof: RecoveryProof): Promise<Uint8Array> {
    if (proof.archiveId !== this.archiveId || proof.schema !== "shape-of-time.asset-recovery.v1") {
      throw new Error("recovery proof belongs to a different archive or schema");
    }
    if (
      !Number.isInteger(proof.byteLength) ||
      proof.byteLength < 0 ||
      typeof proof.digest !== "string" ||
      typeof proof.key !== "string" ||
      typeof proof.mediaType !== "string" ||
      typeof proof.receiptDigest !== "string"
    ) {
      throw new Error("recovery proof fields are invalid");
    }
    assertMediaType(proof.mediaType);
    if (contentAddress(proof.digest) !== proof.key) throw new Error("recovery proof key does not match digest");
    let receiptBytes: Buffer;
    try {
      receiptBytes = await readImmutableFile(this.#receiptPath(root, proof.key), root);
    } catch (cause) {
      throw new Error(`recovery receipt is missing or unreadable: ${proof.key}`, { cause });
    }
    let receipt: RecoveryReceipt;
    try {
      receipt = JSON.parse(receiptBytes.toString("utf8")) as RecoveryReceipt;
    } catch (cause) {
      throw new Error("recovery receipt is invalid JSON", { cause });
    }
    if (
      digestJson(receipt) !== proof.receiptDigest ||
      `${canonicalJson(receipt)}\n` !== receiptBytes.toString("utf8") ||
      canonicalJson(receipt) !== canonicalJson(stripProof(proof))
    ) {
      throw new Error("recovery receipt digest, encoding, or metadata does not match proof");
    }
    let bytes: Buffer;
    try {
      bytes = await readImmutableFile(this.#objectPath(root, proof.key), root);
    } catch (cause) {
      throw new Error(`recovery object is missing or unreadable: ${proof.key}`, { cause });
    }
    if (sha256(bytes) !== proof.digest) throw new Error("recovery object digest does not match receipt");
    if (bytes.byteLength !== proof.byteLength) throw new Error("recovery object length does not match receipt");
    return new Uint8Array(bytes);
  }

  async snapshot(): Promise<RecoverySnapshot> {
    const root = await this.resolveRoot();
    const entries = await this.#listProofs(root);
    entries.sort((left, right) => left.digest.localeCompare(right.digest));
    if (new Set(entries.map(({ digest }) => digest)).size !== entries.length) {
      throw new Error("recovery snapshot contains duplicate proofs");
    }
    const base = {
      archiveId: this.archiveId,
      entries,
      schema: "shape-of-time.asset-recovery-snapshot.v1" as const,
    };
    return { ...base, manifestDigest: digestJson(base) };
  }

  async restore(snapshot: RecoverySnapshot, target: AssetStore): Promise<void> {
    const base = { archiveId: snapshot.archiveId, entries: snapshot.entries, schema: snapshot.schema };
    if (
      snapshot.archiveId !== this.archiveId ||
      snapshot.schema !== "shape-of-time.asset-recovery-snapshot.v1" ||
      digestJson(base) !== snapshot.manifestDigest
    ) {
      throw new Error("recovery snapshot digest or archive does not match");
    }
    const digests = snapshot.entries.map(({ digest }) => digest);
    if (new Set(digests).size !== digests.length || digests.some((digest, index) => index > 0 && digest <= digests[index - 1]!)) {
      throw new Error("recovery snapshot entries must be unique and sorted by digest");
    }
    for (const proof of snapshot.entries) await this.restoreProof(proof, target);
  }

  async restoreProof(proof: RecoveryProof, target: AssetStore): Promise<void> {
    const bytes = await this.read(proof);
    const stored = await target.put(bytes, { mediaType: proof.mediaType });
    if (
      stored.digest !== proof.digest ||
      stored.key !== proof.key ||
      stored.byteLength !== proof.byteLength ||
      stored.mediaType !== proof.mediaType
    ) {
      throw new Error(`restored asset metadata mismatch: ${proof.key}`);
    }
    const roundTrip = await target.get(stored.key);
    if (sha256(roundTrip) !== proof.digest || roundTrip.byteLength !== proof.byteLength) {
      throw new Error(`restored asset failed round-trip verification: ${proof.key}`);
    }
  }

  /** Resolves and revalidates the canonical root for co-located immutable operation records. */
  resolveRoot(): Promise<string> {
    return this.#resolveRoot();
  }

  async #resolveRoot(): Promise<string> {
    const existingAncestor = await findExistingAncestor(this.#configuredRoot);
    const [canonicalExistingAncestor, projectRoot, temporaryRoot] = await Promise.all([
      realpath(existingAncestor),
      realpath(this.#projectRoot),
      realpath(tmpdir()),
    ]);
    const relative = path.relative(existingAncestor, this.#configuredRoot);
    if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error("recovery archive root escaped its existing ancestor");
    }
    const proposedRoot = path.resolve(canonicalExistingAncestor, relative);
    assertNoOverlap(
      proposedRoot,
      projectRoot,
      "paid recovery archive must be outside the project worktree and cannot contain it",
    );
    if (!this.#allowTemporaryRoot) {
      assertNoOverlap(proposedRoot, temporaryRoot, "paid recovery archive cannot overlap the system temporary directory");
    }
    await ensureCanonicalDirectoryChain(proposedRoot, canonicalExistingAncestor);
    const root = await realpath(this.#configuredRoot);
    if (root !== proposedRoot) throw new Error("recovery archive root did not resolve to its validated canonical path");
    const configuredStat = await lstat(this.#configuredRoot);
    if (configuredStat.isSymbolicLink()) throw new Error("recovery archive root cannot be a symlink");
    await syncDirectoryChainTo(root, canonicalExistingAncestor);
    const identity: RecoveryArchiveIdentity = {
      archiveId: this.archiveId,
      schema: "shape-of-time.asset-recovery-archive.v1",
    };
    const identityPath = path.join(root, "archive.json");
    let identityBytes: Buffer;
    try {
      identityBytes = await readImmutableFile(identityPath, root);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const existingEntries = await readdir(root, { withFileTypes: true });
      if (existingEntries.some((entry) => entry.name === "archive.json")) {
        identityBytes = await readImmutableFile(identityPath, root);
      } else {
        const onlyConcurrentIdentityStaging = existingEntries.every(
          (entry) => entry.isFile() && isArchiveIdentityStagingName(entry.name),
        );
        if (!onlyConcurrentIdentityStaging) {
          throw new Error("nonempty recovery archive is missing its immutable identity", { cause: error });
        }
        await writeImmutable(identityPath, new TextEncoder().encode(`${canonicalJson(identity)}\n`), root);
        identityBytes = await readImmutableFile(identityPath, root);
      }
    }
    if (`${canonicalJson(identity)}\n` !== identityBytes.toString("utf8")) {
      throw new Error("recovery archive identity does not match this archive ID");
    }
    return root;
  }

  async #listProofs(root: string): Promise<RecoveryProof[]> {
    await assertRecoveryNamespace(root);
    const objectDigests = await listInventoryDigests(path.join(root, "objects", "sha256"), "object", root);
    const receiptDigests = await listInventoryDigests(path.join(root, "receipts", "sha256"), "receipt", root);
    const missingReceipts = objectDigests.filter((digest) => !receiptDigests.includes(digest));
    const missingObjects = receiptDigests.filter((digest) => !objectDigests.includes(digest));
    if (missingReceipts.length > 0 || missingObjects.length > 0) {
      throw new Error(
        `recovery inventory object/receipt mismatch: missing receipts=${missingReceipts.join(",") || "none"}; missing objects=${missingObjects.join(",") || "none"}`,
      );
    }

    const proofs: RecoveryProof[] = [];
    for (const digest of receiptDigests) {
      const key = contentAddress(digest);
      let receipt: RecoveryReceipt;
      try {
        receipt = JSON.parse((await readImmutableFile(this.#receiptPath(root, key), root)).toString("utf8")) as RecoveryReceipt;
      } catch (cause) {
        throw new Error(`recovery receipt is invalid JSON: ${key}`, { cause });
      }
      if (receipt.digest !== digest || receipt.key !== key) {
        throw new Error(`recovery receipt does not match its inventory digest filename: ${key}`);
      }
      const proof = { ...receipt, receiptDigest: digestJson(receipt) };
      await this.#readVerified(root, proof);
      proofs.push(proof);
    }
    return proofs;
  }

  #objectPath(root: string, key: string): string {
    return path.join(root, "objects", key);
  }

  #receiptPath(root: string, key: string): string {
    return path.join(root, "receipts", `${key}.json`);
  }
}

async function assertRecoveryNamespace(root: string): Promise<void> {
  const allowedRootEntries = new Set(["archive.json", "objects", "operations", "receipts"]);
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (!allowedRootEntries.has(entry.name)) throw new Error(`unexpected recovery inventory namespace: ${entry.name}`);
    if (entry.name === "archive.json") {
      if (!entry.isFile()) throw new Error("recovery archive identity is not a regular file");
    } else if (!entry.isDirectory()) {
      throw new Error(`recovery inventory namespace is not a directory: ${entry.name}`);
    }
  }
  for (const container of ["objects", "receipts"] as const) {
    const directory = path.join(root, container);
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      if (entry.name !== "sha256" || !entry.isDirectory()) {
        throw new Error(`unexpected ${container} recovery inventory namespace: ${entry.name}`);
      }
    }
  }
}

/**
 * Publishes fully written bytes at a final path without overwriting. The hard link is the atomic
 * visibility point; both file contents and the containing directory are synced before success.
 */
export async function createImmutableFile(
  destination: string,
  bytes: Uint8Array,
  durableRoot: string,
): Promise<boolean> {
  const directory = path.dirname(destination);
  await ensureCanonicalDirectoryChain(directory, durableRoot);
  await syncDirectoryChain(directory, durableRoot);
  const temporary = path.join(directory, `.${path.basename(destination)}.${process.pid}.${randomUUID()}.tmp`);
  let created = false;
  try {
    const handle = await open(temporary, "wx", 0o600);
    try {
      await handle.writeFile(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
    try {
      await ensureCanonicalDirectoryChain(directory, durableRoot);
      await link(temporary, destination);
      created = true;
      await syncDirectory(directory);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  } finally {
    await unlink(temporary).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    await syncDirectory(directory);
  }
  return created;
}

export async function writeImmutable(
  destination: string,
  bytes: Uint8Array,
  durableRoot: string,
): Promise<void> {
  if (await createImmutableFile(destination, bytes, durableRoot)) return;
  const existing = await readImmutableFile(destination, durableRoot);
  if (!Buffer.from(existing).equals(Buffer.from(bytes))) {
    throw new Error(`immutable recovery entry already exists with different content: ${destination}`);
  }
}

function stripProof(proof: RecoveryProof): RecoveryReceipt {
  return {
    archiveId: proof.archiveId,
    byteLength: proof.byteLength,
    digest: proof.digest,
    key: proof.key,
    mediaType: proof.mediaType,
    schema: proof.schema,
  };
}

async function listInventoryDigests(
  root: string,
  kind: "object" | "receipt",
  durableRoot: string,
): Promise<string[]> {
  let prefixes;
  try {
    await assertCanonicalExistingDirectory(root, durableRoot);
    prefixes = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const digests: string[] = [];
  for (const prefix of prefixes.sort((left, right) => left.name.localeCompare(right.name))) {
    if (!prefix.isDirectory() || !/^[a-f0-9]{2}$/.test(prefix.name)) {
      throw new Error(`unexpected ${kind} recovery inventory entry: ${prefix.name}`);
    }
    const directory = path.join(root, prefix.name);
    await assertCanonicalExistingDirectory(directory, durableRoot);
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      const fileName = kind === "receipt" && entry.name.endsWith(".json") ? entry.name.slice(0, -5) : entry.name;
      if (!entry.isFile() || !/^[a-f0-9]{64}$/.test(fileName) || !fileName.startsWith(prefix.name)) {
        throw new Error(`unexpected ${kind} recovery inventory entry: ${prefix.name}/${entry.name}`);
      }
      digests.push(fileName);
    }
  }
  return digests.sort((left, right) => left.localeCompare(right));
}

async function syncDirectoryChain(directory: string, durableRoot: string): Promise<void> {
  const resolvedRoot = path.resolve(durableRoot);
  let current = path.resolve(directory);
  if (!isWithin(current, resolvedRoot)) throw new Error("immutable recovery destination escaped its durable root");
  for (;;) {
    await syncDirectory(current);
    if (current === resolvedRoot) break;
    current = path.dirname(current);
  }
}

async function syncDirectoryChainTo(directory: string, ancestor: string): Promise<void> {
  const resolvedAncestor = path.resolve(ancestor);
  let current = path.resolve(directory);
  if (!isWithin(current, resolvedAncestor)) {
    throw new Error("new recovery directory escaped its pre-existing ancestor");
  }
  for (;;) {
    await syncDirectory(current);
    if (current === resolvedAncestor) break;
    current = path.dirname(current);
  }
}

async function findExistingAncestor(candidate: string): Promise<string> {
  let current = path.resolve(candidate);
  for (;;) {
    try {
      const stat = await lstat(current);
      if (!stat.isDirectory() && !stat.isSymbolicLink()) {
        throw new Error(`recovery archive ancestor is not a directory: ${current}`);
      }
      return current;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const parent = path.dirname(current);
      if (parent === current) throw error;
      current = parent;
    }
  }
}

async function ensureCanonicalDirectoryChain(directory: string, durableRoot: string): Promise<void> {
  const root = path.resolve(durableRoot);
  const target = path.resolve(directory);
  if (!isWithin(target, root)) throw new Error("immutable recovery destination escaped its durable root");
  await assertCanonicalExistingDirectory(root, root);
  const relative = path.relative(root, target);
  let current = root;
  for (const segment of relative === "" ? [] : relative.split(path.sep)) {
    current = path.join(current, segment);
    let created = false;
    try {
      await mkdir(current);
      created = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
    await assertCanonicalExistingDirectory(current, root);
    if (created) {
      await syncDirectory(current);
      await syncDirectory(path.dirname(current));
    }
  }
}

async function assertCanonicalExistingDirectory(directory: string, durableRoot: string): Promise<void> {
  const stat = await lstat(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error(`recovery archive path is not a canonical directory: ${directory}`);
  }
  const canonical = await realpath(directory);
  if (canonical !== path.resolve(directory) || !isWithin(canonical, path.resolve(durableRoot))) {
    throw new Error(`recovery archive directory escaped through a symlink: ${directory}`);
  }
}

export async function readImmutableFile(file: string, durableRoot: string): Promise<Buffer> {
  const root = path.resolve(durableRoot);
  const resolvedFile = path.resolve(file);
  if (!isWithin(resolvedFile, root)) throw new Error("immutable recovery file escaped its durable root");
  await assertCanonicalExistingDirectory(path.dirname(resolvedFile), root);
  const stat = await lstat(resolvedFile);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`immutable recovery entry is not a regular file: ${resolvedFile}`);
  }
  const canonical = await realpath(resolvedFile);
  if (!isWithin(canonical, root)) throw new Error(`immutable recovery entry escaped through a symlink: ${resolvedFile}`);
  return readFile(resolvedFile);
}

async function syncDirectory(directory: string): Promise<void> {
  const handle = await open(directory, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function assertNoOverlap(candidate: string, protectedRoot: string, message: string): void {
  if (isWithin(candidate, protectedRoot) || isWithin(protectedRoot, candidate)) throw new Error(message);
}

function isArchiveIdentityStagingName(name: string): boolean {
  return /^\.archive\.json\.[0-9]+\.[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.tmp$/i.test(
    name,
  );
}

function isWithin(candidate: string, parent: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}
