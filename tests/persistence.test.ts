import { beforeAll, afterAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db, json, pool } from "../src/server/db/index.js";
import { migrate } from "../src/server/db/migrate.js";
import {
  createWork,
  writeDocument,
  publish,
  getBook,
  enqueue,
  sourceContext,
} from "../src/server/library/store.js";
const edition = randomUUID();
beforeAll(async () => {
  await migrate();
  await db
    .insertInto("editions")
    .values({
      id: edition,
      title: "Persistence test",
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
      .deleteFrom("publications")
      .where(
        "work_id",
        "in",
        works.map((w) => w.id),
      )
      .execute();
  for (const table of ["intents", "documents", "assets", "works"] as const)
    await db.deleteFrom(table).where("edition_id", "=", edition).execute();
  await db.deleteFrom("editions").where("id", "=", edition).execute();
  await pool.end();
});
it("saves long drafts without a folio quota, atomically publishes a revision once, and reloads its anchors", async () => {
  const work = await createWork(edition, "An unrestricted test draft", {});
  const body = Array.from(
    { length: 12 },
    (_, i) =>
      `Paragraph ${i + 1}. ${"A persistence fixture, not evidence of literary quality. ".repeat(24)}`,
  ).join("\n\n");
  const draft = await writeDocument(edition, "draft.md", body, 0, randomUUID());
  const [a, b] = await Promise.all([
    publish(work.id, draft.id),
    publish(work.id, draft.id),
  ]);
  expect(a.id).toBe(b.id);
  expect(a.blocks).toHaveLength(12);
  expect(a.blocks[11].text).toContain("Paragraph 12");
  const reloaded = await getBook(work.id);
  expect(reloaded.publications).toHaveLength(1);
  expect(reloaded.publications[0].blocks).toEqual(a.blocks);
  const selection = {
    publicationId: a.id,
    blockId: a.blocks[0].id,
    offset: 0,
    endBlockId: a.blocks[1].id,
    endOffset: 12,
    quote: a.blocks[0].text + "\n\n" + a.blocks[1].text.slice(0, 12),
  };
  expect((await sourceContext(selection)).anchor).toEqual(selection);
});
it("rejects missing images while preserving the draft and all prior publications", async () => {
  const work = await createWork(edition, "Unavailable image", {});
  const draft = await writeDocument(
    edition,
    "missing.md",
    "Some prose.\n\n![A study](asset:missing)",
    0,
    randomUUID(),
  );
  await expect(publish(work.id, draft.id)).rejects.toThrow("not available");
  expect((await getBook(work.id)).publications).toHaveLength(0);
  expect(
    (
      await db
        .selectFrom("documents")
        .selectAll()
        .where("id", "=", draft.id)
        .executeTakeFirstOrThrow()
    ).body,
  ).toContain("asset:missing");
});
it("replays a completed document operation without a second revision and refuses a stale edit", async () => {
  const key = randomUUID();
  const draft = await writeDocument(
    edition,
    "notes.md",
    "Original notes.",
    0,
    key,
  );
  expect(
    (await writeDocument(edition, "notes.md", "Original notes.", 0, key)).id,
  ).toBe(draft.id);
  await expect(
    writeDocument(edition, "notes.md", "Stale replacement.", 0, randomUUID()),
  ).rejects.toThrow("current revision is 1");
  expect(
    (
      await writeDocument(
        edition,
        "notes.md",
        "Deliberate revision.",
        1,
        randomUUID(),
      )
    ).revision,
  ).toBe(2);
});
it("deduplicates a repeated reader request before any provider work is bought", async () => {
  const key = randomUUID();
  const a = await enqueue(edition, "begin", null, {}, key);
  const b = await enqueue(edition, "begin", null, {}, key);
  expect(a.id).toBe(b.id);
  expect(a.status).toBe("queued");
});

it("finds the published original without presenting a later unpublished revision as reader history", async () => {
  const { executeTool } = await import("../src/server/agent/tools.js");
  const work = await createWork(edition, "Source lookup", {});
  const first = await writeDocument(
    edition,
    "source-lookup.md",
    "The reserved glass belongs to the traveler.",
    0,
    randomUUID(),
  );
  const publication = await publish(work.id, first.id);
  await writeDocument(
    edition,
    "source-lookup.md",
    "Unpublished alternative: the reserved glass is broken.",
    1,
    randomUUID(),
  );
  const result = JSON.parse(
    (await executeTool(
      "archive",
      json({ action: "search", kind: "publication", query: "reserved glass" }),
      randomUUID(),
      {
        editionId: edition,
        sessionId: randomUUID(),
        intentId: null,
        critic: async () => "",
      },
    )) as string,
  );
  expect(result.publications).toEqual([
    expect.objectContaining({
      id: publication.id,
      document_id: first.id,
      excerpt: first.body,
    }),
  ]);
  expect(result.documents).toBeUndefined();
  expect(result.works).toBeUndefined();
});

it("lets the author develop a side work without replacing the reader-requested root", async () => {
  const { executeTool } = await import("../src/server/agent/tools.js");
  const request = await enqueue(edition, "begin", null, {}, randomUUID());
  const context = {
    editionId: edition,
    sessionId: randomUUID(),
    intentId: request.id,
    critic: async () => "",
  };
  const root = JSON.parse(
    (await executeTool(
      "open_work",
      json({
        title: "Requested root",
        purpose: "Mechanical routing test",
        for_request: true,
      }),
      randomUUID(),
      context,
    )) as string,
  );
  const side = JSON.parse(
    (await executeTool(
      "open_work",
      json({
        title: "An independent side work",
        purpose: "A possible prepared opening",
        for_request: false,
      }),
      randomUUID(),
      context,
    )) as string,
  );
  const draft = await writeDocument(
    edition,
    "side-work.md",
    "A fixture for the independent side work.",
    0,
    randomUUID(),
  );
  await executeTool(
    "publish",
    json({ work_id: side.id, document_id: draft.id }),
    randomUUID(),
    context,
  );
  expect(
    (
      await db
        .selectFrom("intents")
        .select("result_work_id")
        .where("id", "=", request.id)
        .executeTakeFirstOrThrow()
    ).result_work_id,
  ).toBe(root.id);
  expect(
    (
      await db
        .selectFrom("editions")
        .select("root_work_id")
        .where("id", "=", edition)
        .executeTakeFirstOrThrow()
    ).root_work_id,
  ).toBe(root.id);
});

it("can follow an archive cursor to the next original instead of silently losing sources beyond the first result page", async () => {
  const { listArchive } = await import("../src/server/library/archive.js");
  const work = await createWork(edition, "Archive paging", {});
  const ids: string[] = [];
  for (const name of ["first", "second"]) {
    const draft = await writeDocument(
      edition,
      `paging-${name}.md`,
      `Archive paging fixture: ${name} original.`,
      0,
      randomUUID(),
    );
    ids.push((await publish(work.id, draft.id)).id);
  }
  const first = await listArchive(
    edition,
    "publication",
    "Archive paging fixture",
    0,
    1,
  );
  expect(first.publications).toEqual([expect.objectContaining({ id: ids[0] })]);
  expect(first.next_offset).toBe(1);
  const second = await listArchive(
    edition,
    "publication",
    "Archive paging fixture",
    first.next_offset!,
    1,
  );
  expect(second.publications).toEqual([
    expect.objectContaining({ id: ids[1] }),
  ]);
  expect(second.next_offset).toBeNull();
});
