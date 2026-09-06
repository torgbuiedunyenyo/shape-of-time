# Handoff

Updated September 6, 2026, around 05:09 UTC. After compaction read this and PLAN.md P1–P5.

## Purpose

Build a world exploration harness producing sustained, nested image-and-text narratives that remain
coherent within and across works. Successful text-only infinite-book is the experiential baseline.
Give the author original context, persistent memory, tools and freedom. No fixed narrative lengths,
mandatory fact graph, deterministic literary verdicts or compulsory write/image/critic sequence.
PLAN.md is the sole queue; SPEC.md describes the product and EVALS.md the evidence. Single development
agent; no subagents or goal tool. The user's implementation and production replacement are authorized.

## Immediate position

The first root continuation after native context renewal is running:

- Intent: `f9d2a6d8-74a9-408b-ae77-1cb2dcb909bb`.
- Root work: `work-5213e951303bfbdd2f555090ca38fa93`.
- Draft: `root/002-the-bus-home.md` revision1, document `5c9190d8-62eb-416d-919a-a5eab08cf8b7`.
- New image: `img-2258c358-cbfd-4408-90ee-2eefe33c8077`.
- Critic review: `7881cf68-db0d-48a5-ab45-71a6c228871f`.

Builder fully read the draft/review and viewed the image. The scene continues the noodle evening:
Jay and Tan discuss their lives, leave for a bus stop, disclose family/class differences, exchange a
visitor relay address, arrange Tuesday swimming and go home. The critic found real progression,
source/image consistency, and too much corrective subtext; it labeled a sister-message callback as
ambiguous, not a definite contradiction. The author has that review. Continuation publication `e7eb59f4-58f8-4c3e-b090-859de5018800` now contains revision2
(document `601c5eb6-a115-455f-8fb0-8ed23811e8d4`), whose changes the builder read. The author continued after publication and is now creating a Sunday scene with Jay and his sister
Dee (her driving practice). Active image operation `69ee9ed6-7087-4e51-832b-5e48752dc269` began05:14UTC.
The release-lock helper76546 is still waiting; it must not be treated as held until it says so.
**Inspect fresh status. Do not submit another request, duplicate review, renewal or restart.**

Local changes are ready for release after the author finishes. All **25 tests, typecheck, lint and
build passed** in gate session19993. Changes are being committed as a checkpoint; they are not yet deployed:

- Native context renewal automatically runs **between new reader requests** above250k measured input
  tokens. It preserves the complete canonical window and full originals, shares the existing allowance,
  reuses a saved operation on resume, and pauses uncertain outcomes. A very large individual author
  turn still pauses at the880k dispatch guard; no automatic renewal inside a turn yet.
- Reusing a completed renewal no longer rewrites its completion timestamp. Real DB regression first
  reproduced that defect, then passed.
- A real browser defect was reproduced: selecting an image to explore hid a pending continuation's
  status. Exploration and continuation now have separate state and reload/polling. Production QA of
  this correction remains after deployment.
- New receipts/report: tests/receipts/astra-native-renewal.json and evals/native-renewal-2026-09-06.md.
  Reader/recovery report also updated.

Release-lock helper `.local/hold-release.ts` is running in exec76546, waiting to acquire or
holding the author lock. Check its output. Once held with no active operations, push passing work,
verify deployment, then stop76546 to release author work. Never deploy through a
direct image purchase. The PREPARATION_ENABLED variable has been set true with --skip-deploys; the running revision
still has it disabled until the next deployment. When ready for its live
observation, set `PREPARATION_ENABLED=true` with Railway `--skip-deploys`, then activate it with the
passing Git push. No Docker, local generation worker or staging is needed. Continue the meaningful
root/nested corpus after release; don't stop at mechanical success.

## Repositories and production

Active: `/Users/ratpartyserver/git/shape-of-time-agentic`, branch `codex/agentic-world`.
Normal: `/Users/ratpartyserver/git/shape-of-time`, clean main fast-forwarded to b920956.
Remote/deployed SHA: `b92095633cd5a7e05fc239d27bfdcef3c2e1e2f2`, /healthz verified.
Successful Git deployment: `3323a06b-1550-4aac-b1a3-76a2772ab5ca`.

Preceding3a10a6c introduced preparation, saved discoveries, exact source return, quiet publication
refresh and reuse of already-available continuations. b920956 fixes bookmarks losing their containing
visit's return route. Read the local diff before committing the newer changes described above.

Site: https://shape-of-time-production.up.railway.app

| Resource | ID |
| --- | --- |
| Railway project | `8b20e07d-c256-44c9-85be-d1c7e50ac83d` |
| Production environment | `82e1c3e8-e2c1-4023-afa2-b17dc6dc6ec3` |
| App, shape-of-time | `39bf3c12-b426-40ce-836a-2839ea1bc213` |
| Postgres | `294c4570-91e2-4bb2-8639-4a802a475ab8` |
| Assets bucket | `545eb437-32e7-4100-a154-3cffd145fac1` |

