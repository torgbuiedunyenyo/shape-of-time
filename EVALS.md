# Shape of Time — Prototype Proof Model

This document defines what must be demonstrated before the illustrated hyperbook prototype can be
called good, connected to paid generation, or released. It is intentionally small: evidence comes
from readers, a real browser, real persistence boundaries, and recorded provider contracts—not
from a committee of model judges.

## Release rule

The prototype passes only when every applicable gate below has current evidence for the same commit.
An unrun gate is not a pass. A blocked gate blocks the release.

The order matters:

1. Establish the application, real Postgres, private bucket, and health route on the designated
   Railway prototype from the first executable commit. **Complete.**
2. Build the **Reader-first vertical slice** and prove it as one coherent reading object.
3. Pass the **In-app Browser and consecutive-reading delight gate** before connecting generation.
4. Prove the Fable and image provider contracts under explicit spend ceilings.
5. Connect **Simple pagewise generation and real cold paths** before speculative preparation.
6. Perform **Incremental garden expansion and deployed release QA** only after the core experience
   works.

An early healthy deployment proves only the runtime and infrastructure boundary. It is not a
reader-first-slice pass, provider pass, literary pass, or release.

If the slice is not worth reading and exploring, stop. Generation and a larger garden are not
remedies for an unpleasant reader.

## Evidence standard

Each gate report records:

- commit SHA, environment, viewport, browser, and fixture/content digest;
- the exact journey or command run and its result;
- screenshots or recordings where appearance or interaction is the claim;
- timings, model IDs, token counts, usage, and cost where applicable;
- every observed failure, including failures fixed during the run;
- the final PASS, FAIL, or BLOCKED judgment and the person making it.

Store feel-gate and release evidence under docs/qa/ by date. Tests introduced for a behavior must be
observed failing for the intended reason before the implementation makes them pass.

## 1. Reader-first vertical slice gate

Generation and provider credentials remain disconnected from the reader runtime for this gate.
Bounded editorial calls may author the checked-in prose and images, but reading the slice performs no
network request or paid operation.

Required proof:

- Eight finished root folios complete one compressed but intelligible movement from Payment through
  Jay's informed yes. They do not compress the later six-part arc or pretend the root book ends.
- The exact phrase “The maps were always becoming wrong” opens the independent two-folio child
  *The Map on the Wall*. Eniola's Lagos ferry movement makes Phantas Minor materially consequential
  and reaches a public, contested trace without replaying Jay and Tan.
- Four actual reader plates use the approved Treatment B medium and perform distinct narrative jobs.
- The file-backed fixture, Library, cover, reader, navigation, and cold-path demonstrations ship in
  the same slice. There is no database seed, provider call, or fake generated child in this gate.
- The sole visible suggested phrase opens its real prepared destination. Unprepared phrases remain
  ordinary prose.
- Prose and image share narrative work. An image adds place, evidence, relationship, contradiction,
  atmosphere, or deliberately unspoken information; it does not merely paraphrase nearby text.
- A fresh reader can open the cover, read all ten folios, explore laterally, and return to the exact
  root phrase without instructions from the builder.
- There is no title-page auto-advance, global generation banner, dead Next action, stranded child
  book, generic loading takeover, or unexplained control.

PASS requires an in-app Browser walkthrough on desktop and a mobile-sized viewport plus a
consecutive human read. Any comprehension or interaction break is a failure to repair before paid
generation is connected to the reader runtime.

## 2. Complete reader-first journey

A clean session must complete this sequence:

1. Open the library and deliberately open the Shape of Time cover.
2. Read multiple folios and use Next, Previous, keyboard arrows, and swipe.
3. Open a suggested phrase into a prepared book.
4. Use Back to passage and return to the exact source phrase and reading position.
5. Select arbitrary text on a later folio and invoke Open as a book.
6. Remain in the source reader while an honest confirmation explains that dynamic creation is not
   connected in this slice. Do not invent a child, start a timer, or make a network request.
7. Filter the shelf by an existing title.
8. Explicitly choose Create a book called … for a missing title and see the same honest disconnected
   confirmation; typing alone must never spend.
9. Bookmark, reload, and resume the exact book, folio, and place.
10. Finish the available root or child movement without a terminal fiction that the book is over.
11. Return to the shelf from either book.

The journey fails if a mechanic exists only as an isolated demo, if navigation state is duplicated,
or if an auth wall or generic spinner replaces the reading surface.

