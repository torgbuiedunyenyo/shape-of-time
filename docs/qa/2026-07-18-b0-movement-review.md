# B0 movement-topology review

**Status:** Structurally eligible; awaiting the owner’s consecutive read

**Date:** 2026-07-18

**Environment:** local worktree, Node 24.18.0

**Provider spend:** none

## Scope

This review covers the 14-folio first root movement, the first two folios of its successor, three
prepared child openings, and one prepared child successor. It does not review finished literary
prose, generated images, the reader interface, or live provider behavior. Those gates occur later.

The reviewed planning documents are:

- `content/prototype-movements.md`
- `content/prepared-children.md`

## Red evidence

The B0 test was written before either movement document existed. The first run was:

```text
mise exec node@24.18.0 -- node --test scripts/verify-movement-topology.test.mjs
```

One absence test passed and four implementation tests failed. The primary failure reported both
missing files:

```text
missing content/prototype-movements.md
missing content/prepared-children.md
```

The remaining failures were `ENOENT` reads of the same absent root document. This was the intended
red: no movement topology existed.

## What automation now establishes

The dependency-free Markdown audit verifies the allowed heading tree and order, exact movement and
folio counts, contiguous numbering, one exact root-folio citation per child, unique child titles and
origins, bounded natural-prose planning, the prepared child boundary crossing, a substantive
portfolio review, a distributed Phantas or Mystas anti-omission cue, and the absence of exact copied
planning blocks or code-shaped bookkeeping.

Its mutation suite rejects missing and reversed root movements, an extra root movement, unexpected
headings, deleted and skipped folios, a hidden fourth child, duplicate citations, one- and five-folio
child openings, reset and oversized successors, invented or misattributed parent phrases, repeated
origins, copied movement briefs, copied root folios, a missing or empty portfolio review, an axis
mentioned only in the portfolio, and anchored state-record fields.

The audit deliberately does not claim to prove motive, causality, geographic range, viewpoint,
image usefulness, or material temporal consequence. Literal character and place keyword checks were
removed after adversarial review showed that they both rejected legitimate cross-reference and
allowed paraphrased root replay. Those questions belong to a consecutive read.

## Adversarial review and repairs

The first root read returned REVISE. It found that Jay’s final yes had no positive cause, Tan and Jay
repeated the same moral lesson, several folios still contained placeholders, return mechanics had
been confused with admission sponsorship, the crossing had been compressed into a montage, two
apertures sounded planted, and several images repeated the prose. The revision added a concrete
late-rush meeting, bus-stop error, shop cleanup, laundromat evening, company-sponsored admission,
an independently held return booking, Jay’s stated desire to know Tan’s home, an actual Oakland work
obligation, company-authored paperwork, and a crossing that remains in progress after folio 16. It
also replaced the planted phrases with ordinary material language and reassigned image facts.

The first child read also returned REVISE. It found no earned mechanism for the Blue Badges takeover,
several paraphrasing images, an accidental conflation of lagoon water with temporal currents, a
forced visual concealment of Clef, and too many images per child opening. The revision established a
bounded tour operator and roster-lock cost, separated spatial ferry movement from the temporal
vector field, allowed Clef to be realized at root-book scope, gave every image distinct withheld
information, and made folio 03 text-led in each child. Every four-folio child opening now calls for
three images.

The first validator review returned REVISE. It demonstrated false greens for missing H1s, reversed
and extra movement sections, a hidden fourth child, duplicate citations and briefs, and a merely
nominal axis. It also showed that forced phrases such as “experiential center” and “within this
lineage” recreated the code-shaped literary planning the project rejects. The validator was
rewritten around strict document topology, exact origins, ranges, bounded prose, and copying. Its
remaining axis check calls itself an anti-omission cue and expressly leaves material consequence to
the human gate.

Fresh independent reads of the repaired root and children both returned PASS. A final validator
review found four narrow holes: an omitted axis cue in the portfolio, headings hidden in document
preambles, an empty child title, and a one-line JSON record. Each received its own failing mutation
before the parser was repaired. The final validator review returned PASS. Two cautions carry into C0:
the later recording in root folio 05 must remain evidence rather than fate, and root folio 07 should
show the shop’s intervening life instead of explaining the one-person temporal rule.

## Current automated result

The focused audit and mutation suite pass:

```text
Shape of Time movement topology is structurally eligible for human review.
tests 9
pass 9
fail 0
```

The final reviewed artifact digests are:

```text
45cb20ac35d469e58a150012b7c6c99bca4838ee8ffbf94c2b15dab620636393  content/prototype-movements.md
79e620c1fdc0561dc343c4a464661f7abaaf67b83ae2ed49953aab2c0f624ee0  content/prepared-children.md
41f174e5c826312aec1315421aad399294858de71a2aee9b67855263cfd405c3  scripts/verify-movement-topology.mjs
a7bc1db86408d4b76da2185506c5640e79950593ceb80b672e8abc623aab8dd3  scripts/verify-movement-topology.test.mjs
```

The exact-runtime repository gate passed after the authority and handoff state were updated:

```text
mise exec node@24.18.0 -- npx -y pnpm@11.15.0 run gates
content/architecture: 30 passed
unit: 12 passed
real-Postgres integration: 20 passed
built-reader Chromium regression: 1 passed
lint, typecheck, and production build: passed
```

## Consecutive-read gate still required

The owner should read the root folios 01 through 16 in order, then each child opening and the Map
successor in order. The read should answer, from the notes rather than outside explanation:

- What happens on every folio, and what causes the next one?
- Why do the central people act, and what concretely changes by each movement boundary?
- Why do Jay and Tan enjoy each other, and why does Jay choose to travel?
- Could Jay return legally without Tan, and what practical dependence remains?
- Does every child have a local premise and an earned resting point?
- Does Phantas Minor materially alter the Lagos commute and its stakes?
- Does each planned image contribute information the prose intentionally leaves to it?
- Do the opening phrases feel native to the parent scene rather than planted as links?
- Is any beat filler, a lore entry, a disguised choice, a fake cliffhanger, or generated-sounding
  abstraction?

B0 is not a human PASS until that read is complete. B1 must not begin merely because the structural
audit is green.
