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

Judgment: **BLOCKED** (amended 2026-07-19, later the same day: the key is now proven working —
D0 probe PASS — and stored in the gitignored `.env`, so the remaining blocks are the two notes
below, chiefly the template merge):

1. **Template drift**: the B2 agent's approved `<prose_guidance>` work (branch
   `codex/b2-visual-study`, `b5d7e35`) is not on main. The D2 run should use the merged
   template — rerunning after a template change invalidates the baseline's steering variable.
2. The archive root must be outside the worktree (the runner refuses otherwise).

Unblock command (spend ceiling $25.00 written into the contract; 10 folios; archive outside the
tree):

```bash
cd ~/git/shape-of-time-d0
set -a; source .env; set +a
mise x node@24.18.0 -- pnpm exec tsx src/server/text/d2-baseline-run.ts \
  --confirm-spend-cap 25.00 --folios 10 --archive-root "$HOME/shape-of-time-archives/d2-baseline-01"
```

Then the blind read: hand the folios (prose only) to readers with
`docs/qa/d2-blind-read-scorecard.md`. D2 is green only on the human verdict.

Provider calls executed in this slice: 0. Spend: $0.

## Live run 01 — EXECUTED 2026-07-19 (evidence recorded; verdict awaits the human blind read)

Owner said "Proceed": the baseline ran against the **current main template** (main@`44dde30`,
template digest in every archived request manifest) rather than waiting for the prose-guidance
merge — recorded here as a fact of this run; the controlled A/B against the merged template
remains available as run 02.

- Command: the unblock command above, `--folios 10`, archive
  `~/shape-of-time-archives/d2-baseline-01/` (outside the worktree). First launch died pre-spend
  on the deliberately-unwritable missing archive root ($0); relaunch ran clean.
- Outcome: **completed, 10/10 folios, zero failures, zero retries.** Totals: 136,731 input /
  9,167 output tokens (per-folio usage archived; dollar cost is read from the provider bill —
  no pinned price table, per the harness contract).
- Word counts: 215–261; 7/10 inside 120–250 (folios 1, 3, 4 over by 1–11 words — observations,
  not failures). Latency 14–28s per folio, rising with context as expected (11.6k → 15.7k input
  tokens from folio 1 to 10).
- Blind-read package: `d2-baseline-01-folios.md` in the archive (prose only, exposure order),
  delivered to the owner with `docs/qa/d2-blind-read-scorecard.md`.

**D2's green bar is unchanged: it is the human verdict on the scorecard, not this table.**
