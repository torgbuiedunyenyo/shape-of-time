# Initial reader edition walkthrough

This is a mechanical reading-interface walkthrough and preparation record, not a new literary
review. The author will assess the fresh edition. The earlier development study remains separate.
Live creative process: ca6ef9d, mechanism
`2a816eaad04ffb8f85cac75dcb7159af1b26f8070680fd11d9728edd3e1aa9c2`, schema
`world_reader_20260906`. The later client-only selection fix8379de5 does not change this pin.

## Preparation and actual scope

“About 50 steps” was interpreted as roughly 50 reading screens, after the unanswered unit
clarification and the explicit author/reader terminology correction. The estimate uses the actual
651×1026 in-app viewport at default text size. It varies with window and font size, and was never
supplied to the creative agent as a required length. Preparation used four ordinary reader requests, all now complete.

Final sample: **15,244 words including headings/alt text, eight sections, eight illustrations, three
works**. At651×1027, the complete root measures38,158px, The Loaner18,409px and The Receiving
Address17,866px: approximately72screens including interface space. All eight images loaded.
The ordinary output of the four requests was retained, without trimming fiction or requesting
more material to manufacture a screen count. Exact IDs/revisions are in
`tests/receipts/reader-initial-edition.json`. Every provider operation matches the pinned mechanism.

At19:05:36UTC, with no active provider operations, reader commitment was$22.053726, development
$94.697304 and combined$116.751030; unknown0. The reader allocation remains$55.302695, leaving
$33.248969. The author authorized exceeding the initial$150 if necessary; no increase was needed.

The actual Begin request was `685bfcad-6dae-48e5-a6f5-bac1fa9e8005`. First root publication arrived
at 17:46:04 UTC, about five minutes after submission. It occupied 10,108 px of document height,
including interface space, and contained one loaded illustration. Begin continued developing a
second section, published at 17:58:05; together the root measured 20,067 px, or about 20 screens.
These two publications contain approximately 3,839 words including headings and image alt text.
They are not claimed to establish long-form quality on their own.

The first nested request selected the orange-looped visitor phone in the actual opening image.
No premise, title or angle was supplied. The request queued at 17:48:43 and began around 17:59
after Begin ended. That roughly eleven-minute queue is a real limitation of the current single
creative run, distinct from the opening's own generation time. Published root content remained
readable throughout. The creative agent chose image generation before saving its nested draft.

A single root continuation, `ec290ce7-a716-4cd6-9725-947aab0e2a23`, was requested at 18:00:22
through Continue reading, and queued behind the nested request. Its pending message correctly
remained separate from the nested opening. No duplicate request was submitted to accelerate either.

## Reading behavior observed

The shelf was initially clean, without development visits, saved places or discoveries. The old
development root and image routes were unavailable. Open entered root visit
`a0f22e20-0f70-4d2e-a78b-cf54f206b65d`.

The root illustrations loaded at their intended proportions. Text was legible at the actual
narrow viewport, and controls remained accessible. Saving and reloading retained the visible
text block positions. Arrival of the second publication did not move the original image source:
block `b-417bc2c01bed4dcc1d6c` remained at 777 px from the viewport top in the measured view.

The image's Look closer → Choose a detail interaction saved a normalized region and returned a
truthful pending opening. Closing it left the source readable. The shelf retained the pending
opening with a link to its source; returning restored the pending dialog without losing the
root continuation. The Save place → shelf → saved passage round trip, using visible-coordinate
clicks for the sticky header controls, restored scrollY 1072.5 and the same source text block
positions. An earlier locator-driven header click had scrolled the browser; it was not treated
as evidence of a product position defect.

Source region for nested request `2ee1da0a-90f1-4dda-beef-1b66d3f33648`:
publication `ae3d5045-de5e-495f-99e1-c1ef478a43e2`, image block above,
asset `img-8b2bf0e1-c8d6-4ca0-8aa5-d7fa40d2067b`,
x .3788646086252746, y .7034339229968782, width .15222238739408356,
height .11162975075566128.

## Nested journey and completed requests

