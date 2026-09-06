import { sql } from "kysely";
import { db, json } from "../db/index.js";
import { randomUUID } from "node:crypto";
import type { Anchor } from "../../shared/types.js";

/** One opportunity per encountered publication; saved reading is context, not a story quota. */
export async function recordReading(editionId: string, workId: string, place: Anchor) {
  // Serialize signals for this work so a slower heartbeat cannot overwrite a newer one.
  return db.transaction().execute(async (tx) => {
    const work = await tx.selectFrom("works").selectAll()
      .where("id", "=", workId).where("edition_id", "=", editionId)
      .forUpdate().executeTakeFirstOrThrow();
    const publications = await tx.selectFrom("publications").selectAll()
      .where("work_id", "=", work.id).orderBy("ordinal").execute();
    const current = publications.find(p => p.id === place.publicationId);
    const index = current?.blocks.findIndex(b => b.id === place.blockId) ?? -1;
    if (!current || index < 0) throw new Error("This reading place is unavailable.");
    const unread = publications.filter(p => p.ordinal > current.ordinal);
    const openings = await tx.selectFrom("openings")
      .innerJoin("works", "works.id", "openings.target_work_id")
      .select(["openings.id", "openings.source", "openings.target_work_id", "openings.label", "works.title"])
      .where("openings.work_id", "=", work.id).execute();
    const payload = {
      after_publication_id: publications.at(-1)!.id,
      last_seen: new Date().toISOString(),
      reader_place: place,
      source: {anchor: place, publication: current, work},
      unread_publication_ids: unread.map(p => p.id),
      prepared_openings_here: openings.filter(o => o.source.publicationId === current.id),
      remaining_characters_in_saved_work: [...current.blocks.slice(index), ...unread.flatMap(p => p.blocks)]
        .reduce((n, b) => n + b.text.length, 0),
    };
    const key = `prepare:${workId}:${current.id}`;
    await tx.insertInto("intents").values({
      id: randomUUID(), edition_id: editionId, kind: "prepare", work_id: workId,
      payload: json(payload), dedupe_key: key, result_work_id: null,
      error: null, session_id: null,
    }).onConflict(c => c.column("dedupe_key").doNothing()).execute();
    const intent = await tx.selectFrom("intents").select("id")
      .where("dedupe_key", "=", key).executeTakeFirstOrThrow();
    await tx.updateTable("intents").set({payload: json(payload)})
      .where("id", "=", intent.id).where("status", "in", ["queued", "running"]).execute();
    return intent.id;
  });
}

/** Yield only at a settled tool boundary; saved drafts and completed effects remain available. */
export async function preparationYieldReason(intentId: string) {
  const intent = await db.selectFrom("intents").selectAll()
    .where("id", "=", intentId).executeTakeFirstOrThrow();
  if (intent.kind !== "prepare") return null;
  const waiting = await db.selectFrom("intents").select("id")
    .where("edition_id", "=", intent.edition_id).where("kind", "!=", "prepare")
    .where("status", "=", "queued").executeTakeFirst();
  if (waiting) return "Preparation yielded to an explicit reader request; saved work remains available.";
  const seen = Date.parse(String(intent.payload.last_seen));
  if (!Number.isFinite(seen) || Date.now() - seen > 90000)
    return "Preparation ended after the reader moved on; saved work remains available.";
  return null;
}

/** Actual reader requests take precedence. Stale preparation waits for a present reader. */
export async function nextIntent(editionId?: string) {
  return db
    .selectFrom("intents")
    .selectAll()
    .$if(Boolean(editionId), (q) => q.where("edition_id", "=", editionId!))
    .where("status", "in", ["running", "queued", "paused", "failed"])
    .where((eb) =>
      eb.or([
        eb("kind", "!=", "prepare"),
        eb("status", "!=", "queued"),
        sql<boolean>`(payload->>'last_seen')::timestamptz > now() - interval '90 seconds'`,
      ]),
    )
    .orderBy(
      sql<number>`case when status in ('paused', 'failed') then 0 when status = 'running' then 1 when kind = 'prepare' then 3 else 2 end`,
    )
    .orderBy("created_at")
    .executeTakeFirst();
}

/** A queued request may already have been fulfilled by preparation or another reader. */
export async function useAvailableContinuation(intentId: string) {
  const intent = await db
    .selectFrom("intents")
    .selectAll()
    .where("id", "=", intentId)
    .executeTakeFirstOrThrow();
  if (
    intent.session_id ||
    intent.kind !== "continue" ||
    !intent.work_id ||
    typeof intent.payload.after_publication_id !== "string"
  )
    return false;
  const latest = await db
    .selectFrom("publications")
    .select("id")
    .where("work_id", "=", intent.work_id)
    .orderBy("ordinal", "desc")
    .executeTakeFirst();
  if (!latest || latest.id === intent.payload.after_publication_id)
    return false;
  await db
    .updateTable("intents")
    .set({ status: "done", result_work_id: intent.work_id, error: null })
    .where("id", "=", intentId)
    .execute();
  return true;
}
