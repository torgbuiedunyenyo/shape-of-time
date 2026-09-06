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
