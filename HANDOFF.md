# Handoff

Updated September 6, 2026, around 04:56 UTC. After compaction read this and PLAN.md P1–P3.

## Purpose

Build an agent-led world exploration harness: sustained, nested image-and-text narratives coherent
within and across works. Successful text-only infinite-book is the experiential baseline. Give the
agent full original context, memory, tools and creative freedom. No deterministic literary verdicts,
fixed lengths, mandatory fact graph or fixed prose/image/critic workflow.

## Immediate next action

Grandchild Tere & Audrey request85cab9ea-5c51-4daf-a245-7c476180e16c is DONE. Second publication
342b69a2-7997-404e-877c-9ba7d7a752f3 contains revision2, fully read with actual final images/critic.
Agent notes b4ccaaaa-4929-40c0-9994-e222f504d8f2 and library-index67b6dcac-85ed-4e40-bc26-0bd5ff1c6018
fully read. Prepared source link opening-6033a62b2f20362b9a950b7cbbc73bcb offsets199–307.

FIRST NATIVE RENEWAL NOW RUNNING, local exec90480; operationc6f9662c-7255-453b-888a-c869f4de73fe,
stable key first-nested-renewal-2026-09-06. Do not submit another renewal or reader request until
its result is inspected. It holds the author lock. Originals remain saved. No forced restart again.
The earlier forced restart at04:42:32 succeeded despite CLI error; same background Astra operation
de5169c4-6d99-43dc-8b92-20301fb60863 completed04:44:48.641 and wrotecaa13e11-4f56-48d8-86d3-
866524751768 once. Evidence tests/receipts/astra-restart.json.

3a10a6c176f72abc541d7c045c97bbf2aa4f1252 is live, Git deployment
8008c018-7235-4269-af19-ec28b689af0b SUCCESS; health verified, normal main fast-forwarded.
Reader grandchild→child exact program source→root image region completed in production390px after
reflow/reload. Existing pre-release requests needed one entry to record openedVisitId; subsequent
return correctly leaves the source panel closed. Library shows saved discoveries; more bookmark,
resume and prepared-link checks remain. CUA tab2 is currently library; temporary image tabs closed.

After renewal completes, request genuine root continuation. Do not queue before renewal. Preparation remains
disabled until intentional live observation. P1 continuation, sustained P3/P5 corpus, full new restore
and final release evidence remain. No claim of long-form success from these openings.

## Worktree, Git and deployment

- Active /Users/ratpartyserver/git/shape-of-time-agentic, branch codex/agentic-world.
- Normal /Users/ratpartyserver/git/shape-of-time, clean main fast-forwarded to3a10a6c.
- Remote/deployed main **3a10a6c176f72abc541d7c045c97bbf2aa4f1252**; /healthz verified.
- Git-integrated deployment **8008c018-7235-4269-af19-ec28b689af0b**, SUCCESS.
- Preceding bf386dd stores protocol image bytes once, paged archive lookup, calibration evidence,
  normalized image reading positions. 31b3217 adds actual reader wait/publication context to author
  tool outputs and a continuation preflight to load existing new material before buying more.
- Single development agent. No subagents. Retired art-thing is read-only history.
- Sole queue PLAN.md; product SPEC.md; literary evidence EVALS.md. No second STATUS/queue file.
- Cleanup checkpoint 2f0ae24, tag checkpoint/agentic-clean-start-2026-09-06. Retired e1a3dec tag
  archive/folio-prototype-2026-09-06; exact tar and 167-file checksum archive. Do not restore runtime.
- Preserve other historical worktrees/refs and all Codex/Claude transcript files.

## Current bookmark fix and reader evidence

Production walkthrough reproduced a real defect: opening a bookmark kept the passage but created a
fresh visit without its parent/entry route. Fix stores the visit ID with the bookmark and restores
that same visit. Regression failed on the old transition, all21 tests/typecheck/lint/build now pass.
Fix ready for Git deployment; actual bookmark-return QA still required afterward. Summary of reader,
critic and forced-restart observations in evals/nested-reader-and-recovery-2026-09-06.md.
CUA tab2 currently bookmark-created standalone weddingvisit78da84b6-fcb1-4eed-9f1d-09fd1698529f,
1000px viewport; nested saved request usesvisitf7ce6c60-d964-49d9-95ec-029a80499ad1 (parentc92b…).

## Reader/preparation changes deployed in3a10a6c

