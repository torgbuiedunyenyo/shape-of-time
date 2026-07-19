# Paste-ready handoff — Claude Fable 5 xhigh: B2 continuity Stage 1

Use **Claude Fable 5 with xhigh reasoning** for this implementation. Keep the complete working
context below 400,000 tokens. Do not substitute Opus or another model.

## Objective

Implement the red-first, no-provider-call harness and checked-in production plan for **B2 visual
continuity Stage 1**. This slice prepares exactly one bounded GPT Image 2 candidate request for later
human-inspected execution. It does **not** generate an image, approve an anchor, deploy, commit, or
push.

## Repository and shared-worktree safety

- Active repository: `/Users/ratpartyserver/git/shape-of-time-b2`
- Active branch: `codex/b2-visual-study`
- Do not work in `/Users/ratpartyserver/git/shape-of-time`; that is the `main` checkout and may be in
  use by another agent.
- This is a mixed worktree containing substantial uncommitted B1/B2 work owned by another agent.
  Preserve every pre-existing modification and untracked file. Never reset, clean, checkout over,
  stash, reformat broadly, or delete work you did not create.
- Before editing, run `git status --short --branch`. At the end, run it again and report only the
  paths you changed. Use `apply_patch` for edits.
- Another agent has intentionally created the three red tests named below. They belong to this slice
  and may be edited only to correct a genuine test defect, never weakened to make the implementation
  pass.
- Do not stage, commit, push, rebase, merge, deploy, touch Railway, or mutate any external recovery
  archive or review directory.

## Authority to read first

Read these files completely, in this order, before implementation:

1. `AGENTS.md`
2. `SPEC.md`
3. `EVALS.md`
4. `PLAN.md`
5. `HANDOFF.md`
6. `content/shape-of-time/visual-bible.md`
7. `content/shape-of-time/visual-direction-candidates.md`
8. `content/shape-of-time/root-movement-01.md`
9. Root Folio 02, **Payment**, in `content/prototype-movements.md`
10. `content/prepared-children.md`
11. Existing B2 harnesses and tests under `src/server/images/b2-visual-study*.ts`
12. `docs/qa/2026-07-19-b2-visual-direction.md`

Treat the product as a calm illustrated-novel/e-reader whose text and images share narrative labor.
The image study is evidence for that product, not a concept-art side project.

## Completed human decision

The project owner reviewed Treatments A, B, and C together at reader size and gave a human PASS to
**Treatment B: inked reportage with transparent color**. The binding shared qualities are:

- varied observational ink;
- restrained transparent watercolor and sparse colored pencil;
- visible tactile paper, wear, and repair;
- natural perspective; and
- concrete faces and hands.

Only the medium is approved. The comparison image's people, place, ferry terminal, counter, ticket,
clothing, palette, staging, and composition remain incidental and confer no authority. The B2
continuity sequence, recurring identities, book-local objects/places, and all reusable references
remain pending human review. There is no `anchors.json` and this task must not create one.

## Fixed eight-image continuity sequence

Write a concise checked-in production plan with exactly these eight candidates. Every candidate and
every proposed crop must receive human approval before it can be used as a later reference.

### Image 1 — Root F02 Payment

Text-only generation, portrait `1024x1536`. Establish candidate Jay and Tan identities and a
root-lineage realization of Clef. The payment mismatch must be legible through hands, phone,
glances, queue distance, and bodies in space. If approved later, crop Jay, Tan, and Clef separately
for narrowly scoped reference roles.

### Image 2 — Root F01 Late shift

Edit, landscape `1536x1024`. Proposed ordered references: approved Jay crop, approved Tan crop,
approved root-Clef crop, and the selected-medium reference used only for medium. Move the same people
from close to wide scale. Establish the shop and reveal its economic arrangement through wear,
tourist-facing improvement, and who waits for whom.

### Image 3 — Root F07 Thursday

Edit. Proposed references: approved Tan identity/appearance, approved Jay identity, approved F01
shop/place, and medium reference. Make a purposeful change in Tan's travel-worn clothing, fatigue,
and posture while keeping identity legible. Return to a shop that has continued living rather than
showing a reality glitch or generic before/after effect.

### Image 4 — Root F04 The bus stop

Edit. Proposed references: approved Jay, approved Tan, and medium reference. Show the old anchor
bolts, displaced shelter, coach-claimed curb, resident paths, and kiosk without predesigning a
universal Oakland look. Let the image add the spatial/economic fact. Create a small operator or
blue-badge detail that may be cropped for parent-to-child inheritance after human approval;
deterministic text is added later in application composition.

### Image 5 — Blue Badges F01 Two rooms

Edit, portrait `1024x1536`. Proposed references: approved F04 parent plate, approved badge/operator
crop, and medium reference. This is Mara's independent Stepney story, not a continuation of Jay and
Tan. Use a cutaway-like single artist's plate—not comic panels—to reveal the two standards of
shelter construction and comfort before Mara has language for opposing them.

### Image 6 — The Map on the Wall F01 The licensed route

