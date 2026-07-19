import type { AssetStore, StoredAsset } from "./asset-store.js";
import type { FilesystemRecoveryArchive, RecoveryProof } from "./filesystem-recovery-archive.js";
import { sha256 } from "../domain/digests.js";

export class RecoverableImageStore {
  readonly #primary: AssetStore;
  readonly #recovery: FilesystemRecoveryArchive;

  constructor(options: { primary: AssetStore; recovery: FilesystemRecoveryArchive }) {
    this.#primary = options.primary;
    this.#recovery = options.recovery;
  }

  async retainApproved(
    bytes: Uint8Array,
    mediaType: string,
  ): Promise<{ primary: StoredAsset; recovery: RecoveryProof }> {
    const recovery = await this.#recovery.archive(bytes, mediaType);
    await this.#recovery.verify(recovery);
    const primary = await this.#primary.put(bytes, { mediaType });
    const roundTrip = await this.#primary.get(primary.key);
    if (
      primary.digest !== recovery.digest ||
      primary.key !== recovery.key ||
      primary.byteLength !== recovery.byteLength ||
      primary.mediaType !== recovery.mediaType ||
      sha256(roundTrip) !== recovery.digest ||
      roundTrip.byteLength !== recovery.byteLength
    ) {
      throw new Error("primary image failed recovery-proof round-trip verification");
    }
    return { primary, recovery };
  }
}
