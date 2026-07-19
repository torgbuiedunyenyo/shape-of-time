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
   Railway prototype from the first executable commit.
2. Prove the complete static garden is pleasurable with generation disconnected.
3. Prove the reader journey and exact navigation in the in-app Browser.
4. Prove the text and image provider contracts under an explicit spend ceiling.
5. Connect pagewise generation, prefetch, and cold apertures.
6. Repeat the complete journey against the deployed prototype.

An early healthy deployment proves only the runtime and infrastructure boundary. It is not a static
garden pass, provider pass, literary pass, or release.

If the static garden is not worth reading and exploring, stop. Generation is not a remedy for an
unpleasant reader.

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

## 1. Static garden gate

Generation and provider credentials remain disconnected for this gate.

Required proof:

- The first root Shape of Time movement has a complete local change and contains the approved
  illustrated folios; the following prepared folio proves that Next can cross a movement boundary
  without replay, reset, or a terminal interstitial.
- Each prepared child has its own founding premise and complete opening movement. At least one child
  also crosses into a following movement, and none merely continues the parent scene or replays the
  root plot.
- The prepared garden collectively includes a central perspective other than Jay or Tan, a primary
  setting outside Oakland or the Bay Area, and a story in which Phantas or Mystas materially changes
  the place, movement, causation, or stakes.
- Every visible suggested phrase opens a real prepared destination.
- Prose and image share narrative work. An image adds place, evidence, relationship, contradiction,
  atmosphere, or deliberately unspoken information; it does not merely paraphrase nearby text.
- A fresh reader can open the cover, read, turn pages, cross a movement boundary, explore laterally,
  and return without instructions from the builder.
- There is no title-page auto-advance, global generation banner, dead Next action, stranded child
  book, generic loading takeover, or unexplained control.

PASS requires an in-app Browser walkthrough on desktop and a mobile-sized viewport plus a
consecutive human read. Any comprehension or interaction break is a failure to repair before paid
generation work begins.

## 2. Complete reader journey

A clean session must complete this sequence:

1. Open the library and deliberately open the Shape of Time cover.
2. Read multiple folios and use Next, Previous, keyboard arrows, and swipe.
3. Open a suggested phrase into a prepared book.
4. Use Back to passage and return to the exact source phrase and reading position.
5. Select arbitrary text on a later folio and invoke Open as a book.
6. Remain in the source reader while the cold child is being created; enter only when its opening
   folio is atomically ready.
7. Filter the shelf by an existing title.
8. Explicitly choose Create a book called … for a missing title; typing alone must never spend.
9. Bookmark, reload, and resume the exact book, folio, and place.
10. Finish a movement, use ordinary Next to enter the following movement, and verify that it begins
    from the changed situation rather than restarting the prior tension.
11. Stop at a later movement boundary or open an available aperture, then return to the shelf.

The journey fails if a mechanic exists only as an isolated demo, if navigation state is duplicated,
or if an auth wall or generic spinner replaces the reading surface.

## 3. Literary reading gate

Literary quality is judged by consecutive human reading, not isolated excerpts or automated style
scores.

For the static garden, read every root folio and prepared child in order. For generated prose, use
one uninterrupted run of at least eight consecutive folios from the same prompt version; do not
cherry-pick or splice candidates.

At least two fresh readers independently record:

- what physically happened and why;
- what the central characters wanted and what changed;
- any passage they could not interpret;
- any repeated pseudo-literary, meta-referential, abstract, or allusive mannerism;
- whether they wanted to turn the next page, and why.

For every prepared child, readers must also be able to state its local premise, how it grew from the
founding phrase, what changed during its movement, and why it does not replay the Jay and Tan trajectory
or collapse into an encyclopedia entry. Across the garden, readers judge whether the
world feels larger than one couple, Oakland, and a binary past/future corridor.

PASS requires that readers can accurately paraphrase events, motives, and consequences; no reader
finds the run broadly unintelligible; and the project owner judges it worth continuing. A repeated
failure may motivate one targeted prompt change followed by a blinded rerun. Do not add a tribunal,
ban-list accretion, generated style exemplar, or fallback writer.

The explicit temporal-rules block is present from the first baseline because it protects world
physics rather than imposing a literary voice. The three adapted, human-selected craft examples
remain absent from that baseline. They may be tested only as one complete, versioned A/B after
consecutive reading identifies placeless abstraction, above-the-scene reporting, or explanatory
summary as a repeated failure; the beat, history, and every other prompt input remain fixed.

## 4. Image sequence gate

Before production plates are approved, review an 8–12-image continuity sequence containing:

- a recurring root character across changes of pose, scale, clothing, lighting, and time;
- a non-root central figure and a primary place beyond Oakland;
- two materially distinct future cultures rather than one generic future style;
- a place where Phantas or Mystas has visible material consequences;
- at least one recurring location seen from materially different views;
- a book-local object or open visual fact whose continuity matters within that book without becoming
  global canon;
- one purposeful change that must not be mistaken for drift;
- a parent or neighboring image used as a reference for a new scene.

Review the sequence side by side at reading size, not only as individual full-resolution images.

PASS requires stable character and location identity, legible intentional changes, consistent
medium, useful composition beside the prose, and meaningful narrative contribution. Every approved
image has accurate alt text. Rejected images cannot become reference anchors merely because they
were generated first.

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

## 8. Atomic exposure, idempotency, and spend

These claims require integration tests against a real test Postgres instance.

Tests must prove:

- concurrent duplicate requests reserve one book/folio task and purchase at most one attempt;
- a crash between reservation, provider completion, asset storage, and publication resumes safely;
- a folio becomes ready only when its required prose and image assets are valid;
- exposure is one atomic transition;
- exposed prose, layout, aperture source spans, and required asset IDs cannot be mutated;
- a failed unseen folio may be retried without changing an exposed folio;
- repeated highlight, title, refresh, and prefetch actions preserve the same idempotency identity.

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

Every accepted narrative image attempt likewise records the requested and served GPT Image 2 model,
reference assets, prompt version, usage, latency, cost, and output digest. Missing required
references or an unexpected served model is a failed attempt.

## 10. Integration and in-app Browser release gate

The release suite includes:

- real Postgres migration and repository tests from an empty database;
- concurrent reservation, crash/retry, and immutable-exposure tests;
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