## 3. Literary reading gate

Literary quality is judged by consecutive human reading, not isolated excerpts or automated style
scores.

For the reader-first slice, read every root folio and prepared child in order. For generated prose, use
one uninterrupted run of at least eight consecutive folios from the same prompt version; do not
cherry-pick or splice candidates.

At least two fresh readers independently record:

- what physically happened and why;
- what the central characters wanted and what changed;
- any passage they could not interpret;
- any repeated pseudo-literary, meta-referential, abstract, or allusive mannerism;
- any coined thematic label, unclear referent, narrator self-grading, or aphorism-shaped claim that
  substitutes performance for a concrete event, thought, or consequence;
- whether they wanted to turn the next page, and why.

For the prepared child, readers must also be able to state its local premise, how it grew from the
founding phrase, what changed during its movement, and why it does not replay the Jay and Tan trajectory
or collapse into an encyclopedia entry. Across the slice and later generated reading, readers judge whether the
world feels larger than one couple, Oakland, and a binary past/future corridor.

PASS requires that readers can accurately paraphrase events, motives, and consequences; no reader
finds the run broadly unintelligible; and the project owner judges it worth continuing. A repeated
failure may motivate one targeted prompt change followed by a blinded rerun. Automated checks may
prove that the compact prose-guidance block is present, singular, and correctly placed; they may not
certify prose quality with vocabulary regexes or a style score. Do not add a tribunal, ban-list
accretion, generated style exemplar, or fallback writer.

The compact human-authored prose-guidance block and explicit temporal-rules block are present from
the first baseline. The first protects directness and legibility without supplying a voice to copy;
the second protects world physics. The three adapted, human-selected craft examples remain absent
from that baseline. They may be tested only as one complete, versioned A/B after consecutive reading
identifies placeless abstraction, above-the-scene reporting, or explanatory summary as a repeated
failure; the beat, history, and every other prompt input remain fixed.

## 4. Actual reader plates gate

Review all four actual reader plates together in their folio layouts and side by side at reading
size, not only as individual full-resolution images. They must cover recurring Jay/Tan identity,
Oakland material life, the root map, a non-root Lagos center outside Oakland or the Bay Area, and
visible Phantas Minor consequences.
For editorially authored slice plates, Fable's image direction and the application's ordered
prior-image references remain separately inspectable as checked-in provenance. The production
adapter proves the same separation again when dynamic generation is connected.

PASS requires stable character and location identity, legible intentional changes, consistent
medium, useful composition beside the prose, and meaningful narrative contribution. Every approved
image has accurate alt text. Rejected images cannot become reference anchors merely because they
were generated first. An 8–12-image matrix is a conditional diagnostic after an observed identity,
place, or purposeful-change failure; it is not a prerequisite for this gate.

## 5. Exact navigation and reader state

One navigation state machine owns page turns, apertures, browser history, bookmarks, and reload.

Real-browser tests and the manual journey must prove:

- browser Back never pushes a new history entry;
- Back to passage restores source book, folio, exact span, and practical reading position;
- return still works after reload, responsive reflow, and a later-page or cross-paragraph selection;
- Next and Previous neither skip nor duplicate folios;
- cover, first folio, and movement boundary are stable states rather than transient flashes;
- bookmark/resume and discovered shelf entries survive reload;
- book-scoped creation status never leaks onto another book.

An approximate return to the right chapter or the top of the right folio is a failure when an exact
source span was recorded.

## 6. Latency and calm-loading gate

Measure at least ten expected turns and ten prepared-aperture openings in the release environment.

- Prepared page turn: under 250 ms P95.
- Prepared aperture: under 500 ms P95.
- Cold action acknowledgment: visible within one second.
- Normal reading: no token streaming and no full-reader loading replacement.

Record text/image generation latency, prefetch hit rate, and unused prefetched work. A cold
generation may take longer, but its state must be quiet, honest, book-scoped, recoverable after
reload, and must not imply that content is ready before it is.

## 7. Accessibility gate

Automated checks supplement, but do not replace, manual keyboard and screen-reader-oriented review.

PASS requires:

- all controls have accessible names and visible focus;
- the complete prepared journey works without a pointer;
- selection actions are reachable by keyboard and touch;
- focus remains stable across page turns, dialogs, Back, and Escape;
- reduced-motion preference is honored;
- contrast, text sizing, zoom, reflow, and mobile composition remain readable;
- narrative images have useful alt text and decorative elements are hidden appropriately;
- live creation messages are announced without repeatedly interrupting reading.

