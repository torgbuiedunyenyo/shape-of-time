# Reader acceptance testing — September 7, 2026

This report covers actual reader interactions and the defects they exposed. Mechanical checks do
not certify literary quality. The author will assess the new fiction; no automatic literary study
or 20-request sample was resumed.

## Current release and attempt

Application revision: `c1c40d99706a155a09fef7f9d614d1c625f8014b`.
Git-triggered Railway deployment: `09f0e21e-2b00-48d3-b774-f9de96d99dbd`, successful with the exact
health revision verified. Schema: `world_reader_20260907_b`.
Pinned mechanism: `3b1a00a472d152cf481940407ded7116d0c86a1090f99ffa9dc07d8745f10d2c`.
The library was empty before Begin. No earlier fiction, images, notes or session memory were copied.
Models remain GPT-6 Astra at xhigh and GPT Image 2.

All 45 mechanical tests, type checking, lint and build passed. Stateful checks use real Postgres;
the transport regressions use a real local HTTP server. Those checks supplement the walkthrough.

## What failed and what changed

The screenshot's old exploration was queued behind earlier reader work. The creative session handles
one request at a time, and a request could produce a long chapter and illustrations before yielding.
The interface concealed too much of that distinction. The agent now receives waiting-reader context
and guidance to make a worthwhile opening available promptly, with discretion over its composition
and when to finish. No minimum section count or request-completion gate controls entry.

The walkthrough also exposed two transport failures. Native context renewal hit the network layer's
five-minute header timeout despite the SDK's longer deadline. The transport now uses one finite
20-minute deadline, without automatic retries. A subsequent reference-image edit failed because the
SDK's global FormData and the selected fetch implementation did not match. Matching Undici globals
fixed it. The regression reproduces multipart submission against a real listener and verifies the
received file's bytes, name, MIME type and prompt. A reference-based image then completed on the
actual production provider, and further reference-based child images succeeded.

Reader defects fixed during the walkthrough:

- An empty search result removed the search field and its focus.
- Arrow navigation stopped after a page button received focus.
- The mounted library did not add newly readable works or update Begin to Enter.
- Returning from a child reopened an unrelated, previously dismissed opening panel.
- Pending and paused openings presented an inert action instead of a useful way to keep reading.
- Continuation errors exposed provider internals, and paused requests could appear retryable.

The revised panels explain queued, running and blocked states; they retain saved request identities,
keep polling through recoverable failures and offer entry as soon as a first publication exists.
Reselecting a source recovers that source's saved request. Readers cannot supply narrative directions,
angles, titles or premises; library search remains read-only.

## Walkthrough results

| Journey | Actual observation | Result |
|---|---|---|
| Begin and first entry | Live waiting page enabled entry at the first publication, while the request still ran; prose and illustration loaded | Passed |
| First-use guide | Clean local origin automatically showed the guide against real saved content; skip, replay, Escape and reload persistence worked. All six steps, Back and completion were exercised on an illustrated work | Passed; local generation disabled |
| Pages and type controls | Native forward/back, arrow keys after button focus, and text size 23→25→23 retained the reading anchor | Passed |
| Narrow layout | At 390×844, reflow retained the same passage; controls remained usable and horizontal overflow was zero | Passed; viewport override reset |
| Text exploration | Selected the complete visitor-phone paragraph; entered its published child, turned pages, reopened and returned to that paragraph | Passed in the preserved third attempt; unchanged path |
| Whole-image exploration | Requested from the root illustration; left and recovered its panel; entered Three Blue Lines at its first publication | Passed on current production |
| Warm image entry | Returned to the source image, selected it again, and entered the same saved child visit without another generation request | Passed on current production |
| Image detail | Enlarged the child illustration, drew a region around the bread bag, and submitted the selected detail | Passed on current production |
| Deeper cold entry | Left the region panel, found its saved discovery in the library and entered The Early Batch at first publication | Passed on current production |
| Two-level return | Reopened the deeper visit in a fresh browser document after a page turn; returned to the selected image region and then the root source image | Passed on current production |
| Appending reading | New prose and a reference-based illustration appeared without changing the settled visible passage | Passed on current production |
| Explicit continuation | Fresh Continue appended two illustrated passages; both were read and their images opened. The request completed and the normal Continue control returned | Passed on current production |
| Ordinary preparation | Actual reading triggered preparation; a new illustrated root passage appeared automatically, was entered with Right, and its image was enlarged and read | Passed on current production |
| Shelf, bookmark and resume | Saved a passage, left, reopened its shelf bookmark and recovered its anchor; search matched, returned no results and cleared without losing the field | Passed |
| Mounted discovery | The production library added Three Blue Lines and enabled its card without reload; the pending detail later became The Early Batch | Passed on current production |
| Unavailable service and recovery | Stopped only the local API while its waiting view stayed open; visible connection failure appeared. Restart cleared it automatically, and the same saved request entered published reading without resubmission | Passed; real local outage, production unaffected |
| Generation paused | A local API with generation disabled showed a truthful pause and retained access to saved reading | Passed; no paid outage induced |

