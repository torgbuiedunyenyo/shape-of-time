# Reader acceptance pass — September 7, 2026

This pass responds to the author's failed cold-opening experience and new narrative direction.
An implemented control, a passing unit test or an available endpoint is not a completed reader
journey. Record what was actually done in the in-app browser, including waits, failures and fixes.
The earlier20-request automatic sample remains stopped. Only generation necessary for this pass
is authorized here; the author judges the resulting prose and imagery.

## Reported failure and diagnosis

Screenshot: `/Users/ratpartyserver/Desktop/Screenshot 2026-09-06 at 10.51.51 PM.png`.
The selected quote “Don't lift it yet,” she called. comes from The Second Handle publication
7a9868d7-f367-4a55-bd81-380caca39016. Its actual exploration3d86fc13-369d-472f-b09b-10e6bac0e435
was created02:51:33UTC. At02:55:56 it was queued behind three earlier explicit explorations.
53618c9d was running; a49dba98 and fb986002 were queued. No publication existed for this opening.

The global creative session runs an entire request before taking the next. Active requests were
not given the waiting-reader list, although preparation was. The current active exploration had
made two image requests before publishing any prose. Its long wait included an earlier root
continuation and a maintenance hold for the previous release. The UI did not explain queue position,
and its disabled action offered no useful response. A failed/paused request anywhere could also
stop dispatch while other readers saw only generic waiting text.

At about03:04UTC the live waiting view for53618c9d changed to “The Late Game” and enabled Open the
book automatically. Clicking it entered the work; the next loaded observation had one section,
two fully loaded images and no alerts. This establishes that the old publication-to-entry path does
work once generation publishes, while demonstrating that its cold wait was unacceptable. It does
not vindicate the earlier claim that the overall mechanics were finished. The selected3d86fc13
opening never started before retirement; its pending request is preserved as draft evidence.

The author reaffirmed that every new attempt must start empty. All unstarted old-edition requests
were retained as cancelled, with their complete previous records in
`.local/review-second/queued-before-retirement.json`. Active paid work was left to settle.

Actual live library UAT reproduced another defect: search “no-such-title-uat” removed the entire
search field. The corrected local reading interface, using the same saved production material with
generation disabled, kept the field and showed No books match this search. Clearing restored all
five works. A brief field remount while clearing was also found and corrected by retaining the
catalogue whenever a published root exists. Search creates no reader-generation request.

Local reading-control UAT at a720px-high viewport: Next page moved0→570px, Previous restored0.
The right-arrow key then failed because the previous-page button retained focus and the keyboard
handler excluded all buttons. Corrected that exclusion: editable fields and open image dialogs
retain their keyboard behavior; page controls no longer disable reader arrows. Actual retest with
Previous page still focused moved0→570px on ArrowRight.

Native font-control clicks retained block b-6322ee45a4a70b663603 through23→25→23px; scroll817→907.5→817.
An earlier Playwright locator click scrolled the sticky header into view before clicking and changed
the apparent place; native control interaction disproved this as a product reflow defect.
All six guide steps were visited, including Back, completion and exact restoration to scroll817.

After the completed exploration, preparationc2de7eca paused on compaction9d5eeddd: Node's default
five-minute response-header timeout fired despite a20-minute SDK timeout. No provider ID or response
was saved, so the9.7726125 reservation remains uncertain and is never replayed. The transport now
uses matching Undici fetch/Agent deadlines. A real local HTTP-server regression exercises delayed
headers/body and verifies a timed-out call is not retried. This test is transport evidence, not an
actual paid compaction result.

## Changes under verification

Prompts invite an early worthwhile opening, scene selection, foreshadowing, developing plots in
inset works and finishing a reader request once useful reading is available. No plot scaffolding,
length quota, forced image order or deterministic literary verdict is added. Tool results give
the creative agent other waiting readers as context. Public request validation rejects narrative
direction/title input. Queue status distinguishes work ahead from a blocked queue. A pending panel
offers Keep reading, retains the discovery, and offers actual entry after the first publication.

Official Astra prompting guidance was fetched from
https://developers.openai.com/api/docs/guides/latest-model; React cleanup and Kysely query guidance
were retrieved through Context7. No model or reasoning-effort change is involved.

## Acceptance matrix

