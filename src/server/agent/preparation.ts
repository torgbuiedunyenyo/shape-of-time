import { sql } from "kysely";
import { db, json } from "../db/index.js";
import { enqueue } from "../library/store.js";
import type { Anchor } from "../../shared/types.js";

/** One opportunity to prepare ahead of the currently read frontier, never one per heartbeat. */
export async function recordReading(
  editionId: string,
  workId: string,
  place: Anchor,
) {
  const work = await db
    .selectFrom("works")
    .select("id")
    .where("id", "=", workId)
    .where("edition_id", "=", editionId)
    .executeTakeFirstOrThrow();
  const latest = await db
    .selectFrom("publications")
    .selectAll()
    .where("work_id", "=", work.id)
    .orderBy("ordinal", "desc")
    .executeTakeFirstOrThrow();
  if (place.publicationId !== latest.id) return null;
  const index = latest.blocks.findIndex((b) => b.id === place.blockId);
  if (index < 0) throw new Error("This reading place is unavailable.");
  const payload = {
    after_publication_id: latest.id,
    last_seen: new Date().toISOString(),
    reader_place: place,
    remaining_characters_in_saved_work: latest.blocks
      .slice(index)
      .reduce((n, b) => n + b.text.length, 0),
  };
  const intent = await enqueue(
    editionId,
    "prepare",
    workId,
    payload,
    `prepare:${workId}:${latest.id}`,
  );
  await db
    .updateTable("intents")
    .set({ payload: json(payload) })
    .where("id", "=", intent.id)
    .where("status", "in", ["queued", "running"])
    .execute();
  return intent.id;
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
    !["continue", "prepare"].includes(intent.kind) ||
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
