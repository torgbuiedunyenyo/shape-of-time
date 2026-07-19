# B2 shared-medium comparison and continuity gate

_Opened 2026-07-19 PDT. Medium selection: **PASS — Treatment B**. Overall B2 judgment:
**PENDING CONTINUITY REVIEW**._

## Current boundary

B2 requires side-by-side human selection of the shared medium before any generated image can become
an approved reference. This first phase is therefore limited to a tested harness, exact dry-run
inspection, and exactly three medium-quality 1536×1024 generations of the same neutral comparison
scene. No edit, identity anchor, book-local anchor, narrative plate, Railway bucket write, or
`anchors.json` is authorized in this phase.

## Written treatment-phase spend ceiling

- Fixed provider operations: three generation calls, one for Treatment A, B, and C.
- Quality and size: medium, 1536×1024.
- Per-operation conservative admission reserve: 50,000 micro-USD.
- Hard request-scope ceiling: **$0.15 / 150,000 micro-USD**.
- Automatic retry or replacement: none.
- A literal `--confirm-spend-cap 0.15` is required for live dispatch.
- The live command must also repeat the exact inspected study digest. The archive identity and both
  external paths are fixed in the harness rather than caller-selectable, so a fresh path cannot
  silently repurchase the same logical operations.
- Every output and sanitized replay record must complete in a new operator-owned recovery archive
  outside Git, Railway, and temporary storage before it is materialized for review.
- Missing usage-derived total cost stops the study before another dispatch. This is an authorization
  boundary and usage-derived estimate, not a provider billing guarantee.

The continuity-sequence phase has no spend authorization yet. It will receive a separate exact
operation list and ceiling only after a human selects one treatment.

## Planned evidence locations

- Recovery archive: `/Users/ratpartyserver/git/shape-of-time-b2-recovery`
- Review material: `/Users/ratpartyserver/git/shape-of-time-b2-review/medium-comparison-v1`
- Repository source brief: `content/shape-of-time/visual-direction-candidates.md`

The review directory is convenience material, not the recovery copy. Candidate images remain
unapproved regardless of where they are displayed.

## Dry run

The exact dry run was inspected after the orchestration tests passed:

```text
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-visual-study.ts --dry-run
```

- Study digest: `46ee5049dd7e663769f0f2f769d0759674f1f5202285249a3c0a38e68fda8da3`.
- Prompt version: `b2-shared-medium-comparison-v1`.
- Treatment A manifest: `eec4f7841235d40ee546346e83a3645579976a5d3c1978213a44ab717315dfbd`.
- Treatment B manifest: `8cad92e0696f8f056d2f4c47bb2f5b070a6a5ba13f7aa0f35054bf9586efc0e1`.
- Treatment C manifest: `c4aa62a9dcd83f4f8349c42201c84ab24b16b498e10b7cce37a208ae53a63412`.
- All three operations use `/v1/images/generations`, requested snapshot
  `gpt-image-2-2026-04-21`, medium quality, 1536×1024 opaque PNG output, narrative purpose, and
  zero references or anchors.
- The study contains exactly three provider operations and a maximum planned estimate of 150,000
  micro-USD.

The live command authorized by this record is exactly:

```text
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-visual-study.ts \
  --confirm-study-digest 46ee5049dd7e663769f0f2f769d0759674f1f5202285249a3c0a38e68fda8da3 \
  --confirm-spend-cap 0.15
```

The initial orchestration test failed before implementation because the live command was not bound
to the inspected digest, callers could choose a fresh archive, and no study execution function
existed. The final focused suite proves exact digest/cap admission, fixed archive/path identity,
same-archive replay without another provider call, partial completion, missing usage, cap stopping,
rejected and indeterminate results, concurrent invocation, and recovery completion before review
materialization.

## Live results

The first live invocation durably completed Treatment A, then Treatment B entered an indeterminate
terminal state before Treatment C was dispatched. The journal did not retry B.

- Treatment A output digest:
  `9b46be15fa3c1b0c944cabdbd5513f72b18186ec87eb314b43375fd99c73a45f`.
