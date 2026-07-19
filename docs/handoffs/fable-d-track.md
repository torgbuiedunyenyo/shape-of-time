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

POSITION (2026-07-19): red observed (`Cannot find module './fable-contract.js'`), then
`src/server/text/fable-contract.ts` + unit test landed — 8/8 green, typecheck+lint green.
REMAINING for D0: (1) live HTTP adapter (AnthropicFableClient: /v1/messages/count_tokens +
/v1/messages, api key ctor arg, no retry that changes the request, redirects disabled — mirror
openai-image-client.ts discipline); (2) exact request archive (canonicalJson to disk or DB via
generation_attempts later — keep minimal for D0: archive module with digests); (3) QA record
docs/qa/2026-07-19-d0-fable-contract.md (red evidence above, commands, live test status);
(4) live contract test — BLOCKED without ANTHROPIC_API_KEY (not in env; no .env exists; record
BLOCKED honestly with unblock condition per EVALS result semantics) — write it key-gated so it
runs when a ceiling+key are provided; (5) full gates in this worktree (browser step: use
COMPOSE_PROJECT_NAME=shape-of-time), commit, push branch.

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

## Then D1–D6 in order (PLAN is authority)

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
