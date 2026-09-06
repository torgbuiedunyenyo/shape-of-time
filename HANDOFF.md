# Handoff

Updated September 6, 2026. After compaction read this file and P1 in PLAN.md.

## Purpose

Build an agent-led world exploration harness that develops sustained, nested image-and-text
narratives with persistent context and memory. The successful text-only infinite-book is the
experiential baseline. The agent owns creative sequencing; software preserves work and reading place.
No deterministic literary verdicts, fixed folio lengths, mandatory fact graphs or prose/image pipeline.

## Current position and next action

P0 complete. The first real illustrated root is published and its request finished successfully.
P1 still needs a genuine continuation; P2 is underway with a live image-region child. P3–P6 remain
partly implemented/unvalidated. The author independently made/inspected images, wrote, sought a
critic, revised, published and saved free-form continuity notes. Builder read both versions/review/
notes and viewed all three published images. No manual creative edits or publication intervention.

**Next action:** let child request 8e98c0e8-c437-4ebc-93bd-06b86ce2c37d finish, then enter it through
its existing request in the production reader; read it and select a real source there for a grandchild.
Continue the root and verify the exact nested return. Do not buy duplicate requests/criticism.
The child is work-42dc798990ed66ca06ff6d776bf67acb, **Under the WASH Sign**. Its founding source is
publication 617be2fc-17c4-479f-9ef9-541701cc70fb / block b-01c5a2ee18a86f74ed2a, a real rectangle
around waiting travelers inside the corrected boarding lounge image. No angle was supplied.
Image operation 0577f742-eb8e-4734-b864-c5ba4606f212 was active at the latest check; do not deploy
through an active direct image call. Read current status instead of assuming it remains active.

Root request 4c40ef0e-37b3-47f4-b4c8-6648667aaf2e DONE. Publication
617be2fc-17c4-479f-9ef9-541701cc70fb uses revision 2, document
9094a77f-e863-49f9-8274-230b54d63c03. Root work
work-5213e951303bfbdd2f555090ca38fa93. Author notes document
42999fd2-236a-4f58-9dbd-f4c79e225352, notes/root-continuity.md.

A complete first-root snapshot is at .local/corpus-first-reading-2026-09-06: 10 tables, 29 operations,
4 assets, 33 stored objects. It was restored into world_restore_first_reading on the same Railway
Postgres/bucket with generation disabled. Every restored table and object matched its checksum.
Restore finished; no process remains for that check.

## Worktrees and authority

- Active: /Users/ratpartyserver/git/shape-of-time-agentic, codex/agentic-world.
- Normal checkout: /Users/ratpartyserver/git/shape-of-time, local main fast-forwarded to bf23b57.
- Remote main and deployed code: bf23b5776c0bb8a3047fb353918337e1e1d019b4, verified /healthz;
  deployment 4e2b2e05-cd59-4346-8861-6d1a7e50bc09 SUCCESS.
- Reader implementation now deployed: semantic positions/reflow, image regions/native dialog, bookmarks,
  title creation, page controls, stable book URLs, long-selection request identifiers; image dimensions;
  independent-side-work routing fix; protocol item normalization; native context renewal and operator
  scripts. Tests added. No renewal has run live yet.
- Uncommitted: imageFraction reading-anchor fix; paged archive search honoring source kinds and
  published-revision identity; calibration script; updated plan/handoff and first-reading eval report.
  Full gates passed 14 tests after archive fixes (failure reproduced first). Image checkpoint deduplication is now implemented in providers/protocol.ts and wired into author/
  critic persistence, Astra dispatch, native renewal and corpus export. Exact bytes are stored once
  under protocol_images/SHA; all provider calls hydrate actual data URLs. Full items remain intact.
  Regression failed on the original duplicate-byte persistence, then passed with real S3 roundtrip
  equality. Full gates now pass 15 tests. Paid live contract after this change is NOT yet verified;
  deploy at a safe point and inspect the next actual image-bearing Astra response before claiming it.
  Existing historical requests remain intact. This avoids new duplication; it is not context pruning.
  The real browser reproduced image point drift: 46% of picture at desktop became 88% at narrow
  width. Local preview of the same Railway publication now retains ~46% across resize and reload.
  The apparent font-button drift was an automation artifact: locator.click scrolls the sticky header
  before clicking. Direct coordinate clicks preserved the same paragraph on unchanged production.
  Do not reinstate the rejected font/CSS changes; they were reverted.
