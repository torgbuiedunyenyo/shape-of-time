# Story-facing interface and demonstrated controls — September 7

The cover now says “A love story.” Removed the “library unfolding” label and format manifesto,
including the footer. Navigation/catalogue use Contents. Image openings no longer carry an invented
generic description. Necessary waiting, reading and exploration instructions remain in context.

The guide demonstrates highlighting actual words from the opening passage, then reveals the
Open as a book control. Its image demonstration uses the actual first illustration and the same
region-outline style as real image selection: a visible pointer draws a box from corner to corner,
then the detail-opening control appears. These are inert rehearsals, not exploration submissions.
Each runs once in under four seconds; Replay demonstration restarts it. Reduced-motion CSS shows
the completed highlight/box without motion (reviewed in source; OS reduced-motion mode was not toggled).

Actual in-app browser walkthrough against the local reading interface and real persisted book:
- Cover displays “A love story.” and Contents, with no old format-description copy.
- Entered the root, opened the guide, used keyboard Next/Back through text and image demonstrations.
- Viewed highlighted words wrapping over two lines. Replay reset seven word backgrounds from 100%
  to 0%; the animation fills them sequentially and leaves the selected words visibly highlighted.
- Viewed the image box. Replay measured an initial 3.75px border box with opacity 0, then a
  139.24 × 95.03px region with opacity 1 after the pointer gesture.
- At 390 × 844 CSS pixels, text card was within x16–374 and y191–665. Image card was within
  x16–374 and y234–828; demonstration, replay and navigation controls fit. Viewport override reset.
- Finished the guide and returned to scrollY 0 at the opening. Reloaded that visit and confirmed
  the title remained The Shape of Time and the guide stayed dismissed.
- No demonstration invokes a generation callback, changes the live selection, or sends an intent.
  The local API had generation disabled throughout; no paid requests were submitted for this pass.

Reader history is browser-profile-local, stored in localStorage and scoped to the edition. The
shared server stores the book, not a global current reading position. Resume, visits, saved places,
font size and saved opening requests are read from local storage. There are no accounts or cross-device
sync. People sharing one browser profile share its reading history. The controls guide's dismissal
is also local to that profile.

A regression uses two independent real persistent Web Storage files across process reloads for the
same edition: reader A retains a root visit, bookmark, pending opening and dismissed guide; reader B
starts empty, enters a different work, and neither overwrites nor inherits A's history. This supplements
the existing real-storage edition-isolation test. All 46 tests, type checking, lint and build passed.

Only client source changed. The creative mechanism remains
21f659fcad3e8b385a7f72e60f892761c34fc95f86f9075752590ac57451ad90 (Astra medium).
Existing content and the stopped automatic sample are retained. Final Git deployment and release-hold
verification are recorded privately in .local/literature-release.json.
