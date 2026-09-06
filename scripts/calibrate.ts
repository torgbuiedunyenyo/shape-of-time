import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { db, pool } from "../src/server/db/index.js";
import { config } from "../src/server/config.js";
import { critique } from "../src/server/agent/runner.js";
const [sourcePath, outputPath] = process.argv.slice(2);
if (!config.generationEnabled || !sourcePath || !outputPath)
  throw new Error(
    "A funded calibration requires GENERATION_ENABLED=true and source/output paths.",
  );
const source = await readFile(sourcePath, "utf8");
const sha = createHash("sha256").update(source).digest("hex");
const author = await db
  .selectFrom("sessions")
  .select("id")
  .where("edition_id", "=", "shape-of-time")
  .where("role", "=", "author")
  .orderBy("created_at", "desc")
  .executeTakeFirstOrThrow();
const question = `This review concerns archived text-only editions of infinite-book, NOT the new illustrated edition.
State that provenance clearly in the review. The attached packet contains verbatim existing pages,
their book/page/edition labels, and deployment provenance. Missing page ranges are genuinely absent
from this packet. Do not assume that two separately labeled editions must realize a concept in the
same way, or impose the current artistic source as a retrospective rule on historical fiction.

Read these sequences as an attentive literary reader. Assess their narrative interest and development,
meaningful continuity or inconsistency across the supplied ranges, and the experience of the later
stretches. Investigate concrete details rather than accepting a summary judgment. Explain which
relationships are supported, which are contradicted, and which need missing context. Distinguish
viewpoint, deliberate variation and uncertainty from errors. Some material may cohere well; do not
presuppose a defect in every sequence. Cite the exact edition/book/page for consequential claims.
Give a grounded qualitative review, not a score or a checklist. The archive tools in this session
contain the NEW edition; use this packet as the historical source and acknowledge its limits.

Historical source packet (SHA-256 ${sha}):\n${source}`;
try {
  const result = await critique(
    "shape-of-time",
    author.id,
    question,
    [],
    `calibration:${sha}`,
  );
  await writeFile(outputPath, result);
  console.log({ sourceSha256: sha, review: outputPath });
} finally {
  await pool.end();
}
