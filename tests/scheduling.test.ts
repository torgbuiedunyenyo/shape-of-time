import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db, json, pool } from "../src/server/db/index.js";
import { migrate } from "../src/server/db/migrate.js";
import {
  createWork,
  enqueue,
  publish,
  writeDocument,
} from "../src/server/library/store.js";
import { runIntent } from "../src/server/agent/runner.js";
import {
  nextIntent,
  recordReading,
  useAvailableContinuation,
} from "../src/server/agent/preparation.js";

const edition = randomUUID();
beforeAll(async () => {
  await migrate();
  await db
    .insertInto("editions")
    .values({
      id: edition,
      title: "Scheduling checks",
      root_work_id: null,
      source: json({}),
      budget_usd: 0,
    })
    .execute();
});
afterAll(async () => {
  const works = await db
    .selectFrom("works")
    .select("id")
    .where("edition_id", "=", edition)
    .execute();
  if (works.length)
    await db
      .deleteFrom("openings")
      .where(
        "work_id",
        "in",
        works.map((w) => w.id),
      )
      .execute();
  if (works.length)
    await db
      .deleteFrom("publications")
      .where(
        "work_id",
        "in",
        works.map((w) => w.id),
      )
      .execute();
  for (const table of ["intents", "sessions", "documents", "works"] as const)
    await db.deleteFrom(table).where("edition_id", "=", edition).execute();
  await db.deleteFrom("editions").where("id", "=", edition).execute();
  await pool.end();
});

it("offers a quoted passage as a warm opening only when its destination is already readable", async () => {
  const { executeTool } = await import("../src/server/agent/tools.js");
  const { work, publication } = await fixture();
  const target = await createWork(edition, "A prepared destination", {});
  const ctx = {
    editionId: edition,
    sessionId: randomUUID(),
    intentId: null,
    critic: async () => "",
  };
  const args = {
    publication_id: publication.id,
    block_id: publication.blocks[0].id,
    target_work_id: target.id,
    label: "A prepared destination",
  };
  await expect(
    executeTool("offer_opening", json(args), randomUUID(), ctx),
  ).rejects.toThrow("published");
  const draft = await writeDocument(
    edition,
    randomUUID() + ".md",
    "A saved destination.",
    0,
    randomUUID(),
  );
  await publish(target.id, draft.id);
  const offered = JSON.parse(
    (await executeTool(
      "offer_opening",
      json({ ...args, quote: "saved passage" }),
      randomUUID(),
      ctx,
    )) as string,
  );
  expect(offered.source).toMatchObject({
    quote: "saved passage",
    offset: 2,
    endOffset: 15,
  });
  expect(
    await db
      .selectFrom("openings")
      .select("target_work_id")
      .where("work_id", "=", work.id)
      .execute(),
  ).toEqual([{ target_work_id: target.id }]);
});
async function fixture() {
  const work = await createWork(edition, "A saved test work", {});
  const draft = await writeDocument(
    edition,
    randomUUID() + ".md",
    "A saved passage for mechanical request checks.",
    0,
    randomUUID(),
  );
  const publication = await publish(work.id, draft.id);
  return { work, publication };
}
it("finishes an exploration that deliberately reopens an existing published work without requiring another purchase", async () => {
  const { work } = await fixture();
  const session = randomUUID();
  await db
    .insertInto("sessions")
    .values({
      id: session,
      edition_id: edition,
      role: "test",
      parent_id: null,
      input: json([
        {
          role: "assistant",
          type: "message",
          content: [
            {
              type: "output_text",
              text: "The existing work is the relevant opening.",
              annotations: [],
            },
          ],
        },
      ]),
    })
    .execute();
  const intent = await enqueue(edition, "explore", work.id, {}, randomUUID());
  await db
    .updateTable("intents")
    .set({ session_id: session, result_work_id: work.id, status: "running" })
    .where("id", "=", intent.id)
    .execute();
  await runIntent(intent.id);
  expect(
    await db
      .selectFrom("intents")
      .select(["status", "result_work_id"])
      .where("id", "=", intent.id)
      .executeTakeFirst(),
  ).toEqual({ status: "done", result_work_id: work.id });
});
it("deduplicates reading heartbeats and gives an explicit request priority over preparation", async () => {
  const { work, publication } = await fixture();
  const place = {
    publicationId: publication.id,
    blockId: publication.blocks[0].id,
  };
  const preparation = await recordReading(edition, work.id, place);
  expect(await recordReading(edition, work.id, place)).toBe(preparation);
  const explicit = await enqueue(
    edition,
    "continue",
    work.id,
    { after_publication_id: publication.id },
    randomUUID(),
  );
  expect((await nextIntent(edition))?.id).toBe(explicit.id);
  await db
    .updateTable("intents")
    .set({ status: "done" })
    .where("id", "=", explicit.id)
    .execute();
  expect((await nextIntent(edition))?.id).toBe(preparation);
  await db
    .updateTable("intents")
    .set({ payload: json({ last_seen: "2000-01-01T00:00:00Z" }) })
    .where("id", "=", preparation!)
    .execute();
  expect(await nextIntent(edition)).toBeUndefined();
  await recordReading(edition, work.id, place);
  expect((await nextIntent(edition))?.id).toBe(preparation);
  await db
    .updateTable("intents")
    .set({ status: "done" })
    .where("id", "=", preparation!)
    .execute();
});
it("uses a publication prepared while a continuation waited, without buying another, and gives the agent earlier reading context without treating an unread continuation as a reason to skip nested preparation", async () => {
  const { work, publication } = await fixture();
  const request = await enqueue(
    edition,
    "continue",
    work.id,
    { after_publication_id: publication.id },
    randomUUID(),
  );
  expect(await useAvailableContinuation(request.id)).toBe(false);
  const draft = await writeDocument(
    edition,
    randomUUID() + ".md",
    "A next saved passage.",
    0,
    randomUUID(),
  );
  await publish(work.id, draft.id);
  expect(await useAvailableContinuation(request.id)).toBe(true);
  expect(
    await db
      .selectFrom("intents")
      .select(["status", "result_work_id"])
      .where("id", "=", request.id)
      .executeTakeFirst(),
  ).toEqual({ status: "done", result_work_id: work.id });
  const preparation = await recordReading(edition, work.id, {
    publicationId: publication.id,
    blockId: publication.blocks[0].id,
  });
  expect(preparation).toBeTypeOf("string");
  const record = await db.selectFrom("intents").selectAll()
    .where("id", "=", preparation!).executeTakeFirstOrThrow();
  expect(record.payload.reader_place).toMatchObject({publicationId: publication.id});
  expect(record.payload.unread_publication_ids).toHaveLength(1);
  expect(record.payload.source).toMatchObject({publication: {id: publication.id}});
  expect(await useAvailableContinuation(preparation!)).toBe(false);
  expect(await recordReading(edition, work.id, {
    publicationId: publication.id, blockId: publication.blocks[0].id,
  })).toBe(preparation);
  await db.updateTable("intents").set({status: "done"}).where("id", "=", preparation!).execute();
  expect(await recordReading(edition, work.id, {
    publicationId: publication.id, blockId: publication.blocks[0].id,
  })).toBe(preparation);
});

