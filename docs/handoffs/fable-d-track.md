# D-track working handoff — Fable session (2026-07-19)

## Standing goal (owner, 2026-07-19)

Build the plan to completion **through D6**, autonomously, no confirmations; collaborate with the
other agents. Owner decision the same day removed C3 (static delight) as a D-track blocker — the
delight gate now runs on the WIRED reader and blocks F0 only. That amendment is written into
PLAN/EVALS/SPEC/HANDOFF in `/Users/ratpartyserver/git/shape-of-time-b2` (uncommitted there, all 26
content tests green with it).

## Lanes

- B2 continuity = the B2 agent, shared worktree `shape-of-time-b2`, branch `codex/b2-visual-study`
  (my Stage 1 slice is pushed as `9f892d9` on that branch). Do not edit that worktree for D work.
- D0–D6 = THIS session, worktree `/Users/ratpartyserver/git/shape-of-time-d0`, branch
  `fable/d0-fable-adapter` off `main` (`6fc0038`). Commit small, push branch; CI runs on PR/main.

## D0 — Pin Fable xhigh and exact 400k admission (CURRENT)

POSITION (2026-07-19, second increment): contract module (8 tests) AND AnthropicFableClient
(4 tests: exact endpoints/headers, redirect error, no auto-retry, typed 429, key hygiene) are
green — 12/12, typecheck+lint green, committed on the branch. The manifest digest binds body and
manifest; count runs before send; failure taxonomy is closed.
UPDATE: (a)+(b) DONE — src/server/text/d0-live-contract.ts (dry-run mode keyless; live mode
needs --confirm-spend-cap 2.00 + ANTHROPIC_API_KEY, refuses as BLOCKED otherwise) and
docs/qa/2026-07-19-d0-fable-contract.md (12/12 results, live proof BLOCKED on key) are written
and committed. REMAINING: full-gates verdict (background run), then push; live probe stays
BLOCKED until the owner supplies the key. Then D1. [Since resolved: probe PASSED 2026-07-19.]
Superseded detail below: (a) key-gated live contract test (script or test that runs ONLY with
ANTHROPIC_API_KEY + a written ceiling in the QA doc; without the key it must report BLOCKED, not
pass) — key is NOT in env and no .env exists; unblock = owner provides key at run time;
(b) QA record docs/qa/2026-07-19-d0-fable-contract.md (red evidence: 'Cannot find module
./fable-contract.js' then './fable-client.js'; commands + 12/12 results; live test BLOCKED);
(c) full gates here (COMPOSE_PROJECT_NAME=shape-of-time for the browser step), push.
THEN D1 (deterministic full-history compiler — PLAN §D1: world verbatim once + BOOK_ORIGIN +
CURRENT_MOVEMENT_BRIEF + prior folios/images + temporal rules + folio brief + light request last;
prompts live in prompts/fable/write-folio.md; red = randomized-insertion test).

Authority: PLAN §D0, EVALS §9, SPEC "Generation and continuity/Text" + "Hard context boundary".

Contract to enforce (all red-first, per AGENTS.md method):

- Direct Anthropic Messages API, model `claude-fable-5`, `output_config.effort: xhigh`; no Opus
  alias, no fallback/repair writer, no provider compaction/memory; stateless, reproducible.
- Exact token preflight via the official count endpoint on the complete rendered multimodal
  request. Equation: `input + 32_768 + 4_096 <= 400_000` (MAX_COUNTED_INPUT 363_136). Count
  failure BLOCKS generation; no char estimate, cache-adjusted count, truncation, or dropping.
- Distinct failure taxonomy: model-mismatch, opus-alias, refusal, empty, truncation
  (max_tokens stop), unsupported stop reason, count failure, over-ceiling. Each fails closed
  before publication/spend.
- Request archive: exact ordered request, prompt version, source digests, manifest digest,
  response ID, usage, latency, cost estimate w/ pricing version (mirror the B1 image-contract
  provenance discipline; see src/server/images/image-contract.ts for the canonicalJson/digestJson
  house style — packages src/server/domain/digests.ts).
- Live contract test: ONLY after a written spend ceiling in the QA doc; smallest useful sample
  (one tiny request proving fable+xhigh+count+usage). ANTHROPIC_API_KEY not in shell env —
  look in the main checkout's .env / Railway service variables (never print values). Dry-run
  tests must pass without any key.
- Work products: `src/server/text/` module(s) + unit tests + `scripts/verify-d0-fable-contract`
  style content test if doc evidence is pinned; QA record `docs/qa/2026-07-1X-d0-fable-contract.md`
  (red evidence, commands, results, spend); HANDOFF update in b2 worktree at slice end.

## D0 verdict: DONE except live probe

Full gates GREEN in this worktree (lint, typecheck, content, unit, integration, browser, build —
exit 0, 2026-07-19), pushed through `7ec46b1`. Live probe **PASSED 2026-07-19**: owner supplied
the key at invocation (stored later that day by owner decision — see D0 QA doc), served claude-fable-5 xhigh, end_turn, count==usage 70 in /
11 out, response msg_011CdCHc2Vbtj2mDZjjPA7C2 — D0 fully green. (Earlier text: stays BLOCKED on ANTHROPIC_API_KEY
(unblock command in docs/qa/2026-07-19-d0-fable-contract.md).

## D1 — CORE LANDED 2026-07-19 (was CURRENT)

`src/server/text/folio-context.ts` + unit test: 18/18 text tests green (12 D0 + 6 D1), typecheck
and lint green, committed+pushed. Covers: every source exactly once in template order, request
last, exposure-order enforcement, per-source digests + deterministic contextDigest, refusals for
Undertow/visual-bible/craft-examples/empty sources, no summary/truncation path. D1 REMAINING to
call it done per PLAN: a QA note in docs/qa/ (red evidence: 'Cannot find module
./folio-context.js'; commands; results) and full-gates + push — do first thing next session.
NOTE: this worktree's template (main@6fc0038) predates the B2 agent's <prose_guidance> work in
the b2 worktree; the compiler is placeholder-driven and survives that template change, but D2
should run AFTER their template lands on main (coordinate/merge).

## D2–D6 continuation (after D1 QA)

D2 HARNESS LANDED 2026-07-19: d2-baseline.ts/-run.ts + scorecard, 31/31 text tests, dry-run
verified on real sources (folio-1 digest ea8d48c2…). LIVE RUN BLOCKED only on the template now —
the key is proven working (D0 probe 2026-07-19) and now lives in the gitignored .env; still needs +
merged <prose_guidance> template from b2 branch b5d7e35 (rerun after template change invalidates
the steering variable — wait for merge). Unblock command in docs/qa/2026-07-19-d2-baseline-harness.md.
D3 LANDED 2026-07-19: movement-planner.ts (+plan-movement.md template) and
generation/folio-generator.ts; LibraryRepository gained evidence-on-ready, getBook,
listExposedFolios, getAttemptEvidence. 26/26 integration (testcontainers), 105/105 unit,
mutation-verified sibling isolation. Image side is behind NarrativeImagePort with fakes —
FOLLOW-UP: wire durable GPT-Image-2 dispatch into that port once b2 branch merges. Semantic
halves (post-arc ending, child premise independence) named as human-read territory in QA doc. D4 LANDED 2026-07-19: provenance.ts + manifest in attempt result (v1 schema), reconstruction
verifies all digests from primary records only, refuses lineage-less prose; 28/28 integration.
D5 LANDED 2026-07-19: generation/preparation.ts — shares D3's idempotency namespace so
prepared turns are cache hits and duplicate spend is impossible (33/33 integration). Reader-slice
wiring rule: prepareOnExposure/prepareSuggestedAperture may only be called from POST-bodied
exposure/visibility events — a GET route or browser lock must NEVER purchase generation. Dwell
measurement + horizon tuning wait for the reader's exposure events. D6 LANDED 2026-07-19: generation/child-books.ts — confirmed-only founding, exact-span
validation, span/title-scoped idempotency (no duplicate children), persisted ancestry, one
bounded child_first planning call, selection aperture rows on immutable exposed folios, atomic
entry (37/37 integration). UI halves (mounted reader, reload return, no spinner) bind the
reader slice and are named in the D6 QA doc. D0–D6 SERVER TRACK IS COMPLETE except the
key-gated live proofs — D0 probe PASSED 2026-07-19 (owner-supplied key); the D2 baseline run
remains, gated on the merged prose-guidance template + owner-attended run.
LANE UPDATE 2026-07-19 ~16:00: the other agent pivoted to a READER-FIRST VERTICAL SLICE
(branch codex/reader-first-slice, commit 8fafde0) — C-track is CLAIMED by them; do NOT build
C0–C2 here. Build D5/D6 behind ports/contracts so they wire into that reader when it lands.

## Old D1 design notes (implemented; kept for reference)

Template `prompts/fable/write-folio.md` has EXACTLY these placeholders, in this order:
{{WORLD_DOCUMENT}}, {{BOOK_ORIGIN}}, {{CURRENT_MOVEMENT_BRIEF}}, {{STORY_SO_FAR}} (all four inside
<documents>/<document_content> blocks), then {{TEMPORAL_RULES}}, then <current_folio>
{{CURRENT_FOLIO_BRIEF}}, then <writing_request> (contains <prose_guidance>; output contract asks
for <folio_prose>). Sources on disk: content/shape-of-time/world.md, prompts/fable/
temporal-rules.md; origin/brief/folios come from the caller (later the DB).

Design: `src/server/text/folio-context.ts` — pure compileFolioContext({world, temporalRules,
bookOrigin, movementBrief, priorFolios: [{ordinal, prose, images:[{altText, digest}]}] IN ORDER,
currentFolioBrief}) → renders the template with each placeholder substituted EXACTLY ONCE (refuse
unresolved or duplicate placeholders), STORY_SO_FAR = ordered folio sections with image entries
inline, returns { request: compileFableRequest(...), contextManifest: {slot digests in order},
contextDigest }. Refusals by name: empty world, world inserted twice, out-of-order/duplicate
ordinals, Undertow content detected (world must not contain undertow marker; template output must
not contain 'undertow', 'visual bible', craft-example marker per verify-content-authority's
exclusion approach). Red test `src/server/text/folio-context.unit.test.ts`: randomized-insertion
(shuffled priors ≠ ordered priors digest; identical inputs → identical digest; any single-source
change changes digest; world exactly once — count occurrences of a world sentinel line; excluded
sources rejected if passed in). THEN: D2 needs the live key (8–14 folio consecutive Fable run +
HUMAN blind read — surface to owner when reached); D3–D6 per PLAN.

D1 deterministic full-history compiler → D2 prose baseline (8–14 consecutive folios, HUMAN read —
flag to owner when ready; a model can't certify) → D3 movement planning + pagewise generation
(needs B2 for images — coordinate with B2 agent; if B2 continuity still pending, build behind the
image port with contract-only fixtures and mark the seam) → D4 provenance seam → D5 predictive
preparation → D6 dynamic highlight/title. Note: C0–C2 (garden fixture, reader shell, navigation)
are NOT in my claimed lane yet but ARE prerequisites for a playable wired reader (D5 depends on
C2). After D0–D2, reassess lanes: if nobody has claimed C0–C2, claim and build them next so D5/D6
have a reader to wire into. The owner's actual want: a wired version they can play with.

## Verification standard

Every slice: named red observed first, focused tests green, `pnpm run gates` green in THIS
worktree before push (browser step may collide on port 55432 with another checkout's postgres —
adopt `COMPOSE_PROJECT_NAME=shape-of-time` to reuse the running dev container, as pushcheck did).
