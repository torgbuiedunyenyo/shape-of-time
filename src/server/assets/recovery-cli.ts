import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";

import { FilesystemRecoveryArchive } from "./filesystem-recovery-archive.js";
import { RecoverableImageStore } from "./recoverable-image-store.js";
import { contentAddress, type AssetStore, type PutAssetOptions, type StoredAsset } from "./asset-store.js";
import { type S3AssetStoreOptions } from "./s3-asset-store.js";
import { sha256 } from "../domain/digests.js";

interface Arguments {
  archiveId: string;
  command: "smoke";
}

async function main(): Promise<void> {
  const arguments_ = readArguments(process.argv.slice(2));
  const s3 = readS3Options(process.env);
  const ownedRoot = await mkdtemp(path.join(tmpdir(), "shape-of-time-recovery-smoke."));
  try {
    await runSmoke(arguments_, s3, ownedRoot);
  } finally {
    await rm(ownedRoot, { force: true, recursive: true });
  }
}

async function runSmoke(arguments_: Arguments, s3: S3AssetStoreOptions, ownedRoot: string): Promise<void> {
  const client = createS3Client(s3);
  const primary = new OwnedSmokeAssetStore(client, s3.bucket);
  const recovery = new FilesystemRecoveryArchive({
    allowTemporaryRoot: true,
    archiveId: arguments_.archiveId,
    root: ownedRoot,
  });
  const baseline = await listKeys(client, s3.bucket);
  const bytes = new TextEncoder().encode(`shape-of-time recovery smoke ${randomUUID()}`);
  const digest = sha256(bytes);
  const key = `sha256/${digest.slice(0, 2)}/${digest}`;
  if (baseline.includes(key)) throw new Error("synthetic recovery key already exists in the Railway bucket baseline");
  try {
    const protectedStore = new RecoverableImageStore({ primary, recovery });
    const retained = await protectedStore.retainApproved(bytes, "application/vnd.shape-of-time.synthetic-smoke");
    if (retained.primary.key !== key) throw new Error("synthetic smoke stored under an unexpected key");
    const snapshot = await recovery.snapshot();
    if (snapshot.entries.length !== 1 || snapshot.entries[0]?.receiptDigest !== retained.recovery.receiptDigest) {
      throw new Error("synthetic smoke archive did not contain exactly its retained recovery proof");
    }

    await primary.deleteOwned(key);
    await recovery.restoreProof(retained.recovery, primary);
    const roundTrip = await primary.get(key);
    if (sha256(roundTrip) !== digest || roundTrip.byteLength !== bytes.byteLength) {
      throw new Error("restored synthetic object failed digest and length verification");
    }
  } finally {
    await primary.deleteOwned(key);
  }
  const final = await listKeys(client, s3.bucket);
  if (baseline.join("\n") !== final.join("\n")) {
    throw new Error("Railway bucket did not return to its exact baseline after recovery smoke");
  }
  process.stdout.write(
    `${JSON.stringify({ baselineObjects: baseline.length, finalObjects: final.length, restored: true, syntheticDigest: digest })}\n`,
  );
}

class OwnedSmokeAssetStore implements AssetStore {
  readonly driver = "s3" as const;
  readonly #bucket: string;
  readonly #client: S3Client;
  readonly #ownedEtags = new Map<string, string>();

  constructor(client: S3Client, bucket: string) {
    this.#client = client;
    this.#bucket = bucket;
  }

