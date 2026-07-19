import { constants } from "node:fs";
import { access, mkdir, open, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  contentAddress,
  assertContentAddress,
  assertMediaType,
  assertReadUrlLifetime,
  type AssetStore,
  type PutAssetOptions,
  type StoredAsset,
} from "./asset-store.js";
import { sha256 } from "../domain/digests.js";

export class FilesystemAssetStore implements AssetStore {
  readonly driver = "filesystem" as const;
  readonly #root: string;

  constructor(root: string) {
    this.#root = path.resolve(root);
  }

  async put(bytes: Uint8Array, options: PutAssetOptions): Promise<StoredAsset> {
    assertMediaType(options.mediaType);
    const digest = sha256(bytes);
    const key = contentAddress(digest);
    const absolute = this.#resolve(key);
    await mkdir(path.dirname(absolute), { recursive: true });
    try {
      const handle = await open(absolute, "wx");
      try {
        await handle.writeFile(bytes);
        await handle.sync();
      } finally {
        await handle.close();
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existing = await readFile(absolute);
      if (sha256(existing) !== digest) {
        throw new Error(`content-address collision at ${key}`, { cause: error });
      }
    }
    return { byteLength: bytes.byteLength, digest, key, mediaType: options.mediaType };
  }

  async get(key: string): Promise<Uint8Array> {
    return new Uint8Array(await readFile(this.#resolve(key)));
  }

  async createReadUrl(key: string, expiresInSeconds: number): Promise<string> {
    assertReadUrlLifetime(expiresInSeconds);
    const absolute = this.#resolve(key);
    await access(absolute, constants.R_OK);
    return pathToFileURL(absolute).href;
  }

  #resolve(key: string): string {
    assertContentAddress(key);
    const absolute = path.resolve(this.#root, key);
    if (!absolute.startsWith(`${this.#root}${path.sep}`)) {
      throw new Error(`invalid content-addressed asset key: ${key}`);
    }
    return absolute;
  }
}