- Treatment A provider request: `req_bb9aa19c7afc4dd2805643e50e57a32f`.
- Treatment A latency: 57,203 ms; provider processing: 55,853 ms.
- Treatment A usage: 210 text-input tokens, 1,372 image-output tokens, 1,582 total tokens.
- Treatment A usage-derived estimate: 42,210 micro-USD, of which 41,160 is image output.
- Treatment A recovery receipt:
  `8f880a7985f16950133ded38036332d742574c732ceceb0d3ad5436ecaf9dec8`;
  replay digest: `751497872e7b0b6f14fa94e96d4feb2576b8547033cbc73f30e20f050eb2b769`.
- Treatment B terminal state: `indeterminate`; code: `unexpected_dispatch_failure`; HTTP status,
  provider request ID, usage, and cost are unavailable.
- Treatment B terminal digest:
  `30bb1cef5905d90556acbf97396c7cc87cfe6461ce61df67e074814f625b42a6`.
- Treatment C was initially absent and undispatched.

The safe continuation does not replay or replace B. It acknowledges that exact immutable terminal,
counts the full 50,000-micro-USD per-operation reserve against the authorization as though B might
have spent, replays A from recovery, and permits the still-authorized C operation only because
42,210 + 50,000 + 50,000 = 142,210 micro-USD remains below the written 150,000-micro-USD cap. The
resume command is:

```text
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-visual-study.ts \
  --confirm-study-digest 46ee5049dd7e663769f0f2f769d0759674f1f5202285249a3c0a38e68fda8da3 \
  --confirm-spend-cap 0.15 \
  --acknowledge-indeterminate \
  b2-treatment-b-v1:30bb1cef5905d90556acbf97396c7cc87cfe6461ce61df67e074814f625b42a6
```

The continuation replayed A, acknowledged B without dispatch, and made the one remaining authorized
call for C. The provider returned a response, but local validation overflowed the JavaScript call
stack while applying one whole-string base64 regular expression. C was therefore recorded as
indeterminate, with no automatic retry and no review image:

- Treatment C terminal digest:
  `2af994ff3e0afaf5a65f2e249e9629d1b552bcfa9ca8a56fe0f582e65a8b61d9`.
- Treatment C terminal code: `unexpected_dispatch_failure`; provider request ID, usage, and cost are
  unavailable in durable evidence.
- The captured local cause was `RangeError: Maximum call stack size exceeded` at
  `decodeBase64Strict`. Treatment B most likely encountered the same defect, but that is an
  inference because its original local cause was not captured.

All three operations in the original tranche are now either completed or indeterminate. That
tranche is closed. B and C will never be replayed under their v1 identities. A red regression with a
multi-megabyte base64 response reproduced the stack overflow; the validator now performs bounded
linear character validation and the focused transport suite passes. A separate, written two-call
replacement tranche is required before new B and C identities may be dispatched.

## Base64-validator replacement tranche

This is a separate authorization, not an extension or reinterpretation of the original $0.15.
Aggregate B2 request-scope authorization becomes $0.25; the original indeterminate B/C billing is
unknown and is not described as zero.

- Fixed provider operations: exactly two medium 1536×1024 generations, B replacement then C
  replacement.
- New application identities: `b2-treatment-b-replacement-v1` and
  `b2-treatment-c-replacement-v1`.
- Per-operation conservative reserve: 50,000 micro-USD.
- Hard replacement ceiling: **$0.10 / 100,000 micro-USD**.
- Automatic retry or further replacement: none.
- Archive ID/root remain `b2-visual-study-2026-07` and
  `/Users/ratpartyserver/git/shape-of-time-b2-recovery`; a caller cannot select a fresh journal.
- The exact original B/C prompts, prompt version, snapshot, quality, geometry, endpoint, and zero
  references are retained. Only the application idempotency identities change.
- The harness verifies recovered A plus both immutable v1 indeterminate terminals before it can
  dispatch, and recovers every replacement before review materialization.

Exact inspected replacement dry run:

```text
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-visual-study-repair.ts --dry-run
```

- B replacement manifest:
  `c7a51913fce0f7ef30221e19d600577aecf808bd8ed16492df651d3836b3cf49`.
- C replacement manifest:
  `af892d84571fafad68c08f0a0b4661fd5300d1048a5bccb129c2a72d2928e392`.
- Replacement study digest:
  `602a6297b458b572ba7cdb1a76eb1a32ddb9930c1cf4bb26f2ce9aeac7756923`.
- Planned provider operations: 2; maximum planned estimate: 100,000 micro-USD.

