# QA — D1: Deterministic full-history folio context compiler (2026-07-19)

Scope: `src/server/text/folio-context.ts` + `folio-context.unit.test.ts`, worktree
`/Users/ratpartyserver/git/shape-of-time-d0`, branch `fable/d0-fable-adapter`, commit `d530882`.
D1 per PLAN: every folio request compiled from complete sources — no rolling summary, no
recent-N window, no truncation path — bound to a deterministic digest.

## Red evidence, observed before implementation

- `mise x node@24.18.0 -- pnpm exec vitest run --project unit src/server/text/folio-context.unit.test.ts`
  — `Error: Cannot find module './folio-context.js'`, Test Files 1 failed (module did not exist).

## What the compiler enforces (all covered by unit tests)

- One pure substitution of the checked-in `prompts/fable/write-folio.md`: each of the six
  placeholders (`WORLD_DOCUMENT`, `BOOK_ORIGIN`, `CURRENT_MOVEMENT_BRIEF`, `STORY_SO_FAR`,
  `TEMPORAL_RULES`, `CURRENT_FOLIO_BRIEF`) must occur exactly once in the template and is
  rendered exactly once, in template order, with the `<writing_request>` last. Any unresolved
  `{{X}}` after rendering refuses.
- Prior folios must arrive in exposure order with strictly increasing ordinals — out-of-order or
  duplicate ordinals refuse; there is no silent re-sort. Narrative images render inline as
  `[Narrative image: alt (sha256:digest)]`. An empty history renders the explicit first-folio
  sentence, never an empty block.
- Excluded sources are refused by name in the caller's inputs: Undertow, the visual bible, and
  the optional craft examples never enter a prose prompt (SPEC canon rules).
- Empty world / origin / movement / temporal-rules / folio-brief inputs refuse rather than
  rendering a hollow request.
- Output is a `CompiledFableRequest` through the D0 contract (claude-fable-5, xhigh, 32_768),
  plus a manifest of per-source sha256 digests (template included) and a deterministic
  `contextDigest = digestJson({manifest, renderedDigest})`. Identical inputs → identical digest;
  any single-source change → different digest.
- Admission is D0's job: the compiler contains no character estimate and no shrinking — an
  over-ceiling context is refused by `executeFableAttempt` via the official count endpoint.

## Results (pinned runtime Node 24.18.0, 2026-07-19)

- `mise x node@24.18.0 -- pnpm exec vitest run --project unit src/server/text/` — **18/18 pass**
  (12 D0 + 6 D1).
- `mise x node@24.18.0 -- pnpm run typecheck` — pass. `pnpm run lint` — pass.
- Full `pnpm run gates` result is recorded in the commit that closes this slice.

## Template-drift note

This worktree's template is main@`6fc0038` (no `<prose_guidance>` block). The compiler is
placeholder-driven: the B2 agent's in-flight template work changes the rendered text and the
template digest but not this module's code. D2 must run against the merged template.

Provider calls executed in this slice: 0. Spend: $0.
