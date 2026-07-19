import { access, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { sha256 } from "../domain/digests.js";
import { FilesystemAssetStore } from "./filesystem-asset-store.js";
import { FilesystemRecoveryArchive } from "./filesystem-recovery-archive.js";
import { RecoverableImageStore } from "./recoverable-image-store.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

async function temporaryRoot(label: string): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), `shape-of-time-${label}-`));
  roots.push(root);
  return root;
}

describe("external image recovery archive", () => {
  it("writes immutable content and a deterministic receipt, then verifies a repeated archive", async () => {
    const root = await temporaryRoot("recovery");
    const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-test", root });
    const bytes = new TextEncoder().encode("paid image bytes");

    const first = await archive.archive(bytes, "image/png");
    const second = await archive.archive(bytes, "image/png");

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      archiveId: "owner-test",
      byteLength: bytes.byteLength,
      digest: sha256(bytes),
      mediaType: "image/png",
      schema: "shape-of-time.asset-recovery.v1",
    });
    await expect(archive.verify(first)).resolves.toBeUndefined();
  });

  it("initializes one archive identity atomically under concurrent first use", async () => {
    const stagedRoot = await temporaryRoot("concurrent-identity-staging");
    const stagingPath = path.join(
      stagedRoot,
      ".archive.json.99999.00000000-0000-4000-8000-000000000000.tmp",
    );
    await writeFile(
      stagingPath,
      '{"archiveId":"owner-test","schema":"shape-of-time.asset-recovery-archive.v1"}\n',
    );
    const stagedArchive = new FilesystemRecoveryArchive({
      allowTemporaryRoot: true,
      archiveId: "owner-test",
      root: stagedRoot,
    });
    await expect(stagedArchive.resolveRoot()).resolves.toBe(await realpath(stagedRoot));
    await rm(stagingPath);

    const failures: PromiseRejectedResult[] = [];
    for (let round = 0; round < 12; round += 1) {
      const root = await temporaryRoot(`concurrent-identity-${round}`);
      const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-test", root });
      const attempts = await Promise.allSettled(
        Array.from({ length: 8 }, (_, index) =>
          archive.archive(new TextEncoder().encode(`concurrent image ${round}-${index}`), "image/png"),
        ),
      );
      failures.push(...attempts.filter((attempt): attempt is PromiseRejectedResult => attempt.status === "rejected"));
      if (failures.length === 0) expect((await archive.snapshot()).entries).toHaveLength(8);
    }

    expect(failures).toEqual([]);
  }, 60_000);

  it("rejects tampered object bytes and receipts", async () => {
    const root = await temporaryRoot("recovery");
    const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-test", root });
    const proof = await archive.archive(new TextEncoder().encode("original"), "image/png");
    const objectPath = path.join(root, "objects", proof.key);
    await writeFile(objectPath, "tampered");
    await expect(archive.verify(proof)).rejects.toThrow(/recovery object digest/);

    const fresh = await archive.archive(new TextEncoder().encode("second"), "image/png");
    const receiptPath = path.join(root, "receipts", `${fresh.key}.json`);
    const receipt = JSON.parse(await readFile(receiptPath, "utf8")) as Record<string, unknown>;
    receipt.mediaType = "image/jpeg";
    await writeFile(receiptPath, JSON.stringify(receipt));
    await expect(archive.verify(fresh)).rejects.toThrow(/recovery receipt digest/);
  });

  it("builds a stable sorted snapshot and restores exact bytes to a clean target", async () => {
    const root = await temporaryRoot("recovery");
    const targetRoot = await temporaryRoot("restored");
    const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-test", root });
    const second = await archive.archive(new TextEncoder().encode("second"), "image/png");
    const first = await archive.archive(new TextEncoder().encode("first"), "image/png");

    const snapshotA = await archive.snapshot();
    const snapshotB = await archive.snapshot();
    expect(snapshotA).toEqual(snapshotB);
    expect(snapshotA.entries.map(({ digest }) => digest)).toEqual(
      [first.digest, second.digest].sort((left, right) => left.localeCompare(right)),
    );

    const target = new FilesystemAssetStore(targetRoot);
    await archive.restore(snapshotA, target);
    await expect(target.get(first.key)).resolves.toEqual(new TextEncoder().encode("first"));
    await expect(target.get(second.key)).resolves.toEqual(new TextEncoder().encode("second"));
  });

  it("fails an archive inventory audit when either side of an object and receipt pair is missing", async () => {
    const root = await temporaryRoot("recovery");
    const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-test", root });
    const orphanedObject = await archive.archive(new TextEncoder().encode("object only after crash"), "image/png");

    await rm(path.join(root, "receipts", `${orphanedObject.key}.json`));
    await expect(archive.snapshot()).rejects.toThrow(/inventory.*object.*receipt|receipt.*object/i);

    const secondRoot = await temporaryRoot("recovery");
    const secondArchive = new FilesystemRecoveryArchive({
      allowTemporaryRoot: true,
      archiveId: "owner-test",
      root: secondRoot,
    });
    const orphanedReceipt = await secondArchive.archive(new TextEncoder().encode("receipt only after loss"), "image/png");
    await rm(path.join(secondRoot, "objects", orphanedReceipt.key));
    await expect(secondArchive.snapshot()).rejects.toThrow(/inventory.*object.*receipt|receipt.*object/i);
  });

  it("refuses a paid archive inside the repository or system temporary directory", () => {
    expect(
      () =>
        new FilesystemRecoveryArchive({
          archiveId: "unsafe",
          projectRoot: process.cwd(),
          root: path.join(process.cwd(), ".local", "recovery"),
        }),
    ).toThrow(/outside the project worktree/);
    expect(
      () =>
        new FilesystemRecoveryArchive({
          archiveId: "unsafe",
          projectRoot: process.cwd(),
          root: path.join(tmpdir(), "paid-recovery"),
        }),
    ).toThrow(/temporary directory/);
    expect(
      () =>
        new FilesystemRecoveryArchive({
          archiveId: "unsafe",
          projectRoot: process.cwd(),
          root: path.dirname(process.cwd()),
        }),
    ).toThrow(/overlap.*project worktree|outside the project worktree/i);
    expect(
      () =>
        new FilesystemRecoveryArchive({
          archiveId: "unsafe",
          projectRoot: process.cwd(),
          root: path.parse(process.cwd()).root,
        }),
    ).toThrow(/overlap.*project worktree|outside the project worktree/i);
  });

  it("resolves symlinks before accepting an external paid archive location", async () => {
    const temporaryTarget = await temporaryRoot("symlink-target");
    const externalParent = await mkdtemp(path.join(path.dirname(process.cwd()), ".shape-of-time-recovery-link-"));
    roots.push(externalParent);
    const linkedRoot = path.join(externalParent, "paid-archive");
    await symlink(temporaryTarget, linkedRoot, "dir");

    const archive = new FilesystemRecoveryArchive({ archiveId: "unsafe", root: linkedRoot });
    await expect(archive.snapshot()).rejects.toThrow(/temporary directory/);
  });

  it("rejects symlinked descendants instead of writing outside the canonical archive root", async () => {
    const root = await temporaryRoot("descendant-symlink-root");
    const outside = await temporaryRoot("descendant-symlink-target");
    const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-test", root });
    await archive.resolveRoot();
    await symlink(outside, path.join(root, "objects"), "dir");

    await expect(archive.archive(new TextEncoder().encode("must remain inside"), "image/png")).rejects.toThrow(
      /symlink|canonical|escaped/i,
    );
    await expect(access(path.join(outside, "sha256"))).rejects.toThrow();
  });

  it("locks one immutable archive identity to each recovery root", async () => {
    const root = await temporaryRoot("archive-identity");
    const first = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-one", root });
    const second = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-two", root });

    await first.archive(new TextEncoder().encode("first"), "image/png");
    await expect(second.archive(new TextEncoder().encode("second"), "image/png")).rejects.toThrow(/archive.*identity|different content/i);
    await expect(first.snapshot()).resolves.toMatchObject({ archiveId: "owner-one" });
  });

  it("revalidates archive identity on every operation instead of trusting a cached root", async () => {
    const root = await temporaryRoot("archive-identity-revalidation");
    const first = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-one", root });
    await first.resolveRoot();
    await rm(path.join(root, "archive.json"));
    const replacement = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-two", root });
    await replacement.resolveRoot();

    await expect(first.archive(new TextEncoder().encode("wrong owner"), "image/png")).rejects.toThrow(
      /identity|different content/i,
    );
  });

  it("rejects a canonical overlap before creating through an intermediate symlink", async () => {
    const external = await temporaryRoot("canonical-external");
    const protectedRoot = await temporaryRoot("canonical-protected");
    const alias = path.join(external, "alias");
    await symlink(protectedRoot, alias, "dir");
    const archive = new FilesystemRecoveryArchive({
      allowTemporaryRoot: true,
      archiveId: "unsafe",
      projectRoot: protectedRoot,
      root: path.join(alias, "created-before-reject"),
    });

    await expect(archive.resolveRoot()).rejects.toThrow(/outside the project worktree|overlap/i);
    await expect(access(path.join(protectedRoot, "created-before-reject"))).rejects.toThrow();
  });

  it("rejects residue outside the exact object and receipt namespaces", async () => {
    const root = await temporaryRoot("namespace-residue");
    const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-test", root });
    await archive.archive(new TextEncoder().encode("valid"), "image/png");
    await writeFile(path.join(root, "objects", "stray"), "residue");

    await expect(archive.snapshot()).rejects.toThrow(/unexpected.*inventory|namespace/i);
  });

  it("binds each parsed receipt to its inventory filename and rejects duplicate proofs", async () => {
    const root = await temporaryRoot("receipt-inventory-binding");
    const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "owner-test", root });
    const first = await archive.archive(new TextEncoder().encode("first"), "image/png");
    const second = await archive.archive(new TextEncoder().encode("second"), "image/png");
    const secondReceipt = await readFile(path.join(root, "receipts", `${second.key}.json`));
    await writeFile(path.join(root, "receipts", `${first.key}.json`), secondReceipt);

    await expect(archive.snapshot()).rejects.toThrow(/receipt.*inventory|digest.*filename|duplicate/i);
  });
});

