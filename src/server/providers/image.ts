import { toFile } from "openai";
import type { ImagesResponse } from "openai/resources/images";
import sharp from "sharp";
import { config } from "../config.js";
import { db, json } from "../db/index.js";
import { getBytes, putBytes, imageContent } from "../library/assets.js";
import { openai } from "./astra.js";
import {
  reserve,
  dispatched,
  preserveRaw,
  finish,
  uncertain,
  parsedReceipt,
  Paused,
} from "./operations.js";
export type ImageRequest = {
  prompt: string;
  size: string;
  quality: "low" | "medium" | "high";
  references: string[];
};
export async function makeImage(
  editionId: string,
  sessionId: string,
  key: string,
  args: ImageRequest,
) {
  const refs = [];
  let referencePixels = 0;
  for (const id of args.references) {
    const asset = await db
      .selectFrom("assets")
      .selectAll()
      .where("id", "=", id)
      .where("edition_id", "=", editionId)
      .executeTakeFirstOrThrow();
    referencePixels += asset.width * asset.height;
    refs.push(asset);
  }
  const size = args.size === "auto" ? null : /^(\d+)x(\d+)$/.exec(args.size);
  if (args.size !== "auto" && !size)
    throw new Error("Use an image size such as 1536x1024 or auto.");
  const pixels = size ? Number(size[1]) * Number(size[2]) : 8388608;
  const reserveUsd =
    ((pixels / 32) * 30) / 1e6 +
    ((referencePixels / 16) * 8) / 1e6 +
    (Buffer.byteLength(args.prompt) * 5) / 1e6 +
    0.05;
  const op = await reserve(
    editionId,
    sessionId,
    key,
    "image",
    {
      ...args,
      model: config.imageModel,
      reference_storage_keys: refs.map((r) => r.storage_key),
      price_record: "2026-09-06-standard",
    },
    reserveUsd,
  );
  if (op.status === "complete" && typeof op.response?.asset_id === "string")
    return [
      {
        type: "input_text" as const,
        text: json({
          asset_id: op.response.asset_id,
          source_operation: op.id,
          cost_usd: op.actual_usd,
        }),
      },
      await imageContent(op.response.asset_id),
    ];
  if (["unknown", "failed"].includes(op.status))
    throw new Paused(op.error ?? "This image request needs reconciliation.");
  let result = parsedReceipt(op.response) as ImagesResponse | null;
  if (op.status === "reserved") {
    await dispatched(op.id);
    const body = {
      model: config.imageModel,
      prompt: args.prompt,
      size: args.size,
      quality: args.quality,
      n: 1,
      output_format: "png" as const,
    };
    try {
      const response = refs.length
        ? await openai.images
            .edit({
              ...body,
              image: await Promise.all(
                refs.map(async (r) =>
                  toFile(await getBytes(r.storage_key), `${r.id}.png`, {
                    type: r.mime,
                  }),
                ),
              ),
            })
            .asResponse()
        : await openai.images.generate(body).asResponse();
      result = (await preserveRaw(
        op.id,
        response,
      )) as unknown as ImagesResponse;
    } catch (e) {
      return uncertain(op.id, e);
    }
  } else if (!result)
    throw new Paused(
      "An image was dispatched without a recoverable result. It will not be purchased again automatically.",
    );
  const data = result?.data?.[0]?.b64_json;
  if (!data)
    throw new Paused(
      "The image receipt is saved but contains no decodable image. Inspect it before purchasing another.",
    );
  const id = `img-${op.id}`,
    storageKey = `images/${id}.png`,
    bytes = Buffer.from(data, "base64");
  await putBytes(storageKey, bytes, "image/png");
  const metadata = await sharp(bytes).metadata();
  if (!metadata.width || !metadata.height)
    throw new Paused(
      "The returned image bytes are saved but cannot be displayed.",
    );
  await db
    .insertInto("assets")
    .values({
      id,
      edition_id: editionId,
      storage_key: storageKey,
      mime: "image/png",
      width: metadata.width,
      height: metadata.height,
      operation_id: op.id,
      description: args.prompt,
      references: json(args.references),
    })
    .onConflict((c) => c.column("id").doNothing())
    .execute();
  const u = result!.usage;
  const cost = u
    ? ((u.input_tokens_details?.text_tokens ?? 0) * 5 +
        (u.input_tokens_details?.image_tokens ?? 0) * 8 +
        u.output_tokens * 30) /
      1e6
    : null;
  // Raw base64 remains in object storage; the operation keeps usage and the durable asset identity.
  await finish(
    op.id,
    {
      ...result,
      data: result!.data?.map((item) => ({
        revised_prompt: item.revised_prompt,
        asset_id: id,
      })),
      asset_id: id,
    },
    cost,
  );
  return [
    {
      type: "input_text" as const,
      text: json({
        asset_id: id,
        width: metadata.width,
        height: metadata.height,
        source_operation: op.id,
        cost_usd: cost,
      }),
    },
    await imageContent(id),
  ];
}