| Journey | Required observation | Result/evidence |
|---|---|---|
| First entry and guide | Actual Begin to readable opening; next/back/skip/escape/replay and dismissal survives reload | Passed: live Begin148.136s; clean local origin auto-guide; all six controls/steps on old illustrated work |
| Reading controls | Forward/back and keyboard; text sizes; desktop and narrow reflow retain place | Passed on corrected local UI; native type23→25→23 and390px reflow retained anchor |
| Text exploration | Actual selected quote, correct request and destination, source return | Correct quote/submission7e9145a6; awaiting actual child entry |
| Whole-image exploration | Actual image source, request through first publication and entry | Submitted from live root illustration; awaiting entry |
| Image-region exploration | Visible drag selection, correct crop/source, usable entry and return | Native bottle drag/panel passed locally; paid nested region journey pending |
| Cold opening | Submitted through UI; stays usable while waiting; first publication enables entry before whole request completion | Root passed; nested openings pending |
| Warm opening | Existing link opens with loaded prose/images without another generation request | Root→Back Label→Late Game passed on old corpus with generation disabled; fresh warm re-entry pending |
| Continuation | Reach frontier, request more, receive appended reading without losing place or duplicating request |197cad4d submitted through frontier after root second publication; watching fixed anchor for next append |
| Preparation | Ordinary reading prepares continuation or a linked work; material and images become usable | Reading queued preparation; explicit text exploration took priority; prepared result pending |
| Nested returns | Root→child→grandchild→child→root, including reload and page turns | Passed on real old corpus, including grandchild reload/page turn; fresh region journey pending |
| Shelf/bookmark/resume | Save place, leave, find saved work, resume exact place; search makes no generation request | Passed; found/fixed disappearing empty-search field; mounted live catalogue refresh fix being verified |
| Pending discovery | Leave pending panel, use shelf, reopen discovery after it becomes ready | Root waiting→shelf→ready entry passed; pending text/image panels close via Keep reading and persist on shelf |
| Failure and recovery | Actual unavailable/paused case tells truth, keeps saved reading usable, no false retry or duplicate purchase | Passed using local generation-disabled API and real local API interruption/restart; same request recovered automatically and entered; no paid failure induced |

No row is a pass merely because it was implemented or passed a prior attempt. Real database
regressions supplement these observations. Any unavailable/error scenario exercised using a
read-only local mirror or fixture must be labeled; do not cause ambiguous paid calls to test failure.

## Live release and continuing walkthrough

Git deployment06022230-9f24-467a-b39d-954b7a2f2bca succeeded at2664d40b829aabf953bf20574db797eaa58a22ce.
Exact health revision verified. Fresh schema world_reader_20260907 was absent before deployment;
the published library was then empty at03:25:14.878UTC. Its pin is
add399808eaa52d8e97889362e1da2b07227f290328ecd694ef25782e2fe75c9.
All43tests/typecheck/lint/build passed. Actual UI Begin at03:26:23.523UTC created
c0e8aa02-20cf-419e-a559-5d11aba5bc9d. Leaving its waiting page showed the same live request under
Your openings in the library, with View this opening linking back to the same identity.

Additional old-corpus UAT on the corrected local interface: root→Back Label→Late Game, grandchild
reload and page turn, then both Return buttons restored the source image and root clef paragraph.
All paired images loaded. Saving a passage and reopening its shelf bookmark retained the same text
anchor. At390×844 the root source block remained b-d9d899cdb3efaae5736d and horizontal overflow was0;
the screenshot showed readable prose, accessible font/page controls and the linked opening. The
temporary viewport override was reset. A bottle region was drawn with an actual drag, enabled its
action, and opened the exploration panel. With local generation disabled, its submission showed
New writing is paused. Saved books remain available. No paid call was submitted by that check.

Fresh first publication d5e14acd became readable03:28:51.659UTC,148.136seconds after Begin. The
library's Your openings card enabled entry while the request still ran; clicking entered visit
0b82eb9f-c124-4cb4-9937-6fdffd1bc6a8 with actual published prose. The main library button still said
Begin because the catalogue did not refresh while mounted: corrected in the pending client-only
follow-up by periodically refreshing the shelf without overlapping requests.

Actual triple-click selected the visitor-phone paragraph; its complete quote appeared in the panel.
Clicking Open as a book created exploration7e9145a6-802c-43ab-ad17-17f0870ec8d1 at03:30:30.586UTC.
The panel showed one request ahead and an enabled Keep reading action, which actually closed it.
Ordinary reading also queued preparationdad20cfa. It must yield priority to the explicit exploration.

First-entry guidance was tested separately on a clean local origin3000, backed by the same real
published work with generation disabled. The guide appeared automatically; Skip guide, replay,
Escape and reload were exercised. Dismissal persisted. Only5steps existed before the first image
was published; the picture step is offered when a published picture exists.

Local recovery test: waiting page remained open while only the local API was stopped. Failed to
fetch became visible, while its known ready result remained. Restarting the local API cleared the
error automatically, without reload or resubmission. Clicking Open entered the actual two-section
work. This is a real connection-recovery check against the production database with local generation
disabled; production and its paid requests were not interrupted.

Text exploration7e9145a6 published207aa170 at03:38:07.361UTC,456.775seconds after submission
(including waiting behind Begin). Its card became The Money on Its Way and entry was enabled
while its request still ran. Actual entry loaded the first nested section with no alerts and a
Return control. The child takes up the visitor payment service named in the selected parent text.
This is a source/entry observation, not a verdict on sustained literary quality.

The local library automatically added The Money on Its Way while left mounted, confirming the
client follow-up refresh. Local recovery tab and API were then closed/stopped. Production whole-image
exploration6a1733a5 was submitted03:36:24.480UTC. Root continuation197cad4d was submitted03:34:19.985UTC
against6278fe61. Root tab stays at scroll3175.5/blockb-dc1745deaa84d3731951 to observe its next append;
another tab is used for the nested reading so this check does not manufacture a scroll change.
