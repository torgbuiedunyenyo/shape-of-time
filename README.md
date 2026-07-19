# Shape of Time

An illustrated generative hyperbook: a calm e-reader where books continue through finite narrative
movements and phrases can open into other books.

Turn a folio to move through the current story. Open a phrase, a deliberate highlight, or a requested
title to move sideways into a nearby story. Back returns to the exact passage. Every movement can
rest; every book can continue.

## Current state

This repository is the clean successor to the retired `auto-biblio` experiment. It currently contains
the governing product contract, proof model, implementation plan, verified Shape of Time source, and
the accepted one-process stack decision. It contains no product implementation, generated corpus, or
paid generation output yet. The linked Railway prototype exists, but its documentation-only commit is
not a runnable deployment; A2 builds and deploys the first application spine.

Start here, in order:

1. [`SPEC.md`](SPEC.md) — what the experience is and is not.
2. [`EVALS.md`](EVALS.md) — what evidence makes it good enough.
3. [`PLAN.md`](PLAN.md) — the dependency-ordered build queue.
4. [`HANDOFF.md`](HANDOFF.md) — the live state and next action.

The expanded world source is in
[`content/shape-of-time/world.md`](content/shape-of-time/world.md), with byte-level provenance in
[`content/shape-of-time/SOURCE.md`](content/shape-of-time/SOURCE.md). It is the sole comprehensive
factual and plot authority. The first finite root movement is in
[`content/shape-of-time/root-movement-01.md`](content/shape-of-time/root-movement-01.md); the root book
continues from its changed state rather than ending there.

The Fable prompt contract lives under [`prompts/fable/`](prompts/fable/): the baseline XML
template, the explicit temporal guardrail, and a separately excluded set of optional craft examples
for a controlled experiment. The separate
[`visual-bible.md`](content/shape-of-time/visual-bible.md) defines shared visual grammar and scoped
book/folio continuity without deciding Clef, future cultures, or scene details globally.

The accepted application and Railway topology is recorded in
[`docs/adr/0001-one-process-stack.md`](docs/adr/0001-one-process-stack.md).

## Ancestry

- [`torgbuiedunyenyo/infinite-book`](https://github.com/torgbuiedunyenyo/infinite-book) is the earlier Shape of Time implementation and the source-history repository.
- [`torgbuiedunyenyo/auto-biblio`](https://github.com/torgbuiedunyenyo/auto-biblio) is the retired Infinite Library implementation.
- [`LEGACY.md`](LEGACY.md) records what was retained and what was deliberately left behind.
- [`shapeoftime.net`](https://shapeoftime.net) is the existing public Shape of Time experience and a
  reference point. This successor deploys first to its isolated Railway-generated domain; any later
  custom-domain cutover is deliberate.