  async put(bytes: Uint8Array, options: PutAssetOptions): Promise<StoredAsset> {
    const digest = sha256(bytes);
    const key = contentAddress(digest);
    const response = await this.#client.send(
      new PutObjectCommand({
        Body: bytes,
        Bucket: this.#bucket,
        ContentType: options.mediaType,
        IfNoneMatch: "*",
        Key: key,
        Metadata: { sha256: digest, smoke_owner: "shape-of-time-recovery-cli" },
      }),
    );
    if (response.ETag === undefined || response.ETag.length === 0) {
      throw new Error("Railway bucket did not return an ETag for the owned smoke object; safe cleanup is impossible");
    }
    this.#ownedEtags.set(key, response.ETag);
    return { byteLength: bytes.byteLength, digest, key, mediaType: options.mediaType };
  }

  async get(key: string): Promise<Uint8Array> {
    const response = await this.#client.send(new GetObjectCommand({ Bucket: this.#bucket, Key: key }));
    if (response.Body === undefined) throw new Error(`owned smoke asset body missing: ${key}`);
    return response.Body.transformToByteArray();
  }

  async createReadUrl(): Promise<string> {
    throw new Error("owned recovery smoke store does not issue read URLs");
  }

  async deleteOwned(key: string): Promise<void> {
    const etag = this.#ownedEtags.get(key);
    if (etag === undefined) return;
    await this.#client.send(new DeleteObjectCommand({ Bucket: this.#bucket, IfMatch: etag, Key: key }));
    this.#ownedEtags.delete(key);
  }
}

export function readArguments(values: string[]): Arguments {
  if (values[0] === "--") values = values.slice(1);
  const [command, ...rest] = values;
  if (command !== "smoke") throw new Error("usage: assets:recovery smoke --archive-id ID");
  const parsed = new Map<string, string>();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (key === undefined || value === undefined || !key.startsWith("--")) {
      throw new Error("recovery smoke arguments must be --name value pairs");
    }
    parsed.set(key, value);
  }
  const archiveId = parsed.get("--archive-id");
  if (archiveId === undefined || parsed.size !== 1) throw new Error("recovery smoke requires only --archive-id");
  return { archiveId, command };
}

export function readS3Options(environment: NodeJS.ProcessEnv): S3AssetStoreOptions {
  const keys = ["S3_ACCESS_KEY_ID", "S3_BUCKET", "S3_ENDPOINT", "S3_REGION", "S3_SECRET_ACCESS_KEY"] as const;
  for (const key of keys) {
    if (environment[key]?.trim().length === 0 || environment[key] === undefined) {
      throw new Error(`${key} is required for the recovery smoke`);
    }
  }
  let endpoint: URL;
  try {
    endpoint = new URL(environment.S3_ENDPOINT!);
  } catch (cause) {
    throw new Error("S3_ENDPOINT must be a valid HTTPS URL", { cause });
  }
  if (endpoint.protocol !== "https:" || endpoint.username.length > 0 || endpoint.password.length > 0) {
    throw new Error("S3_ENDPOINT must use HTTPS and cannot contain credentials");
  }
  return {
    accessKeyId: environment.S3_ACCESS_KEY_ID!,
    bucket: environment.S3_BUCKET!,
    endpoint: endpoint.toString().replace(/\/$/, ""),
    region: environment.S3_REGION!,
    secretAccessKey: environment.S3_SECRET_ACCESS_KEY!,
  };
}

function createS3Client(options: S3AssetStoreOptions): S3Client {
  const config: S3ClientConfig = {
    credentials: { accessKeyId: options.accessKeyId, secretAccessKey: options.secretAccessKey },
    endpoint: options.endpoint,
    region: options.region,
  };
  return new S3Client(config);
}

async function listKeys(client: S3Client, bucket: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  const seenTokens = new Set<string>();
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ...(continuationToken === undefined ? {} : { ContinuationToken: continuationToken }),
      }),
    );
    for (const object of response.Contents ?? []) if (object.Key !== undefined) keys.push(object.Key);
    if (response.IsTruncated === true) {
      const next = response.NextContinuationToken;
      if (next === undefined || next.length === 0 || seenTokens.has(next)) {
        throw new Error("Railway bucket listing returned an invalid continuation token");
      }
      seenTokens.add(next);
      continuationToken = next;
    } else {
      continuationToken = undefined;
    }
  } while (continuationToken !== undefined);
  return keys.sort((left, right) => left.localeCompare(right));
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) await main();
