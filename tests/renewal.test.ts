import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import { db, json, pool } from "../src/server/db/index.js";
import { migrate } from "../src/server/db/migrate.js";
import { renewBeforeRequest, renewSession, withOrientation } from "../src/server/agent/renewal.js";

it("does not append a duplicate world guide when the native window already retains it", () => {
  const orientation: ResponseInputItem = { role: "developer", content: "The complete original world.\nAnd writing guidance." };
  const canonical: ResponseInputItem[] = [
    { type: "message", role: "developer", content: [{ type: "input_text", text: "The complete original world.\nAnd writing guidance." }] },
    { role: "user", content: "Retained reader source." },
    { type: "compaction", id: "cmp_fixture", encrypted_content: "structural-fixture" },
  ];
  expect(withOrientation(canonical, orientation)).toEqual(canonical);
  expect(withOrientation(canonical.slice(1), orientation)).toEqual([...canonical.slice(1), orientation]);
});

const edition = randomUUID();
beforeAll(async () => {
  await migrate();
  await db.insertInto("editions").values({
    id: edition, title: "Renewal persistence checks", root_work_id: null,
    source: json({}), budget_usd: 0,
  }).execute();
});
afterAll(async () => {
  await db.deleteFrom("operations").where("edition_id", "=", edition).execute();
  await db.deleteFrom("sessions").where("edition_id", "=", edition).execute();
  await db.deleteFrom("editions").where("id", "=", edition).execute();
  await pool.end();
});

async function savedWindow(status = "complete") {
  const id = randomUUID(), operation = randomUUID(), intent = randomUUID();
  const orientation: ResponseInputItem = { role: "developer", content: "Original unabridged source fixture." };
  const original: ResponseInputItem[] = [orientation, {role: "user", content: "A previous request."}];
  // Protocol-shaped fixture tests database application, not provider validity or literary memory.
  // The funded real native-compaction receipt lives in tests/receipts/astra-native-renewal.json.
  const canonical: ResponseInputItem[] = [
    {role: "user", content: "Retained source before the opaque item."},
    {type: "compaction", id: "cmp_" + operation, encrypted_content: "structural-fixture"},
    {role: "user", content: "Retained source after the opaque item."},
  ];
  await db.insertInto("sessions").values({
    id, edition_id: edition, role: "author", input: json(original), step: 7, parent_id: null,
  }).execute();
  const completed = "2026-09-01T12:00:00.000Z";
  await db.insertInto("operations").values({
    id: operation, edition_id: edition, session_id: id,
    key: `${id}:renew:before-reader:${intent}`, kind: "compaction", status,
    request: json({ model: "gpt-6-astra", input: original, step: 7 }),
    provider_id: null, raw_key: null, reserved_usd: 0, actual_usd: 0,
    completed_at: completed, error: status === "unknown" ? "Outcome uncertain" : null,
    response: status === "complete" ? json({output: canonical, usage: {input_tokens: 0, output_tokens: 0}}) : null,
  }).execute();
  return { id, operation, intent, original, canonical, orientation, completed };
}

it("applies every item of a saved renewal window once and preserves the original receipt when resumed before a reader request", async () => {
  const f = await savedWindow();
  await renewBeforeRequest(f.id, f.intent, []);
  await renewBeforeRequest(f.id, f.intent, []);
  const session = await db.selectFrom("sessions").selectAll().where("id", "=", f.id).executeTakeFirstOrThrow();
  expect(session.input).toEqual([...f.canonical, f.orientation]);
  expect(session.step).toBe(8);
  const op = await db.selectFrom("operations").selectAll().where("id", "=", f.operation).executeTakeFirstOrThrow();
  expect(op.request.input).toEqual(f.original);
  expect(new Date(op.completed_at!).toISOString()).toBe(f.completed);
  expect(await db.selectFrom("operations").select("id").where("session_id", "=", f.id).execute()).toEqual([{id: f.operation}]);
});

it("keeps an uncertain renewal paused instead of dispatching a replacement or changing the session", async () => {
  const f = await savedWindow("unknown");
  await expect(renewBeforeRequest(f.id, f.intent, [])).rejects.toThrow("Outcome uncertain");
  expect((await db.selectFrom("sessions").select("input").where("id", "=", f.id).executeTakeFirstOrThrow()).input).toEqual(f.original);
});

it("does not replace newer work or compact through an unanswered tool call", async () => {
  const f = await savedWindow();
  await db.updateTable("sessions").set({step: 9}).where("id", "=", f.id).execute();
  await expect(renewSession(f.id, `before-reader:${f.intent}`)).rejects.toThrow("advanced during renewal");
  const input: ResponseInputItem[] = [...f.original, {type: "function_call", call_id: "pending", name: "archive", arguments: "{}"}];
  await db.updateTable("sessions").set({input: json(input)}).where("id", "=", f.id).execute();
  await expect(renewSession(f.id, `before-reader:${f.intent}`)).rejects.toThrow("current tool exchange");
  expect((await db.selectFrom("sessions").select("input").where("id", "=", f.id).executeTakeFirstOrThrow()).input).toEqual(input);
});
