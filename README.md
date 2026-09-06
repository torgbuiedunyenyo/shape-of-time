# Shape of Time

A world exploration harness for sustained, nested illustrated narratives. Read a book, follow a
passage or image into another life, and return to the exact place with a deeper understanding.

The successful text-only infinite-book is the experiential baseline. The creative agent uses GPT-6
Astra at xhigh, with persistent context, memory and tools it can choose among. Imagery uses GPT Image
2. The agent decides how to investigate, create, inspect, revisit and develop the work.

## Current state: ready to begin implementation

The plan, original creative sources and repository cleanup are complete. **The replacement
application is not implemented.** There is deliberately no active package manifest, application
code, old corpus, test suite, build/start command, migration or deployment configuration. Nothing in
this checkout silently runs the retired illustrated prototype.

Start here:

1. [SPEC.md](SPEC.md) — the intended experience and current artistic direction.
2. [EVALS.md](EVALS.md) — meaningful literary, visual, operational and reader evidence.
3. [PLAN.md](PLAN.md) — the single implementation queue; begin with P1a.
4. [HANDOFF.md](HANDOFF.md) — actual progress, local/deployed state and next action.

[AGENTS.md](AGENTS.md) governs development. CLAUDE.md points to it and adds no competing rules.

## What is here

- [content/shape-of-time/SOURCE.md](content/shape-of-time/SOURCE.md) identifies the full original world,
  verbatim main-template world description, adapted original writing guidance and approved visual
  medium. Preserve their wording. Some natural explanation of world mechanics is welcome; constant
  didactic monologues are not.
- [archive/README.md](archive/README.md) explains the complete retired-source snapshot, exact
  predecessor sources and how to inspect them without restoring the old application. Archive text is
  historical evidence, excluded from ordinary searches and from active creative context.
- .nvmrc and .npmrc retain the selected Node version and package registry. P1 creates a fresh minimal
  application manifest and configuration for the chosen TypeScript/React/Hono/Postgres stack.

P1 builds saved work, a thin reader and the real Astra/image/critic loop together. P2 adds generated
nesting and exact return. Subsequent milestones develop sustained reading, recovery and long-form
coherence. Do not substitute another static showcase or reassemble the archived runtime first.

## Checkouts and release state

On the original machine, work continues in /Users/ratpartyserver/git/shape-of-time-agentic on
codex/agentic-world. The normal /Users/ratpartyserver/git/shape-of-time checkout's local main also
contains this clean starting point. A new clone of this revision has the same instructions and
source material; the old local folders and conversation are not required to understand the plan.

The local checkpoint is tagged checkpoint/agentic-clean-start-2026-09-06. The complete retired source
is tagged archive/folio-prototype-2026-09-06 at e1a3decb29b33710f26a89f5cf2a415ca6f3ae09. The source
archive also travels with this checkout, independent of tag availability.

**Remote main and the Railway deployment have not been changed.** Do not push the pre-implementation
checkpoint to production. A future release requires the implemented, tested application and the
Git-integrated deployment process in PLAN.md. The current local state is not a deployable product.

Previous ignored credentials, dependencies and build/test artifacts from the normal checkout are
preserved privately under its ignored .local/retired-folio-e1a3dec directory. They are not inputs to
the new application. No database, remote asset store or running deployment was changed.

## Ancestry

- [infinite-book](https://github.com/torgbuiedunyenyo/infinite-book): successful text-only predecessor
  and source of the selected world and writing guidance.
- [auto-biblio](https://github.com/torgbuiedunyenyo/auto-biblio): retired theoretical experiment,
  available for historical investigation.
- The archived July shape-of-time: failed illustrated folio successor. Its old instructions and
  completed milestones do not govern this replacement.
