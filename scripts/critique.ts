import { db, pool } from "../src/server/db/index.js";
import { critique } from "../src/server/agent/runner.js";
const key = process.argv[2];
if (!key)
  throw new Error(
    "Supply a stable review request key; reusing it retrieves the same review.",
  );
const session = await db
  .selectFrom("sessions")
  .select("id")
  .where("edition_id", "=", "shape-of-time")
  .where("role", "=", "author")
  .orderBy("created_at", "desc")
  .executeTakeFirstOrThrow();
const edition = await db
  .selectFrom("editions")
  .select("root_work_id")
  .where("id", "=", "shape-of-time")
  .executeTakeFirstOrThrow();
const subjects = process.argv.slice(3);
if (!subjects.length && edition.root_work_id)
  subjects.push(edition.root_work_id);
const question =
  "Read the actual published material in these works and view the actual illustrations. Assess the experience as a sustained illustrated narrative: what is absorbing or uninteresting, how characters and scenes develop, whether enough of the temporal world can be followed without didactic explanation, and how prose and images agree or differ. Investigate relevant original context. If these include nested works, read their founding passages/images too and assess both the connection and their independent life. Give grounded examples, uncertainty and a few consequential suggestions. Do not give numeric scores or treat an opening as proof of long-form coherence.";
console.log(
  await critique(
    "shape-of-time",
    session.id,
    question,
    subjects,
    "operator-review:" + key,
  ),
);
await pool.end();
