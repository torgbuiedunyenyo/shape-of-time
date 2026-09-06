# Nested reading and live recovery

Observed on production revision 3a10a6c176f72abc541d7c045c97bbf2aa4f1252, Git-triggered
Railway deployment 8008c018-7235-4269-af19-ec28b689af0b. This extends the first-reading evidence;
it does not establish long-form success. The full new corpus and provider receipts remain in
Railway's `world` schema and asset namespace. Original artistic sources and selected models unchanged.

## What was actually read

The development agent read both root drafts, both Under the WASH Sign drafts, Tere & Audrey's
published first section and both drafts of its second section, plus all three contextual reviews.
All nine final illustrations across the three works were visually inspected. Astra authored and
revised the work; no developer spliced prose, supplied nested synopses, or published manually.

The child began from an actual rectangle selected around the lounge attendant and travelers in the
root image. The grandchild began from actual selected text about Dimas's folded wedding program.
Neither request supplied a desired plot. Tere & Audrey develops the marriage and community through
Audrey's perspective. It gives independent interest to a remembered event without resolving the
parent's interrupted journey or supplying its narrator with knowledge she lacks.

The wedding critic (document 5f7ea6c3-6b56-42e7-ac87-95852982facd) inspected the source prose and real
images. It found no material source/logistics contradiction, distinguished a promised photograph
from its delivery, and identified two useful weaknesses: a generic unnamed reading and narration
that announced an already visible contrast. The author revised the second section accordingly
(document dd087022-89d1-439f-9e8f-dbb16806cc49; publication342b69a2-7997-404e-877c-9ba7d7a752f3).
The developer agrees these are grounded observations; this is not an independent guarantee that no
other errors exist. The actual portrait supports the blue dress, ivory/orange suit, Dimas's cap and
family resemblance. Before criticism, the author also inspected and corrected an unwanted date and
Dimas's hair in the ceremony image.

The wedding is warm and specific. The lounge child introduces a different stake and first-person
perspective; its cadence remains closer to the root than its changed speaker might suggest. These
are promising openings. Sustained root development and post-renewal continuity remain untested here.

## Reader observations

The real in-app journey entered all three works from source controls, with page turns, font changes,
reload and width changes between1000px and390px. On3a10 the sticky Return control remained visible.
Returning from the wedding placed the folded-program quote in view within paragraph
b-0efd732eb9f190ccb30c. Returning from that child placed the selected lounge-image region in view
within b-01c5a2ee18a86f74ed2a. This used the actual source stored on each visit.

The library lists the saved wedding request with its exact quotation; Resume reopens its saved
visit. New second-section material appeared without waiting for the author turn to finish.
Saving a reading place changed the control to Saved. Reflow390→1000 and reload preserved the
same first-section paragraph b-55fe45b3aafb76f82084, with identical desktop top position after reload.
The production controls supplement20 passing mechanical tests; they are not inferred from DOM
presence alone. Visits created before this release lacked the new entered-request marker, so their
ready panel appeared once on return. Entering once through the released control recorded it;
subsequent return kept that panel closed. No generation was needed for these repeat entries.

Observed first-publication waits: root27m14s including initial provider-retrieval repair,
child30m06s, wedding roughly9min. N=3 different contexts and implementation states, not a latency
benchmark. The wedding continued authoring after its first publication. Reader-wait context was
added before it, but this observation does not establish causality. Bounded preparation is initially
disabled; its effect still needs live observation.

## Forced interruption

See tests/receipts/astra-restart.json for the small receipt. On revision31b3217, a forced process
restart was requested while background response resp_07d55e4c2e541ade006a9cef1d772487d0a12f60931d7884a4
was in progress. The Railway CLI reported an error, but service logs show termination04:42:32.125UTC
and restart04:42:33.234UTC. Readback retained the same operation and provider IDs.

At04:44:48.641UTC that operation completed and wrote second-section draftcaa13e11-4f56-48d8-
86d3-866524751768. Exactly one saved tool receipt exists for its write call. No replacement request,
manual resume or publication was submitted. This proves that concrete background-response recovery
path. It does not prove that every ambiguous direct image purchase can be recovered; those remain
paused for reconciliation rather than being automatically repeated.

Follow-up on revisionb920956: the bookmark initially lost ancestry, despite preserving its text
position. The regression reproduced this and the fix retained the visit's original parent/source.
In production, Save place → library saved passage reopened visitf7ce6c60-d964-49d9-95ec-
029a80499ad1 with Return available; it returned through the program to the root image.
Three adjacent paragraphs could also be selected as a single exact exploration quote, without
submitting a generation request. While the root continuation was pending, opening another image's
exploration panel hid the continuation status; that separate state defect was reproduced and is
being corrected in the next release.

On eec8fddb7b837fbb50e3f8bca024a39ff969d88e, root continuation432dad7f-d219-4cf2-ab94-3f46ed642ddd
remained disabled with its pending status after choosing the pool image for exploration and again
after reload. No image exploration was purchased for that check. A prepared root→WASH opening then
created visit8389d3f8-b207-4925-9cc5-4d54cf71e96e; its actual Continue request is
8c015d8e-d085-4d70-ab8b-cc491d192e65. While that request waited, the prepared wedding-program link
opened visita77a4527-0834-46c8-9821-8d9eb5f13f15 immediately. Return reached the exact program
passage in8389d3f8. It did not steal focus to the root or lose the nested continuation.

First live preparation8a820cb7-c57e-40c5-94c5-ce712e7ad5dc began from actual visible root003 reading
at05:41:06UTC. Root Continue followed at05:42:08, WASH Continue at05:43:47. On seeing both requests,
the author saved notes/prepare-8a820cb7.md (document85f87088-82cb-464a-8c0a-11b17449783e) and yielded
without publishing speculative fiction. The note explicitly distinguishes a considered Dee branch
from canonical events. Root continuation then started; WASH waits next. This demonstrates queue
awareness and restraint, not a warm continuation or a measured reduction in frontier latency.
The developer had already read the chapter and navigated faster than ordinary sustained reading.
A useful prepared continuation remains to be observed without prematurely requesting it.