- Single development agent. Do not spawn agents. Retired art-thing is read-only history.
- Current queue: PLAN.md; intended product: SPEC.md; literary evidence: EVALS.md.
- Cleanup checkpoint: 2f0ae24, tag checkpoint/agentic-clean-start-2026-09-06.
- Retired app: e1a3dec, tag archive/folio-prototype-2026-09-06 and exact tar/manifest under archive/.
- Original histories, source bytes and other worktrees remain. Do not restore old architecture/scripts.

## Railway and authorization

User explicitly directed implementation/testing on production: no Docker, no staging, no users or
old data to preserve. They reiterated to trash and replace the old implementation. Production is
https://shape-of-time-production.up.railway.app and deploys from passing Git pushes to main.
Never use railway up/manual redeploy to bypass that integration.

Project 8b20e07d-c256-44c9-85be-d1c7e50ac83d (imagery-shape-of-time).
Environment 82e1c3e8-e2c1-4023-afa2-b17dc6dc6ec3 (production).
App service 39bf3c12-b426-40ce-836a-2839ea1bc213 (shape-of-time).
Postgres 294c4570-91e2-4bb2-8639-4a802a475ab8. Assets bucket 545eb437-32e7-4100-a154-3cffd145fac1.
Added Postgres TCP proxy b696fdf7-96a9-43ce-b588-a0ff901e0295 for direct development/tests.

The eight obsolete public folio tables and four old stored images were deleted after replacement.
ANTHROPIC_API_KEY and ASSET_DRIVER were removed. New data lives in world, checks in world_checks;
new objects use matching prefixes. The same Railway resources host the fresh application.

Local ignored .env contains selected Railway credentials, generation disabled for local processes.
The hosted application has GENERATION_ENABLED=true, DATABASE_SCHEMA=world, PROVIDER_BUDGET_USD=150.
Do not print variable values or full environment config. The existing OpenAI key had surrounding
quotes; these were normalized on Railway. Both requested model IDs are available (read-only check).

The implementation go-ahead activates the detailed plan's combined $150 allowance, including text,
images, critique and renewal. $4.582698 completed, $145.417302 remaining, no active reservation or unknown
spend after the first request. Use pnpm inspect for authoritative totals as the hosted author continues.
At most $20 of the combined allowance is for provider-contract investigation. Do not reuse historical
Fable budgets or infer unlimited spend. Dated rates are encoded in provider wrappers; actual receipts
and uncertainty are retained. No extra user approval is needed for this authorized scope.

## Actual deployment and live request

P1a 665d68f4f40f80888274283b43f8372e71b149a9 deployed successfully (485ed367-60aa-4d86-b30e-7151fda7e6d9).
Agent a87ccfa45e6290b1b0b3f22b13eab6c285838b1e deployed successfully (83cd1b78-7a2e-4dda-875e-ea9b8e36e263).
Fix 242c071753bb77d2118344c1ece51e3b11c39762 deployed successfully; the failed intent was resumed once.

The in-app Browser started request 4c40ef0e-37b3-47f4-b4c8-6648667aaf2e using Begin the book.
First operation 966a4fa7-35f4-4a80-8ec3-f0688c3fc2cd started successfully in background.
Provider response resp_07d55e4c2e541ade006a9cdb1c2c2487d0981e9db038b7ee2c completed.
GET with include=reasoning.encrypted_content failed 400: encrypted content cannot be requested for
persisted responses. We retrieved that SAME response with plain GET, persisted it in DB/S3 and
finished its cost receipt. Intent was resumed after the fix deployment; inspect current status instead of repeating resume.

Recovered result: model gpt-6-astra, effort xhigh, effective reasoning.context all_turns; first chosen
tool resources. Usage input 10,070, output 13, reasoning 0; cost $0.10135. The full actual non-sensitive first response is tests/receipts/astra-first-resources.json.

