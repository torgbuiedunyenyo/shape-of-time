# C1 reader-first delight gate

_Date: 2026-07-19_  
_Status: PASS._

## What was exercised

The final file-backed slice was opened in the Codex in-app Browser at
`http://127.0.0.1:4173`. The walkthrough began from a clean Library entry and read all eight
Shape of Time folios consecutively. It opened “The maps were always becoming wrong,” read both
folios of The Map on the Wall, returned from the second child folio to the exact source phrase, and
finished the root movement.

The same run exercised:

- Library entry and discovery of the child book;
- button page turns and keyboard ArrowRight page turns;
- the exact aperture and Back to passage after a child page turn;
- bookmark state, reload persistence, Library resume, stable block hash, and focus restoration;
- local title filtering, a missing title, the distinct explicit creation affordance, the honest
  disconnected modal, close, and focus return;
- all four final narrative plates and their alt text; and
- console warnings/errors and narrative-asset responses.

The exact Back return placed the active aperture at 325 CSS pixels in a 720-pixel viewport after
restoring scroll position. The Library resume returned to
`root-folio-08#root-folio-08-block-01`, focused that stable block, and retained the bookmark.
All four digest-named WebPs returned HTTP 200. No reader console warning or error occurred.

## Consecutive reading

The root movement is direct and causally legible. Jay and Tan's attraction, the band recording,
the venue conflict, repair, route questions, and informed yes accumulate rather than reset. The
images establish the shop, recording, material chart, and public Lagos evidence without restating
the prose. The child is recognizably independent: Eniola's witnessed correction, physical crossing,
suspension, and public traces form a complete small movement. Both rests create a concrete desire for
the next folio rather than pretending either book has ended.

The run found none of the rejected house style: no meta-narrator, generated-literature title,
philosophical fog, recursive allusion, or unexplained paradox machinery. A few world terms remain
un-glossed, but actions and stakes make their local meaning usable.

## Findings and repairs

1. **Aperture punctuation — fixed.** At desktop width the period after the founding phrase could wrap
   alone onto the following line. The renderer now places adjacent punctuation inside the
   accessible-name-stable aperture control. The focused browser journey regression proves the button
   reads “The maps were always becoming wrong.” while its accessible name remains the exact quote.
2. **Credential referent — fixed.** “Mrs. Adeyemi … her credential number” made the suspension appear
   to belong to the passenger. The production fixture now says “Eniola's credential number” and
   records that single copyedit without altering private provider evidence.

No other comprehension or interaction break warranted a code or prose change.

## Tool-surface limits

The in-app Browser's pointer driver did not create a native selection after three bounded,
coordinate-verified attempts. The existing browser regression constructs a real cross-paragraph DOM
selection and verifies the Open as a book modal and its no-request language. The current Browser
viewport capability also reported success but remained at 1280×720 after two reset/set attempts.
The same reader shell had already passed an in-app 320-pixel visual checkpoint before final content
assembly; the complete post-assembly automated suite rechecks 320-pixel overflow, bookmark state,
dialog reachability, reduced motion, and swipe behavior. These are recorded automation-surface
limitations, not silent claims of interactions the tool performed.

## Result

The reader-first delight gate passes. The owner delegated subsequent implementation judgments rather
than requiring another confirmation pause. No dynamic generator is connected in this checkpoint.
