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
BLOCKED until the owner supplies the key. Then D1.
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
exit 0, 2026-07-19), pushed through `7ec46b1`. Live probe stays BLOCKED on ANTHROPIC_API_KEY
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

D2 (prose baseline): BLOCKED on ANTHROPIC_API_KEY (same as D0 live probe) + needs the merged
template + B0 movement briefs as inputs; run one uninterrupted 8–14 folio root run via
folio-context + fable-client, archive everything, then HUMAN blind read — surface to owner.
D3 (movement planning + pagewise generation): real-DB integration (books/folios/apertures/assets/
generation_attempts repos from A2), one prose + one image call per folio, atomic ready/expose —
image side needs B2 anchors (coordinate with B2 agent; build behind ports with contract fixtures
if still pending). D4 provenance seam; D5 prefetch (needs C2!); D6 dynamic highlight/title (needs
C2 reader). C0–C2 are unclaimed — after D2, claim C0–C2 in the b2-worktree HANDOFF and build them
(the owner's goal is a PLAYABLE wired reader; D5/D6 cannot wire into a reader that lacks
selection/apertures/navigation).

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
