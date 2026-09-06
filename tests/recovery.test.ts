import { beforeAll, afterAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { db, json, pool } from "../src/server/db/index.js";
import { migrate } from "../src/server/db/migrate.js";
import { config } from "../src/server/config.js";
import { reserve, budget, Paused } from "../src/server/providers/operations.js";
import { recordedTool, executeTool } from "../src/server/agent/tools.js";
import { makeImage } from "../src/server/providers/image.js";
import { putBytes } from "../src/server/library/assets.js";
import { textCost } from "../src/server/providers/astra.js";
const edition = randomUUID(),
  session = randomUUID();
const ctx = {
  editionId: edition,
  sessionId: session,
  intentId: null,
  critic: async () => "",
};
beforeAll(async () => {
  await migrate();
  await db
    .insertInto("editions")
    .values({
      id: edition,
      title: "Recovery fixture",
      root_work_id: null,
      source: json({}),
      budget_usd: 5,
    })
    .execute();
  await db
    .insertInto("sessions")
    .values({
      id: session,
      edition_id: edition,
      role: "test",
      input: json([]),
      parent_id: null,
    })
    .execute();
});
afterAll(async () => {
  await db
    .deleteFrom("tool_results")
    .where("session_id", "=", session)
    .execute();
  for (const table of [
    "assets",
    "documents",
    "operations",
    "sessions",
  ] as const)
    await db.deleteFrom(table).where("edition_id", "=", edition).execute();
  await db.deleteFrom("editions").where("id", "=", edition).execute();
  await pool.end();
});
it("recovers a tool interrupted after its document write without creating another revision", async () => {
  const callId = randomUUID(),
    args = json({
      path: "resume.md",
      body: "Saved before the process stopped.",
      expected_revision: 0,
    });
  await executeTool("write_document", args, callId, ctx);
  const result = await recordedTool("write_document", args, callId, ctx);
  expect(await recordedTool("write_document", args, callId, ctx)).toEqual(
    result,
  );
  expect(
    await db
      .selectFrom("documents")
      .select("revision")
      .where("edition_id", "=", edition)
      .where("path", "=", "resume.md")
      .execute(),
  ).toEqual([{ revision: 1 }]);
});
it("holds uncertain provider costs in the same allowance as writing, images and criticism", async () => {
  const original = config.generationEnabled;
  config.generationEnabled = true;
  try {
    const op = await reserve(edition, session, randomUUID(), "astra", {}, 4);
    await db
      .updateTable("operations")
      .set({ status: "unknown" })
      .where("id", "=", op.id)
      .execute();
    const state = await budget(edition);
    expect(state.remaining).toBe(1);
    expect(state.unknown).toBe(1);
    await expect(
      reserve(edition, session, randomUUID(), "image", {}, 2),
    ).rejects.toBeInstanceOf(Paused);
  } finally {
    config.generationEnabled = original;
  }
});
it("replays a saved image tool result from real object storage with provider generation disabled", async () => {
  // A tiny mechanical fixture, explicitly not a provider-contract or artistic success case.
  const opId = randomUUID(),
    assetId = "fixture-" + randomUUID(),
    key = randomUUID(),
    storageKey = `tests/${assetId}.png`;
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6yS0AAAAASUVORK5CYII=",
    "base64",
  );
  await putBytes(storageKey, bytes, "image/png");
  await db
    .insertInto("operations")
    .values({
      id: opId,
      edition_id: edition,
      session_id: session,
      key,
      kind: "image",
      status: "complete",
      request: json({}),
      provider_id: null,
      response: json({ asset_id: assetId }),
      raw_key: null,
      reserved_usd: 0,
      actual_usd: 0,
      error: null,
      completed_at: new Date().toISOString(),
    })
    .execute();
  await db
    .insertInto("assets")
    .values({
      id: assetId,
      edition_id: edition,
      storage_key: storageKey,
      mime: "image/png",
      width: 1,
      height: 1,
      operation_id: opId,
      description: "Mechanical fixture",
      references: json([]),
    })
    .execute();
  const result = await makeImage(edition, session, key, {
    prompt: "Mechanical fixture",
    size: "1024x1024",
    quality: "low",
    references: [],
  });
  expect(result[1]).toMatchObject({
    type: "input_image",
    image_url: "data:image/png;base64," + bytes.toString("base64"),
  });
  expect(config.generationEnabled).toBe(false);
});
it("prices actual cache reads and writes separately and applies the long-context rate to the full request", () => {
  const usage = {
    input_tokens: 300000,
    input_tokens_details: { cached_tokens: 100000, cache_write_tokens: 50000 },
    output_tokens: 10000,
    output_tokens_details: { reasoning_tokens: 5000 },
    total_tokens: 310000,
  };
  expect(textCost(usage)).toBeCloseTo(5.2);
});

it("continues a recovered actual Astra response from the saved receipt without another provider dispatch", async () => {
  const { readFile } = await import("node:fs/promises");
  const { astra } = await import("../src/server/providers/astra.js");
  const receipt = JSON.parse(
    await readFile(
      new URL("./receipts/astra-first-resources.json", import.meta.url),
      "utf8",
    ),
  );
  const key = randomUUID();
  await db
    .insertInto("operations")
    .values({
      id: randomUUID(),
      edition_id: edition,
      session_id: session,
      key,
      kind: "astra",
      status: "complete",
      request: json({}),
      provider_id: receipt.provenance.provider_id,
      response: json(receipt.response),
      raw_key: null,
      reserved_usd: 0,
      actual_usd: 0,
      error: null,
      completed_at: new Date().toISOString(),
    })
    .execute();
  const response = await astra(edition, session, key, [], []);
  expect(response.model).toBe("gpt-6-astra");
  expect(response.reasoning).toMatchObject({
    effort: "xhigh",
    context: "all_turns",
  });
  expect(response.output).toEqual(receipt.response.output);
  expect(response.output[0]).toMatchObject({
    type: "function_call",
    name: "resources",
  });
});
