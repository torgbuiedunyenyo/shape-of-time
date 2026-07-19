# Shape of Time

An illustrated generative hyperbook: a calm e-reader containing finite books whose phrases can open into other finite books.

Turn a folio to move through the current story. Open a phrase, a deliberate highlight, or a requested title to move sideways into a nearby story. Back returns to the exact passage. Every book can end; the library can keep opening.

## Current state

This repository is the clean successor to the retired `auto-biblio` experiment. It currently contains the governing product contract, proof model, implementation plan, and verified Shape of Time source. It contains no product implementation, generated corpus, deployment, or paid generation output yet.

Start here, in order:

1. [`SPEC.md`](SPEC.md) — what the experience is and is not.
2. [`EVALS.md`](EVALS.md) — what evidence makes it good enough.
3. [`PLAN.md`](PLAN.md) — the dependency-ordered build queue.
4. [`HANDOFF.md`](HANDOFF.md) — the live state and next action.

The expanded world source is in [`content/shape-of-time/world.md`](content/shape-of-time/world.md), with byte-level provenance in [`content/shape-of-time/SOURCE.md`](content/shape-of-time/SOURCE.md).

## Ancestry

- [`torgbuiedunyenyo/infinite-book`](https://github.com/torgbuiedunyenyo/infinite-book) is the earlier Shape of Time implementation and the source-history repository.
- [`torgbuiedunyenyo/auto-biblio`](https://github.com/torgbuiedunyenyo/auto-biblio) is the retired Infinite Library implementation.
- [`LEGACY.md`](LEGACY.md) records what was retained and what was deliberately left behind.
- [`shapeoftime.net`](https://shapeoftime.net) is the existing public Shape of Time experience and a reference point, not this repository's deployment target.
