import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const plan = await readFile("content/shape-of-time/visual-continuity-plan.md", "utf8");
const qa = await readFile("docs/qa/2026-07-19-b2-continuity-stage-1.md", "utf8");

test("B2 continuity plan fixes exactly eight staged images without pre-approving anchors", async () => {
  assert.equal((plan.match(/^### Image [1-8] —/gm) ?? []).length, 8);
  assert.match(plan, /Image 1 — Root F02 Payment/);
  assert.match(plan, /Image 2 — Root F01 Late shift/);
  assert.match(plan, /Image 3 — Root F07 Thursday/);
  assert.match(plan, /Image 4 — Root F04 The bus stop/);
  assert.match(plan, /Image 5 — Blue Badges F01 Two rooms/);
  assert.match(plan, /Image 6 — Map on the Wall F01 Licensed route/);
  assert.match(plan, /Image 7 — Map on the Wall F04 Terminal wall/);
  assert.match(plan, /Image 8 — Map on the Wall F02 Order to return/);
  assert.match(plan, /neighbor repair/i);
  assert.match(plan, /parent-to-child inheritance/i);
  assert.match(plan, /purposeful.*change/i);
  assert.match(plan, /Phantas Minor/i);
  assert.match(plan, /human approval.*before.*reference/is);
  await assert.rejects(access("content/shape-of-time/visual-study/anchors.json"), /ENOENT/);
});

test("Stage 1 evidence records one no-reference call, a $0.05 ceiling, and no execution", () => {
  assert.match(qa, /b2-continuity-root-payment-v1/);
  assert.match(qa, /gpt-image-2-2026-04-21/);
  assert.match(qa, /1024×1536/);
  assert.match(qa, /medium quality/i);
  assert.match(qa, /zero reference images/i);
  assert.match(qa, /exactly one provider operation/i);
  assert.match(qa, /\$0\.05/);
  assert.match(qa, /Provider calls executed:\s*0/i);
  assert.match(qa, /PENDING.*DRY-RUN.*INSPECTION/i);
});
