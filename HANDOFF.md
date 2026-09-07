# Handoff

## Latest instruction — buffer PAUSED; GitHub handoff

The author paused the 40-request buffer to prioritize usage credits. Do not submit further requests.
.local/reader-buffer-40/hold is present. Request dfc0bd14-e86b-45a4-9edb-b5969c9e4d1b was already
submitted; preserve and reconcile it, never duplicate it. See operations/reader-buffer-40/README.md
for the tracked checkpoint/driver. The remaining 39 submissions await explicit resumption.
This instruction supersedes the active-run wording below. README/SPEC/PLAN are updated for handoff.


## Active work — F11 reading buffer

The author now explicitly authorizes 40 ADDITIONAL reader requests: 20 core continuations and
20 across reachable side stories, to defer cold-generation waits for new readers. This supersedes
the blanket no-sampling restriction ONLY for this new run. Do not resume the old review-second
driver or change its hold. New durable ledger/driver: .local/reader-buffer-40/. See PLAN.md F11.
Keep Astra medium and the current content. Initial budget: $13.993545 spent, $78.664460 remaining.
No generated text, imagery or narrative instructions are being replaced.


## Current follow-up — F10

The cover uses the root book’s first published illustration (Jay and Tan at the shop counter).
Desktop places it beside the title; mobile places it below “A love story.” The full composition is
uncropped. Actual local desktop/390×844 checks passed: image 338×225px on mobile, no horizontal
overflow, and Enter opens The Counter. Final checks/deployment: .local/cover-release.json.
Client-only; medium, content and reader history remain unchanged. See PLAN.md F10.
No generation or automatic sample was requested.


## Latest interface work — F9

Literature-first interface copy, demonstrated text/image selection in the guide, and verification of
browser-profile-local reading history are implemented and locally walked through. All 46 tests,
type checking, lint and build passed. See evals/reader-interface-2026-09-07.md and the final
deployment/hold receipt at .local/literature-release.json. No accounts or cross-device history exist. Client-only;
retain Astra medium, existing content, and the stopped automatic sample. See PLAN.md F9.


## Latest override — Astra medium

The author explicitly requested medium effort and a one-time exemption from resetting the book.
Keep all current content and memory. F8 in PLAN.md changes the shared setting to medium;
tests/receipts/astra-medium-transition-2026-09-07.json records both mechanisms and the boundary
(60 existing operations, 9 publications). The medium pin is
21f659fcad3e8b385a7f72e60f892761c34fc95f86f9075752590ac57451ad90.
.local/medium-release.json records the final deployment verification and released hold. Earlier xhigh UAT and pin
statements below describe the pre-switch state, not the current effort after this release.
The automatic sample remains stopped.

## Current purpose and authority

Build The Shape of Time as a world exploration harness producing sustained, coherent novels nested
inside novels, with both text and imagery. The human user is the author; people exploring are readers;
the overall system is the book. Readers choose sources to explore, never direct plots. Give the
creative agent context, memory and tools, with freedom to investigate, create, revisit and develop.

The text-only infinite-book was a success and remains the experiential baseline. Keep its recovered
world and original writing guidance. The failed illustrated prototype and earlier generated attempts
are historical evidence, not architectural or creative authority.

**The automatic 20-request sample is stopped.** Do not restart `.local/review-second/run.ts`, remove
its hold, or submit more sample requests without a new instruction. Actual reader requests and ordinary
preparation remain enabled. The four explicit requests below were necessary interactive UAT, not a
resumed sample. Do not launch an extended literary evaluation or automatic refinement; the author
will assess the fiction.

**Every new attempt starts empty.** AGENTS.md preserves the author's exact instruction. Before
activating a changed creative process, privately preserve the previous attempt with its mechanism,
source and usage evidence, then pin an empty edition. Never seed it with earlier generated fiction,
images, notes or session memory. Reader-interface fixes alone do not create a new creative attempt.

## Current position — F7 implementation and reader UAT complete