## 8. Dynamic atomic exposure, idempotency, and spend

This gate becomes applicable only when dynamic generation is connected. The static slice neither
claims nor needs it. These claims then require integration tests against a real test Postgres
instance.

Tests must prove:

- repeated duplicate actions reserve one book/folio task and purchase at most one attempt;
- one process claims a paid operation atomically before dispatch;
- a folio becomes ready only when its required prose and image assets are valid;
- exposure is one atomic transition;
- exposed prose, layout, aperture source spans, and required asset IDs cannot be mutated;
- a failed unseen folio may be retried without changing an exposed folio;
- repeated highlight, title, refresh, and prefetch actions preserve the same idempotency identity.
- root and child books cross a movement boundary from the changed state without chapter-sized
  generation, replay, or a terminal interstitial.

Leases, fencing, and overlapping-worker recovery are required only if the deployed topology or an
observed recovery failure introduces overlapping workers. They are not prerequisites for the
reader-first slice or the first one-process generator.

Mocks may test pure decision logic. They cannot prove database locking, transactionality,
uniqueness, provider behavior, browser geometry, or object-storage durability.

## 9. Provider and 400k contract

Every accepted prose attempt must record and verify:

- served writer is Claude Fable 5;
- effort is xhigh;
- no Opus, alternate writer, repair model, or provider fallback was used;
- result is nonempty and not refused or truncated;
- prompt version, ordered context blocks, source digests, model response ID, usage, latency, and
  cost.

The total Fable context ceiling is 400,000 tokens. With a 32,768-token output reserve and a
4,096-token safety margin, counted input must not exceed 363,136 tokens. Count the complete
multimodal request using the provider-supported token counter before spending. Character estimates,
recent-page windows, summaries, cache discounts, or provider compaction cannot make an over-limit
request pass.

A live contract test, run only after an explicit spend ceiling is recorded, proves the current
provider accepts Fable with xhigh and reports count/usage as expected. Recorded fixtures cover
ordinary CI afterward, but a replay fixture does not prove the live provider contract.

Every accepted narrative image attempt records the exact requested GPT Image 2 snapshot, reference
assets, prompt version, provider request ID, usage when returned, latency, pricing version, a
usage-derived total-cost estimate when every component is priced (or explicit unavailable
components), and output digest. Estimated cost is not provider-billed cost. The served model is not
exposed by the Image API, so requested-model provenance must never be presented as provider-reported
evidence. Missing required references, malformed output, moderation failure, or an unprotected sole
copy is a failed attempt. An ambiguous dispatch remains indeterminate and is not automatically
retried.

## 10. Integration and in-app Browser release gate

The release suite includes:

- real Postgres migration and repository tests from an empty database;
- atomic-claim, duplicate-idempotency, indeterminate-dispatch, and immutable-exposure tests;
- overlapping-worker concurrency recovery only when its measured topology trigger fires;
- real HTTP tests through the application composition root;
- real-browser automated tests for geometry, selection, history, keyboard, touch, and reflow;
- explicit live provider contract tests under a recorded spend cap;
- a clean-session walkthrough in the Codex in-app Browser on desktop and mobile-sized layouts.

Playwright or another test runner may support repeatable browser tests, but it does not replace the
final in-app Browser feel gate. The final walkthrough repeats the complete reader journey against
the exact deployed commit and records screenshots, timings, content/model evidence, and human
reading notes.

## Result semantics

Use exactly these judgments:

- PASS — the named evidence exists and satisfies every criterion.
- FAIL — the behavior or evidence violates a criterion, including flaky or non-reproducible
  results.
- BLOCKED — a named external prerequisite is unavailable and no safe in-scope alternative can
  produce the evidence.

BLOCKED is not a waiver, and it does not permit later gates or release. Record the blocking
condition, attempts made, owner, and concrete unblock condition. Missing credentials, missing test
binaries, skipped tests, unavailable humans, absent screenshots, or a command that never ran cannot
be reported as PASS.

Never make a gate green by weakening its assertion, widening an allowlist, changing the fixture to
avoid the defect, silently excluding an environment, or replacing a real boundary with a mock. Fix
the product or report the failure honestly.