Text-only generation, landscape `1536x1024`. Establish candidate Eniola, the Lagos municipal ferry,
and this child book's local material culture. Keep lagoon water and temporal-vector instruments
visibly separate. Circular motion, mirrors, heat, repair, crowding, and unequal protective equipment
make Phantas Minor materially consequential. Avoid a generic future city or global ferry/PRMTT
design. If approved later, crop Eniola and the ferry/place separately.

### Image 7 — The Map on the Wall F04 The terminal wall

Edit. Proposed references: approved Eniola, approved F01 ferry/Lagos place, and medium reference.
Show purposeful change in Eniola's status and the returned-to place, plus the public route trace and
crews gathering around it. Any route labels or factual map marks are composed deterministically
later rather than generated as readable text. If approved, this becomes the later causal neighbor
for Image 8.

### Image 8 — The Map on the Wall F02 The order to return

Neighbor-repair edit. Proposed references: approved Eniola identity, approved F01 earlier neighbor,
approved F04 later neighbor, and medium reference. Preserve identity and local place while staging
the mid-crossing decision. Do not import the later public wall, suspension, or other future facts
backward. The corporate omission and municipal outer berth are overlaid deterministically later.

The complete later sequence is expected to need separately inspected, staged spend authorizations;
a prior design audit proposed an overall bound of `$0.70`. That is **not** an authorization for this
task. This task prepares Stage 1 only, under the exact `$0.05` bound below, and executes zero calls.

## Immediate implementation scope: Stage 1 only

Implement the production harness, pure compiler, tests, and documentation for Image 1 only.

### Fixed request identity and infrastructure

- Application idempotency key: `b2-continuity-root-payment-v1`
- Request kind: text-only image generation, not edit
- Requested snapshot: `gpt-image-2-2026-04-21`
- Quality: `medium`
- Size: `1024x1536`
- Ordered references: none
- Maximum provider operations: exactly one
- Per-operation conservative maximum: `50_000` micro-USD
- Written Stage 1 request-scope cap: `$0.05`
- Recovery archive ID: `b2-visual-study-2026-07`
- Recovery root: `/Users/ratpartyserver/git/shape-of-time-b2-recovery`
- Review root: `/Users/ratpartyserver/git/shape-of-time-b2-review/continuity-v1`
- Review image filename: `01-root-payment.png`
- No retry and no replacement. A rejected or indeterminate terminal is final for this operation
  identity and must not trigger a second paid request.
- A future live run must require the literal `$0.05` cap and the exact current dry-run study digest.
  This task prints and records that exact digest but does not execute the live command.

### Exact Stage 1 image brief requirements

Compile one opaque portrait **adult illustrated-novel plate** for Root Folio 02, Payment.

- Depict Jay and Tan as two specific, recognizable young adults whose candidate identities can be
  evaluated and, only after human approval, cropped into separate references.
- Make the failed payment immediately legible through their hands, Jay's physical phone, their
  faces and glances, the distance between them, and the waiting queue. Jay recognizes the mismatch
  and avoids publicly embarrassing Tan; Tan expects an interface action this phone cannot perform.
- Let the model realize Clef for this root lineage without being told what Clef is. Do not specify
  whether it is food, drink, drug, preparation, package, or anything else; do not specify its form,
  substance, color, packaging, use, or effect.
- Require the image to add material and spatial facts beyond the prose instead of merely decorating
  or paraphrasing it. Those facts may emerge through ordinary shop wear, access, bodies, waiting,
  repair, labor, and arrangement, but the prompt must not predesign the shop.
- Bind only the approved medium: varied observational ink; restrained transparent watercolor;
  sparse colored pencil; visible tactile paper, wear, and repair; natural perspective; concrete
  faces and hands.
- Explicitly reject comic panels, graphic-novel frames, speech balloons, urban-sketch
  prettification, generic sci-fi/future shorthand, readable generated text, logos, captions,
  portals, cosmic time effects, and duplicate people.
- Do not predefine race or ethnicity, precise facial features, Clef form, shop plan, a universal
  future style, or incidental palette. Do not depict multiple copies of a person. No choice in this
  candidate becomes global canon.

Use a concise image prompt with clear sections such as narrative job, scene/relationship, medium,
facts to discover, must remain open, and reject. Do not write pseudo-code prose or convert the world
into a taxonomy.

## Intentionally red tests already present

These were written and run before implementation:

1. `src/server/images/b2-continuity-stage1.unit.test.ts`
2. `src/server/images/b2-continuity-stage1.orchestration.unit.test.ts`
3. `scripts/verify-b2-continuity-stage1.test.mjs`

The observed red is legitimate:

- both Vitest files fail because `src/server/images/b2-continuity-stage1.ts` does not exist;
- the content test fails because `content/shape-of-time/visual-continuity-plan.md` and the Stage 1 QA
  record do not exist.

Preserve this red evidence in the QA record. Read the tests before implementation. They require:

- one fixed no-reference generation and exact request/prompt invariants;
- the exact archive/review roots, operation identity, settings, max reserve, and cap;
- literal cap plus exact dry-run digest admission;
- recovery evidence before review materialization;
- stable replay with no second provider call;
- fail-closed missing-usage and observed-over-cap behavior;
- terminal indeterminate behavior with no retry, replacement, or review output; and
- an eight-image plan with no premature `anchors.json`.

