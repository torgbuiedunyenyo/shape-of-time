import { afterAll, beforeAll, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { db, json, pool } from "../src/server/db/index.js";
import { migrate } from "../src/server/db/migrate.js";
import { config } from "../src/server/config.js";
import { currentMechanism } from "../src/server/mechanism.js";
import { reserve } from "../src/server/providers/operations.js";

const edition = randomUUID(), session = randomUUID();
beforeAll(async () => {
  await migrate();
  await db.insertInto("editions").values({ id: edition, title: "Pinned mechanism fixture", source: json({}),
    root_work_id: null, budget_usd: 5, mechanism: json(await currentMechanism()) }).execute();
  await db.insertInto("sessions").values({ id: session, edition_id: edition, role: "test", input: json([]), parent_id: null }).execute();
});
afterAll(async () => {
  await db.deleteFrom("operations").where("edition_id", "=", edition).execute();
  await db.deleteFrom("sessions").where("edition_id", "=", edition).execute();
  await db.deleteFrom("editions").where("id", "=", edition).execute();
  await pool.end();
});
it("records the actual mechanism on a reserved request and refuses to mix changed generation behavior into a pinned edition", async () => {
  const generation = config.generationEnabled, threshold = config.contextRenewalTokens;
  config.generationEnabled = true;
  const key = randomUUID();
  try {
    const saved = await reserve(edition, session, key, "astra", { purpose: "Reservation only; no provider dispatch" }, 1);
    expect(saved.request.mechanism).toEqual(await currentMechanism());
    config.contextRenewalTokens = threshold + 1;
    await expect(reserve(edition, session, randomUUID(), "astra", {}, 1)).rejects.toThrow("pinned process");
    expect((await db.selectFrom("operations").select("id").where("edition_id", "=", edition).execute())).toEqual([{ id: saved.id }]);
    // Already saved receipts remain retrievable; a process change never purchases a duplicate.
    expect((await reserve(edition, session, key, "astra", {}, 1)).id).toBe(saved.id);
  } finally {
    config.generationEnabled = generation;
    config.contextRenewalTokens = threshold;
  }
});
it("keeps visits, bookmarks and source quotations in their own edition across real persistent browser-storage reloads", async () => {
  const directory = await mkdtemp(join(tmpdir(), "shape-of-time-reading-"));
  const run = (script: string) => {
    const result = spawnSync(process.execPath, ["--experimental-webstorage", "--localstorage-file=" + join(directory, "reading"), "--import", "tsx", "--input-type=module", "-e", script], { encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
  };
  const imports = `import assert from 'node:assert/strict'; import {selectReadingEdition,enter,loadReading,saveReading} from './src/client/visits.ts';`;
  try {
    run(imports + `selectReadingEdition('development'); const id=enter('development-root',null); const state=loadReading(); state.bookmarks['development-root']={publicationId:'draft-publication',blockId:'draft-block'}; state.requests['old-opening']={intentId:'old-opening',visitId:id,source:{publicationId:'draft-publication',blockId:'draft-block',quote:'Private development passage'}}; saveReading(state);`);
    run(imports + `selectReadingEdition('reader-edition'); assert.deepEqual(loadReading().visits,{}); assert.deepEqual(loadReading().bookmarks,{}); assert.deepEqual(loadReading().requests,{}); enter('final-root',null);`);
    run(imports + `selectReadingEdition('reader-edition'); assert.equal(Object.values(loadReading().visits)[0].workId,'final-root'); selectReadingEdition('development'); assert.equal(Object.values(loadReading().visits)[0].workId,'development-root'); assert.equal(loadReading().requests['old-opening'].source.quote,'Private development passage');`);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