DB proxy: iriguchi.proxy.rlwy.net:41493. Active schema `world`; tests `world_checks`.
Ignored.env contains selected credentials with local generationfalse; scripts/configure-local.py
refreshes them without printing secrets. Never print complete environments, configuration or headers.
Railway and OpenAI skills were read; current Context7/official docs consulted for the stack and APIs.
Use passing Git pushes to main. Never railway up/manual redeploy/Deploy Latest to bypass Git.

The OLD production implementation is already gone: eight old public tables, four images and old
Anthropic/asset-driver variables removed. The current corpus is NEW evaluation evidence; preserve it.
User explicitly authorized production replacement, no old users/data/compatibility to preserve.
Cleanup checkpoint2f0ae24 and retired runtimee1a3dec have tagged archives with all167 source checksums.
Retired art-thing remains read-only. Preserve other historical worktrees/refs and every session file.

Initial combined provider allowance is **$150**, including text, images, criticism and renewal; at
most$20 for provider-contract investigations. Latest observed commitment including active reserves
$50.754575, remaining$99.245425, unknown0. Query fresh. Renewal$6.74581; first root$4.582698;
predecessor calibration$1.02882. No unlimited spending or silent allowance increase.

## Actual corpus

One author session throughout: `5fee6506-857a-48c1-af70-2f0336004de0`. No developer creative edits,
manually authored nested premise, spliced prose or manual publication. Builder has read all opening
drafts/reviews and all final illustrations below. Full provenance and agent notes are in the archive.

| Work | Work ID | Published material |
| --- | --- | --- |
| The Shape of Time | `work-5213e951303bfbdd2f555090ca38fa93` | `root/001-the-counter.md` rev2, pub `617be2fc-17c4-479f-9ef9-541701cc70fb` |
| Under the WASH Sign | `work-42dc798990ed66ca06ff6d776bf67acb` | `wash-sign/001-offered-route.md` rev2, pub `747ca3cf-7d62-432b-9fed-d856ea173a5a` |
| Tere & Audrey | `work-e8aad2c5c7442b4d0df413d8cdc76eea` | `tere-audrey/001-the-cover.md` rev1, pub `0538d34d-a846-431c-a169-e99773153c80`; `002-the-inside-pages.md` rev2, pub `342b69a2-7997-404e-877c-9ba7d7a752f3` |

Opening intents are DONE: root `4c40ef0e-37b3-47f4-b4c8-6648667aaf2e`, child
`8e98c0e8-c437-4ebc-93bd-06b86ce2c37d`, grandchild `85cab9ea-5c51-4daf-a245-7c476180e16c`.
Approximate published words including alt text:3370+4034+2012+2296. Size is descriptive, not a quota.

Root: Jay gives Tan a$4.75 clef against his wage-deducted tab, they repair the cooler, she returns six
days later on Thursday, and they go for noodles. Opening ends as food arrives. Images are counter
`img-2e65d7c4-9eb6-4495-a8e7-ae9386e6efa5`, corrected lounge
`img-6dbbc75c-8ebf-48b3-ae1f-7fa940229810`, dinner
`img-40cce6d2-9c38-4ef3-bf1d-c41ee078aa65`. Superseded wrong-wrist study retained.
Agent notes: notes/root-continuity.md. Current continuation details above.

Child: actual reader rectangle selected the attendant/travelers in root block
`b-01c5a2ee18a86f74ed2a` (x.6382,y.4021,w.2895,h.2928), with no angle. Lena's first-person account
concerns misclassifying Dimas Serrano's inadmissible route as refused, denying his hotel/rebooking.
Bo finds a guided legal route via Reed to South Basin, Ames helps within constraints, Lena admits
fault and stays overnight, and guide Saye arrives at7am. Dimas's departure/arrival are not established
at the ending. Tan is an unnamed visitor from Lena's perspective. Dimas came for sister Tere's wedding
to Audrey; he has a yellow-bordered program, but has not received the photograph with both brides.
Notes: notes/wash-sign-continuity.md. Three images/revisions reviewed; source IDs are in the notes.
Prepared root→child link: `opening-7f11eed9dd8cc410db8dba57ee484122`.

Grandchild: actual drag selected the folded-program quote, no angle. Source child block
`b-0efd732eb9f190ccb30c`, offsets199–307. Close third around Audrey: Thursday hall preparations,
ceremony, portraits and start of dinner. Tere in blue, Audrey ivory/orange, daughter Nina31 officiates,
Luz plays music, Rafi photographs. Couple lived together four years. Dimas is first photographed with
Tere, then called back with Audrey, honoring the parent account; no photograph delivered or later
journey resolved. The author corrected an unwanted date and Dimas's head in a ceremony study before
criticism. Critic `5f7ea6c3-6b56-42e7-ac87-95852982facd` found consistency and recommended a more
particular ceremony reading and less announcing narration; revision2 addressed both.
Final images: kitchen `img-54a14f81-8ccc-499e-804a-2483d94cf869`, corrected ceremony
`img-87a5bee8-7243-47bd-b968-2bb789b018e2`, portrait `img-d6e24472-87e6-489e-a5f8-e2d5540d5826`.
Notes: notes/tere-audrey-continuity.md and notes/library-index.md rev2, both fully read by builder.
Prepared child→wedding link: `opening-6033a62b2f20362b9a950b7cbbc73bcb`.