PLAN.md section 11/F7 is implemented. The prompts invite developing plots, consequential scenes,
foreshadowing and online narrative pull while retaining quiet, descriptive richness and natural
conversation. Side narratives are novels with independent lives. These are invitations to the
agent's judgment, not beat schedules, quotas, deterministic literary verdicts or compulsory reviews.
The earlier image/text agreement, image frequency and ethnically ambiguous Jay/Tan nudges remain.

The actual walkthrough reproduced and repaired the stuck-opening failures, reference-image upload
failure, disappearing empty-search field, keyboard focus issue, stale mounted shelf, unwanted panel
on return, and misleading waiting/paused controls. Reader direction is rejected by both UI and API.
First publication enables entry while the creative request continues. Saved requests recover without
another purchase. The first-use controls guide is implemented and tested.

All 45 mechanical tests, type checking, lint and build passed before application deployment. Actual
UAT covered Begin, text selection, whole images, image regions, first-publication entry, warm entry,
reopening visits, two-level returns, paging, keyboard, type size, narrow reflow, bookmarks, search,
pending discoveries, actual local connection failure/recovery, background preparation and Continue.
The report labels earlier local/preserved-attempt evidence separately from fresh production results.

Detailed evidence: [reader UAT report](evals/reader-uat-2026-09-07.md).
Final scope, models, mechanism and accounting: [receipt](tests/receipts/reader-uat-2026-09-07.json).
All 7 published assets passed the final production HTTP check and were viewed in the reading interface.
Every provider operation matches the edition's mechanism. No current operation is uncertain.

## Live book and code

- Site: https://shape-of-time-production.up.railway.app
- Active worktree: `/Users/ratpartyserver/git/shape-of-time-agentic`, branch `codex/agentic-world`.
- Normal checkout: `/Users/ratpartyserver/git/shape-of-time`, branch `main`.
- Functional application revision: `c1c40d99706a155a09fef7f9d614d1c625f8014b`.
- Verified Git deployment for that code: `09f0e21e-2b00-48d3-b774-f9de96d99dbd`.
- Final follow-up changes are documentation/receipts only. Read `/healthz` for the current deployed
  Git head; such changes do not alter the pinned creative mechanism.
- Production schema: `world_reader_20260907_b`, initialized empty at `2026-09-07T03:57:03.265Z`.
- Pin: `3b1a00a472d152cf481940407ded7116d0c86a1090f99ffa9dc07d8745f10d2c`.
- Models: GPT-6 Astra at xhigh; `gpt-image-2-2026-04-21`. No fallback or reduced effort.
- Generation and preparation are enabled in Railway. Local `.env` points at this schema with
  generation disabled, for diagnostics. Never print or commit its credentials.

The book contains three works, nine published sections and seven illustrations at the final receipt:
The Shape of Time, Three Blue Lines, and The Early Batch. All derive from this single pinned attempt.

| Actual UAT request | ID | Result |
|---|---|---|
| Begin | `3fdbd099-1a96-4e15-8b77-ead5859ee013` | Completed; root work `work-c9d164ad62fcbc3b4627ed165ec84eed` |
| Whole-image exploration | `0bcecbdf-0df2-446e-9376-336d87e9c216` | Completed; Three Blue Lines `work-c989cdfd80a48e2aa32cfd9517b326b1` |
| Image-region exploration | `06d74e83-b754-4455-84f6-4cff00876406` | Completed; The Early Batch `work-1829a8ae7c5690472d620b886f48d787` |
| Continue | `816026d0-0012-4a6f-b6ec-5e3228078a4c` | Completed; appended two illustrated root passages |

Ordinary preparation `adf28fd4-705d-4cc5-b0a7-42149f5b507a` published the illustrated After Nine
passage before Continue was requested. The reader entered it with Right and opened its image.
Preparation `acbb9829` yielded to the final explicit request. A later preparation `b875ed01` chose
an optional contextual critic; it settled after QA reading ended. No operator literary study was run.
Stale queued preparation remains available for a future reader; it does not execute without recent
reading. Do not treat those saved opportunities as a broken queue or restart a sampling driver.

