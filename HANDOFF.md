# Handoff

Updated September 6, 2026. After compaction, read this file and the current PLAN.md section.

## Purpose

Build a world exploration harness whose agent develops sustained, nested image-and-text narratives
with persistent context and memory. Preserve the successful infinite-book's reading pleasure and
nesting. The agent owns creative sequencing; software preserves its work and the reader's place.

## Current position

P0 is complete. **P1 is in progress; P2–P6 are not yet validated.** The user requested implementation
and then explicitly directed development and testing on the existing Railway production project.
There are no users or data requiring preservation. Use Railway Postgres directly; do not introduce
Docker or a separate staging environment. The fresh application is being built in the active worktree.

- Implementation worktree: /Users/ratpartyserver/git/shape-of-time-agentic, codex/agentic-world.
- Normal checkout: /Users/ratpartyserver/git/shape-of-time, local main at the same clean starting point.
- Starting checkpoint: checkpoint/agentic-clean-start-2026-09-06.
- Retired baseline: e1a3decb29b33710f26a89f5cf2a415ca6f3ae09, tagged archive/folio-prototype-2026-09-06.
- Changes are committed locally. Nothing was pushed or deployed. Local main is ahead of remote main;
  this pre-implementation checkpoint must not trigger a production deployment.

Read archive/README.md before historical investigation. archive/folio-prototype-e1a3dec.tar.gz and its
manifest preserve all 167 old tracked files exactly. Original Git history and earlier B2/D0/reader
worktrees are intact. Do not restore the old app as a scaffold. Recover small mechanical components
only after inspecting their fit with the new design. Old checks and milestones are historical.

The normal checkout's ignored .env, node_modules, dist and test-results were moved intact into its
ignored .local/retired-folio-e1a3dec directory. No secret values were read or committed. Databases,
remote assets and deployed services were not changed. The new runtime needs fresh configuration,
database and asset namespace.

## Artistic inputs and models

Use content/shape-of-time/SOURCE.md and its selected inputs in full: world.md, world-essence.md,
prose-guide.md and visual-direction.md. Preserve original wording. The 4,512-word corrected world
is byte-identical to infinite-book's historical source. The world description and writing guidance
come from the user-selected infinite-book/main template. The illustrated successor's later prose
guide is superseded. Permit useful natural explanation of world mechanics while trusting the reader
and avoiding constant didactic monologues. Writer and critic receive this same direction.

The approved inked-reportage medium is retained without the old fixed image briefs, per-reference
approval sequence or mandatory division of narrative work between text and images. Source history
is under archive/infinite-book; earlier contradictory world versions and Undertow are not automatic
creative input. No additional longer world document or the referred-to “Document 1” was found among
60 reachable predecessor commits. The reason for historical condensation/deletion is unverified.

Text, creative agent and initial contextual critic: GPT-6 Astra at xhigh. Images: GPT Image 2
(initial documented snapshot gpt-image-2-2026-04-21). No silent fallback or effort reduction.

## Spending and deployment

The user accepted implementation after the detailed plan, then explicitly authorized direct Railway
production work with no old-data preservation requirement. Execute the plan's initial combined live
allowance of $150 (at most $20 for provider contracts); spent $0, reserved $0. This records the
implementation go-ahead against that proposed ceiling, not an unlimited generation budget. All text,
images, criticism and renewal count together. Do not reuse historical Fable budgets.

Existing Railway project: 8b20e07d-c256-44c9-85be-d1c7e50ac83d. Last read-only production investigation
found e1a3dec and a failed old continuation; that is historical evidence, not current runtime QA.
The cleanup made no Railway calls. A later authorized release uses a passing Git-triggered deploy.

## Implementation checkpoint before first live generation

The P1a foundation is deployed from main at 665d68f4f40f80888274283b43f8372e71b149a9, Railway
successful deployment 485ed367-60aa-4d86-b30e-7151fda7e6d9; /healthz confirms that revision.
The old eight public folio tables and four stored images were deleted after that replacement;
ANTHROPIC_API_KEY and ASSET_DRIVER were removed. No old corpus or compatibility path remains.
The requested models were verified available with read-only model lookups. No paid request yet.

New agent/provider code is written and eight tests passed with typecheck/lint/build: explicit
Responses Astra/xhigh, background IDs and full protocol replay, exact token counts, shared cost
reservations, no opaque provider retries, raw responses saved before parsing, direct GPT Image 2,
real image function outputs, archive/docs/work/publish/opening tools and optional contextual critic.
Author and critic sources load all four prepared originals. A DB lock serializes the author. This
code still needs its first deployment/live run. It is not provider-contract or literary evidence yet.

