import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { sql } from "kysely";
import { db, json } from "../db/index.js";
import { config } from "../config.js";
import { compose } from "./composition.js";
import type { Anchor } from "../../shared/types.js";
export async function initializeEdition() {
  const source: Record<string, string> = {};
  for (const name of [
    "world",
    "world-essence",
    "prose-guide",
    "visual-direction",
  ])
    source[name] = await readFile(`content/shape-of-time/${name}.md`, "utf8");
  await db
    .insertInto("editions")
    .values({
      id: "shape-of-time",
      title: "The Shape of Time",
      root_work_id: null,
      source: json(source),
      budget_usd: config.budget,
    })
    .onConflict((c) => c.column("id").doNothing())
    .execute();
  return db
    .selectFrom("editions")
    .selectAll()
    .where("id", "=", "shape-of-time")
    .executeTakeFirstOrThrow();
}
export async function createWork(
  editionId: string,
  title: string,
  founding: Record<string, unknown>,
  id: string = randomUUID(),
) {
  await db
    .insertInto("works")
    .values({ id, edition_id: editionId, title, founding: json(founding) })
    .onConflict((c) => c.column("id").doNothing())
    .execute();
  return db
    .selectFrom("works")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
}
export async function writeDocument(
  editionId: string,
  path: string,
  body: string,
  expectedRevision: number | null,
  key: string,
) {
  return db.transaction().execute(async (tx) => {
    await sql`select pg_advisory_xact_lock(hashtext(${`${editionId}:document:${path}`}))`.execute(
      tx,
    );
    const receipt = await tx
      .selectFrom("documents")
      .selectAll()
      .where("operation_key", "=", key)
      .executeTakeFirst();
    if (receipt) return receipt;
    const latest = await tx
      .selectFrom("documents")
      .selectAll()
      .where("edition_id", "=", editionId)
      .where("path", "=", path)
      .orderBy("revision", "desc")
      .executeTakeFirst();
    if ((latest?.revision ?? 0) !== (expectedRevision ?? 0))
      throw new Error(
        `Draft changed: current revision is ${latest?.revision ?? 0}. Read it before revising.`,
      );
    return tx
      .insertInto("documents")
      .values({
        id: randomUUID(),
        edition_id: editionId,
        path,
        body,
        revision: (latest?.revision ?? 0) + 1,
        operation_key: key,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  });
}
export async function publish(workId: string, documentId: string) {
  return db.transaction().execute(async (tx) => {
    const work = await tx
      .selectFrom("works")
      .selectAll()
      .where("id", "=", workId)
      .forUpdate()
      .executeTakeFirstOrThrow();
    const prior = await tx
      .selectFrom("publications")
      .selectAll()
      .where("work_id", "=", workId)
      .where("document_id", "=", documentId)
      .executeTakeFirst();
    if (prior) return prior;
    const draft = await tx
      .selectFrom("documents")
      .selectAll()
      .where("id", "=", documentId)
      .where("edition_id", "=", work.edition_id)
      .executeTakeFirstOrThrow();
    const id = randomUUID(),
      blocks = compose(draft.body, id);
    for (const b of blocks.filter((b) => b.assetId)) {
      const asset = await tx
        .selectFrom("assets")
        .select(["id", "width", "height"])
        .where("id", "=", b.assetId!)
        .where("edition_id", "=", work.edition_id)
        .executeTakeFirst();
      if (!asset)
        throw new Error(
          `Image ${b.assetId} is not available. Your saved draft is intact.`,
        );
      b.width = asset.width;
      b.height = asset.height;
    }
    const last = await tx
      .selectFrom("publications")
      .select("ordinal")
      .where("work_id", "=", workId)
      .orderBy("ordinal", "desc")
      .executeTakeFirst();
    return tx
      .insertInto("publications")
      .values({
        id,
        work_id: workId,
        document_id: documentId,
        ordinal: (last?.ordinal ?? 0) + 1,
        blocks: json(blocks),
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  });
}
export async function getBook(id: string) {
  const work = await db
    .selectFrom("works")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirstOrThrow();
  const [publications, openings, pending] = await Promise.all([
    db
      .selectFrom("publications")
      .selectAll()
      .where("work_id", "=", id)
      .orderBy("ordinal")
      .execute(),
    db.selectFrom("openings").selectAll().where("work_id", "=", id).execute(),
    db
      .selectFrom("intents")
      .selectAll()
      .where("work_id", "=", id)
      .where("status", "in", ["queued", "running", "paused", "failed"])
      .orderBy("created_at")
      .execute(),
  ]);
  const ids = [
    ...new Set(
      publications.flatMap((p) =>
        p.blocks.flatMap((b) => (b.assetId ? [b.assetId] : [])),
      ),
    ),
  ];
  if (ids.length) {
    const assets = await db
      .selectFrom("assets")
      .select(["id", "width", "height"])
      .where("id", "in", ids)
      .execute();
    const byId = new Map(assets.map((a) => [a.id, a]));
    for (const publication of publications)
      for (const block of publication.blocks) {
        const asset = block.assetId ? byId.get(block.assetId) : undefined;
        if (asset) {
          block.width = asset.width;
          block.height = asset.height;
        }
      }
  }
  return { work, publications, openings, pending };
}
export async function sourceContext(anchor: Anchor) {
  const publication = await db
    .selectFrom("publications")
    .selectAll()
    .where("id", "=", anchor.publicationId)
    .executeTakeFirstOrThrow();
  const index = publication.blocks.findIndex((b) => b.id === anchor.blockId);
  if (index < 0) throw new Error("Source passage does not exist.");
  const block = publication.blocks[index];
  if (anchor.assetId && block.assetId !== anchor.assetId)
    throw new Error("Source image does not match the passage.");
  if (anchor.offset !== undefined) {
    const end = publication.blocks.findIndex(
      (b) => b.id === (anchor.endBlockId ?? anchor.blockId),
    );
    if (end < index) throw new Error("Invalid selection range.");
    const selected = publication.blocks
      .slice(index, end + 1)
      .map((b, i, arr) =>
        b.text.slice(
          i === 0 ? anchor.offset : 0,
          i === arr.length - 1 ? anchor.endOffset : undefined,
        ),
      )
      .join("\n\n");
    if (anchor.quote && selected !== anchor.quote)
      throw new Error("The selection changed. Select the passage again.");
  }
  return {
    anchor,
    publication,
    work: await db
      .selectFrom("works")
      .selectAll()
      .where("id", "=", publication.work_id)
      .executeTakeFirstOrThrow(),
  };
}
export async function enqueue(
  editionId: string,
  kind: string,
  workId: string | null,
  payload: Record<string, unknown>,
  key: string,
) {
  await db
    .insertInto("intents")
    .values({
      id: randomUUID(),
      edition_id: editionId,
      kind,
      work_id: workId,
      payload: json(payload),
      dedupe_key: key,
      result_work_id: null,
      error: null,
      session_id: null,
    })
    .onConflict((c) => c.column("dedupe_key").doNothing())
    .execute();
  return db
    .selectFrom("intents")
    .selectAll()
    .where("dedupe_key", "=", key)
    .executeTakeFirstOrThrow();
}
