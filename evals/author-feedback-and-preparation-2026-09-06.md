# Second reader attempt: author feedback and preparation

The author approved the first attempt as a strong start, then requested gentle artistic changes,
preparation while reading, 20 reader requests and a first-entry controls tour. They explicitly
reiterated that every attempt must start from scratch under one consistent mechanism. PLAN.md
section11 is the work queue. No previous fiction or images seed this attempt.

## Artistic changes

Small labeled additions to prose-guide.md and visual-direction.md invite more descriptive breathing
room, varied sentence and conversational rhythm, richer/more frequent visual encounters, attention to
material agreement between actual pictures and prose, and ethnically ambiguous Jay/Tan. The original
world and world-essence remain unchanged. No image quota, sentence metric, ethnic classification,
mandatory critic stage or deterministic literary verdict was added.

The author's Desktop screenshots, `Screenshot 2026-09-06 at 3.36.11 PM.png` and `3.36.24 PM.png`
(actual filenames use a narrow space before PM), were inspected. The visible bottle has no label,
while the passage says Tan studies a label with an oak drawing. This is a concrete example of the
reported mismatch. It is retained as feedback evidence, not copied as a scene requirement into the
new creative context. The guidance asks the agent to consider the actual depicted details and use
its judgment to reconcile unpublished prose/image choices while preserving established facts.

## Preparation changes

The original infinite-book frontend/src/app.ts prepares pages ahead of the current page and openings
for its references; frontend/src/tour.ts highlights navigation and references. Its fixed page counts
and browser queue are historical implementation choices, not imported story constraints.

The first illustrated attempt only offered preparation from the latest published section. The new
runtime offers one shared opportunity per encountered publication, including earlier sections. It
provides the actual source text/images, existing openings and unread continuation. The creative agent
chooses useful further reading or a nested opening, and can decide nothing more is needed. Reading
signals coalesce across concurrent readers. Already saved continuation no longer falsely marks a
nested-preparation opportunity fulfilled. Explicit continuation still reuses material that arrived
while it waited. Preparation yields between settled tool batches if an explicit request arrives or
reading becomes stale; completed tool effects and drafts stay saved.

Focused real-Postgres tests first reproduced missing earlier-section preparation and acceptance of
a wrong-work reading signal. The fixed scheduling tests pass, including12concurrent signals sharing
one opportunity and an actual saved session yielding without a provider purchase. An intermediate
local transaction deadlock was corrected by keeping the complete signal update in one transaction.
All33mechanical tests, typecheck, lint and build passed before the runtime release. These establish
scheduling/persistence, not narrative quality or actual preparation latency; live observation follows.

## Fresh mechanism and accounting

Git-triggered Railway deployment710979c4-060c-4fc6-81d0-4f8ef8964933 succeeded at exact revision
02d6115bb6e143563ba4db9305a6e5f0531c7bf6. /healthz matched. Fresh schema world_reader_20260906_b
recorded mechanism aefcf65a848bbecda3b37c0a26d71e6230712f795c4e268e678bc671408acd4e before
any provider operation or publication; local source/configuration matched. The actual shelf was
empty, with no previous visits or bookmarks. Begin was clicked through the UI: request
ed8a8cf1-5940-4255-886f-af988132b759, request1 of20. The run ledger is
.local/review-second/ledger.json; preparation is counted separately from explicit requests.

First-attempt snapshot/reference: archive/reader-attempts/README.md and
 tests/receipts/reader-first-preserved.json. Its allowance is frozen at22.053726, in addition to
94.697304 from earlier development. Under the explicit overrun authorization, the new attempt has
an initial150 allowance, for266.751030 combined. The old116.751030 remains in the accounting.
Receipt tests/receipts/second-edition-allocation.json. Spending may be raised deliberately if required
to complete the20requests, without silently lowering Astra/xhigh or the requested image model.

## Controls tour — local verification