If a test fixture itself is malformed, repair it narrowly and document the reason. Do not loosen an
assertion, introduce a skip, or change a fixed requirement to turn the suite green.

## Implementation guidance

Follow the existing B2 production patterns rather than inventing a second image system:

- `compileImageRequest` for exact GPT Image 2 manifests;
- `FilesystemRecoveryArchive`, `FilesystemImageDispatchJournal`, and `DurableImageDispatcher` for
  one-dispatch semantics and recovery-before-review;
- `canonicalJson`, `digestJson`, and immutable review writes for deterministic evidence;
- the argument/dry-run patterns in `b2-visual-study.ts` and `b2-visual-study-b-v2.ts`;
- honest `requestedModelSnapshot` evidence and `servedModelEvidence:
  "unavailable-from-image-api"`; and
- no undocumented provider idempotency header, automatic transport retry, or `input_fidelity`.

Keep the new module focused on this one candidate. A reasonable name is
`src/server/images/b2-continuity-stage1.ts`. Do not generalize the later eight-image sequence into a
framework before those stages need it.

Materialize review bytes and their JSON report only after the journal reports the exact operation
completed and its external recovery proof matches the returned output. A stable rerun may use the
durable completed evidence but must make zero provider calls. Missing usage-derived cost evidence or
an estimate above `$0.05` must withhold review publication. Rejected or indeterminate operations
must publish nothing and must never be silently replaced.

## Checked-in documentation to add or update

- Add `content/shape-of-time/visual-continuity-plan.md` with the concise exact eight-image plan above,
  staged reference dependencies, human-review gates, and scope boundaries.
- Add `docs/qa/2026-07-19-b2-continuity-stage-1.md` recording:
  - the intentional red commands and failure reasons;
  - exact request manifest and dry-run study digest;
  - fixed request identity, archive, review root, model snapshot, settings, zero references, one-op
    maximum, `$0.05` ceiling, and pricing provenance;
  - the future live command as **not executed**;
  - `Provider calls executed: 0` and spend `$0` for this task;
  - exact focused test/type/lint/diff-check commands and results; and
  - judgment `PENDING DRY-RUN INSPECTION` or, after the exact output has been inspected in this task,
    the narrowly accurate `DRY-RUN READY — LIVE CALL NOT EXECUTED`. Never call B2 complete.
- Update `HANDOFF.md` accurately: Treatment B remains human-approved at medium scope; Stage 1 harness
  and eight-image plan are prepared; no Stage 1 provider call or new spend occurred; continuity and
  anchors remain pending; the single next action is independent inspection of the exact dry run
  before a separately authorized live execution.

Do not edit `content/shape-of-time/visual-bible.md` or
`content/shape-of-time/visual-direction-candidates.md` unless a contradiction blocks the harness;
if one does, report it instead of silently changing approved authority.

## Verification

Use the pinned runtime, not the host's default Node:

```bash
mise x node@24.18.0 -- pnpm exec vitest run --project unit \
  src/server/images/b2-continuity-stage1.unit.test.ts \
  src/server/images/b2-continuity-stage1.orchestration.unit.test.ts

mise x node@24.18.0 -- node --test scripts/verify-b2-continuity-stage1.test.mjs
mise x node@24.18.0 -- pnpm run typecheck
mise x node@24.18.0 -- pnpm run lint
git diff --check
```

Then run the dry-run only and inspect the complete canonical JSON before recording its exact digest
and manifest digest in QA:

```bash
mise x node@24.18.0 -- pnpm exec tsx src/server/images/b2-continuity-stage1.ts --dry-run
```

Do **not** source an API key. Do **not** run any live arguments. Do not write into either external
root. Do not run the full integration/browser gate unless your changes unexpectedly cross those
boundaries; focused unit/content/type/lint/diff evidence is the requested handoff.

## Prohibited actions

- No OpenAI or other paid provider call.
- No mutation of `/Users/ratpartyserver/git/shape-of-time-b2-recovery`.
- No mutation of `/Users/ratpartyserver/git/shape-of-time-b2-review/continuity-v1`.
- No `anchors.json`, no anchor approval, and no use of an unapproved candidate as a reference.
- No image generation through another tool.
- No Railway action or deployment.
- No commit, push, merge, rebase, stash, or cleanup.
- No claim that continuity or B2 has passed.

## Deliverables to report

Return a concise handoff containing:

1. every file created or changed;
2. the exact Stage 1 study digest and request manifest digest;
3. the exact dry-run command and confirmation that it performed zero provider calls;
4. focused test, content test, typecheck, lint, and `git diff --check` results;
5. confirmation that external recovery/review roots, Railway, and `anchors.json` were untouched;
6. Stage 1 spend for this task (`$0`); and
7. the single next action: independent inspection of the exact dry run before any separately
   authorized one-call execution.

Do not commit or push. Leave the implementation in the shared B2 worktree for the coordinating agent
to review and integrate.
