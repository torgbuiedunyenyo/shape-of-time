import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { FilesystemAssetStore } from "./filesystem-asset-store.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("filesystem asset store", () => {
  it("stores bytes under an immutable SHA-256-derived key and deduplicates repeats", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "shape-of-time-assets-"));
    roots.push(root);
    const store = new FilesystemAssetStore(root);
    const bytes = new TextEncoder().encode("one small illustrated folio");

    const first = await store.put(bytes, { mediaType: "image/webp" });
    const second = await store.put(bytes, { mediaType: "image/webp" });

    expect(first).toEqual(second);
    expect(first.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(first.key).toBe(`sha256/${first.digest.slice(0, 2)}/${first.digest}`);
    expect(await store.get(first.key)).toEqual(bytes);
  });

  it("rejects keys that are not canonical content addresses", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "shape-of-time-assets-"));
    roots.push(root);
    const store = new FilesystemAssetStore(root);

    await expect(store.get("../../world.md")).rejects.toThrow(/invalid content-addressed asset key/);
  });

  it("rejects an empty media type before writing an object", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "shape-of-time-assets-"));
    roots.push(root);
    const store = new FilesystemAssetStore(root);

    await expect(store.put(new TextEncoder().encode("plate"), { mediaType: "   " })).rejects.toThrow(
      /asset media type cannot be empty/,
    );
  });

  it("rejects nonpositive or long-lived read URLs", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "shape-of-time-assets-"));
    roots.push(root);
    const store = new FilesystemAssetStore(root);
    const stored = await store.put(new TextEncoder().encode("plate"), { mediaType: "image/webp" });

    await expect(store.createReadUrl(stored.key, 0)).rejects.toThrow(/between 1 and 3600 seconds/);
    await expect(store.createReadUrl(stored.key, 3601)).rejects.toThrow(/between 1 and 3600 seconds/);
  });
});
