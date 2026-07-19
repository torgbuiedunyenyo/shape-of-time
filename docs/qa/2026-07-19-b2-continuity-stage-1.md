# QA — B2 continuity Stage 1: harness and plan, no execution (2026-07-19)

Scope: the red-first harness, checked-in eight-image production plan, and dry-run evidence for
**Stage 1 (Image 1 — Root F02 Payment)** of the Treatment B continuity sequence. This task
performed **zero paid provider calls**. Branch `codex/b2-visual-study`, shared B2 worktree
`/Users/ratpartyserver/git/shape-of-time-b2`; work left uncommitted for the coordinating agent.

## Judgment

**PENDING DRY-RUN INSPECTION** by an independent reader before any separately authorized live
execution. This task's own reading of the exact canonical dry-run output found the fixed contract
below satisfied in full: DRY-RUN READY — LIVE CALL NOT EXECUTED. B2 is not complete; no anchor,
crop, or continuity approval exists or is claimed.

## Intentional red, observed before implementation

Run 2026-07-19 on the pre-existing red tests (restored from the authoring agent's stash
`fable-b2-continuity-stage1-red-tests-2026-07-19` via `git stash apply`, which left the stash
entry intact):

- `pnpm exec vitest run --project unit src/server/images/b2-continuity-stage1.unit.test.ts
  src/server/images/b2-continuity-stage1.orchestration.unit.test.ts` — **Test Files 2 failed,
  "no tests"**: both files fail to resolve `./b2-continuity-stage1.js`, which did not exist.
- `node --test scripts/verify-b2-continuity-stage1.test.mjs` — **1 failing**:
  `ENOENT: no such file or directory, open 'content/shape-of-time/visual-continuity-plan.md'`
  (and this QA record also did not exist).

## Fixture repair (documented, assertions untouched)

The two cost-path fixtures in `b2-continuity-stage1.orchestration.unit.test.ts` invented cost
evidence the durable pipeline can never emit: B1's replay validator enforces exact usage-derived
arithmetic (output tokens × 30, text × 5, image × 8 micro-USD; a null-usage 1024×1536 medium
result carries the fixed 41,000 micro-USD output estimate), so `recordReceived` rejected the
synthetic results as "image result could not be bound to its durable dispatch" before the
orchestrator's own cap/evidence checks could run. The repair derives internally consistent usage
for the requested totals (`usageForExactTotal`) and the null-usage output estimate. Every
assertion — `/exceeded.*spend cap/`, `/usage-derived cost/`, single provider call, no review
bytes — is unchanged.

## Fixed Stage 1 request identity (from the inspected dry run)

- Application idempotency key: `b2-continuity-root-payment-v1`
- Kind: text-only generation (`/v1/images/generations`), **zero reference images**
- Requested snapshot: `gpt-image-2-2026-04-21` (served-model evidence:
  `unavailable-from-image-api` — the Image API exposes no served-model field)
- Size: portrait `1024×1536` (wire form `1024x1536`), medium quality, opaque PNG
- Maximum provider operations: **exactly one provider operation**; no retry and no replacement —
  a rejected or indeterminate terminal is final for this operation identity
- Per-operation conservative maximum: 50,000 micro-USD; written Stage 1 request-scope cap:
  **$0.05**
- Pricing provenance: `openai-standard-token-pricing-2026-07-19`
  (`src/server/images/openai-image-client.ts` `estimateCost`); estimates are usage-derived and
  are never provider-billed cost
- Recovery archive: `b2-visual-study-2026-07` at
  `/Users/ratpartyserver/git/shape-of-time-b2-recovery`
- Review root: `/Users/ratpartyserver/git/shape-of-time-b2-review/continuity-v1`, image file
  `01-root-payment.png`, report `stage-1.json` (`judgment: PENDING_OWNER_CONTINUITY_REVIEW`)
- Recovery-before-review: review bytes are written only after the journal reports the exact
  operation completed and its recovery proof (digest and byte length) matches the returned
  output; a stable rerun replays durable evidence with zero provider calls
- Fail-closed publication: missing usage-derived cost evidence or an estimate above $0.05
  withholds all review material; indeterminate publishes nothing and is never retried

## Exact dry-run evidence (executed in this task; zero provider calls)

Command:

```bash
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-continuity-stage1.ts --dry-run
```

- Study digest: `bd93dc513e7b002bb8515210ec3a3dfdd8dd93eba2cd9c5b6d5c7bd2797a64b6`
- Request manifest digest: `f96a6acbc722198467460136382905c773a980d114351c84e622ea79b97b050d`
- Prompt digest: `6ba6ab445fc941d6ded4fd915905a8de0a23d0f8cc2af058b731309d7e7feffb`
  (prompt version `b2-continuity-stage1-root-payment-v1`, 2,405 characters, sections: narrative
  job / scene and relationship / medium / facts to discover / must remain open / reject)
- `plannedProviderOperations: 1`, `maximumPlannedEstimateMicrousd: 50000`,
  `spendAuthorizationBoundUsd: 0.05`, `orderedReferences: []`, `requiredAnchors: []`

## Future live command — NOT EXECUTED

The following command was **not executed** in this task, must be separately authorized, and
requires the literal cap and the exact current dry-run study digest:

```bash
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-continuity-stage1.ts \
  --confirm-spend-cap 0.05 \
  --confirm-study-digest bd93dc513e7b002bb8515210ec3a3dfdd8dd93eba2cd9c5b6d5c7bd2797a64b6
```

Provider calls executed: 0. Stage 1 spend for this task: $0. No OpenAI key was sourced. The
external recovery root, the review root, the Railway project, and `anchors.json` (which still
does not exist) were untouched.

## Verification results (2026-07-19, pinned runtime Node 24.18.0)

- `mise x node@24.18.0 -- pnpm exec vitest run --project unit
  src/server/images/b2-continuity-stage1.unit.test.ts
  src/server/images/b2-continuity-stage1.orchestration.unit.test.ts` — **2 files, 9 tests, all
  pass** (after the observed red above)
- `mise x node@24.18.0 -- node --test scripts/verify-b2-continuity-stage1.test.mjs` — recorded
  below after this file exists; red was observed first
- `mise x node@24.18.0 -- pnpm run typecheck` — recorded below
- `mise x node@24.18.0 -- pnpm run lint` — recorded below
- `git diff --check` — recorded below

RESULTS: content test 2/2 pass; typecheck pass; lint pass; `git diff --check` clean.

## Next action

Independent inspection of the exact dry run (the canonical JSON, prompt, digests, and caps above)
before any separately authorized one-call live execution. Approval of the resulting candidate and
of every proposed crop remains a later human decision; nothing in this task creates an anchor.
