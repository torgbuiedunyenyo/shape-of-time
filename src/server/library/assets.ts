import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import sharp from "sharp";
import { db } from "../db/index.js";
import { config } from "../config.js";
import type { Anchor } from "../../shared/types.js";
const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION ?? "auto",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  },
});
export async function putBytes(key: string, bytes: Uint8Array, mime: string) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `${config.schema}/${key}`,
      Body: bytes,
      ContentType: mime,
    }),
  );
  return key;
}
export async function getBytes(key: string) {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `${config.schema}/${key}`,
    }),
  );
  if (!result.Body) throw new Error("Stored object has no body");
  return Buffer.from(await result.Body.transformToByteArray());
}
export async function imageContent(id: string, region?: Anchor["region"]) {
  const asset = await db
    .selectFrom("assets")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  let bytes = await getBytes(asset.storage_key),
    mime = asset.mime;
  if (region) {
    if (
      region.x < 0 ||
      region.y < 0 ||
      region.width <= 0 ||
      region.height <= 0 ||
      region.x + region.width > 1.00001 ||
      region.y + region.height > 1.00001
    )
      throw new Error("Invalid image region");
    const left = Math.floor(region.x * asset.width),
      top = Math.floor(region.y * asset.height);
    bytes = await sharp(bytes)
      .extract({
        left,
        top,
        width: Math.max(
          1,
          Math.min(asset.width - left, Math.round(region.width * asset.width)),
        ),
        height: Math.max(
          1,
          Math.min(
            asset.height - top,
            Math.round(region.height * asset.height),
          ),
        ),
      })
      .png()
      .toBuffer();
    mime = "image/png";
  }
  return {
    type: "input_image" as const,
    image_url: `data:${mime};base64,${bytes.toString("base64")}`,
    detail: "original" as const,
  };
}