No result is called a pass merely because a control exists. Earlier local checks are labeled, and
failed paid journeys are preserved below. A native font-control check also disproved a suspected
scroll defect: the earlier movement came from an automation click scrolling the sticky header into
view, rather than from changing the text size.

## Fresh production evidence

Begin `3fdbd099-1a96-4e15-8b77-ead5859ee013` was submitted at 03:58:16.711 UTC.
First publication `55e8ddfb-92a0-4c67-9921-289994007f41` arrived at 04:03:25.032 UTC:
**5 minutes 8 seconds**, including image-first generation. Actual entry created root visit
`c32d0e50-8327-4904-850a-6400941586ac`.

The second root image, operation `229aabff-64e1-4d6d-9d69-0d6a3ea80aa4`, used the first as its
reference and completed at 04:06:20.517 UTC. Its publication arrived while the reader remained at
scroll 2693, block `b-e7f33cd1e319f28358a3`, top 80.765625. Both images loaded.

Whole-image request `0bcecbdf-0df2-446e-9376-336d87e9c216` was submitted at 04:04:14.867 UTC.
Its first publication arrived at 04:11:40.081 UTC: **7 minutes 25 seconds including the queue**.
Actual entry opened Three Blue Lines, visit `bc074ecf-21b9-4e11-ad72-70d44d556b05`, while generation
continued. Reopening after a page turn restored scroll 570 and block `b-8470b4e46ce0d3511ef2` at
76.296875. Return restored the root image at 99.828125; no unrelated panel appeared. Warm entry
reused that exact child visit. Its illustration also used the root image as a reference.

Region request `06d74e83-b754-4455-84f6-4cff00876406` was submitted at 04:18:29.690 UTC from
child publication `757764ef-53bc-4386-87a0-183a973dfb24`, image block `b-7a12c5705ce96055f7a0`.
An actual drag selected the bread bag: normalized x 0.774214, y 0.630189, width 0.193711,
height 0.354717. First publication arrived at 04:23:24.386 UTC: **4 minutes 55 seconds**.
The library's saved discovery opened The Early Batch, visit `14150da5-276b-47c8-affe-7ccbc8bda5f1`.
Its opening concerns the bakery where Bev buys the pictured rolls. This is a bounded source
connection observation, not a verdict on long-form coherence or literary quality.

Reopening that deeper visit after a page turn restored scroll 570 and block
`b-ea8813e204475ebced5c` at 97.296875. Return placed the child image at -302.796875 with height
498.6640625, centering the selected region at approximately 100 pixels. The next Return restored
the root image at 99.828125. The published root images remained loaded.

These cold waits are a remaining experience limitation. Truthful status and early entry fix the
broken interaction, but do not make serial, high-effort generation instant. The preparation check
below establishes usable output without guaranteeing that its delay is hidden at normal reading speed.

