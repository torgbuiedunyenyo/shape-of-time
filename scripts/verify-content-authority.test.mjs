import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const CONTENT = new URL("../content/shape-of-time/", import.meta.url);
const WORLD_SHA256 = "e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c";
const UNDERTOW_SHA256 = "9dc8f105dac17a8a751a397026ff9b243d1de529633be1cc1431819e19c55dd3";

const retiredPatterns = [
  /\bdark thing\b/i,
  /disturbance.{0,80}(?:amplif|grow stronger|snowball)/i,
  /(?:scattered|duplicate|multiple)\s+(?:copies|selves|versions)\s+of\s+(?:a person|someone|Jay)/i,
  /Jay.{0,80}(?:mystical|supernatural|innate).{0,40}(?:temporal|time)/i,
  /(?:fixed|immutable|unchanging).{0,30}2150/i,
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function content(name, encoding) {
  return readFile(new URL(name, CONTENT), encoding);
}

function requireAll(text, fragments, label) {
  for (const fragment of fragments) {
    assert.ok(text.includes(fragment), `${label} is missing ${fragment}`);
  }
}

function retiredMaterialIssues(text) {
  return retiredPatterns.flatMap((pattern) => (pattern.test(text) ? [pattern.source] : []));
}

test("A0 begins from the byte-exact corrected world and segregated Undertow source", async () => {
  assert.equal(sha256(await content("world.md")), WORLD_SHA256);
  assert.equal(sha256(await content("undertow.md")), UNDERTOW_SHA256);
});

test("A0 has a machine-readable authority manifest that excludes Undertow from the main narrative", async () => {
  const manifest = JSON.parse(await content("authority.json", "utf8"));

  assert.equal(manifest.schemaVersion, 1);
  assert.ok(["pending-owner", "approved"].includes(manifest.review?.status));
  if (manifest.review.status === "approved") {
    assert.equal(typeof manifest.review.reviewer, "string");
    assert.ok(manifest.review.reviewer.length > 0);
    assert.match(manifest.review.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  } else {
    assert.equal(manifest.review.reviewer, null);
    assert.equal(manifest.review.reviewedAt, null);
  }
  assert.deepEqual(manifest.canonSource, { path: "world.md", sha256: WORLD_SHA256 });
  assert.deepEqual(manifest.mainNarrativeDocuments, ["story-bible.md", "arc.md", "visual-bible.md"]);
  assert.deepEqual(manifest.sequelSeeds, [
    { path: "undertow.md", sha256: UNDERTOW_SHA256, status: "excluded" },
  ]);
  assert.ok(!manifest.mainNarrativeDocuments.includes("undertow.md"));
});

test("A0 story bible states cited invariants, terminology, unknowns, and forbidden contradictions", async () => {
  const bible = await content("story-bible.md", "utf8");

  requireAll(
    bible,
    [
      "## Canon invariants",
      "## Terminology",
      "## Character and relationship authority",
      "## Known unknowns",
      "## Forbidden contradictions",
      "[TIME-01]",
      "[TIME-02]",
      "[TIME-03]",
      "[TECH-01]",
      "[ECON-01]",
      "[CHAR-JAY]",
      "[CHAR-TAN]",
      "[PLOT-END]",
      "[FORBID-DARK]",
      "[FORBID-AMPLIFICATION]",
      "[FORBID-DUPLICATES]",
      "[FORBID-MYSTIC-JAY]",
      "[FORBID-2150]",
    ],
    "story-bible.md",
  );
  assert.ok((bible.match(/world\.md:L\d+(?:-L\d+)?/g) ?? []).length >= 16, "story bible lacks citations");
});

test("A0 arc contains six finite parts, the true ending, and a deliberate pilot boundary", async () => {
  const arc = await content("arc.md", "utf8");

  for (let part = 1; part <= 6; part += 1) requireAll(arc, [`[ARC-${part}]`], "arc.md");
  assert.equal((arc.match(/\[ARC-[1-6]\]/g) ?? []).length, 6, "arc must define exactly six numbered parts");
  requireAll(
    arc,
    [
      "## Complete six-part arc",
      "## Pilot movement boundary [PILOT-BOUNDARY]",
      "Meeting",
      "phone and payment incident",
      "courtship",
      "temporal orientation",
      "decision threshold",
      "[TRUE-END]",
      "UNDERTOW_STATUS: EXCLUDED_SEQUEL_SEED",
    ],
    "arc.md",
  );
  assert.ok((arc.match(/world\.md:L\d+(?:-L\d+)?/g) ?? []).length >= 10, "arc lacks citations");
});

test("A0 visual bible resolves a direction and classifies binding, variable, and unspecified traits", async () => {
  const visual = await content("visual-bible.md", "utf8");
  const subjects = ["Jay", "Tan", "Clef", "Oakland", "Temporal maps and transit", "Important objects"];

  requireAll(visual, ["## Selected direction [VISUAL-DIRECTION]", "## Reference and continuity rules"], "visual-bible.md");
  for (const subject of subjects) {
    const start = visual.indexOf(`### ${subject}`);
    assert.ok(start >= 0, `visual-bible.md is missing ${subject}`);
    const next = visual.indexOf("\n### ", start + 5);
    const section = visual.slice(start, next < 0 ? visual.length : next);
    requireAll(section, ["**Binding:**", "**Variable:**", "**Unspecified:**"], `${subject} section`);
  }
  assert.ok((visual.match(/world\.md:L\d+(?:-L\d+)?/g) ?? []).length >= 8, "visual bible lacks citations");
});

test("A0 content gate rejects source-preamble and retired-concept mutations", async () => {
  const world = await content("world.md");
  const preambleMutation = Buffer.concat([Buffer.from("EDITORIAL PREAMBLE\n"), world]);
  assert.notEqual(sha256(preambleMutation), WORLD_SHA256);

  const retiredMutations = [
    "A malevolent dark thing waits at the edge.",
    "The disturbance will amplify until it swallows every era.",
    "There are scattered copies of Jay across time.",
    "Jay has an innate mystical sense of temporal currents.",
    "The fixed 2150 chronology cannot change.",
  ];
  for (const mutation of retiredMutations) {
    assert.ok(retiredMaterialIssues(mutation).length > 0, `retired mutation escaped: ${mutation}`);
  }

  const mainNarrative = await Promise.all(["arc.md", "visual-bible.md"].map((name) => content(name, "utf8")));
  assert.deepEqual(retiredMaterialIssues(mainNarrative.join("\n")), []);
});
