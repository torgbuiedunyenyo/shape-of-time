# QA — D2: Lightly steered prose baseline — harness ready, live run BLOCKED (2026-07-19)

Scope: `src/server/text/d2-baseline.ts`, `d2-baseline-run.ts`, `d2-baseline.unit.test.ts`, and
`docs/qa/d2-blind-read-scorecard.md`. Worktree `/Users/ratpartyserver/git/shape-of-time-d0`,
branch `fable/d0-fable-adapter`.

## Red evidence, observed before implementation

- `mise x node@24.18.0 -- pnpm exec vitest run --project unit src/server/text/d2-baseline.unit.test.ts`
  — `Cannot find module './d2-baseline.js'`, Test Files 1 failed.

## What the harness enforces (all covered by unit tests)

- One consecutive run of 8–14 folios; a count outside that window refuses. Each folio's context
  is compiled by the D1 compiler from the real repo sources (world.md, root-movement-01.md,
  temporal-rules.md, the root-book origin statement) plus every prior folio of this run in
  exposure order — verified: folio 3's request carries folio 1 and 2 exactly once, in order.
- The exact request (wire body + manifest + digests) is archived **before** any send (B1's
  dispatch-before-spend rule); the result or the named failure is archived after; `run.json`
  closes the archive. Archive writes go through `writeImmutable` to an absolute root outside the
  worktree.
- No retry, no splicing, no fallback: the first contract failure (D0's closed taxonomy) or
  malformed reply (`malformed_output`: missing/multiple `folio_prose`, commentary outside it,
  empty element) archives the failure and stops the run. Exactly one attempt per folio, verified
  by provider call count.
- Word count out of 120–250 is recorded as an observation (`wordCountInRange: false`), never a
  failure — the baseline records what happened; humans judge it.
- Cost honesty: exact usage tokens per folio are archived; `costUsd` is `null` with a written
  basis, because no claude-fable-5 price table is pinned in this repo. No invented arithmetic.
- Nothing in the module scores prose. The verdict instrument is the human blind-read scorecard
  (`docs/qa/d2-blind-read-scorecard.md`).

## Results (pinned runtime Node 24.18.0, 2026-07-19)

- `mise x node@24.18.0 -- pnpm exec vitest run --project unit src/server/text/` — **31/31 pass**
  (12 D0 + 6 D1 + 13 D2).
- `pnpm run typecheck` — pass. `pnpm run lint` — pass. Full `pnpm run gates` recorded in the
  closing commit.
- Keyless dry-run works end to end on the real sources: folio-1
  `contextDigest ea8d48c20dbfda32431fa1377664fe4e5e31fabd0ec591a5f5abc6e8290508a8` (template at
  main@`6fc0038`). Keyless live invocation refuses with
  `BLOCKED: ANTHROPIC_API_KEY is required…` — verified.

## Live run — BLOCKED

Judgment: **BLOCKED**. The live baseline needs `ANTHROPIC_API_KEY` at invocation; it is not in
the environment and no `.env` exists. Two further gating notes:

1. **Template drift**: the B2 agent's approved `<prose_guidance>` work (branch
   `codex/b2-visual-study`, `b5d7e35`) is not on main. The D2 run should use the merged
   template — rerunning after a template change invalidates the baseline's steering variable.
2. The archive root must be outside the worktree (the runner refuses otherwise).

Unblock command (spend ceiling $25.00 written into the contract; 10 folios; archive outside the
tree):

```bash
cd ~/git/shape-of-time-d0
ANTHROPIC_API_KEY=<key> mise x node@24.18.0 -- pnpm exec tsx src/server/text/d2-baseline-run.ts \
  --confirm-spend-cap 25.00 --folios 10 --archive-root "$HOME/shape-of-time-archives/d2-baseline-01"
```

Then the blind read: hand the folios (prose only) to readers with
`docs/qa/d2-blind-read-scorecard.md`. D2 is green only on the human verdict.

Provider calls executed in this slice: 0. Spend: $0.