- src/server/agent/preparation.ts: one prepare opportunity per actively read latest publication,
  recent reader place/unread characters; stale unstarted preparation waits; explicit queued requests
  precede preparation. Uses existing intents, no new table or model pipeline. Already prepared new
  material satisfies a queued continue/prepare request without another purchase.
- PREPARATION_ENABLED defaults false (including current Railway: flag absent). Generation also must
  be enabled. Shared $150 budget still bounds every paid operation. Do not enable until testing this
  slice and intentionally observing preparation. Actual reader signal begins after 20 seconds visible,
  repeats at 30 seconds, refreshes queued/running context, never buys from search.
- Runner now permits exploration to reopen an already-published work without requiring a new
  publication. Regression reproduced the original erroneous pause. A prepare turn may finish without
  publishing; the agent chooses what is useful. Continuation still requires genuinely new material.
- offer_opening requires a readable target and supports exact substring/multi-block quote anchors.
  Regression reproduced empty destination acceptance, then passed with readable exact quote.
- Reader Return stays in sticky toolbar. Each child retains its own source for return rather than
  using the parent's mutable current place; image-region return uses selected region center.
- All requested openings are retained on the library shelf, including explicit title requests;
  entered requests resume their own visit and stop reopening the source panel automatically.
- New publications/links refresh without stealing focus or waiting for the author turn to end.
  Older pending fetches cannot replace a newly visited book. Continuations carry their frontier ID.
- Full gates most recently passed 20 tests, typecheck, lint, build. No paid calls in gates.
- Local preview API session 10249 (port3000), Vite16038 (5173), both generation disabled. Still running.
  Stop after UI verification. Local in-app QA tab was closed; production tab2 is the only tab.
- Local QA used real saved root/child: warm link enters without generation; deep-child Return remains
  visible at390px and returns to parent image. The later exact-source/discoveries changes still need
  the full production journey, not merely DOM presence.

## Production and authorization

User explicitly authorized replacement/testing on existing Railway production, with no old users or
data to preserve, no Docker/staging required. The old application was already trashed: eight old
public tables and four old images deleted; ANTHROPIC_API_KEY and ASSET_DRIVER removed. The current
world corpus is the NEW implementation; preserve it as evaluation evidence.

Site https://shape-of-time-production.up.railway.app
Project 8b20e07d-c256-44c9-85be-d1c7e50ac83d (imagery-shape-of-time)
Environment 82e1c3e8-e2c1-4023-afa2-b17dc6dc6ec3 (production)
App 39bf3c12-b426-40ce-836a-2839ea1bc213 (shape-of-time)
Postgres 294c4570-91e2-4bb2-8639-4a802a475ab8
Bucket 545eb437-32e7-4100-a154-3cffd145fac1 (assets)
Postgres proxy iriguchi.proxy.rlwy.net:41493 (b696fdf7-96a9-43ce-b588-a0ff901e0295).

Use passing Git pushes to main; never railway up/manual redeploy/Deploy Latest to bypass Git.
A controlled same-revision railway restart is allowed for recovery testing. Railway skill read.
Ignored .env has selected DB/S3/OpenAI credentials; local generation false. Never print variable
values/full environment configuration. scripts/configure-local.py refreshes selected credentials
without printing them. Hosted GENERATION_ENABLED=true, schema world. Real tests use world_checks.

Combined initial provider allowance $150 is authorized by implementation go-ahead. Includes all
text, images, criticism and renewal; at most $20 for provider-contract investigations. Latest observed
commitment INCLUDING active reserves $30.27615, remaining $119.72385, unknown0. Query fresh budget;
this changes during work. Root total $4.582698; predecessor calibration $1.02882. No unlimited spend.
Edition budget is stored in DB; environment changes do not silently raise an existing allowance.

## Actual corpus and requests

### Root — done

Work work-5213e951303bfbdd2f555090ca38fa93, **The Shape of Time**.
Intent 4c40ef0e-37b3-47f4-b4c8-6648667aaf2e DONE; author session
5fee6506-857a-48c1-af70-2f0336004de0 (same agent used for all connected works).
Publication 617be2fc-17c4-479f-9ef9-541701cc70fb, doc9094a77f-e863-49f9-8274-230b54d63c03,
root/001-the-counter.md rev2. Builder fully read draft/revision/critic/notes, viewed all images.
Jay gives Tan $4.75 clef against his wage-deducted tab; they shim cooler; she waits for current to
ease. She returns Thursday six days later and they go for noodles. Ends as their food arrives.
Images: img-2e65d7c4-9eb6-4495-a8e7-ae9386e6efa5 counter;
img-6dbbc75c-8ebf-48b3-ae1f-7fa940229810 corrected lounge exterior;
img-40cce6d2-9c38-4ef3-bf1d-c41ee078aa65 dinner.
Superseded wrong-wrist lounge image img-4bf6ae06-770a-4ecf-873d-c7c7696fc3e9 retained.
Root critic doc3cdda498-75b6-4d7b-b3fd-1b9674502560; notes42999fd2-236a-4f58-9dbd-f4c79e225352.
First publication wait27m14s included initial provider-retrieval repair. Root needs continuation.

