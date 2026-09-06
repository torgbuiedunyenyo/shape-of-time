import { db, pool } from "../src/server/db/index.js";
import { parsedReceipt } from "../src/server/providers/operations.js";
const id = process.argv[2];
if (!id) throw new Error("Supply the saved reader request ID.");
const intent = await db
  .selectFrom("intents")
  .selectAll()
  .where("id", "=", id)
  .executeTakeFirstOrThrow();
if (!["paused", "failed"].includes(intent.status))
  throw new Error("Only a paused or failed request needs resuming.");
if (!intent.session_id)
  throw new Error("Inspect this request: it has no session.");
const ops = await db
  .selectFrom("operations")
  .selectAll()
  .where("session_id", "=", intent.session_id)
  .execute();
for (const op of ops) {
  if (["unknown", "failed"].includes(op.status))
    throw new Error(`Operation ${op.id} must be reconciled before resuming.`);
  if (
    op.status === "dispatched" &&
    !op.provider_id &&
    !parsedReceipt(op.response)
  )
    throw new Error(
      `Operation ${op.id} has an uncertain dispatch. Do not buy a replacement automatically.`,
    );
}
await db
  .updateTable("intents")
  .set({ status: "running", error: null })
  .where("id", "=", id)
  .execute();
console.log("The hosted worker can resume the same saved request:", id);
await pool.end();
