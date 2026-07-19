import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const files = Object.fromEntries(
  await Promise.all(
    ["SPEC.md", "EVALS.md", "PLAN.md", "HANDOFF.md"].map(async (file) => [file, await readFile(file, "utf8")]),
  ),
);

test("image authority matches the documented GPT Image 2 evidence boundary", () => {
  for (const [file, text] of Object.entries(files)) {
    assert.doesNotMatch(text, /records? the requested and served GPT Image 2 model/i, `${file} claims an unavailable served model`);
    assert.doesNotMatch(text, /reject served-model mismatch/i, `${file} claims an unavailable served model`);
  }
  assert.match(files["SPEC.md"], /gpt-image-2-2026-04-21/);
  assert.match(files["EVALS.md"], /served model is not\s+exposed by the Image API/i);
  assert.match(files["PLAN.md"], /ambiguous dispatch is never retried automatically/i);
});

test("B1 names the external recovery and sanitized replay boundary", () => {
  assert.match(
    files["PLAN.md"],
    /operator-owned recovery\s+archive outside the repository and live Railway bucket/i,
  );
  assert.match(files["PLAN.md"], /replay[^.]*does not regenerate pixels/i);
  assert.match(files["HANDOFF.md"], /B1 is complete/i);
  assert.doesNotMatch(files["HANDOFF.md"], /B1 has not begun/i);
  assert.match(files["PLAN.md"], /CURRENT ITEM: B2/i);
});