Root work: work-5213e951303bfbdd2f555090ca38fa93, The Shape of Time.
Draft revision 1: 24e83cdd-4e79-494a-923d-4df391c6b82b, root/001-the-counter.md.
Critic: 3cdda498-75b6-4d7b-b3fd-1b9674502560,
criticism/critic-e0849b016f902c8ed559170c23719787.md. Builder read the full draft and review.
Review found absorbing development across the shop encounter/return visit, some overarranged repair
motifs, a few action/prop slips, need for a small temporal anchor and possible wrist-band mismatch.
The author received that critique through its own tool call; no manual creative edits were made.

Actual images viewed by builder and agent: img-2e65d7c4-9eb6-4495-a8e7-ae9386e6efa5 (counter),
img-4bf6ae06-770a-4ecf-873d-c7c7696fc3e9 (boarding lounge; first image supplied as reference).
The agent's next response received actual input_image content and chose view_image crops;
xhigh/all_turns confirmed. The actual revised departure image img-6dbbc75c-8ebf-48b3-ae1f-7fa940229810 and dinner image
img-40cce6d2-9c38-4ef3-bf1d-c41ee078aa65 are published alongside the counter image. The discarded
wrist-band version is retained as a study. All operations completed; no live image call remains.

Provider constraint supersedes the plan's assumption: stored/background responses must omit
reasoning.encrypted_content inclusion. Every returned protocol item is retained, but future opaque
reasoning IDs without encrypted_content depend on provider retention. Do not claim indefinite
self-contained reasoning replay. Before long-lived reuse, implement explicit context renewal with
full originals/agent notes available and retain the full returned canonical compaction window.
No change to Astra/xhigh. Current runtime refuses overlarge context instead of truncating silently.

## Implemented paths and checks

Fresh pinned Node 24.18.0/pnpm 11.15.0 TypeScript app: React/Router/Vite reader, Hono API,
Kysely/pg persistence, S3 storage, OpenAI SDK 7.10.0, Markdown structural compositions.

Editions/works, revisioned documents, immutable publications with stable block IDs, image assets,
intents, full sessions, operations, tool receipts and prepared openings. Missing images prevent
publication atomically without deleting drafts. Duplicate document/publish/intent operations reuse
saved effects. One DB lock serializes the author. Failed/paused work blocks later requests pending
reconciliation, avoiding context mixing.

Tools: archive list/search/read, versioned notes/drafts, create/reopen work, publish, generate/edit
GPT Image 2 with agent-selected references, actual-image viewing/crops, optional independent Astra
critic with read-only archive access, prepared openings, shared resource budget. Both author/critic
load all four prepared artistic sources. No fixed creative sequence or mandatory critic gate.

Provider ops reserve before dispatch, save raw response text before parsing, keep background IDs,
record actual/unknown cost, disable SDK generation retries and replay full output/tool protocol.
Direct image results are stored before decoding/metadata acceptance and returned as actual image
function output. Completed image replay tested against real S3 without another provider call.

Fifteen tests passed on real Railway Postgres/storage, plus typecheck, lint and production build:
unrestricted >3-paragraph publication, atomic missing-image failure, stale revision checks,
request/tool idempotency across interruption, shared uncertain-cost reserve, actual saved Astra
response replay, S3 image fixture replay and actual usage arithmetic. Fixtures are mechanical;
none are literary verdicts. Full gates pass including long-selection request identity. Native renewal is implemented but has not been bought or
validated. It preserves the full returned canonical window and reattaches original artistic sources;
the standalone compaction API exposes no reasoning-effort setting, so do not claim confirmed xhigh
for that utility. Author and critic remain xhigh.

Reader has flowing typography, text-size controls, image enlargement, text/whole-image exploration,
full per-visit browser storage, return links, persisted cold request restoration and prepared links.
This code is preliminary. Actual nested/reflow behavior remains to verify and fix; don't call P2
complete. In-app Browser showed the calm new library and initiated the real root. CUA binding `tab` is production tab 2 at /read/0f84838d-2093-4b02-a91a-87f2934fcefb. Its child
request is saved; reload restores the pending opening panel if it was dismissed. `qa` (local tab 5) was closed after successful image-position QA. `childImage` is temporary tab 6
showing the first nested illustration, which builder inspected. Browser binding `browser`, viewport
capability `viewport`; override was 390x844 on qa; selected image tab currently uses normal dimensions. Reset before finishing.
Viewport applies to the selected tab, not every tab. Close qa before resizing production.
Use direct coordinates for sticky header buttons (after screenshot), not locator.click, which scrolls
first. `readPlace` and `imagePlace` are read-only DOM helpers in CUA. Published story/AX text already
read; use emit:false and compact slices for repeated state to avoid printing the whole chapter. Temporary local API/reader preview processes are running (exec sessions 10249 and 16038), generation
  disabled; they read the actual Railway corpus. Stop them after the pending reader fix is verified.

