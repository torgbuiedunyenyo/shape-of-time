# B0 movement-topology review

**Status:** Revised after the owner's consecutive read; awaiting owner reread

**Initial date:** 2026-07-18

**Latest revision:** 2026-07-19

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

## Owner review revision

The owner's consecutive read returned REVISE on 2026-07-19. The folio bodies seemed sound, but two
surface problems blocked approval:

- "later-Primas Lagos" treated a relative position as though it were a named era; and
- many folio and movement titles used self-conscious, pseudo-literary abstraction instead of naming
  the scene.

The canon identifies Primas as the familiar past/future axis but does not assign either relation to
Major or Minor. The revised notes therefore describe travel between named coordinates along Primas
without inventing "later Primas," a futureward direction, or a global past/future. Related planning
language for Oakland, Stepney, Recife, and Tan's home now uses the same coordinate-relative frame.
The visual bible and B2 review criteria use that frame as well, and the A0 authority test now requires
the explicit statement that past and future describe travel along Primas rather than kinds of era.

The heading pass preserved "Your tomorrow or mine" and "Yesterday's safe route," which the owner
identified as acceptable. Other headings now use the event, place, object, or action on the folio:
"Late shift," "Payment," "The bus stop," "Thursday," "Laundry," "The application," "The terminal
wall," and "The offer" are representative. No folio body was re-plotted.

A new test captured the requested coordinate wording and direct prototype title set before the
documents changed. It failed with the complete old-versus-new root title diff, then passed after the
revision. This test protects the reviewed fixture; it is not a general literary-quality heuristic.

## Current automated result

The focused audit and mutation suite pass:

```text
Shape of Time movement topology is structurally eligible for human review.
tests 10
pass 10
fail 0
```

The final reviewed artifact digests are:

```text
2f48dbaf9649d2d290c2b3bafa2ea3fd1777e9e147f549dece5446768b7c413d  content/prototype-movements.md
a993ce5393eff75003bbf367c6e5298b12397ff6e59cdee3498e290c462f64e4  content/prepared-children.md
41f174e5c826312aec1315421aad399294858de71a2aee9b67855263cfd405c3  scripts/verify-movement-topology.mjs
1151deb93cdb8a1a301e2b0f39826ccc7a3ee5b24408436d377f97759d75daba  scripts/verify-movement-topology.test.mjs
```

The exact-runtime repository gate passed after the authority and handoff state were updated:

```text
mise exec node@24.18.0 -- npx -y pnpm@11.15.0 run gates
content/architecture: 31 passed
unit: 12 passed
real-Postgres integration: 20 passed
built-reader Chromium regression: 1 passed
lint, typecheck, and production build: passed
```

## Owner reread still required

The owner has read the root and child folios and found the bodies broadly sound. The remaining read
is the revised heading set and coordinate language in context. It should confirm that:

- Primas coordinates remain relational rather than eras labeled past or future;
- no Major/Minor direction has been invented for Primas;
- each changed title names the scene without sounding like commentary on its meaning; and
- the two intentionally less literal titles still feel earned in context.

B0 is not a human PASS until that read is complete. B1 must not begin merely because the structural
audit is green.