Tests include process-boundary tool replay, unavailable-asset atomicity, real S3 fixture replay with
generation disabled, duplicate reader requests and shared uncertain-cost reservations. Fixtures are
labeled mechanical. All active code was formatted for readability after those passing checks.

Known remaining work: first genuine illustrated root/continuation/critic; actual in-app reader QA;
prepared openings and cold request recovery after reload; image-region selection; exact nested
return and reflow; explicit context compaction; broader recovery/long-form evidence. Do not claim
P2 or long-form coherence from the initial reader code. No model fallback or fixed narrative quotas.

Next action: deploy the agent loop from passing main with the funded allowance and generation
enabled, request the first real root through the hosted reader, and inspect actual receipts/output.

## Validation

P1a implementation: fresh pinned TypeScript/React/Hono/Kysely application; Railway-backed `world`
schema; versioned documents, immutable Markdown compositions with stable block IDs; real reader
and visit history. Four real Railway Postgres integration tests pass for unrestricted draft length,
atomic missing-image rejection, revision/idempotency and request deduplication. Typecheck, lint and
production build pass. No generated content or live provider request yet. The reader interaction
code is preliminary and still needs the actual browser journey and fixes; do not call P2 complete.

Railway connection: production environment `82e1c3e8-e2c1-4023-afa2-b17dc6dc6ec3`, app service
`39bf3c12-b426-40ce-836a-2839ea1bc213`, Postgres `294c4570-91e2-4bb2-8639-4a802a475ab8`, assets
bucket `545eb437-32e7-4100-a154-3cffd145fac1`. Added Postgres TCP proxy
`b696fdf7-96a9-43ce-b588-a0ff901e0295` for direct development/tests. Selected Railway credentials
are in ignored `.env`, generation disabled. Runtime uses the existing private DATABASE_URL.
User reiterated: trash and replace the old Railway implementation; no compatibility or data
preservation needed. Old code remains only in the Git/archive record. No Docker dependency.

Archive contents and all 167 file hashes match the retired Git tree. Selected world/source bytes
and predecessor manifests match their preserved origins. Active document links and instructions
were checked; obsolete executable entry points are absent. git diff --check passed. Both current
checkouts have a clean Git status after the local commit/fast-forward, and the starting and retired
tags resolve to their recorded checkpoints. No history was rewritten.

No application build/test pass is claimed: the old suite is archived and the new code does not yet
exist. P1 must create meaningful tests with the new implementation, not restore obsolete gates to
manufacture a green result.

## Single next action

Continue P1a in codex/agentic-world: create the fresh minimal
application configuration, Railway persistence and a thin reader, then continue directly to the actual
Astra/image/critic loop within P1. Read PLAN.md first. The detailed historical reassessment remains
at /Users/ratpartyserver/git/claude/infinite-library-reassessment-2026-09-05 as supporting evidence;
the repository's current documents are self-contained and are the implementation authority.

## First live provider evidence and immediate repair

The agent deployment a87ccfa45e6290b1b0b3f22b13eab6c285838b1e succeeded on Railway
(deployment 83cd1b78-7a2e-4dda-875e-ea9b8e36e263), generation enabled. The in-app Browser
started root request 4c40ef0e-37b3-47f4-b4c8-6648667aaf2e using Begin the book.
First operation 966a4fa7-35f4-4a80-8ec3-f0688c3fc2cd started successfully in background;
GET with include=reasoning.encrypted_content failed 400: encrypted content cannot be requested
for persisted responses. This is a live API constraint despite the earlier planning assumption.
The saved provider ID allowed retrieving that same response with plain GET, without a second
purchase. Result confirms gpt-6-astra, xhigh, all_turns; first chosen tool is resources. Actual
usage: input 10,070, output 13, reasoning 0; cost $0.10135. Result saved in DB/S3 and the exact
non-sensitive response fixture tests/receipts/astra-first-resources.json.

The request is currently failed pending a retrieval-parameter fix deployment. No work or image
has been generated. Repair removes encrypted-content inclusion for stored/background responses;
all returned protocol items remain preserved. Stored reasoning items, if returned without encrypted
content, depend on the provider's retention. Do NOT claim self-contained indefinite reasoning replay.
Before long-lived reuse, implement explicit context renewal retaining full local original sources,
agent notes and returned canonical compaction window. No model or xhigh fallback.

Immediate next step: run the focused recovery check and full gate, push this fix, then mark the
existing failed intent running only AFTER verifying the fixed deployed revision. Resume the same
session and already-completed operation. Do not enqueue a second root or buy the first call again.
