# Handoff

Updated September 6, 2026, around 04:38 UTC. After compaction read this and PLAN.md P1–P3.

## Purpose

Build an agent-led world exploration harness: sustained, nested image-and-text narratives coherent
within and across works. Successful text-only infinite-book is the experiential baseline. Give the
agent full original context, memory, tools and creative freedom. No deterministic literary verdicts,
fixed lengths, mandatory fact graph or fixed prose/image/critic workflow.

## Immediate next action

The live grandchild **Tere & Audrey** has published its first passage; the author is still working on
further images/material. Do not submit another request for it. Inspect live status before deploying.
Latest active image operation **87a5bee8-7243-47bd-b968-2bb789b018e2**, dispatched 04:37:07 UTC.
Do not deploy or restart through a direct image purchase. Two attempted restart probes stopped at
their eligibility guard; **no forced restart was performed** and .local/restart-proof.json does not
exist. Retry a controlled restart only while a known background Astra response is still active.

Local reader/preparation work passes all gates (20 tests), ready to commit/deploy at a safe point.
Then reload the actual production reader, complete grandchild → child → root with exact source
return after reflow/reload, and inspect the remaining new prose/images. After the author becomes
idle, perform the first native context renewal, then request genuine root continuation. Do not queue
that continuation before renewal (the renewal script requires idle author/no queued requests).
P1 continuation and P2 complete return are still outstanding. P3–P6 remain partly implemented.

## Worktree, Git and deployment

- Active /Users/ratpartyserver/git/shape-of-time-agentic, branch codex/agentic-world.
- Normal /Users/ratpartyserver/git/shape-of-time, clean main fast-forwarded to 31b3217.
- Remote/deployed main **31b3217596907b895245208626c1718c20f62fdd**; /healthz verified.
- Git-integrated deployment **835c3f73-ade7-452d-9f5e-f58268a2979d**, SUCCESS.
- Preceding bf386dd stores protocol image bytes once, paged archive lookup, calibration evidence,
  normalized image reading positions. 31b3217 adds actual reader wait/publication context to author
  tool outputs and a continuation preflight to load existing new material before buying more.
- Single development agent. No subagents. Retired art-thing is read-only history.
- Sole queue PLAN.md; product SPEC.md; literary evidence EVALS.md. No second STATUS/queue file.
- Cleanup checkpoint 2f0ae24, tag checkpoint/agentic-clean-start-2026-09-06. Retired e1a3dec tag
  archive/folio-prototype-2026-09-06; exact tar and 167-file checksum archive. Do not restore runtime.
- Preserve other historical worktrees/refs and all Codex/Claude transcript files.

## Current local changes (not yet deployed)

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
subsequent images/prose not yet inspected. This opening took about9minutes to become readable.

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
explicitly true. Not yet used live. It preserves full original input/receipt, entire canonical
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
