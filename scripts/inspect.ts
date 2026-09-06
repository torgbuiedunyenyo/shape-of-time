import { db, pool } from "../src/server/db/index.js";
import { budget } from "../src/server/providers/operations.js";
console.log(
  JSON.stringify(
    {
      budget: await budget("shape-of-time"),
      works: await db
        .selectFrom("works")
        .select(["id", "title"])
        .where("edition_id", "=", "shape-of-time")
        .execute(),
      intents: await db
        .selectFrom("intents")
        .select(["id", "kind", "status", "result_work_id", "error"])
        .where("edition_id", "=", "shape-of-time")
        .orderBy("created_at")
        .execute(),
      operations: await db
        .selectFrom("operations")
        .select([
          "id",
          "kind",
          "status",
          "provider_id",
          "reserved_usd",
          "actual_usd",
          "error",
        ])
        .where("edition_id", "=", "shape-of-time")
        .orderBy("created_at")
        .execute(),
    },
    null,
    2,
  ),
);
await pool.end();
