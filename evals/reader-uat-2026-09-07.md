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
| First entry and guide | Actual Begin to readable opening; next/back/skip/escape/replay and dismissal survives reload | Pending |
| Reading controls | Forward/back and keyboard; text sizes; desktop and narrow reflow retain place | Pending |
| Text exploration | Actual selected quote, correct request and destination, source return | Pending |
| Whole-image exploration | Actual image source, request through first publication and entry | Pending |
| Image-region exploration | Visible drag selection, correct crop/source, usable entry and return | Pending |
| Cold opening | Submitted through UI; stays usable while waiting; first publication enables entry before whole request completion | Pending |
| Warm opening | Existing link opens with loaded prose/images without another generation request | Pending |
| Continuation | Reach frontier, request more, receive appended reading without losing place or duplicating request | Pending |
| Preparation | Ordinary reading prepares continuation or a linked work; material and images become usable | Pending |
| Nested returns | Root→child→grandchild→child→root, including reload and page turns | Pending |
| Shelf/bookmark/resume | Save place, leave, find saved work, resume exact place; search makes no generation request | Pending |
| Pending discovery | Leave pending panel, use shelf, reopen discovery after it becomes ready | Pending |
| Failure and recovery | Actual unavailable/paused case tells truth, keeps saved reading usable, no false retry or duplicate purchase | Pending |

No row is a pass merely because it was implemented or passed a prior attempt. Real database
regressions supplement these observations. Any unavailable/error scenario exercised using a
read-only local mirror or fixture must be labeled; do not cause ambiguous paid calls to test failure.