describe("protected paid image storage", () => {
  it("never calls the primary store when archival fails", async () => {
    const badRoot = path.join(await temporaryRoot("bad-recovery-parent"), "not-a-directory");
    await writeFile(badRoot, "blocking file");
    const primaryRoot = await temporaryRoot("primary");
    const recovery = new FilesystemRecoveryArchive({
      allowTemporaryRoot: true,
      archiveId: "synthetic-test",
      root: badRoot,
    });
    const primary = new FilesystemAssetStore(primaryRoot);
    const store = new RecoverableImageStore({ primary, recovery });
    const bytes = new TextEncoder().encode("candidate");

    await expect(store.retainApproved(bytes, "image/png")).rejects.toThrow();
    const key = `sha256/${sha256(bytes).slice(0, 2)}/${sha256(bytes)}`;
    await expect(access(path.join(primaryRoot, key))).rejects.toThrow();
  });

  it("archives and verifies before primary upload, then restores after primary loss", async () => {
    const recoveryRoot = await temporaryRoot("recovery");
    const primaryRoot = await temporaryRoot("primary");
    const restoredRoot = await temporaryRoot("restored");
    const recovery = new FilesystemRecoveryArchive({
      allowTemporaryRoot: true,
      archiveId: "synthetic-test",
      root: recoveryRoot,
    });
    const primary = new FilesystemAssetStore(primaryRoot);
    const store = new RecoverableImageStore({ primary, recovery });
    const bytes = new TextEncoder().encode("approved image");

    const retained = await store.retainApproved(bytes, "image/png");

    expect(retained.primary.digest).toBe(retained.recovery.digest);
    expect(retained.recovery.receiptDigest).toMatch(/^[a-f0-9]{64}$/);
    const restored = new FilesystemAssetStore(restoredRoot);
    await recovery.restore(await recovery.snapshot(), restored);
    await expect(restored.get(retained.primary.key)).resolves.toEqual(bytes);
  });
});
