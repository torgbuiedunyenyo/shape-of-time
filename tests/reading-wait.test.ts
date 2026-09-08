import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { db, json, pool } from "../src/server/db/index.js";
import { migrate } from "../src/server/db/migrate.js";
import { readingWait, typicalWait } from "../src/reading-wait.js";
import { waitState } from "../src/client/wait-state.js";
import { RequestWait } from "../src/client/RequestWait.js";
import { outstandingOpenings } from "../src/client/OpeningTray.js";
import type { Intent } from "../src/shared/types.js";

const edition = randomUUID(), start = Date.parse("2026-09-01T00:00:00Z");
const intent: Intent = { id: "waiting", kind: "explore", status: "running", work_id: null, result_work_id: null, payload: {}, error: null };
const timing = { requestedAt: new Date(start).toISOString(), lowerMinutes: 6, upperMinutes: 12, sampleCount: 7 };
beforeAll(async () => {
  await migrate();
  await db.insertInto("editions").values({ id: edition, title: "Waiting checks", source: json({}), root_work_id: null, budget_usd: 0 }).execute();
});
afterAll(async () => {
  await db.deleteFrom("intents").where("edition_id", "=", edition).execute();
  const works = await db.selectFrom("works").select("id").where("edition_id", "=", edition).execute();
  if (works.length) await db.deleteFrom("publications").where("work_id", "in", works.map(w => w.id)).execute();
  await db.deleteFrom("documents").where("edition_id", "=", edition).execute();
  await db.deleteFrom("works").where("edition_id", "=", edition).execute();
  await db.deleteFrom("editions").where("id", "=", edition).execute();
  await pool.end();
});

it("estimates first readable publication using comparable saved requests, excluding already-prepared entries", async () => {
  let target = "";
  for (const [index, minutes] of [5, 6, 7, 8, 9, 11, 115, -1].entries()) {
    const work = randomUUID(), id = randomUUID(), requested = start + index * 86400_000;
    target = id;
    await db.insertInto("works").values({ id: work, edition_id: edition, title: "Nested work", founding: json({}) }).execute();
    await db.insertInto("intents").values({ id, edition_id: edition, dedupe_key: id, kind: "explore", work_id: null, result_work_id: work, status: "done", payload: json({}), error: null, session_id: null, created_at: new Date(requested).toISOString() }).execute();
    for (const [ordinal, delay] of [minutes, minutes + 20].entries()) {
      const doc = randomUUID();
      await db.insertInto("documents").values({ id: doc, edition_id: edition, path: doc, revision: 1, body: "Test publication", operation_key: doc }).execute();
      await db.insertInto("publications").values({ id: randomUUID(), work_id: work, ordinal, document_id: doc, blocks: json([]), created_at: new Date(requested + delay * 60_000).toISOString() }).execute();
    }
  }
  const estimate = await readingWait(target);
  expect(estimate).toEqual({ requestedAt: new Date(start + 7 * 86400_000).toISOString(), lowerMinutes: 6, upperMinutes: 10, sampleCount: 7 });
  expect(await readingWait(randomUUID())).toBeNull();
});

it("uses an approximate fallback with little evidence and retains slow samples without turning one outage into a typical wait", () => {
  expect(typicalWait([])).toEqual({ lowerMinutes: 6, upperMinutes: 12, sampleCount: 0 });
  expect(typicalWait([300, 360, 420, 450, 480, 550, 660, 7000, 14000])).toEqual({ lowerMinutes: 6, upperMinutes: 12, sampleCount: 9 });
});

it("does not count queue time down or animate failures, blocked queues, and disconnected status", () => {
  const queued = waitState({ ...intent, status: "queued" }, timing, start + 30 * 60_000);
  expect(queued).toMatchObject({ active: false, state: "queued" });
  expect(queued.estimate).toContain("once it begins");
  for (const status of ["paused", "failed", "cancelled"])
    expect(waitState({ ...intent, status }, timing).active).toBe(false);
  expect(waitState({ ...intent, queue: { ahead: 2, blocked: true } }, timing).active).toBe(false);
  expect(waitState(intent, timing, start, true)).toMatchObject({ active: false, state: "disconnected", estimate: "" });
  expect(waitState(intent, timing, start + 13 * 60_000)).toMatchObject({ state: "delayed", text: "Taking longer than usual." });
});

it("offers readable work immediately even if later generation fails or status connection drops", () => {
  expect(waitState({ ...intent, status: "failed", result_work_id: "child" }, timing, start, true)).toMatchObject({ state: "ready", active: false, estimate: "" });
  const html = renderToStaticMarkup(createElement(RequestWait, { intent }));
  expect(html).toContain("Usually about 6–12 minutes");
  expect(html).toContain('class="wait-line" aria-hidden="true"');
  expect(html).not.toContain("progressbar");
  expect(renderToStaticMarkup(createElement(RequestWait, { intent: { ...intent, status: "paused" } }))).not.toContain('class="wait-line"');
});

it("retains only this reader's unentered openings in the quiet tray", () => {
  const source = { publicationId: "p", blockId: "b" };
  const saved = { opening: { intentId: "one", visitId: "v", source }, other: { intentId: "two", visitId: "w", source }, entered: { intentId: "three", visitId: "v", source, openedVisitId: "child" }, continuation: { intentId: "four", visitId: "v" } };
  expect(outstandingOpenings(saved).map(r => r.intentId)).toEqual(["two", "one"]);
  expect(outstandingOpenings({})).toEqual([]);
});
