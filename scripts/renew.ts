import { db, pool } from "../src/server/db/index.js";
import { renewSession } from "../src/server/agent/renewal.js";
const key = process.argv[2];
if (!key)
  throw new Error(
    "Supply a stable renewal request key so rerunning this command reuses the same receipt.",
  );
const connection = await pool.connect();
try {
  const { rows } = await connection.query(
    "select pg_try_advisory_lock(hashtext($1)) as locked",
    ["shape-of-time:author"],
  );
  if (!rows[0].locked)
    throw new Error(
      "The author is still working. Renew after the current reading request finishes.",
    );
  try {
    const active = await db
      .selectFrom("intents")
      .select("id")
      .where("edition_id", "=", "shape-of-time")
      .where("status", "in", ["running", "queued"])
      .executeTakeFirst();
    if (active)
      throw new Error(
        "Finish the pending reader request before renewing context.",
      );
    const session = await db
      .selectFrom("sessions")
      .select("id")
      .where("edition_id", "=", "shape-of-time")
      .where("role", "=", "author")
      .orderBy("created_at", "desc")
      .executeTakeFirstOrThrow();
    console.log(await renewSession(session.id, key));
  } finally {
    await connection.query("select pg_advisory_unlock(hashtext($1))", [
      "shape-of-time:author",
    ]);
  }
} finally {
  connection.release();
  await pool.end();
}