it("rejects a reading signal whose publication belongs to another work", async () => {
  const first = await fixture();
  const other = await fixture();
  await expect(recordReading(edition, first.work.id, {
    publicationId: other.publication.id, blockId: other.publication.blocks[0].id,
  })).rejects.toThrow("reading place");
});

it("coalesces concurrent readers into one preparation opportunity", async () => {
  const {work, publication} = await fixture();
  const place = {publicationId: publication.id, blockId: publication.blocks[0].id};
  const ids = await Promise.all(Array.from({length: 12}, () => recordReading(edition, work.id, place)));
  expect(new Set(ids).size).toBe(1);
  await db.updateTable("intents").set({status: "done"}).where("id", "=", ids[0]).execute();
});

it("yields an in-progress preparation at a settled boundary without buying a response or losing its saved context", async () => {
  const {work, publication} = await fixture();
  const prep = await recordReading(edition, work.id, {publicationId: publication.id, blockId: publication.blocks[0].id});
  const session = randomUUID();
  const input = [{role: "user" as const, content: "Preparation context already saved."}];
  await db.insertInto("sessions").values({id: session, edition_id: edition, role: "author", input: json(input), parent_id: null}).execute();
  await db.updateTable("intents").set({session_id: session, status: "running"}).where("id", "=", prep!).execute();
  const request = await enqueue(edition, "continue", work.id, {after_publication_id: publication.id}, randomUUID());
  await runIntent(prep!);
  expect(await db.selectFrom("intents").select("status").where("id", "=", prep!).executeTakeFirst()).toEqual({status: "done"});
  expect((await db.selectFrom("sessions").select("input").where("id", "=", session).executeTakeFirstOrThrow()).input).toEqual(input);
  expect(await db.selectFrom("operations").select("id").where("session_id", "=", session).execute()).toEqual([]);
  expect((await nextIntent(edition))?.id).toBe(request.id);
  await db.updateTable("intents").set({status: "done"}).where("id", "=", request.id).execute();
});