Preparation `adf28fd4-705d-4cc5-b0a7-42149f5b507a` ran from the actual root reading signal and
published `0d1403e6-f87e-450f-b335-ad7abcef6341` at 04:41:22.233 UTC, before another Continue was
submitted. The new section, After Nine, includes a restaurant illustration generated with both
previous root images as references. The existing view remained at scroll 11537.5, block
`b-dd36cfba57fca488cc81`, top 52.046875. Right entered the prepared prose; its picture was enlarged
and loaded successfully. Escape closed it. This proves functional preparation of illustrated linear
reading, not that generation was hidden at a normal reading speed: the walkthrough waited at the
frontier. The earlier [preparation walkthrough](author-feedback-and-preparation-2026-09-06.md#actual-preparation-and-warm-entry)
records an actual prepared nested opening and warm entry into The Back Label in a preserved attempt.

After reading the prepared material, final continuation `816026d0-0012-4a6f-b6ec-5e3228078a4c`
was submitted through Continue at 04:42:54.024 UTC. A newer preparation opportunity yielded to it.
The fixed position for its append check is scroll 20105, block `b-40924f7c62eb2d28aad4`, top 110.2578125.
First new publication `e708f0c6-70d8-4776-8e64-70a9558c38cb` arrived at 04:51:30.277 UTC,
**8 minutes 36 seconds** after Continue. The reader retained the same block with a 12-pixel
adjustment: scroll 20117, block top 98.2578125. Right entered the new prose, and its lake-walk image
was opened and loaded. Second publication `4c7c8ca8-33c4-430f-bc63-542bf52dbd2f` arrived at
04:59:10.499 UTC; its blue-bench illustration was also opened and loaded. By 05:03 UTC, completion
was confirmed in persistence and the actual interface, where Continue reading was available again.
The QA reading session was then closed. The full request kept developing after its first readable
passage; first-publication availability must not be confused with full-request completion.

## Preserved failures and scope

The screenshot-era draft remains private in the [second attempt receipt](../tests/receipts/reader-second-preserved.json).
Its ambiguous native-renewal timeout remains reserved, with no automatic replay or invented zero cost.
The subsequent UAT draft is preserved in the [third attempt receipt](../tests/receipts/reader-third-preserved.json).
Its reference upload was proven to fail before HTTP submission; its original operation row is retained
and that operation's actual cost was reconciled to zero. Neither draft seeds the current book.

The third attempt's text exploration entered The Money on Its Way at first publication, with later
illustration, exact source return and warm re-entry. Its actual continuation appended a third root
section at an unchanged settled position, scroll 3245.5 and block top 78.640625. The following upload
failure prevented completion. Its whole-image and region requests never began and are not counted
as successful journeys.

Four explicit UAT requests completed in the fresh attempt: Begin, whole-image exploration,
selected-detail exploration and Continue. The stopped automatic 20-request driver was not restarted.
The book contains **3 works, 9 published sections and 7 illustrations**. All published assets passed
the final production HTTP check and were viewed in the reading interface. All 60 provider operations
match the pinned mechanism. The fresh attempt has no uncertain operations.

Final fresh-attempt spend: **$13.993545**, including ordinary preparation and an optional critic
chosen by the creative agent. The last preparation settled after reading stopped; its critic was
part of the book's normal agent-selected tool use, not an operator literary study or a compulsory
evaluation stage. Remaining allowance: **$78.664460**. Previous committed spending remains preserved;
combined committed spending is **$288.0865695** against the recorded $366.751030 combined allowance.
No allowance increase was needed for this pass.

The [final receipt](../tests/receipts/reader-uat-2026-09-07.json) records the work and request identities,
publication times, asset availability, model settings, mechanism and costs. Earlier paused and failed
attempts remain separately preserved. These results establish the exercised mechanics and bounded
source continuity; they do not claim ideal cold-generation latency or novel-length literary success.
