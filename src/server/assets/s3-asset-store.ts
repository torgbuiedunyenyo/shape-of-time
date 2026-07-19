import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  assertContentAddress,
  assertMediaType,
  assertReadUrlLifetime,
  contentAddress,
  type AssetStore,
  type PutAssetOptions,
  type StoredAsset,
} from "./asset-store.js";
import { sha256 } from "../domain/digests.js";

export interface S3AssetStoreOptions {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  region: string;
  secretAccessKey: string;
}

export class S3AssetStore implements AssetStore {
  readonly driver = "s3" as const;
  readonly #bucket: string;
  readonly #client: S3Client;

  constructor(options: S3AssetStoreOptions) {
    const config: S3ClientConfig = {
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      endpoint: options.endpoint,
      region: options.region,
    };
    this.#bucket = options.bucket;
    this.#client = new S3Client(config);
  }

  async put(bytes: Uint8Array, options: PutAssetOptions): Promise<StoredAsset> {
    assertMediaType(options.mediaType);
    const digest = sha256(bytes);
    const key = contentAddress(digest);
    try {
      await this.#client.send(
        new PutObjectCommand({
          Body: bytes,
          Bucket: this.#bucket,
          ContentType: options.mediaType,
          IfNoneMatch: "*",
          Key: key,
          Metadata: { sha256: digest },
        }),
      );
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status !== 409 && status !== 412) throw error;
      const existing = await this.#client.send(new HeadObjectCommand({ Bucket: this.#bucket, Key: key }));
      if (
        existing.Metadata?.sha256 !== digest ||
        existing.ContentLength !== bytes.byteLength ||
        existing.ContentType !== options.mediaType
      ) {
        throw new Error(`content-address collision at ${key}`, { cause: error });
      }
    }
    return { byteLength: bytes.byteLength, digest, key, mediaType: options.mediaType };
  }

  async get(key: string): Promise<Uint8Array> {
    assertContentAddress(key);
    const response = await this.#client.send(new GetObjectCommand({ Bucket: this.#bucket, Key: key }));
    if (response.Body === undefined) throw new Error(`asset body missing: ${key}`);
    return response.Body.transformToByteArray();
  }

  async createReadUrl(key: string, expiresInSeconds: number): Promise<string> {
    assertContentAddress(key);
    assertReadUrlLifetime(expiresInSeconds);
    return getSignedUrl(this.#client, new GetObjectCommand({ Bucket: this.#bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }
}
