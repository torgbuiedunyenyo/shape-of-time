# QA — D3: Movement planning + pagewise generation (2026-07-19)

Scope: `src/server/text/movement-planner.ts` (+ unit test, + `prompts/fable/plan-movement.md`),
`src/server/generation/folio-generator.ts` (+ real-DB integration test), and three additions to
`LibraryRepository` (optional attempt `evidence` on ready; `getBook`; `listExposedFolios`;
`getAttemptEvidence`). Worktree `/Users/ratpartyserver/git/shape-of-time-d0`, branch
`fable/d0-fable-adapter`.

## Red evidence, observed before green

- Planner: `Cannot find module './movement-planner.js'`, Test Files 1 failed.
- Generator: the integration test was run with the implementation file removed —
  `Cannot find module './folio-generator.js'`, Test Files 1 failed — then restored. (Honesty
  note: the implementation was drafted before the test file; the module-removed red run is what
  proves the test binds to the requirement, plus the mutation below.)

## Adversarial verification (the gate rejected something)

Deliberately broke sibling isolation — removed the `book_id` filter from `listExposedFolios` —
and re-ran: **2 failed / 4 passed**, and the two failures were exactly the sibling-contamination
and movement-boundary tests. Restored (the restore initially clobbered the uncommitted repository
edits; they were re-applied and the full integration suite re-run green — 26/26, which includes
the pre-existing A2 suite against the modified repository).

## What D3 enforces in code (structural halves)

- **One bounded planning call** per movement boundary: `plan-movement.md` template, six
  placeholders each exactly once, single `<movement_brief>` reply element with nothing outside
  it. Phase instructions are code constants per book phase (root pre-arc / root post-arc /
  child first / child later); the compiled request is digest-bound and deterministic.
- **No replay**: `acceptPlannedMovement` refuses a movement id already in the book;
  `appendMovementBrief` refuses at the ledger (integration-verified).
- **No Undertow by default**: planning refuses Undertow (and visual-bible) material in any
  source and in the returned brief, by name.
- **Pagewise**: one prose call + one image call per folio; never a movement-sized prose unit.
  The idempotency key names book+movement+ordinal — duplicate requests return the same folio
  with zero further provider calls (integration-verified with counting fakes).
- **Crash resume**: an expired lease is reclaimed and the folio completes (1ms lease test).
- **Retry only from a named failure**: a truncated attempt records the failure, the folio goes
  `failed`, and only then does a successor attempt get minted; the retry succeeded and the folio
  holds the ordinal once.
- **Atomic ready**: prose + required image asset + layout + attempt evidence (usage, latency,
  provider request id, context digest) land in one `markFolioReady` transition; exposure is a
  separate explicit transition.
- **Sibling isolation on the normal path**: history is loaded via `listExposedFolios(bookId)` —
  a child's compiled request carries its own founding passage and never a sibling's prose
  (integration-verified with sentinels, and mutation-verified above).

## What D3 does NOT enforce in code (semantic halves — named honestly)

"A post-arc movement that undoes the true ending", "child continuation of the parent scene", and
"root-plot recasting" are prose-meaning properties. Their checkable halves are enforced (phase
instructions compiled into the request; sibling-free, lineage-local context; replay refusal);
their semantic halves belong to the D2-style human blind read of real planned movements once the
live key exists. A model score does not certify them here.

## Results (pinned runtime Node 24.18.0, 2026-07-19)

- `pnpm exec vitest run --project integration src/server/` — **26/26 pass** (testcontainers
  Postgres 18.4).
- `pnpm run test:unit` — **105/105 pass**. `pnpm run typecheck` — pass. `pnpm run lint` — pass.
- Full `pnpm run gates` recorded in the closing commit.

Provider calls executed in this slice: 0. Spend: $0. The image side runs behind
`NarrativeImagePort` with contract fakes until B2's reference anchors merge; wiring the real
GPT-Image-2 dispatch into that port is a small follow-up once `codex/b2-visual-study` lands.