## Costs and preserved attempts

The final fresh-attempt spend is **$13.993545**, with **$78.664460** remaining in its $92.658005
allowance. Previous committed spending, including preserved uncertainty, is $274.0930245; combined
committed spending is **$288.0865695** against the recorded $366.751030 combined allowance. No
allowance increase was needed for this UAT pass. Later actual reading can incur additional normal costs.

The [draft archive index](archive/reader-attempts/README.md) points to every preserved attempt and
its tracked checksum receipt. The second attempt's ambiguous native-renewal timeout
`9d5eeddd-f356-45c8-bfb4-f484aeb7fda9` retains its $9.7726125 reservation; no provider ID was returned,
and it must not be replayed or reclassified as zero cost. It belongs to frozen schema
`world_reader_20260906_b`, not the live edition.

The third attempt, schema `world_reader_20260907`, is preserved at
`.local/reader-third-preserved-2026-09-07`, with all 10 table and 31 object checksums verified.
Its image operation `5f2ac817-f5dd-4d5f-9399-d2edea4a3696` failed in the SDK's local FormData check
before HTTP submission. The exact failure was reproduced, its original row preserved, and its actual
cost reconciled to zero without replay. That draft's completed spend was $3.407022. Full private
allocation/reconciliation evidence is `.local/fourth-edition-allocation.json`.

The transport now pairs Undici fetch and its global FormData implementation, with a finite 20-minute
header/body/SDK timeout and no automatic retries. Actual reference-based uploads succeeded repeatedly.
Raw provider results and stable operation identities remain preserved before interpretation.

## Limits and next work

Cold first reading still took about 5–9 minutes in this pass, including queue time. The final Continue
produced its first new passage after 8 minutes 36 seconds and continued developing another part.
The global creative session is serial, and agent-selected image-first work adds latency. Early entry
and preparation function, but this is not a claim of instant cold generation or an ideal latency.
Preparation was observed from a frontier; it proves the feature works, not that its entire delay is
hidden at ordinary reading speed.

The final append retained the same passage with a 12-pixel adjustment. Exact nested source returns
and reopening at the saved passage passed. The report gives measurements rather than claiming
pixel-perfect behavior in every circumstance.

The author should now read and assess the fiction. The walkthrough establishes mechanical behavior
and bounded source continuity, not novel-length literary success. Do not prescribe another redesign,
reset, paid sample or critic study without a new instruction. Keep the original world, agent freedom,
text/image coherence and fresh-attempt rule as the governing constraints.

## Operations and release safety

Railway project: `8b20e07d-c256-44c9-85be-d1c7e50ac83d`; production environment:
`82e1c3e8-e2c1-4023-afa2-b17dc6dc6ec3`; app service: `39bf3c12-b426-40ce-836a-2839ea1bc213`.
Use the Railway skill and deploy source only through passing pushes to main. Never use `railway up`
or a manual redeploy to bypass Git integration. No Docker is needed. No local API, Vite server or
sample driver is running.

The development pump holds its advisory lock across the whole eligible queue, not just one request.
For a safe release, close QA reading first, allow in-flight tool work to settle, then acquire the
release lock. Do not interrupt a paid image or critic call. Always release a temporary hold afterward.
The final documentation release uses helper PID50965/session63033; completion requires its release,
verified from its exit. `.local/reader-uat-release.json` records the final deployment and release of
that hold. Do not blindly reuse or kill a PID from this document; verify its command and current state.

All QA tabs were closed before settlement. Leave the fresh opening available for the author after
release, with the guide available through its visible control. The original old user tab is historical.
Private step-by-step UAT checkpoints are retained at `.local/uat-handoff-checkpoints-2026-09-07.md`.
After compaction, read this file and PLAN.md section 11/F7 before acting. Maintain this current handoff
rather than adding another status file or competing plan.
