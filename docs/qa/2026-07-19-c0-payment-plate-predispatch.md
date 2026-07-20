# C0 Payment plate pre-dispatch evidence

Date: 2026-07-19 (America/Los_Angeles)

Judgment: **PASS for one reviewed Payment dispatch; no image provider call had occurred when this
record was written.** The output must still receive a separate visual review and explicit
no-provider acceptance before it may enter editorial progress.

## Bound Fable candidate

- Folio: `shape-of-time/root-folio-01` (`Payment`)
- Candidate:
  `/Users/ratpartyserver/git/shape-of-time-c0-authoring/fable/01-root-folio-01-1630c5df2f00/candidate.json`
- Candidate SHA-256:
  `ed52dd2d072314454500515d20350561bf964fa212d3dc69f8ec50e702177986`
- Operation-manifest SHA-256:
  `1630c5df2f00914bcea58076859c66257cfa41ce3ca6a578de841b8480c590ec`
- Provider-counted input: 13,112 tokens
- Writer evidence: `claude-fable-5`, `xhigh`, `end_turn`
- Usage-derived text estimate: `$0.370920`
- Fable image-direction SHA-256:
  `80bf4dcdf6823460b247dafb2626091a17d7c461ca0b9da227777a5c7e45d7f5`

The candidate is 242 words in one uninterrupted run. Its direction establishes Jay, Tan, and the
shop; leaves the room, queue geometry, material wear, and unequal attention to the plate; realizes
Clef only within this root lineage as the already-exposed small cold bottle; and explicitly rejects
glamorous science-fiction characterization.

## Image request

Current official OpenAI Image Edits documentation was checked before changing B1's former internal
two-reference minimum. Image Edits accept one or more input images; GPT Image 2 treats its edit
inputs as high fidelity and does not accept `input_fidelity`. The C0 route therefore admits 1–5
ordered references while retaining all B1 validation, durable-journal, one-dispatch, recovery, and
cost evidence.

The Payment request is fixed to:

- requested model snapshot: `gpt-image-2-2026-04-21`;
- endpoint: `/v1/images/edits`;
- quality and size: `medium`, `1024x1536`;
- one ordered input: verified Treatment B, provenance
  `human-approved-medium/shared-medium-only`, role `shared-medium-only`;
- one provider operation;
- request-scope estimate ceiling: `$0.10` / 100,000 microUSD;
- no automatic retry after a durable dispatch claim;
- external C0 recovery archive:
  `/Users/ratpartyserver/git/shape-of-time-c0-authoring/images/recovery`, archive ID
  `shape-of-time-c0-reader-first-2026-07`.

The Fable image direction appears as canonical JSON unchanged. The separate application block adds
only technical/layout constraints and reference scope. It says that Treatment B governs medium
only and forbids transferring its people, ferry-terminal place, objects, blue palette, arrangement,
or composition.

Exact inspected dry run:

- image manifest SHA-256:
  `fb7a78450d102ece1297cf8c95ee066331a655d2dad02fadb39489cdd4956f5a`;
- exact prompt SHA-256:
  `1f6995012c514af2968677433502f7a6c250d42e0793edc5b30eb65fa9fc781a`;
- application-guidance SHA-256:
  `bf83dd6a73923ea086ab9f5b2c9cfd2f7773c0a4ce272351b3860f4740978d7e`;
- operation digest:
  `807e299c9b7ab2c4a966affd38d5226eec2e9a2e190d72924f6cbd958f27b39a`.

## Red-to-green and exact-runtime evidence

Named red failures were observed before implementation:

1. `reader-first-plate.unit.test.ts` could not import the absent plate module.
2. The acceptance test failed because `acceptReaderFirstPlate` did not exist.
3. The progress test failed because `appendAcceptedProgress` did not exist.
4. An adversarial fixture then proved that a file containing only the PNG signature plus text and an
   arbitrary one-field receipt could enter accepted history.
5. A concurrent exact replay initially failed on the live progress lock, and a self-consistent
   candidate built from empty rather than accepted history initially entered the staged path.

The coherent repair uses one verifier for review acceptance and every later history load. It binds
the exact Fable direction, fixed plate request, ordered source identities, complete sanitized replay,
recovery objects, a fully decoded opaque 1024×1536 PNG, and acceptance v2. Treatment B's exact digest
and every exposed source plate are rejected before dispatch if substituted. Progress updates wait on
one exclusive writer, reload the complete staged evidence chain before rename, and make an exact
crash replay idempotent. The acceptance command also proves the candidate is the next global folio
before it can occupy a fixed immutable acceptance path.

The final checkpoint under Node 24.18.0 and pnpm 11.15.0 passed:

- 58 non-acceptance content/architecture tests;
- 116 unit tests;
- 20 real-Postgres integration tests;
- 11 built-reader browser regressions;
- lint, typecheck, production build, and `git diff --check`.

The two production-content acceptance tests remain intentionally red until the final 8+2 Fable run,
four accepted plates, production manifest, digest-named WebPs, and accurate alt text exist.

## Promotion boundary

The live runner can write only an immutable review PNG and a provider-bound receipt after the B1
journal reaches `completed` and its recovery proof matches the returned bytes. Its result is
`PENDING_REVIEW`. A separate command must repeat the reviewed candidate digest, validate the
receipt and PNG, write immutable acceptance evidence, and append the exact next progress entry. The
staged progress file is reloaded through the full candidate/evidence/plate validator before its
atomic rename. Rejected or merely generated images never enter later Fable history.
