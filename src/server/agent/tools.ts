import { randomUUID, createHash } from "node:crypto";
import { z } from "zod";
import type {
  FunctionTool,
  ResponseInputItem,
} from "openai/resources/responses/responses";
import { db, json } from "../db/index.js";
import {
  createWork,
  writeDocument,
  publish,
  getBook,
  sourceContext,
} from "../library/store.js";
import { imageContent } from "../library/assets.js";
import { listArchive } from "../library/archive.js";
import { makeImage } from "../providers/image.js";
import { storeImages } from "../providers/protocol.js";
import { budget, Paused } from "../providers/operations.js";
import type { Anchor } from "../../shared/types.js";
export type ToolContext = {
  editionId: string;
  sessionId: string;
  intentId: string | null;
  critic: (
    question: string,
    subjects: string[],
    key: string,
  ) => Promise<string>;
};
const archiveArgs = z.object({
  action: z.enum(["list", "search", "read"]),
  kind: z.enum(["all", "source", "work", "publication", "document", "image"]),
  id: z.string().optional(),
  query: z.string().optional(),
  offset: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().max(200).default(40),
});
const writeArgs = z.object({
  path: z.string().min(1),
  body: z.string(),
  expected_revision: z.number().int().nonnegative(),
});
const workArgs = z.object({
  title: z.string().min(1),
  purpose: z.string(),
  existing_work_id: z.string().optional(),
  for_request: z
    .boolean()
    .default(true)
    .describe(
      "Use false for a side work or prepared opening; true selects the book the current reader request will open.",
    ),
});
const publishArgs = z.object({ work_id: z.string(), document_id: z.string() });
const imageArgs = z.object({
  prompt: z.string().min(1),
  size: z.string().default("1536x1024"),
  quality: z.enum(["low", "medium", "high"]).default("high"),
  references: z.array(z.string()).default([]),
});
const viewArgs = z.object({
  asset_id: z.string(),
  region: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});
const criticArgs = z.object({
  question: z.string(),
  subjects: z
    .array(z.string())
    .describe(
      "Document, publication or work IDs to inspect. The critic can investigate further.",
    ),
});
const openingArgs = z.object({
  publication_id: z.string(),
  block_id: z.string(),
  target_work_id: z.string(),
  label: z.string(),
  quote: z.string().optional(),
  offset: z.number().int().nonnegative().optional(),
  end_block_id: z.string().optional(),
  end_offset: z.number().int().nonnegative().optional(),
  asset_id: z.string().optional(),
});
const definitions = [
  [
    "archive",
    "List, search or read the source world, works/publications, all document revisions and image provenance. Publication search returns only published originals; document search includes unpublished revisions and notes. Lists/searches have pages: use next_offset to retrieve more. Read by ID (or document path) returns the full original without an excerpt limit. Image briefs describe requests; use view_image for actual appearance.",
    archiveArgs,
    true,
  ],
  [
    "view_image",
    "Look at an actual saved image, optionally a normalized rectangular region. Returns image content.",
    viewArgs,
    true,
  ],
  ["resources", "Inspect the shared generation allowance.", z.object({}), true],
  [
    "write_document",
    "Save a new draft or note revision. Use expected_revision=0 for a new path, otherwise read its current revision first. Returns a document ID for publishing.",
    writeArgs,
    false,
  ],
  [
    "open_work",
    "Create or reopen a work. Use for_request=true to select it for the waiting reader; use false to investigate or develop another work without changing that destination. The founding source is retained automatically.",
    workArgs,
    false,
  ],
  [
    "publish",
    "Append an exact saved draft revision to a work. Returns stable publication and block addresses. This is idempotent for the same saved revision.",
    publishArgs,
    false,
  ],
  [
    "make_image",
    "Generate or edit an image using GPT Image 2. Supply chosen references to edit or preserve aspects. Returns actual image content for inspection and a saved asset ID.",
    imageArgs,
    false,
  ],
  [
    "ask_critic",
    "Ask an independent Astra critic agent to investigate a draft, work, image relationship or literary question. It has read-only archive/image tools. This is optional; use when useful.",
    criticArgs,
    false,
  ],
  [
    "offer_opening",
    "Offer a prepared work at an exact published passage or image. Readers can enter it immediately. Existing prose remains unchanged.",
    openingArgs,
    false,
  ],
] as const;
export const toolDefinitions = (readOnly = false): FunctionTool[] =>
  definitions
    .filter((d) => !readOnly || d[3])
    .map(([name, description, schema]) => ({
      type: "function",
      name,
      description,
      parameters: z.toJSONSchema(schema, { io: "input" }),
      strict: false,
    }));