The Receiving Address published its first section, The First Stop, at18:50:40 UTC, publication
`c589de52-dcdf-47cc-8718-d2d079ecad37`, work`work-87d080f6543119a057fbda3cfd2ebc56`, document
`2af0e753-fc81-43e1-afee-3988dc7b6e09`. Entry through Your openings created visit
`bf34961b-588e-4156-bfae-5a725d7192d7`, retaining the Loaner parent visit. At651×1027 it measured
9,001px, with one loaded illustration inspected in its full image view. Root+child+grandchild
therefore provided about64screens at this point.

Reload preserved the grandchild visit and its return control. After opening/closing the actual
image, Return restored the selected Loaner passage: source block`b-2dc45cc63167b7fb8a68` appeared
at96.91px, with both selected paragraphs visible. A second Return restored the root phone region
center at99.83px. Both original visit IDs remained unchanged. The shelf retained all three
openings and source links. No new explicit narrative request was submitted during this check. The
ordinary reading heartbeat queued a preparation opportunity; returning to the shelf lets its
90-second freshness expire. A read-only
attempt to measure a glyph with NodeFilter was unsupported by the browser tool; the saved source
block's DOM position and actual screenshot establish the stated observation instead.

The root continuation finished around18:40 UTC. It published Tuesday at18:24:07 and The Forwarding
Card at18:38:23, after the creative agent's own image work and optional critique. No operator
literary intervention was added. With four root sections, the root measured38,158px at651×1027,
and all four images loaded. Root plus The Loaner provided about55screens. The queued deeper
opening began after that continuation completed. Its first publication therefore took about42minutes
from submission, including32minutes in the queue. Its second publication, The Second Photograph,
arrived at19:02:53UTC (813f65fb-abe4-4dc9-80f0-30bf2559d970, document
1145d2b2-828c-4050-b5df-c05e5e4121d4, receiving-address/002-the-second-photograph.md rev2).
Final continuity notes followed, and the request completed by19:05. No operator narrative feedback
was inserted. The complete grandchild measured17,866px with both illustrations loaded.

The Loaner published `loaner/001-seventeen.md` at 18:06:43, about eighteen minutes after the
initial request including its eleven-minute queue. Entering its saved opening created visit
`1219b5c1-f55d-404b-b7ef-dcb6375dc9b3`. Its first section measured 10,461 px at 651×1026, with
one loaded image. Returning through the visible Return control put the original phone region's
center at y=99.71 px (the reading reference line is 100 px). Shelf Resume reused the child visit.

Selected the two actual paragraphs beginning “Seventeen had been handed in that morning” and
ending “The export hadn't finished.” Their source starts at block `b-2dc45cc63167b7fb8a68`,
offset0, and ends at `b-1fe1a0cd6fcdb1106a6a`, offset54, in publication
`8dc9b143-4da6-4e3d-b130-a61caa96dcc3`. Deeper opening request
`2923d71a-d7c6-4b84-9d59-027b4dbf45e8` was submitted at 18:08:27, with no angle or premise.

The Loaner independently published a second section at 18:14:24, publication
`e2dce1fd-95ee-4475-afa9-6d0c9892ef50`, document `88f51665-e01d-4ed5-969b-23050f5c8329`,
loaner/002-the-recording.md rev2. The complete child measured 18,409 px at 651×1027, with two
loaded illustrations. No more explicit requests were submitted after the deeper opening.
Four stale unstarted preparation opportunities remain saved; no provider operation is unresolved.
These records are ordinary reading-context opportunities, not failed generation.

Prepared works are immediately readable. Cold generation and the serial queue remain a material
latency limitation. These mechanical observations do not establish novel-length or indefinite
coherence, or replace the author’s assessment of writing and visual quality.

## Selection defect found during the walkthrough

After submitting the deeper text opening, closing its panel and clicking Look closer, the dismissed
panel reappeared beneath the image and its pending status vanished. The browser still held the old
native text selection, and the image button's mouseup bubbled into the main text-selection handler.
The persisted request was unaffected; no replacement request was submitted.

The client-only fix clears the native selection when its panel is dismissed and ignores mouse/touch
events originating in reading controls when capturing text. It changes no source, prompt, server,
dependency or mechanism fingerprint. The existing edition stays intact.

The failure was reproduced through actual production controls before the change. With the fixed
interface against the same saved publications locally (generation disabled), selecting a passage
still opened its correct quote; closing it cleared the native selection; opening and closing the
illustration left the selection panel closed. This regression used no generation submission. The
30-test mechanical suite, typecheck, lint and build also passed. Deployment verification follows.