### Child — done

Work work-42dc798990ed66ca06ff6d776bf67acb, **Under the WASH Sign**.
Intent 8e98c0e8-c437-4ebc-93bd-06b86ce2c37d DONE.
Publication747ca3cf-7d62-432b-9fed-d856ea173a5a, doc2149a12f-0632-4e33-8735-a97b41bf26f9,
wash-sign/001-offered-route.md rev2. First draft dcb7f8e4-5559-4119-8e22-869ce7fbbdb2 retained.
Origin: actual image rectangle around attendant/travelers in corrected root lounge image,
publication617be… blockb-01c5a2ee18a86f74ed2a; no angle/synopsis. Agent also offered prepared link
opening-7f11eed9dd8cc410db8dba57ee484122 at this source.
First-person Lena, future-born attendant who misclassified Dimas Serrano's inadmissible route as
refused; hotel/rebooking denied. Bo helps find guided legal route viaReed toSouthBasin; Ames useful
within constraints. Lena admits fault, stays overnight despite her dispatch ambitions. GuideSaye
arrives morning; Dimas's departure/arrival still not established at ending. Tan a brief unnamed
visitor from Lena's perspective. Dimas came for sisterTere's wedding toAudrey; program and missing
photograph have actual source meaning. Builder fully read both versions, critic and all3images.
Images img-0577f742-eb8e-4734-b864-c5ba4606f212 confrontation,
img-bcab7eba-3d37-4494-8b22-1d91fa5e4b52 bench,
img-1b8e5f3d-e2db-4e0f-8af3-bb72eee72b4d overnight.
Criticfcd8432e-15e0-4a76-a8b0-74678b63d9fb found worthwhile distinct stakes, suggested fewer moral
asides and Dimas's food. Author revised those plus logistics/voice. Notes9ac2765a-cfea-4d50-abd8-
10023ce56848 (wash-sign-continuity), index1893519e-9409-4a24-99f6-a47b036a0772.
First publication wait30m06s. No builder creative rewrite or manual publishing.

### Grandchild — first publication readable, author active

Work work-e8aad2c5c7442b4d0df413d8cdc76eea, **Tere & Audrey**.
Intent85cab9ea-5c51-4daf-a245-7c476180e16c, source text selected by real browser drag:
'a folded program from the wedding. TERE & AUDREY, the cover said, inside a printed border of yellow flowers.'
Source childpublication747ca… blockb-0efd732eb9f190ccb30c; no angle/synopsis.
Publication0538d34d-a846-431c-a169-e99773153c80 at04:33:08 UTC; doc01f5e523-3d33-48f8-9dad-
91d7fd7af85b, tere-audrey/001-the-cover.md rev1. Builder fully read it (~1900words, no quota).
Audrey POV, pre-wedding Thursday hall kitchen, Tere folding yellow-rose programs, lived-together
couple/newceremony nerves. Audrey's daughterNina officiates; Rafi photographer; Dimas brings drinks,
cap/jacket and particular family ease; gold paper decorations seed earlier detail. Ends before
ceremony, room for sustained continuation. Temporal delivery man appears ordinarily, no conflict
with parent perspective. Image img-54a14f81-8ccc-499e-804a-2483d94cf869 viewed by builder, Tereblue/
Audreyivory-orange foldingprograms, consistent with prose. Author continues after first publication;
second section revisions1/2 fully read; all3 final wedding images viewed. Critic5f7ea6c3-6b56-42e7-ac87-95852982facd read, found source/visual consistency and recommended specific reading and less explanatory narration. Agent revised with Rossetti poem/particular Tere desire, removed announcing sentence. Revision2 dd087022-89d1-439f-9e8f-dbb16806cc49; ceremonyimg-87a5bee8-7243-47bd-b968-2bb789b018e2 (corrected date/head), portraitimg-d6e24472-87e6-489e-a5f8-e2d5540d5826. No builder creative edits. This opening took about9minutes to become readable.

## Browser state and next QA