The only authorized live repair command is:

```text
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-visual-study-repair.ts \
  --confirm-study-digest 602a6297b458b572ba7cdb1a76eb1a32ddb9930c1cf4bb26f2ce9aeac7756923 \
  --confirm-spend-cap 0.10
```

The repair harness began red because it did not exist. Its focused tests now prove exactly two new
B/C identities, unchanged comparison prompts, exact digest/cap admission, recovery-backed review
materialization, and same-archive replay without a second provider call. The separately red
multi-megabyte transport regression also passes.

### Replacement B live result and durable-journal correction

The authorized repair invocation dispatched replacement B once. OpenAI returned HTTP 200, but a
second local whole-string base64 regular expression in the durable received-result journal
overflowed after the provider adapter had already accepted the response. The operation is immutable
and will not be retried:

- idempotency key: `b2-treatment-b-replacement-v1`;
- manifest digest: `c7a51913fce0f7ef30221e19d600577aecf808bd8ed16492df651d3836b3cf49`;
- terminal state/code: `indeterminate` / `invalid_received_result`;
- terminal digest: `a4b2f9659c137e67eb3abd9877d968cd68dfb80dc8a07592d1677ec038c6c0c8`;
- HTTP status: 200;
- provider request: `req_739fd4bdd47549648f844ed65006b163`;
- latency: 45,277 ms; provider processing: 44,424 ms; and
- usage and provider bill: unavailable because the accepted bytes were not durably bound.

The first red regression exercised a 4,000,000-byte provider PNG through the durable receive and
replay path and failed with the same `RangeError: Maximum call stack size exceeded`. Provider and
journal decoding now share one bounded linear canonical-base64 decoder. The regression completes,
replays exact bytes, and proves a single executor invocation. A repository scan found no other
unbounded whole-string base64 validators.

Replacement C remains absent and has never been dispatched. Continuing the existing replacement
tranche requires an exact acknowledgement of replacement B's terminal. The harness charges the full
50,000-micro-USD reserve for B before admitting C's 50,000-micro-USD reserve, never invokes B again,
and suppresses the final three-way contact sheet while B remains missing. The continuation command
is exactly:

```text
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-visual-study-repair.ts \
  --confirm-study-digest 602a6297b458b572ba7cdb1a76eb1a32ddb9930c1cf4bb26f2ce9aeac7756923 \
  --confirm-spend-cap 0.10 \
  --acknowledge-indeterminate \
  b2-treatment-b-replacement-v1:a4b2f9659c137e67eb3abd9877d968cd68dfb80dc8a07592d1677ec038c6c0c8
```

This does not enlarge the existing replacement authorization. Aggregate B2 request-scope
authorization remains $0.25 at this point; it is not a statement of provider billing. A distinct,
one-operation B-v2 tranche and new identity will require a separate $0.05 ceiling after C is safely
recovered. The manifest `purpose: narrative` value denotes the image contract's production lane as
opposed to its synthetic `contract-test` lane; it does not claim that this neutral comparison image
is a story plate.

Replacement C then completed under that exact continuation without another B invocation:

- output digest: `93498bd84304576bfa3a9f2886ae6fb69a3d45a74fa2dc092602e204e1483d44`;
- provider request: `req_5c4dbec2154343878378ee21b668fccc`;
- latency: 44,721 ms; provider processing: 44,279 ms;
- usage: 209 text-input tokens, 1,372 image-output tokens, 1,581 total tokens;
- usage-derived estimate: 42,205 micro-USD, of which 41,160 is image output;
- image recovery receipt:
  `36eff8ff3a192ccafba343bce56be7781d1bdc0561f4f35d2d95eeaff6e2b23a`;
- replay digest: `bff1c570e9230660fed6e819ac20caee0c2a090ad5b70128af168943c817dac5`;
  and
- completed terminal digest:
  `4f15231ca02794264449db5bd21fdef5155865e1c0437b4cb8e5c2e9a4704f8c`.

The replacement tranche consumed at most 92,205 micro-USD of authorization: the full 50,000 reserve
for indeterminate B plus C's 42,205 usage-derived estimate. Its final three-way report remains
suppressed because B is absent.

## Treatment B v2 one-call tranche

This is a third and final treatment-comparison authorization. It does not retry any prior identity.

