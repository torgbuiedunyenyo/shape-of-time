# B1 GPT Image 2 contract and recovery evidence

_Run date: 2026-07-19 PDT. B1 release commit:
`6fc00380031692ad3cc85cec4f589dd1163976bf`._

## Judgment and scope

The live generate/edit endpoint contract, durable recovery boundary, final exact-runtime gate, and
independent adversarial rereads passed. B1 is complete. The technical judgment is by the Codex
implementation agent under the owner's delegated instruction to proceed. This report makes no
literary or visual-direction approval claim.

The two retained provider outputs are generic non-corpus contract evidence. They are not approved
narrative assets, visual anchors, application `Asset` rows, or Railway bucket objects.

## Official contract and pricing decision

The implementation was checked against the current official
[GPT Image 2 model page](https://developers.openai.com/api/docs/models/gpt-image-2),
[image generation guide](https://developers.openai.com/api/docs/guides/image-generation),
[API pricing](https://developers.openai.com/api/docs/pricing), and Image API generation/edit OpenAPI
specifications.

- Exact requested snapshot: `gpt-image-2-2026-04-21`.
- First candidates use `POST /v1/images/generations`; ordered-reference work uses
  `POST /v1/images/edits`.
- GPT Image 2 edit inputs are intrinsically high fidelity, so `input_fidelity` is absent.
- The Image API response does not expose a served-model field. The requested snapshot is retained as
  request evidence and is never mislabeled as provider-reported evidence.
- The Image endpoints do not document provider idempotency. `X-Client-Request-Id` is tracing only.
  A durable application journal claims the exact request before fetch, dispatches once, and blocks
  automatic resend after any ambiguous outcome.
- Provider generation is nondeterministic and has no image seed. Replay means verification and
  recovery of a recorded result, never pixel regeneration.
- Standard GPT Image 2 prices checked on 2026-07-19 are $5 per million text-input tokens, $8 per
  million image-input tokens, and $30 per million image-output tokens.

The published model/guide and generic endpoint schema still disagree in places about models and
sizes. The minimal live evidence therefore exercised both generation and edit endpoints.

## Red evidence

The first B1 tests ran before implementation:

- `node --test scripts/*.test.mjs`: 31 passed and 2 failed on stale served-model/idempotency
  authority and the absent recovery/replay contract.
- `vitest run --project unit`: the new suites could not import the absent image-contract and recovery
  modules.

Adversarial review then produced additional observed reds before the fixes:

- a caller-controlled recovery root could be recursively removed;
- object-only recovery residue disappeared from snapshots;
- a symlink into the temporary directory and a project-ancestor root were accepted;
- the image idempotency key did not prevent a second provider call;
- a response-body abort escaped as an unclassified error;
- a 45-byte pseudo-PNG with no `IDAT` and bad checksums passed;
- replay accepted mutation of result digest, request ID, usage, and cost; and
- the full content gate rejected the two unreviewed package scripts;
- caller-owned reference bytes could change after their manifest was compiled;
- a required reference carried neither approval/exposure provenance nor a recoverable exact copy;
- an undocumented response `model` echo was presented as served-model evidence;
- a non-JSON HTTP 408 became a definitive rejection;
- a CRC-valid PNG with two `PLTE` chunks passed validation;
- a descendant `objects` symlink escaped the archive root, and two archive IDs could poison one root;
- a merely prepared operation could be terminalized without a dispatch marker; and
- a replayed live-harness operation was reported as though the current invocation made a provider call.
- `acquireDispatch` trusted a caller-mutated prepared operation, and received evidence did not bind
  the replay result's client request ID;
- the journal permitted a failed terminal after durable received bytes and received bytes after a
  failed terminal;
- successful latency stopped when response headers arrived rather than after body consumption and
  validation;
- usage accepted integers beyond `Number.MAX_SAFE_INTEGER`, producing unsafe micro-USD arithmetic;
- replay sanitization removed only pixel bytes and retained an unexpected secret-bearing field;
- coherently rehashed mutations could change fixed manifest fields before wire dispatch;
- indexed PNG validation accepted a palette larger than its bit depth and a pixel index outside its
  palette; and
- the recovery command accepted an HTTP S3 endpoint that could expose bucket credentials;
- a resolution claim and its received/failed evidence were separate durable files, leaving a crash
  window between them;
- PNG validation accepted trailing bytes after an otherwise complete zlib stream; and
- reference guidance could grow the final dispatched prompt beyond the compiler's 32,000-character
  ceiling;
- PNG validation accepted a CRC-valid chunk with the reserved third type bit set;
- the durable journal accepted a coherently rehashed fixture whose result violated fixed pricing,
  model, size, or cost semantics;
- the generic executor boundary could label arbitrary non-PNG bytes as a valid image result; and
- archive containment mishandled the filesystem volume root, allowing it to contain the worktree;
  and
- concurrent first use of a fresh recovery root could mistake another initializer's atomic staging
  file for foreign residue and fail before publishing the immutable archive identity;
- the exported client accepted an arbitrary base URL and would attach its bearer credential to that
  origin; and
- the opaque PNG contract accepted `tRNS`, including malformed post-`IDAT` placement, and accepted
  alpha-bearing pixels whose samples were not fully opaque; and
- native fetch redirect following could reissue a claimed POST to a redirected origin, violating the
  exact endpoint and single-dispatch boundary.

The focused red run recorded three recovery failures, a missing durable-dispatch module, and three
image-contract failures for required anchors, body-abort classification, and result integrity. No
provider call occurred during these review reds.

## Implemented contract

- Generation and edit manifests pin the requested snapshot, purpose, prompt/version, output options,
  application operation key, and exact ordered reference evidence. Compilation copies caller-owned
  bytes and metadata; both the durable dispatcher and wire adapter revalidate the snapshot.
- Edit compilation requires an explicit anchor requirement set, rejects omission or substitution,
  rejects duplicate bytes relabeled as independent inputs, and admits only human-approved,
  exposed-folio, or explicitly contract-only fixture provenance.
- Wire requests omit both undocumented provider idempotency and `input_fidelity` fields.
- The adapter has no endpoint override: it sends only to the exact official
  `https://api.openai.com` origin, rejects unknown constructor options before dispatch, and sets
  `redirect: "error"` on both generation and edit requests.
- Before an edit claim, the journal archives and verifies each exact reference byte sequence in
  manifest order and binds those recovery proofs into the prepared record. A filesystem-backed
  journal then stores an atomic dispatch marker and one single-winner resolution record containing
  the complete received result or failed terminal. This prevents received and failed outcomes from
  coexisting even when callers race, without introducing a claim/evidence crash window. Completion
  adds recovery proofs in a terminal record; a crash before it leaves the complete received result
  reconcilable. Every transition reloads and compares the complete canonical prepared operation.
  Terminal and received evidence cannot exist without and must digest-bind the dispatch marker and
  client request ID. A completed same-key operation reads its archived bytes; changed intent conflicts.
- Successful bytes and replay v2 metadata are archived before completion. If the process stops after
  the received record or an archive write but before terminal linkage, a later invocation reconciles
  the exact archived result without provider redispatch. A dispatch with no recoverable received
  result remains indeterminate and cannot resend.
- Successful responses require canonical base64, exact requested dimensions, valid PNG chunk
  boundaries and CRCs, `IHDR`, decodable consecutive `IDAT` data, a final `IEND`, valid row filters,
  valid indexed-palette bounds and samples, complete exhaustion of the zlib stream, and no trailing
  bytes. The chunk-type reserved bit is enforced. The same structural PNG and dimension validation
  runs again at the generic executor-to-journal boundary, so an alternate executor cannot smuggle
  mislabeled bytes into durable evidence. Because every manifest requests an opaque background,
  `tRNS` is forbidden and 8/16-bit grayscale-alpha or RGBA pixels must carry fully opaque alpha
  samples.
- Body-read failures, HTTP 408, malformed successful bodies, invalid usage arithmetic, and invalid
  PNGs are indeterminate after dispatch. A definitive 4xx moderation rejection remains rejected.
  Failed terminal records preserve pricing plus captured timing, or state explicitly that executor
  timing was unavailable. There is no transport or server retry in the adapter.
- Cost evidence separates output estimate from usage-derived estimated total and provider-billed
  cost. Usage and all derived arithmetic must be safe integers. Total remains null when usage is
  absent. Replay metadata is built from an explicit field allowlist rather than copying provider or
  caller objects.
- Recovery publication uses a synced same-directory staging file and atomic no-overwrite hard link.
  One immutable archive identity is locked to the canonical root. Canonical checks reject
  project/temp overlap, filesystem-root containment, root aliases, and symlinked descendants; newly
  created ancestor entries are synced. First-use identity publication tolerates only the exact
  same-directory staging filename shape used by concurrent initializers; all other pre-identity
  residue remains rejected. Received fixtures pass the same exact-key, digest, manifest,
  pricing, model, size, usage, and cost validator as replay before the atomic resolution is written.
  Snapshots require exact object/receipt inventory equality. This detects corruption against retained
  proofs; it is not WORM storage and a snapshot digest recomputed from the same archive is not
  independent authentication.

## Current local evidence

Exact runtime: Node 24.18.0 and pnpm 11.15.0.

- `pnpm run test:content`: 33/33 pass.
- `pnpm run test:unit`: 67/67 pass.
- `pnpm run test:integration`: 20/20 pass against real Postgres.
- `pnpm run test:browser`: 1/1 production-build Chromium regression passes.
- `pnpm run typecheck`: pass.
- `pnpm run lint`: pass.
- `pnpm run build`: pass.
- `pnpm run gates`: pass.
- Current dry-run manifests:
  - generation manifest `52adec81e57ce9acca5801f656e4ee59a950707de551063bc8d18fa8aa741f4a`;
  - distinct two-reference edit `56f07fa67f8ff33ae240b8800540c914d08b3e01d037354577008dfcccfbdbc3`.
- The dry run contains exactly two operations, two distinct reference digests, explicit required
  anchors, exact prompts, and the requested snapshot. It contains no authorization value or
  generated binary.

Three final independent Sol/xhigh audits returned PASS after their concrete findings were reproduced
red-first and fixed. Their final focused runs covered 55 image/compiler/dispatch/recovery tests,
concurrent fresh-root initialization, external archive integrity, secret leakage, exact-origin and
redirect behavior, opaque PNG semantics, and end-to-end replay/reconciliation. One full-gate attempt
timed out waiting for the browser web server while concurrent audits were active; the browser gate
then passed alone in 6 seconds, and the clean final full-gate run passed end to end.

GitHub Application gates run `29701491746` passed for the exact release commit. Railway then created
Git-triggered deployment `81ca9edd-7e22-4b51-9096-e3bb085ac5ef`; it reached `SUCCESS`, and production
`/healthz` reported the exact B1 commit, migration `001_initial`, schema digest
`66eaee6423b1e99b4e8a29e5acc206ed25c6b48531834a81256bb45cf0049fb0`, and PostgreSQL 18.4. No
`railway up` deployment was used.

### Post-release B2 regression correction

B2's first multi-megabyte outputs exposed two duplicated base64 validators that B1's small PNG
fixtures had not stressed. The provider adapter and then the durable received-result journal each
overflowed the JavaScript call stack after a successful provider response. The B2 branch records
both immutable indeterminate operations and never retries them. A red multi-megabyte regression now
runs through each boundary, and both call sites use one bounded linear canonical decoder. This is a
corrective B1 contract hardening discovered during B2; it does not rewrite the B1 release evidence
or claim that the lost outputs were recovered.

## Railway recovery smoke

At 2026-07-19 02:07 PDT, the ownership-safe command ran against project
`8b20e07d-c256-44c9-85be-d1c7e50ac83d`, environment `production`, service `shape-of-time`, bucket
`assets`:

```text
railway run --project 8b20e07d-c256-44c9-85be-d1c7e50ac83d --environment production \
  --service shape-of-time mise x node@24.18.0 -- pnpm \
  run assets:recovery -- smoke --archive-id synthetic-railway-smoke-2026-07-19-v4
```

Result: baseline 0 objects, final 0 objects, restore true, synthetic digest
`a8965b83f4eb18fdfc1ea6f8f366f7ade3f3519e97f6a92a844f528ae8ebd5df`.

The tool created its own temporary archive, archived and verified one synthetic proof, conditionally
created and GET-verified the object, conditionally deleted only the ETag it created, restored only
that proof through another no-overwrite put, GET-verified it again, and conditionally deleted the
second owned ETag. A concurrent collision is rejected and is never cleanup-owned. The tool removed
only its own temporary root. No deployment, variable change, credential print, or retained bucket
object occurred. One earlier invocation used an incorrect Railway `--` separator and exited without
running the child command or touching storage.

## Written live authorization and dry run

Before the paid call, B1 authorized exactly two low-quality 1024×1024 operations: one generation and
one edit, with no automatic retry.

- Published quality/size output estimate: approximately $0.006 each, $0.012 total.
- Input text/image tokens were additional.
- Authorization bound: **$0.10**.
- The harness required literal `--confirm-spend-cap 0.10`.

This was an authorization for a fixed request scope, not a provider billing guarantee. It was
written and the dry run inspected before dispatch.

## Historical live endpoint result

The endpoint contract passed without retry or fallback:

| Call | Manifest | Output | Request ID | Latency | Usage |
| --- | --- | --- | --- | ---: | --- |
| Generate | `b01fd5f5a4f92677872744ffe74259f04c5360a0972b64d4c0cd478a868f8531` | `194411866ab4f1c9b559607bceaeb3aa728e7bd06c2ad3bfda038c91e68a6fda` | `req_adc99cc5b9c64b828102dc16bf5cfe6e` | 14,990 ms | 30 input, 196 output, 226 total |
| Edit | `e812a3e7933ed55df3422018d1e5f97d0e9fba0339f42b3e515efd7e4613ad81` | `d27c8dc279186019a20d7423d439b3a84b75d7c279cfa50684af039ace0b1fa9` | `req_4ee263dc5bb84e94a1d9d67ef5f9be41` | 25,091 ms | 2,119 input (2,048 image), 196 output, 2,315 total |

- Both requests named `gpt-image-2-2026-04-21`.
- Both response bodies omitted `model`; there is no served-model evidence.
- Provider processing headers reported 14,159 ms and 24,791 ms.
- Usage-derived estimate at the checked standard prices:
  - text input: 101 tokens × $5/M = 505 micro-USD;
  - image input: 2,048 tokens × $8/M = 16,384 micro-USD;
  - image output: 392 tokens × $30/M = 11,760 micro-USD;
  - estimated total: **28,649 micro-USD ($0.028649)**.
- This is not the provider's billed amount; the response did not report one.
- Visual inspection found that the edit retained the cup/material, moved it, and added the napkin.

The historical edit submitted the same PNG twice under two labels. It proves that the edit endpoint
accepted a two-part multipart request and visibly followed the edit, but not ordering between two
distinct visual inputs or semantic anchor enforcement. Those gaps are now covered by mutation tests
and the distinct-input v2 dry run. No extra paid call was made merely to rewrite historical evidence.

The historical operations predate the durable journal and are not falsely represented as having a
pre-dispatch claim. The current harness uses new `*-journal-v2` operation keys, v2 replay evidence,
and the one-dispatch journal; it has not been paid-rerun.

## External recovery result

The owner-controlled archive is `/Users/ratpartyserver/git/shape-of-time-recovery`, archive ID
`owner-archive-2026-07`. It contains two PNGs and two historical sanitized replay records, each with
a content-addressed object and receipt. No generated binary is in Git.

The strict inventory and clean-target restore ran again on 2026-07-19 after locking the archive's
immutable identity:

- entries: 4;
- snapshot manifest digest:
  `86748ab97055f0ad2de402c05b6f033c577ff263a8b59f0aa68a330a2a5c4ae6`;
- restored digests:
  `194411866ab4f1c9b559607bceaeb3aa728e7bd06c2ad3bfda038c91e68a6fda`,
  `ae63bb30a54d52b521720f8c4fa24bd541c05a741120050337b2b26ccb73d3d3`,
  `b9c1c349fa427ccf3debe4f6051bf70eb2de78a795ad75c4cc18a20813488af9`, and
  `d27c8dc279186019a20d7423d439b3a84b75d7c279cfa50684af039ace0b1fa9`.

Every restore call supplied and receipt-matched the retained media type. Every clean-store byte read
passed digest and length verification; the byte-only `AssetStore.get` interface does not claim to
round-trip media-type metadata. The temporary restore target was removed. The Railway bucket
remained at 0 objects / 0 B.
