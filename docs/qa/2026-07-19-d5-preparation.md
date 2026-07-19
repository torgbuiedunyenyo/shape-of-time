# QA — D5: Prepare likely pages and apertures during reading time (2026-07-19)

Scope: `src/server/generation/preparation.ts` (+ real-DB integration test) and
`LibraryRepository.listFolios`. Worktree `/Users/ratpartyserver/git/shape-of-time-d0`, branch
`fable/d0-fable-adapter`.

## Red evidence, observed before implementation

- `pnpm exec vitest run --project integration src/server/generation/preparation.integration.test.ts`
  — `Cannot find module './preparation.js'`, Test Files 1 failed.

## The load-bearing design decision

Preparation shares D3's idempotency namespace (`generate:${bookId}:${movementId}:${ordinal}`).
A prepared folio IS the folio the reader's turn asks for, so:

- **Normal prepared turns are cache hits** — integration-verified: after exposure prepared
  ordinals 2 and 3, the reader's `generateNextFolio` for ordinal 2 returned `spent: false` with
  zero new provider calls.
- **Duplicate spend is impossible** — two concurrent `prepareOnExposure` calls over the same
  horizon produced exactly 2 provider sends for 2 needed folios (4 candidate attempts), with
  exactly one spender per ordinal. This is the reservation + lease layer doing the work; it was
  mutation-verified in the D3 slice.
- **Failed preparation leaves navigation honest** — a truncated preparation left the folio
  `failed` in the ledger (never fake-ready), and a later explicit attempt retried from the named
  failure and succeeded.
- **Visible suggested apertures** — `prepareSuggestedAperture(targetBookId)` readies the target
  book's first folio from its own founding premise (sentinel-verified), idempotently: a second
  visibility event buys nothing.
- **Hit/waste measured from the ledger alone** — `measurePreparationEconomy` reports exposed /
  prepared-unread / latencies straight from folios + attempts; no derived counters, no new table.

## Honest scope notes

- **Dwell** is a reader-side signal; it is named here and measured only when the reader
  (`codex/reader-first-slice`, other agent's lane) wires exposure events in. Horizon tuning waits
  for that data, as the PLAN requires ("measure … before tuning the horizon").
- **"A GET route and browser-only lock may never purchase generation"**: this module creates no
  routes; the route layer that calls `prepareOnExposure`/`prepareSuggestedAperture` must do so
  only from POST-bodied exposure/visibility events. That rule binds the reader-slice wiring and
  is restated in the handoff for whoever lands it.
- Movement-boundary preparation (planning the next movement when the horizon crosses a boundary)
  goes through the D3 planner and is not auto-triggered here — planning is a paid call and stays
  behind explicit invocation until the live key exists.

## Results (pinned runtime Node 24.18.0, 2026-07-19)

- `pnpm run test:integration` — **33/33 pass** (5 new). `pnpm run test:unit` — **105/105 pass**.
- `pnpm run typecheck` — pass. `pnpm run lint` — pass. Full `pnpm run gates` recorded in the
  closing commit.

Provider calls executed in this slice: 0. Spend: $0.