- Fixed provider operations: exactly one medium 1536×1024 generation.
- New identity: `b2-treatment-b-replacement-v2-durable-base64`.
- Candidate manifest:
  `57739f11b99edb025b0189293de552e9126ee553020e4c2fde94b7ae9d219a49`.
- Exact original Treatment B prompt, prompt version, snapshot, endpoint, quality, geometry, and zero
  references; only the application identity changes.
- Hard tranche ceiling: **$0.05 / 50,000 micro-USD**.
- Automatic retry or further replacement: none.
- The fixed archive and review roots are unchanged.
- Before dispatch, the harness verifies A and replacement C as exact completed/recoverable
  operations and verifies original B, original C, and replacement B as the three exact immutable
  indeterminate terminals. Retained A/C are durable replays, never provider calls.
- A complete contact sheet can be written only after B v2 has completed with recovery evidence.

Exact inspected dry run:

```text
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-visual-study-b-v2.ts --dry-run
```

- Study digest: `3b4881fb9f7c27d3a33b7eeac27119ccb8ea180c7e1a1b312953bdcf929ea2ea`.
- Planned operations: 1; maximum planned estimate: 50,000 micro-USD.

The only authorized live command is:

```text
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-visual-study-b-v2.ts \
  --confirm-study-digest 3b4881fb9f7c27d3a33b7eeac27119ccb8ea180c7e1a1b312953bdcf929ea2ea \
  --confirm-spend-cap 0.05
```

The red test first failed because the one-call harness did not exist. The focused green proof uses a
real filesystem journal and recovery archive: it seeds completed A/C and all three indeterminate
lineages, dispatches only B v2 once, writes a complete A/B/C report, and proves a second run performs
only durable replays. Aggregate B2 treatment-comparison request-scope authorization is now $0.30;
this remains distinct from the unknown provider bill for indeterminate responses.

### Treatment B v2 live result

The one-call tranche completed without retry, recovered both the image and sanitized replay outside
Git and Railway, and materialized the complete A/B/C review set:

- output digest:
  `85e55625e3a8bcf3e31c3546689287dc306736bf8deef59172ae8511c6dd2b06`;
- provider request: `req_e0f6415b63674914bda51745a8b63987`;
- latency: 43,440 ms; provider processing: 42,865 ms;
- usage: 211 text-input tokens, 1,372 image-output tokens, 1,583 total tokens;
- usage-derived estimate: 42,215 micro-USD, of which 41,160 is image output;
- image recovery receipt:
  `a9ac29f4a649bba572ddb8dce97547e7bd8c27ef8413ec7a9d2d5fa44a1acf5a`;
- replay digest:
  `b76e2dbc05db4b553de4145bba9e502f714f88c2d49a09113aa129db8f8902e5`;
  and
- completed terminal digest:
  `c02bfd1d2fc98577c9ece5b6f20aff3e952275c63856ed3bca5dd67430332f85`.

The exact requested model snapshot was `gpt-image-2-2026-04-21`. The Image API supplied no served
model field, so served-model evidence is explicitly unavailable; this record does not infer that the
provider returned a different or more specific identity.

## Human medium scorecard

**MEDIUM SELECTION: PASS.** On 2026-07-19 the project owner reviewed all three treatments together
at reader size and selected **Treatment B — inked reportage with transparent color**.

The selected qualities are observational varied ink; transparent, restrained color; tactile paper,
wear, and repair; natural perspective; and concrete faces and hands. These qualities, and only these
medium-level qualities, bind the next experiment. The ferry-terminal scene's people, place, ticket,
counter, palette, clothing, arrangement, and composition are all incidental and do not become story
facts or references.

The completed scorecard covered:

- whether faces, hands, material wear, and spatial relationships remain legible;
- whether the medium feels adult, intimate, and specific rather than generated concept art;
- whether it can support both close emotion and wide material settings;
- whether different books can own radically different palettes, light, architecture, and density;
- whether purposeful changes will read as change rather than drift;
- whether the treatment invites another page without prettifying every place; and
- exactly which medium qualities bind, with all depicted scene content declared incidental.

This is a human PASS for medium selection only. The 8–12-image continuity sequence, recurrence and
purposeful-change evaluation, reference-asset selection, and `anchors.json` remain PENDING. No model
review can satisfy that later human gate, and this report does not claim an overall B2 PASS.
