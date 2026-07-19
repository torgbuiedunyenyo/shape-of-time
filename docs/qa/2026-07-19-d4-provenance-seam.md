# QA — D4: Dormant long-form provenance seam (2026-07-19)

Scope: `src/server/generation/provenance.ts` (+ real-DB integration test), provenance manifest
persisted by `folio-generator.ts` into the attempt's `result` column, and two repository readers
(`getAttemptEvidence` extended with result/exact_inputs; `getAsset`). Worktree
`/Users/ratpartyserver/git/shape-of-time-d0`, branch `fable/d0-fable-adapter`.

## Red evidence, observed before implementation

- `pnpm exec vitest run --project integration src/server/generation/provenance.integration.test.ts`
  — `Cannot find module './provenance.js'`, Test Files 1 failed.

## What the seam records (in the existing five entities + attempts — no sixth table)

Persisted at ready time inside the generation attempt's `result` (schema
`shape-of-time.provenance.v1`): the exact context digest and manifest source digests (template
included), prompt version, movement id, prose digest, image asset id + byte digest + alt text,
counted input tokens, and each prior folio used as context recorded as an exact span
(`folioId`, `ordinal`, `proseDigest`). Dormant slots (`entityIds`, `timeIds`, `causalIds`,
`epistemicIds`, `visualProfile`) are explicit named nulls with a written reason — a future
long-form pass fills them from the archived context; nothing pretends they exist today. No
retrieval runtime, embeddings, graph, or rolling summary was built.

## What reconstruction proves (integration-verified on Postgres 18.4)

`reconstructFolioProvenance` reads only the folio row, its attempt row, the asset row, and the
asset store bytes, and re-verifies every digest: folio prose against the recorded prose digest,
image bytes against both the recorded and the asset-row digest, each prior folio's prose against
its recorded span digest. `verified: true` requires all of them.

**Refusal proven:** a folio pushed to `ready` through the raw ledger with no provenance manifest
is refused by name (`no generation lineage … never promoted to canon`) — generated prose without
attempt lineage cannot be blessed.

## Results (pinned runtime Node 24.18.0, 2026-07-19)

- `pnpm run test:integration` — **28/28 pass** (my 8 across D3+D4 + the pre-existing 20).
- `pnpm run typecheck` — pass. `pnpm run lint` — pass. Full `pnpm run gates` recorded in the
  closing commit.

Provider calls executed in this slice: 0. Spend: $0.
