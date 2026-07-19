import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const candidates = await readFile("content/shape-of-time/visual-direction-candidates.md", "utf8");
const report = await readFile("docs/qa/2026-07-19-b2-visual-direction.md", "utf8");
const visualBible = await readFile("content/shape-of-time/visual-bible.md", "utf8");

test("B2 begins with three comparable treatments and a written bounded spend tranche", () => {
  assert.match(candidates, /same comparison scene/i);
  assert.equal((candidates.match(/^## Treatment [ABC] —/gm) ?? []).length, 3);
  assert.match(candidates, /SELECTED: TREATMENT B/i);
  assert.match(report, /exactly three medium-quality\s+1536×1024 generations/i);
  assert.match(report, /\$0\.15/);
  assert.match(report, /MEDIUM SELECTION: PASS/i);
});

test("the owner-approved medium is narrow and continuity anchors remain gated", async () => {
  assert.match(visualBible, /REVIEW_STATUS: MEDIUM_APPROVED_CONTINUITY_PENDING/);
  assert.match(visualBible, /inked reportage with transparent color/i);
  assert.match(visualBible, /not.*ferry terminal|does not authorize.*ferry terminal/is);
  assert.match(report, /project owner.*Treatment B/is);
  assert.match(report, /85e55625e3a8bcf3e31c3546689287dc306736bf8deef59172ae8511c6dd2b06/);
  assert.match(report, /gpt-image-2-2026-04-21/);
  assert.match(report, /served-model evidence is explicitly unavailable/i);
  assert.match(report, /req_e0f6415b63674914bda51745a8b63987/);
  assert.match(report, /a9ac29f4a649bba572ddb8dce97547e7bd8c27ef8413ec7a9d2d5fa44a1acf5a/);
  assert.match(report, /b76e2dbc05db4b553de4145bba9e502f714f88c2d49a09113aa129db8f8902e5/);
  assert.match(report, /c02bfd1d2fc98577c9ece5b6f20aff3e952275c63856ed3bca5dd67430332f85/);
  await assert.rejects(access("content/shape-of-time/visual-study/anchors.json"), /ENOENT/);
  assert.match(report, /Overall B2 judgment:\s*\n?\*\*PENDING CONTINUITY REVIEW\*\*/i);
  assert.doesNotMatch(report, /Overall B2 judgment:\s*\n?\*\*PASS/i);
});