## Artistic source and models

Text/creative agent/initial critic: GPT-6 Astra xhigh. Image snapshot: gpt-image-2-2026-04-21.
No model/effort fallback. Use content/shape-of-time/SOURCE.md and all selected inputs in full:
world.md, world-essence.md, prose-guide.md, visual-direction.md. Original infinite-book wording is
preserved. World.md is the exact 4,512-word corrected historical body, SHA-256
e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c. Later failed-successor prose guide
is retired. Permit useful natural explanation without didactic monologues. Approved medium remains
inked reportage with transparent color; no fixed image density or approval sequence.

## Remaining work after immediate recovery

First genuine illustrated root, reload, continuation and contextual criticism. Actual image feedback
contract evidence. Then generated child and grandchild from encountered material, prepared/cold
entry and exact return after reload/font/viewport changes. Verify image-region UI, explicit title
creation distinct from search, bookmarks, semantic reading anchors and paging controls.
Read actual work before scaling. Implement explicit renewal and assess distant continuity/visual
identity at substantial length; no long-form success claim from an opening. Record full runs,
critic calibration and artistic revisions. Continue recovery and restored corpus/media checks on
production, then leave a usable release/handoff with genuine limitations.

Skills read: OpenAI Docs (search then fetch), Railway (deploy/config/request references), Context7
for Kysely/Hono/React Router/Marked/S3/Sharp. No current tool cell or local server process is needed
for the hosted worker. Inspect pending exec session/deployment status after compaction if relevant.


## Current independent evaluation

The funded readonly Astra xhigh calibration completed successfully; no local process remains and
there is no reason to run it again. Script scripts/calibrate.ts uses the complete verbatim packet at
.local/critic-calibration/source.json, SHA-256
9c0a7452d6b81c1edae64d374b0303a5342170bd03f2b6aa4f4c5dc2861a6076.
64 preserved predecessor pages: public root 1–8 and 80–100; public Mrs. Chen 1–20;
main root 1–2 and 140–152, with separate edition/deployment provenance. The critic was not told
our earlier diagnoses. Review output .local/critic-calibration/review.md, also preserved with the source packet and builder
assessment under evals/. Cost $1.02882. Session
critic-ebba9972344eaf95bc437ce6ec807a1d, completed operation a28ddbbe-ae65-4361-b823-a88a8011e9d6.
The review independently identified the expected meaningful recurrence, two actual reversals,
distinct-edition variation and late-arc differences, with useful uncertainty rather than blanket
verdicts. Builder read it in full; see evals/2026-09-06-critic-calibration.md.

Child draft dcb7f8e4-5559-4119-8e22-869ce7fbbdb2, wash-sign/001-offered-route.md revision 1,
was read fully by builder. First person Lena, a terminal attendant whose mistaken declined-route
record strands Dimas Serrano; colleague Bo helps find an admissible guided route. Saye is the guide.
Dimas returned for sister Tere's wedding to Audrey; the folded wedding program and photograph
conversation are actual generated material, potentially worth following once the child is published.
Do not pre-author that grandchild. One child image img-0577f742-eb8e-4734-b864-c5ba4606f212 is saved.
The author chose its own contextual critic, session critic-48027f3bbe8efc4d8e31163738078276;
that review is separate from the predecessor calibration. Saved child review is
fcd8432e-15e0-4a76-a8b0-74678b63d9fb, read fully by builder. It found sustained fiction, distinct
professional culpability and useful procedural stakes, but suggested fewer interpretive afterthoughts
and accounting for Dimas's food. Author is responding and plans two further child illustrations.
No child publication existed at the latest check. Inspect live status before deploying.