The short guide uses a native modal and highlights actual headings, page controls, passage,
illustration, save/text-size controls and library/return area. Skip, Escape, Back, Next and keyboard
arrows work; completion/dismissal are remembered; ? reopens it. Tour scrolling does not emit reading
signals or overwrite saved reading positions. It returns to the position where it began.

The actual in-app journey at1280×720 traversed all6steps and returned to scrollY0. Reload kept it
closed; ? reopened it; Escape dismissed it and restored the opening. A separate real-browser check
at390×844 traversed all6steps by keyboard; each card stayed inside the viewport, with no horizontal
overflow. Enter finished the tour, restored scrollY0, and dismissal persisted through reload.
The real persistent Web Storage test also verifies dismissal survives a separate process without
erasing an existing reading-place entry. No provider request was submitted by tour QA.

The narrow screenshot is .local/guide-narrow-welcome.png. An initial screenshot command mistook a
relative path for a selector; the absolute-path capture succeeded. This was a tool issue, not an app
failure. The client-only tour does not change the mechanism. All34tests, typecheck, lint and build passed for the tour. Production tour/preparation
verification is pending; final20-request scope and cost belong in the completed handoff.

## Live release and controls

Tour revision1ed691ab831a658eb93f395b1329fb2d8836370c deployed successfully through Git deployment
169d3c85-efdd-4725-b935-1c18b7f5fad3; exact health matched. The temporary pump hold was released and
its process exited0. Production first-entry welcome appeared at651x1027. Next/Skip/reload suppression,
? replay and Escape worked; both dismissals restored scroll0. All5opening images were loaded.
Root visit94116ec2-0b0d-4da9-b9c7-4d6c33b789f5 is the live preparation walkthrough.

The first completed request produced2publications,4,061words including headings/alt,5publishedimages.
Settled cost4.110384; combined with prior attempts120.861414;unknown0. Every operation matched the
pinned mechanism. This is an interim volume/mechanical observation, not a literary evaluation.

## Actual preparation and warm entry

Ordinary reading in root visit94116ec2 queued preparationa41a6042-d9f6-457b-9052-6bb13184c802 at
20:20:53UTC, from first publication3d81106c, while publication8350c795 was already available ahead.
The browser continued paging normally and sent recent reading positions. The agent developed
The Back Label, work37e6ef40518cb332d5b65c8c9c3d32cb (full ID prefixed work-), and published its
Returns opening at20:36:24; the source link was saved at20:36:46. This took approximately16minutes
of background work; it does not establish that every opening will beat every reader's pace.

The actual source link appeared during reading without a manual reload. Clicking it entered
visitc8b4065e-4088-4d5d-a165-0f9e8877cd6a. Within the next observation5.5seconds later, all101prose
paragraphs and3images were present and loaded. This is an upper observation bound including tool
latency, not a network benchmark. No reader generation request was submitted for this warm entry.
Return restored root visit94116ec2 and the source blockb-d9d899cdb3efaae5736d, containing the exact
anchor “the same bottler in San Leandro” (offset164–195). The quote was on screen; the paragraph
started30.6px from the top. The prepared opening is opening-b3b9f3b434234b355853f9b0c0b2ae10.

The20-request run resumed at20:37:55 with request2decc7f9a-b434-42ab-98a4-1734fbd23ffe,
an ordinary root continuation. Preparation is tracked separately. It remains the agent's choice
whether any opportunity develops a nested opening, linear continuation, or neither. The observed
case demonstrates preparation of a nested illustrated opening while saved linear reading exists;
mechanical tests separately establish reuse of a continuation published ahead of a waiting request.

At21:11UTC the still-open root reader contained all4rootpublications and9loadedimages after
request2 completed. No manualreload or readernavigation occurred. The saved source paragraph
remained at30.566px and scrollY1168.75, exactly matching the earlier return observation. No alert
was visible. Thus newly saved continuation arrived through the ordinary reading refresh without
moving the existing reading place. This continuation was created by explicit request2, not by
preparation; that distinction is preserved in the ledger.