## Browser and reader evidence

Production journey root→child→grandchild→child→root completed after font changes, reload and390px
reflow. Return found the exact program passage and selected lounge-image region. Sticky Return stays
visible. Discoveries retains source quotes and resumes its own visit. New publications appear before
the author finishes. Three adjacent paragraphs could be selected as one exact quote without buying.
Bookmark bug was reproduced/fixed: on b920, Save place→library bookmark preserved the nested visit,
and its Return reached the parent/program then root/image. Current local continuation-state fix
still needs production QA. See evals/nested-reader-and-recovery-2026-09-06.md.

Observed first-publication waits: root27m14s including initial retrieval repair, child30m06s,
wedding about9min. N=3 different circumstances, not a benchmark. Preparation still needs live testing.

CUA production tab2 is root visit `0f84838d-2093-4b02-a91a-87f2934fcefb`, near its frontier.
Child visit `c92b10b6-71bc-46a9-a591-a4f6158cda14`; current nested wedding visit
`f7ce6c60-d964-49d9-95ec-029a80499ad1`. Earlier wedding visit131daf… and bookmark-created standalone
78da84… remain historical reading records. Pre3a10 visits lack the entered-request marker; their
ready panel can appear once. Enter through the released control once to record it.

Bindings tab/browser/viewport exist. Temporary busScene tab13 remains open; close when finished.
Other image bindings point to closed tabs. Viewport1000x800. Close image tabs before changing viewport;
reset on completion. Evaluate DOM read-only; no fetch/storage mutation. Use coordinate clicks for
sticky toolbar controls because locator.click scrolls first. AX returns diffs; avoid dumping novels.
Local preview API/Vite sessions10249/16038 stopped.

## Renewal, recovery and tests

First native renewal **completed**, stable key `first-nested-renewal-2026-09-06`:
operation `c6f9662c-7255-453b-888a-c869f4de73fe`, encrypted compaction item
`cmp_07d55e4c2e541ade016a9cf28268e887d09cacf53a61125e96`.
235 items became five canonical items plus the original artistic orientation.316643 input tokens,
5506 output, cost$6.74581; next input with tools84287. Same-key replay bought nothing and retained the
same window. Post-renewal Astra accepted it atxhigh/all_turns, retrieved root notes/full original and
viewed the dinner image. See tests/receipts/astra-native-renewal.json and evals/native-renewal-2026-09-06.md.
The native utility exposes no effort setting; don't call itxhigh. Later opaque provider IDs still
depend on retention; do not claim indefinite replay outside a durable renewal/reconstruction path.

Forced restart **really succeeded**, despite CLI error, on31b3217: stop04:42:32.125/start04:42:33.234.
Same operation `de5169c4-6d99-43dc-8b92-20301fb60863` and provider ID completed04:44:48.641, writing
second wedding draft `caa13e11-4f56-48d8-86d3-866524751768` exactly once. No replacement generation.
Receipt tests/receipts/astra-restart.json. Two earlier guarded attempts did nothing. DO NOT repeat it.

First-root backup `.local/corpus-first-reading-2026-09-06` restored exactly to
`world_restore_first_reading` and its S3 prefix, generationfalse (10tables,29ops,4assets,33objects).
Need a NEW full snapshot/restore including current corpus, protocol image blobs and renewed window.
Use scripts/corpus.ts export|restore DIRECTORY. Export requires idle author/no active operations;
restore uses a fresh world_restore_* schema and matching ASSET_PREFIX with generation disabled.

All25 current gates pass against real DB/S3 and mechanical fixtures; no ordinary paid calls or
literary scores. They cover persistence, arbitrary length, publication atomicity, replay, budget,
raw bytes, exact image storage, archive originals, request dedupe/priority, preparation staleness,
source/bookmark routes, independent pending requests and native-window preservation/uncertainty.
Use `mise exec node@24.18.0 -- npx --yes pnpm@11.15.0 gates`. No further gates needed until code changes.

## Sources and remaining scope

Author/critic: GPT-6 Astra xhigh. Images: gpt-image-2-2026-04-21. Full original4512-word world SHA
`e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c`; original main-template essence/prose,
softer exposition preference and approved ink/transparent-color medium. No artistic source changes.
Predecessor calibration is DONE:64 verbatim pages, source/review/assessment under evals/, reviewdoc
`f8c56d9e-14f5-4ea7-9e0f-08b7b3a0db62`. Found amber/first-clef-giver/repeated-departure errors while
distinguishing separate editions and nuanced post-resolution behavior. Don't buy it again.

P1 first root continuation and P2 actual nested return are complete. P3 needs live
preparation and several root/nested continuations with grounded criticism. P4 needs the new corpus
restore. P5 needs substantial connected reading (30–50k study scale, not a quota), distant recurrence,
post-resolution development and continued renewal evidence. P6 needs the final production walkthrough
and honest handoff. Do not declare long-form success from the roughly12k opening corpus. Stay within
$150 and preserve everything already generated.