export async function executeTool(
  name: string,
  raw: string,
  callId: string,
  ctx: ToolContext,
): Promise<
  Extract<ResponseInputItem, { type: "function_call_output" }>["output"]
> {
  const definition = definitions.find((d) => d[0] === name);
  if (!definition) throw new Error(`Unknown tool ${name}`);
  const args = JSON.parse(raw),
    key = `${ctx.sessionId}:tool:${callId}`;
  const stableId = createHash("sha256").update(key).digest("hex").slice(0, 32);
  switch (name) {
    case "resources":
      return json(await budget(ctx.editionId));
    case "archive": {
      const a = archiveArgs.parse(args);
      if (a.action === "read") {
        if (a.kind === "source") {
          const e = await db
            .selectFrom("editions")
            .select("source")
            .where("id", "=", ctx.editionId)
            .executeTakeFirstOrThrow();
          return json(a.id ? e.source[a.id] : e.source);
        }
        if (a.kind === "work") return json(await getBook(a.id!));
        if (a.kind === "publication")
          return json(
            await db
              .selectFrom("publications")
              .selectAll()
              .where("id", "=", a.id!)
              .executeTakeFirstOrThrow(),
          );
        if (a.kind === "document")
          return json(
            await db
              .selectFrom("documents")
              .selectAll()
              .where("edition_id", "=", ctx.editionId)
              .where((eb) =>
                eb.or([eb("id", "=", a.id!), eb("path", "=", a.id!)]),
              )
              .orderBy("revision", "desc")
              .executeTakeFirstOrThrow(),
          );
        if (a.kind === "image")
          return json(
            await db
              .selectFrom("assets")
              .selectAll()
              .where("edition_id", "=", ctx.editionId)
              .where("id", "=", a.id!)
              .executeTakeFirstOrThrow(),
          );
        throw new Error(
          "Choose source, work, publication, document or image for reading.",
        );
      }
      return json(
        await listArchive(ctx.editionId, a.kind, a.query, a.offset, a.limit),
      );
    }
    case "write_document": {
      const a = writeArgs.parse(args);
      const d = await writeDocument(
        ctx.editionId,
        a.path,
        a.body,
        a.expected_revision,
        key,
      );
      return json({ document_id: d.id, path: d.path, revision: d.revision });
    }
    case "open_work": {
      const a = workArgs.parse(args),
        intent = ctx.intentId
          ? await db
              .selectFrom("intents")
              .selectAll()
              .where("id", "=", ctx.intentId)
              .executeTakeFirstOrThrow()
          : null;
      const w = a.existing_work_id
        ? await db
            .selectFrom("works")
            .selectAll()
            .where("edition_id", "=", ctx.editionId)
            .where("id", "=", a.existing_work_id)
            .executeTakeFirstOrThrow()
        : await createWork(
            ctx.editionId,
            a.title,
            {
              purpose: a.purpose,
              ...(intent ? { request: intent.payload } : {}),
            },
            `work-${stableId}`,
          );
      if (intent && a.for_request) {
        if (intent.kind === "continue" && intent.work_id !== w.id)
          throw new Error(
            "A continuation belongs to the requested work. Use for_request=false to develop a side work.",
          );
        await db
          .updateTable("intents")
          .set({ result_work_id: w.id })
          .where("id", "=", intent.id)
          .execute();
        if (intent.kind === "begin")
          await db
            .updateTable("editions")
            .set({ root_work_id: w.id })
            .where("id", "=", ctx.editionId)
            .execute();
      }
      return json(w);
    }
    case "publish": {
      const a = publishArgs.parse(args);
      const p = await publish(a.work_id, a.document_id);
      return json(p);
    }
    case "make_image":
      return makeImage(
        ctx.editionId,
        ctx.sessionId,
        key,
        imageArgs.parse(args),
      );
    case "view_image": {
      const a = viewArgs.parse(args);
      return [await imageContent(a.asset_id, a.region)];
    }
    case "ask_critic": {
      const a = criticArgs.parse(args);
      return ctx.critic(a.question, a.subjects, key);
    }
    case "offer_opening": {
      const a = openingArgs.parse(args),
        source: Anchor = {
          publicationId: a.publication_id,
          blockId: a.block_id,
          ...(a.quote ? { quote: a.quote } : {}),
          ...(a.asset_id ? { assetId: a.asset_id } : {}),
          ...(a.offset !== undefined ? { offset: a.offset } : {}),
          ...(a.end_block_id ? { endBlockId: a.end_block_id } : {}),
          ...(a.end_offset !== undefined ? { endOffset: a.end_offset } : {}),
        };
      const target = await getBook(a.target_work_id);
      if (
        target.work.edition_id !== ctx.editionId ||
        !target.publications.length
      )
        throw new Error(
          "A prepared opening needs a published destination before readers can enter it.",
        );
      if (a.quote && !a.end_block_id) {
        const original = await sourceContext({
          publicationId: a.publication_id,
          blockId: a.block_id,
        });
        const text = original.publication.blocks.find(
          (b) => b.id === a.block_id,
        )!.text;
        const offset = a.offset ?? text.indexOf(a.quote);
        if (
          offset < 0 ||
          (a.offset === undefined && text.indexOf(a.quote, offset + 1) >= 0)
        )
          throw new Error(
            "Choose an exact quoted passage and give its offset if it occurs more than once.",
          );
        source.offset = offset;
        source.endOffset = a.end_offset ?? offset + a.quote.length;
      }
      const s = await sourceContext(source);
      await db
        .insertInto("openings")
        .values({
          id: `opening-${stableId}`,
          work_id: s.work.id,
          source: json(source),
          target_work_id: a.target_work_id,
          label: a.label,
          operation_key: key,
        })
        .onConflict((c) => c.column("operation_key").doNothing())
        .execute();
      return json({
        id: `opening-${stableId}`,
        source,
        target_work_id: a.target_work_id,
      });
    }
    default:
      throw new Error("Unavailable tool");
  }
}
export async function recordedTool(
  name: string,
  args: string,
  callId: string,
  ctx: ToolContext,
  readOnly = false,
) {
  const prior = await db
    .selectFrom("tool_results")
    .select("output")
    .where("session_id", "=", ctx.sessionId)
    .where("call_id", "=", callId)
    .executeTakeFirst();
  if (prior) return prior.output;
  if (readOnly && !definitions.find((d) => d[0] === name)?.[3])
    throw new Error("The critic cannot change the archive.");
  let output: Extract<
    ResponseInputItem,
    { type: "function_call_output" }
  >["output"];
  try {
    output = await executeTool(name, args, callId, ctx);
  } catch (e) {
    if (e instanceof Paused) throw e;
    output = json({ error: e instanceof Error ? e.message : String(e) });
  }
  if (ctx.intentId) {
    const intent = await db
      .selectFrom("intents")
      .selectAll()
      .where("id", "=", ctx.intentId)
      .executeTakeFirstOrThrow();
    const workId = intent.result_work_id ?? intent.work_id;
    const publication = workId
      ? await db
          .selectFrom("publications")
          .select("id")
          .where("work_id", "=", workId)
          .where("created_at", ">=", intent.created_at)
          .executeTakeFirst()
      : undefined;
    const situation = {
      request_kind: intent.kind,
      elapsed_seconds: Math.round(
        (Date.now() - new Date(intent.created_at).getTime()) / 1000,
      ),
      new_publication_available: Boolean(publication),
      ...(intent.kind === "prepare"
        ? {
            reader_last_seen: intent.payload.last_seen,
            reader_place: intent.payload.reader_place,
            unread_publication_ids: intent.payload.unread_publication_ids,
            prepared_openings_here: intent.payload.prepared_openings_here,
            remaining_characters_in_saved_work:
              intent.payload.remaining_characters_in_saved_work,
            waiting_requests: await db
              .selectFrom("intents")
              .select(["kind", "work_id", "created_at"])
              .where("edition_id", "=", ctx.editionId)
              .where("status", "=", "queued")
              .where("kind", "!=", "prepare")
              .orderBy("created_at")
              .execute(),
          }
        : {}),
    };
    output = [
      ...(typeof output === "string"
        ? [{ type: "input_text" as const, text: output }]
        : output),
      {
        type: "input_text",
        text: "Reader situation (not fictional content): " + json(situation),
      },
    ];
  }
  const item: ResponseInputItem = {
    type: "function_call_output",
    call_id: callId,
    output,
  };
  await db
    .insertInto("tool_results")
    .values({
      id: randomUUID(),
      session_id: ctx.sessionId,
      call_id: callId,
      output: json(await storeImages(item)),
    })
    .onConflict((c) => c.columns(["session_id", "call_id"]).doNothing())
    .execute();
  return item;
}
