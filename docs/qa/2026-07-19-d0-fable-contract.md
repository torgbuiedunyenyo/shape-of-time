# QA — D0: Pin Fable xhigh and exact 400k admission (2026-07-19)

Scope: the strict writer contract, direct Anthropic client, and key-gated live probe. Worktree
`/Users/ratpartyserver/git/shape-of-time-d0`, branch `fable/d0-fable-adapter` off `main`
(`6fc0038`). Context: the owner's 2026-07-19 decision removed C3 as a D-track blocker (amended in
PLAN/EVALS/SPEC/HANDOFF), and the standing goal is to proceed through D6.

## Red evidence, observed before implementation

- `pnpm exec vitest run --project unit src/server/text/fable-contract.unit.test.ts` —
  `Cannot find module './fable-contract.js'` (module did not exist), Test Files 1 failed.
- The client test was likewise authored before `fable-client.ts` existed.

## What the contract enforces (all covered by unit tests)

- Model exactly `claude-fable-5`, `output_config.effort: xhigh`, `max_tokens: 32768`; the
  manifest digest binds the manifest AND the exact wire body.
- Hard equation pinned: `363_136 + 32_768 + 4_096 = 400_000`. Counted input of exactly
  `MAX_COUNTED_INPUT` is admitted; one token more refuses with `over_context_ceiling` before any
  send. A counting failure blocks with `count_failed` before any send — no character estimate.
- Closed failure taxonomy on the response: `served_model_mismatch` (including an Opus alias),
  `truncated` (max_tokens stop), `refused`, `unsupported_stop`, `empty_output` (also for missing
  usage or response id). No fallback writer exists anywhere in the module.
- Client: count and send go only to `https://api.anthropic.com/v1/messages/count_tokens` and
  `/v1/messages`, redirects disabled, no automatic transport retry, key never in a URL; the count
  body keeps model/system/messages byte-identical to the send body.

## Results (pinned runtime Node 24.18.0, 2026-07-19)

- `mise x node@24.18.0 -- pnpm exec vitest run --project unit src/server/text/` — **12/12 pass**.
- `mise x node@24.18.0 -- pnpm run typecheck` — pass. `pnpm run lint` — pass.
- Full `pnpm run gates` result is recorded in the commit that closes this slice.

## Live contract proof — PASS (2026-07-19, owner-supplied key at invocation)

Judgment: **PASS**. The owner supplied ANTHROPIC_API_KEY at run time (never stored) and the
probe ran under the written $2.00 cap:

```
mise x node@24.18.0 -- pnpm exec tsx src/server/text/d0-live-contract.ts --confirm-spend-cap 2.00
```

Evidence: served model exactly `claude-fable-5` with `output_config.effort: xhigh`; stop
`end_turn`; response id `msg_011CdCHc2Vbtj2mDZjjPA7C2`; official count endpoint admitted the
request at 70 input tokens and billed usage matched exactly (70 in / 11 out — ~81 tokens total
spend); prose "Request received and confirmed." The count→admit→send→validate chain is proven
against the live provider. D0 is fully green.

Provider calls executed for this proof: 1. The key exists only at invocation; it is not in git,
.env, logs, or Railway (verified by name 2026-07-19: art-thing's .env holds only OpenRouter and
Langfuse keys; the shape-of-time Railway service holds only DB/S3/asset variables).
