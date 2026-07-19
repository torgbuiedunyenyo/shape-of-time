export interface StoredAsset {
  byteLength: number;
  digest: string;
  key: string;
  mediaType: string;
}

export interface PutAssetOptions {
  mediaType: string;
}

export interface AssetStore {
  readonly driver: "filesystem" | "s3";
  put(bytes: Uint8Array, options: PutAssetOptions): Promise<StoredAsset>;
  get(key: string): Promise<Uint8Array>;
  createReadUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export function assertMediaType(mediaType: string): void {
  if (mediaType.trim().length === 0) throw new Error("asset media type cannot be empty");
}

const contentKeyPattern = /^sha256\/[a-f0-9]{2}\/[a-f0-9]{64}$/;

export function contentAddress(digest: string): string {
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error("invalid SHA-256 digest");
  return `sha256/${digest.slice(0, 2)}/${digest}`;
}

export function assertContentAddress(key: string): void {
  if (!contentKeyPattern.test(key) || key.slice(7, 9) !== key.slice(-64, -62)) {
    throw new Error(`invalid content-addressed asset key: ${key}`);
  }
}

export function assertReadUrlLifetime(expiresInSeconds: number): void {
  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds < 1 || expiresInSeconds > 3600) {
    throw new Error("read URL lifetime must be between 1 and 3600 seconds");
  }
}
