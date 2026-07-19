# QA — D6: Dynamic highlight + explicit title creation, server core (2026-07-19)

Scope: `src/server/generation/child-books.ts` (+ real-DB integration test) and repository
additions (`findBookByIdempotencyKey`, `recordSelectionAperture`, `listSelectionApertures`).
Worktree `/Users/ratpartyserver/git/shape-of-time-d0`, branch `fable/d0-fable-adapter`.

## Red evidence, observed before implementation

- `pnpm exec vitest run --project integration src/server/generation/child-books.integration.test.ts`
  — `Cannot find module './child-books.js'`, Test Files 1 failed.

## What D6 enforces in code (all integration-verified on Postgres 18.4)

- **Nothing spends without explicit action**: both creation paths refuse `confirmed !== true` by
  name, before any planner call (asserted: zero planner requests after refusal).
- **The gesture cannot lose its source**: selection offsets must reproduce the exact source text
  against the folio's actual prose — validated twice, at founding and again inside
  `recordSelectionAperture`, which also refuses to attach to a non-exposed folio and never
  mutates the folio row (exposed work is immutable; the aperture is a new fact about it).
- **A child is never duplicated**: identity is the exact founding span
  (`child:selection:${folioId}:${start}:${end}`) or the title intent digest. The same confirmed
  gesture returns the same book with `created: false`, plans nothing, and records one aperture.
- **Independent premise, no root replay**: the first movement comes from one bounded
  `child_first` planning call whose instruction says founding-premise-not-continuation; the
  entered child's folio request contains its founding passage and its own brief, and does not
  contain the parent's movement brief (sentinel-asserted).
- **Ancestry persists in the ledger**: `origin.ancestry` carries the full parent chain, so
  return-through-nested-books survives reload from primary records alone.
- **Entry is atomic**: `enterChildBook` returns only an exposed first folio; a non-ready folio
  is a named refusal, never a fake page.
- **Distinct paths**: title creation has its own key namespace, origin kind, and no founding
  passage; search filtering must never call it implicitly (reader-slice rule, restated below).

## What D6 leaves to the reader slice (named, not skipped)

Source reader staying mounted with a book-native creation state, no global spinner or auth wall,
exact return-position restore after reload, and selection surviving the cold path are UI
properties of the reader (`codex/reader-first-slice`, other agent's lane). The server halves they
wire into are all here: idempotent founding, persisted ancestry, atomic entry. The visual-profile
slot is a named null until the approved visual bible (B2) merges.

## Results (pinned runtime Node 24.18.0, 2026-07-19)

- `pnpm run test:integration` — **37/37 pass** (4 new). `pnpm run test:unit` — **105/105 pass**.
- `pnpm run typecheck` — pass. `pnpm run lint` — pass. Full `pnpm run gates` recorded in the
  closing commit.

Provider calls executed in this slice: 0. Spend: $0.
