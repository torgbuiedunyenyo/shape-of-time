import { sql } from "kysely";
import { db } from "./server/db/index.js";

export type ReadingWait = {
  requestedAt: string;
  lowerMinutes: number;
  upperMinutes: number;
  sampleCount: number;
};

/** Typical first-publication latency, not a percentage or a completion prediction. */
export function typicalWait(seconds: number[]) {
  const minutes = seconds.filter(n => Number.isFinite(n) && n > 0).map(n => n / 60).sort((a, b) => a - b);
  if (minutes.length < 5) return { lowerMinutes: 6, upperMinutes: 12, sampleCount: minutes.length };
  // The middle of recent experience gives a useful range without letting a single
  // overnight outage promise hours of waiting. Slow requests remain in the sample.
  const lowerMinutes = Math.max(1, Math.floor(minutes[Math.floor((minutes.length - 1) * .2)] / 2) * 2);
  const upperMinutes = Math.max(lowerMinutes + 2, Math.ceil(minutes[Math.floor((minutes.length - 1) * .8)] / 2) * 2);
  return { lowerMinutes, upperMinutes, sampleCount: minutes.length };
}

const cache = new Map<string, { until: number; value: ReturnType<typeof typicalWait> }>();
export async function readingWait(id: string): Promise<ReadingWait | null> {
  const intent = await db.selectFrom("intents").select(["id", "kind", "edition_id", "created_at"])
    .where("id", "=", id).executeTakeFirst();
  if (!intent) return null;
  const key = `${intent.edition_id}:${intent.kind}`;
  let estimate = cache.get(key);
  if (!estimate || estimate.until < Date.now()) {
    const rows = await sql<{ seconds: number }>`
      select extract(epoch from (first_passage.created_at - i.created_at))::double precision as seconds
      from intents i
      join lateral (
        select p.created_at from publications p
        where p.work_id = i.result_work_id and p.created_at >= i.created_at
        order by p.created_at limit 1
      ) first_passage on true
      where i.edition_id = ${intent.edition_id} and i.kind = ${intent.kind}
        and i.status in ('done', 'running')
        and not exists (select 1 from publications p where p.work_id = i.result_work_id
          and p.created_at < i.created_at and i.kind in ('explore', 'begin'))
      order by i.created_at desc limit 40
    `.execute(db);
    estimate = { until: Date.now() + 60_000, value: typicalWait(rows.rows.map(r => r.seconds)) };
    cache.set(key, estimate);
  }
  return { requestedAt: new Date(intent.created_at).toISOString(), ...estimate.value };
}