CUA tab2 currently production /read/131daf26-3a86-4858-ae13-5eae94da403d (grandchild).
Parent child visit c92b10b6-71bc-46a9-a591-a4f6158cda14; root visit
0f84838d-2093-4b02-a91a-87f2934fcefb. Entered all3through real source controls.
Bindings tab, browser, viewport available. Others qa/childImage/childSecond/childThird/weddingImage
point to closed temporary tabs. Only production2 remains. Viewport just changed1000x800→390x844
and font reduced by toolbar; inspect/reload next, then return after new reader deployment.
Grandchild currently within first long paragraph b-55fe45b3aafb76f82084 before image.

CUA getAXState({emit:false}) returns a diff after first call; slice/filter repeated output rather
than dumping novels. Evaluate only readonly DOM. Use screenshots + coordinate clicks for sticky
header controls: locator.click scrolls first and previously produced a FALSE font-position bug.
The actual image reflow bug was real and fixed with normalized imageFraction, local QA preserved46%
across width/reload. Latest per-source Return changes need production verification separately.
Viewport applies to selected tab; close other temporary tabs before resizing production. Reset
viewport when finishing. API/Vite local preview sessions still running, generation false.

## Provider, context and recovery evidence

Astra background/storetrue, xhigh/all_turns, no retries, durable response IDs/raw bytes/tool receipts.
Direct GPT Image2 outputs stored before parsing, actual image content returned to author/critic.
All17 image references in the first post-deployment request hydrated successfully from content-
addressed bytes. Receipt tests/receipts/astra-hydrated-images.json: op2b5fc911-dd7f-4d02-8dee-
ac0e6cdd7187, response resp_07d55e4c2e541ade006a9ceaf0784087d0aedf3c056bcbe902,
217832inputtokens, xhigh/all_turns, first toolarchive. Saved request has references, no inlineimage
bytes; realS3roundtrip proves exact preservation. Existing historical requests remain unchanged.

Native renewal implemented in agent/renewal.ts; scripts/renew.ts STABLE_KEY, generation must be
explicitly true. First live operation now running, see immediate next action. It preserves full original input/receipt, entire canonical
compaction output, and reattaches original orientation. No APIeffort option on native utility;
never claim xhigh for compactor. Author/critic remainxhigh. StoredGET encrypted_content unsupported;
opaque prior reasoningIDs depend on provider retention. Do not claim indefinite self-contained
replay. Use early renewal once idle, then investigate automatic durable renewal from that evidence.
Current active context pauses above880k; no automatic renewal yet.

First-root snapshot .local/corpus-first-reading-2026-09-06 (10tables,29ops,4assets,33objects)
restored exactly to world_restore_first_reading / matchingS3prefix with generationdisabled.
Every row/object checksum matched. Later corpus export includes protocol image blobs and forbids
active author/provider work; repeat restore after new corpus/renewal. scripts/corpus.ts export|restore.

Predecessor calibration completed once, no rerun needed:64verbatim pages, sourceSHA
9c0a7452d6b81c1edae64d374b0303a5342170bd03f2b6aa4f4c5dc2861a6076. Independentcritic identified
amberrecurrence, firstClefgiverreversal, MrsChenrepeatfirstdeparture, validseparateeditions, different
post-resolution behavior with nuance. Fullsource/review/assessmentunder evals/; cost$1.02882.
No deterministic literaryscores. A short successful opening is not proof of long-form coherence.

## Sources, tooling and remaining work

Astra xhigh author/critic, gpt-image-2-2026-04-21. Full four artistic sources from edition DB/
content/shape-of-time: exact recovered4512wordworldSHAe47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c,
originalmain-templateessence/prose with softerexpositionpreference, approvedink/transparentcolor.
No source/prose-guide changes during implementation slice. Original wording remains intact.

Node24.18.0/pnpm11.15.0 via mise exec node@24.18.0 -- npx --yes pnpm@11.15.0 COMMAND.
React/Hono/Kysely/pg/S3/OpenAI/Sharp official docs and Context7 consulted earlier; use again for new
external API questions. Railway/OpenAI skills already read. No new schema/framework needed.

Remaining: P1sameagentcontinuation; P2exactcomplete productionnestedreturn; P3observepreparation,
multipleconsecutive root/nestedscenes and contextualcriticism; P4realcontrolledrestart and new
corpusrestore; P5native renewaland extendedcoherentcorpus (30–50kreadingstudy, notquota), distant
recurrence/visualcontinuity and post-resolutiondevelopment; P6releaseexactrevisionand honesthandoff.
Review the actual growing work, not just green tests. Stay within remaining fundedallowance.
