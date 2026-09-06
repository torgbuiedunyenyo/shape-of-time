# Initial reader edition walkthrough

This is a mechanical reading-interface walkthrough and preparation record, not a new literary
review. The author will assess the fresh edition. The earlier development study remains separate.
Live creative process: ca6ef9d, mechanism
`2a816eaad04ffb8f85cac75dcb7159af1b26f8070680fd11d9728edd3e1aa9c2`, schema
`world_reader_20260906`. Only documentation has changed since that pin.

## Preparation and actual scope

“About 50 steps” is being interpreted as roughly 50 reading screens, after the unanswered unit
clarification and the explicit author/reader terminology correction. The estimate uses the actual
651×1026 in-app viewport at default text size. It varies with window and font size, and was never
supplied to the creative agent as a required length. Preparation uses ordinary reader requests.

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

## Pending completion

The nested opening and root continuation are still generating. Enter the published nested work
through its saved source, verify return, and use an encountered source for deeper nesting if
useful within the initial reading scope. Record final publications, screen measurements, budget
and remaining operations here. Do not add a further operator critique or literary refinement.

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
