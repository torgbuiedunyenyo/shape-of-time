import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);

async function document(name) {
  return readFile(new URL(name, ROOT), "utf8");
}

function normalized(text) {
  return text.replace(/\s+/gu, " ").trim();
}

function requireAll(text, fragments, label) {
  const value = normalized(text);
  for (const fragment of fragments) {
    assert.ok(value.includes(fragment), `${label} is missing ${fragment}`);
  }
}

test("the active queue puts one complete reader experience before further machinery", async () => {
  const [spec, evals, plan, handoff] = await Promise.all([
    document("SPEC.md"),
    document("EVALS.md"),
    document("PLAN.md"),
    document("HANDOFF.md"),
  ]);

  requireAll(
    spec,
    [
      "reader-first experience slice",
      "eight root folios",
      "independent two-folio child",
      "four narrative plates",
      "The maps were always becoming wrong",
      "file-backed",
      "larger garden is an expansion after the slice passes",
      "Fable receives prior prose and narrative images interleaved",
      "Fable-authored image direction",
      "GPT Image 2 receives that direction plus the smallest relevant ordered set of approved prior images",
    ],
    "SPEC.md",
  );

  requireAll(
    evals,
    [
      "Reader-first vertical slice",
      "In-app Browser and consecutive-reading delight gate",
      "Simple pagewise generation and real cold paths",
      "Incremental garden expansion and deployed release QA",
      "Generation and provider credentials remain disconnected from the reader runtime",
      "actual reader plates",
      "conditional diagnostic",
    ],
    "EVALS.md",
  );

  requireAll(
    plan,
    [
      "CURRENT ITEM: D6 — deploy and exercise the complete dynamic reader",
      "A0/A1/A2/B0/B1 [DONE, FROZEN]",
      "Treatment B medium [DONE]",
      "C0 — Build the reader-first vertical slice **[DONE]**",
      "eight finished root folios",
      "The Map on the Wall",
      "four actual narrative plates",
      "bounded editorial authoring run",
      "not as proof that the D0/D1 production adapters already exist",
      "file-backed fixture and reader in the same item",
      "C1 — Pass the reader-first delight gate **[DONE]**",
      "D4 — Connect live highlight and explicit title creation",
      "D5 — Prepare only the next likely folio",
      "D6 — Pass the complete dynamic-reader experience gate",
      "every visible UI feature",
      "in-app Browser evidence",
      "G0 — Expand the garden after delight and generation",
      "new prose plus a natural-language image direction",
      "application chooses the eligible ordered references",
    ],
    "PLAN.md",
  );

  assert.ok(plan.indexOf("### D4 — Connect live highlight") < plan.indexOf("### D5 — Prepare only the next"));
  assert.doesNotMatch(plan, /### D4 — Prove the dormant long-form provenance seam/);
  assert.doesNotMatch(plan, /On exposure reserve next, second-next/);
  assert.doesNotMatch(plan, /B0 \+ B2 -> C0 static garden/);
  assert.doesNotMatch(plan, /The initial garden is a 14-folio/);
  assert.doesNotMatch(plan, /two distinct futures/);
  assert.doesNotMatch(plan, /Postgres-leased/);
  assert.doesNotMatch(plan, /same-key transient retry/);
  assert.ok(plan.indexOf("### G0 — Expand the garden") < plan.indexOf("### F0 — Pass the release gate"));
  assert.match(plan, /### F0[\s\S]*?\*\*Depends on:\*\* G0/);

  requireAll(
    handoff,
    [
      "codex/dynamic-reader",
      "CURRENT ITEM: D6",
      "B2 is frozen",
      "must not dispatch",
      "C0/C1 reader-first slice complete",
    ],
    "HANDOFF.md",
  );
  assert.doesNotMatch(handoff, /B2 remains PENDING overall/);
  assert.doesNotMatch(handoff, /## B2 in flight/);
  assert.doesNotMatch(handoff, /before a separately authorized one-call live execution/);
});
