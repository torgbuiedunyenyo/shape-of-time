# QA — Minimal live path for Next Page (2026-07-19)

Scope (owner instruction, 2026-07-19): compose the EXISTING Fable/counting/history/image code
into the server; expose only the API needed for Next Page; persist/publish one atomic folio.
No chapter generation, queue framework, lease/fencing expansion, garden expansion, deployment,
or UI work. Branch `fable/d0-fable-adapter` only — NOT merged.

## Red evidence

- `next-page.api.integration.test.ts` written first; observed red for the intended reason
  (routes absent → `expected 404 to be 201`), then implementation.

## What landed

- **`src/server/next-page.ts`** — four routes, registered only when `createApp` receives a
  `generation` dependency (healthz-only boot unchanged):
  - `POST /api/books/:id/next-folio` — spends at most once per ordinal (D3 idempotency
    namespace); an in-flight or failed folio is the next page (failed → named-failure retry).
  - `GET  /api/books/:id/folios/:ordinal` — state only; can never purchase (verified: provider
    call counts unchanged by GETs).
  - `POST /api/books/:id/folios/:ordinal/open` — the one atomic publish: ready→exposed, returns
    prose + image identity together; refuses an unready folio by state.
  - `GET  /api/books/:id/folios/:ordinal/image` — read-only bytes, digest-verified, immutable
    cache headers.
- **Interleaved history for Fable** — `folio-generator` now loads each exposed folio's accepted
  image and the D1 compiler renders its marker inside that folio's section. Verified: folio 3's
  request has folio-1 prose < marker-1 < folio-2 prose < marker-2.
- **`src/server/images/narrative-image-adapter.ts`** — GPT Image 2 receives Fable's written
  scene as the exact prompt plus eligible prior images as book-local references through the
  UNCHANGED B1 contract: with ≥2 eligible priors (most recent 5) an edit request where each
  reference doubles as its own required anchor; with <2 the contract forbids an edit
  (2–5 references, ≥1 anchor) and the honest request is a generation — the gate was not
  widened. Reference bytes and results are digest-verified. Verified: folio 3 compiled to
  `/v1/images/edits` with 2 `exposed-folio-image` references and the folio's prose in
  `exactPrompt`.

## Results (Node 24.18.0, 2026-07-19, real Postgres 18.4 via testcontainers)

- API test: existing book requests its next folio exactly once (double POST → one prose send,
  one image dispatch, same folio id) and retrieves it when ready. 3/3.
- Full suites: integration 40/40, unit 105/105, typecheck, lint. Full gates in closing commit.
- The failure that taught something: with `requiredAnchors: []` and one reference, the B1
  compiler refused the edit (its rule, working); the folio failed, and the API's next POST
  correctly retried it from the named failure — the live path's failure→retry loop was
  exercised by accident before it was exercised on purpose.

## Blockers / not done here

- Not merged; not deployed; no live provider call made in this slice (spend $0). Live
  composition needs `composeApplication` to be handed the real ports (keys are in `.env` and on
  Railway per owner decision) — wiring that into `index.ts` boot is deliberately left until the
  owner wants the deployed path live.
- The prose-guidance template (committed here, `7e5a861`) rides this branch; run 02 of the D2
  baseline through this same live path is ready when wanted.
