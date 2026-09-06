import { randomUUID } from "node:crypto";
import { db, pool } from "../src/server/db/index.js";
import { enqueue, initializeEdition } from "../src/server/library/store.js";
import { config } from "../src/server/config.js";
import { pump } from "../src/server/agent/runner.js";
if (!config.generationEnabled)
  throw new Error(
    "Set GENERATION_ENABLED=true deliberately before a funded live run.",
  );
await initializeEdition();
const workId = process.argv[3] ?? null;
const intent = await enqueue(
  "shape-of-time",
  workId ? "continue" : "begin",
  workId,
  {},
  process.argv[2] ?? `live:${randomUUID()}`,
);
console.log("Saved live reading request", intent.id);
await pump();
console.log(
  await db
    .selectFrom("intents")
    .select(["id", "status", "result_work_id", "error"])
    .where("id", "=", intent.id)
    .executeTakeFirst(),
);
await pool.end();
