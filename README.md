# The Shape of Time

*A love story.*

[Read the book](https://shape-of-time-production.up.railway.app/)

The Shape of Time begins with Jay and Tan in a world where time works differently. It is an
illustrated novel that can contain other novels: a passage, a person or a detail in a picture can
open into a story of its own. Readers can stay with any of these stories, follow another opening,
and return to the place they left. The ambition is sustained fiction with characters, developing
plots and visual continuity, at every depth.

## How the book is made

The human author supplies the world, its artistic direction and the judgment of whether the work
is succeeding. A **creative agent** develops the fiction inside a **harness**: the surrounding
software that gives it tools, remembers its work and makes published passages available to readers.

The harness gives the agent access to the original worldbuilding, writing and visual guidance,
published stories and images, and a persistent workspace for drafts and notes. The agent decides
what to investigate, write, illustrate, revisit and develop. It can look at earlier passages, consult
its notes, inspect an image, use previous images as references, or ask a separate critic agent for
feedback. Those are available choices, not a compulsory sequence of production stages.

Text is generated with **GPT-6 Astra at medium reasoning effort**. Illustrations use
**GPT Image 2**. The creative agent directs the images and can inspect them alongside the prose;
text and imagery are parts of the same world rather than independent decorations. An optional
critic also uses Astra at medium, in a separate context with access to the actual material.

One active creative session moves among the connected stories. Its persistent context, saved notes
and access to originals support continuity across long narratives and nested works. When that
context needs renewal, the system preserves the original record and renews the working context.
Plans and notes remain distinct from what has actually appeared in the published fiction.

The engineering provides dependable storage, source links, return paths, a request queue and
spending records. It does not dictate plot beats, chapter lengths, image quotas or mandatory
literary reviews. Prompts encourage narrative movement and coherence; creative choices belong to
the agent, and literary judgment ultimately belongs to the author.

## What readers do

Readers read, continue and explore passages or images. They do **not** give plot directions or
choose a character's next action. Published stories are shared. Each browser profile keeps its own
reading places, bookmarks and opening history; there are no accounts or cross-device syncing yet.
Two people sharing one browser profile share that reading history.

The interface prepares reading ahead when useful, giving the creative agent a chance to develop a
continuation or a nearby opening while someone reads. Already published material is immediately
available. An unprepared opening still takes time to generate; preparation reduces that wait but
cannot eliminate it everywhere. The first readable passage can be entered before the whole request
has finished. A reader request is not a page: it may produce several passages and illustrations.

The cover uses the opening illustration. A short, replayable guide demonstrates text highlighting
and drawing a selection box on an image. Beyond necessary controls and waiting messages, the
reading interface presents the literature rather than explaining the software.

## Current work and project history

The successful text-only [infinite-book](https://github.com/torgbuiedunyenyo/infinite-book) is the
experiential baseline. This implementation aims to extend it with richer agent freedom, imagery
and persistent context. The retired illustrated folio prototype is preserved in `archive/` and Git
history; it is not the active architecture.

The live book retains its current content. The author granted a **one-time exception** to switch
from Astra xhigh to medium within that book; the exact transition is recorded in
[the provenance receipt](tests/receipts/astra-medium-transition-2026-09-07.json). Otherwise a changed
creative attempt starts empty, with the earlier attempt privately preserved and referenced.

The planned buffer of **40 additional reader requests (20 core, 20 side stories) is paused at the
author's request**. One core request was submitted before the pause; no further automatic requests
may be submitted until the author resumes it. The operational checkpoint and recovery instructions
are in [operations/reader-buffer-40](operations/reader-buffer-40/README.md).

- [SPEC.md](SPEC.md): intended experience, creative freedom and product requirements.
- [PLAN.md](PLAN.md): implementation history and current work queue.
- [HANDOFF.md](HANDOFF.md): current state, receipts, limitations and continuation instructions.
- [EVALS.md](EVALS.md): meaningful literary evaluation, separate from mechanical testing.
- [AGENTS.md](AGENTS.md): working rules and preservation requirements.
- [Source provenance](content/shape-of-time/SOURCE.md): recovered original world and writing material.
- [Draft archive](archive/reader-attempts/README.md): references to preserved earlier attempts.

## Running and development

Use Node 24.18.0 and pnpm 11.15.0. Install with `pnpm install`. The application uses the existing
Railway Postgres service and S3-compatible assets bucket; Docker is not required.

For development, link the Railway project and run `python3 scripts/configure-local.py`. This copies
selected credentials to ignored `.env` without printing them and leaves generation disabled.
`pnpm server` starts the API; `pnpm dev` starts the reading interface. `pnpm build` builds both, and `pnpm start`
runs the production application. In Railway, `DATABASE_URL` uses private networking. The local
configuration uses its Postgres TCP proxy.

Configuration is listed in `.env.example`. Required: DATABASE_URL and S3_ENDPOINT/S3_BUCKET/
S3_REGION/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY. Live generation additionally needs OPENAI_API_KEY,
GENERATION_ENABLED=true and an explicitly funded PROVIDER_BUDGET_USD. The allowance is stored in the
edition when first initialized; changing the environment alone does not silently increase it.
The text model is GPT-6 Astra at medium; images use gpt-image-2-2026-04-21. There is no fallback.
PREPARATION_ENABLED=true offers preparation while readers spend time in any published section.
The creative agent receives the actual current text/images, already prepared openings and unread
continuation. It can prepare more linear reading or a nested opening, or decide enough is available.
Repeated signals and concurrent readers share one opportunity per encountered section. Explicit
requests take priority; preparation yields between completed tool batches when one arrives or the
reader moves on. Saved work remains available. Preparation uses the shared allowance and requires
generation enabled.
The agent chooses what, if anything, is useful to develop.

`pnpm gates` runs typecheck, lint, real Railway persistence/storage tests and the production build.
Tests use the `world_checks` schema, never purchase generation, and do not claim literary quality.
`pnpm inspect` reports requests, provider operations and shared spending without credentials.
Operator scripts run with `tsx --env-file=.env scripts/NAME.ts`. `resume.ts REQUEST_ID` resumes only a
reconciled paused/failed request. `critique.ts REVIEW_KEY [WORK_IDS...]` commissions an explicitly
funded contextual review. Before a new reader request, the creative agent automatically renews an active
context above250,000 tokens. This timing follows the first live renewal and observed longer-context
costs; it is an operational boundary, not a story-length constraint. It preserves the full archive
and complete canonical returned window. It shares the edition allowance, reuses a saved receipt on
restart, and pauses an uncertain outcome. A single unusually long creative agent turn still pauses before
the880,000-token dispatch guard; inspect it before manual renewal/resume.
`renew.ts RENEWAL_KEY` also preserves and renews the idle creative agent's context;
its standalone compaction interface does not expose a reasoning-effort setting. Creative agent/critic
responses continue to use Astra medium. Both paid utilities require generation deliberately enabled.
`corpus.ts export .local/SNAPSHOT` saves all records and original media with checksums while the
creative agent is idle. `corpus.ts restore .local/SNAPSHOT` verifies and restores to a fresh
`DATABASE_SCHEMA=world_restore_NAME`, with generation disabled, and checks every restored row/object.
Snapshot tables use incremental JSONL (format jsonl-v2) so the growing archive need not fit in one
JavaScript string. Use the corresponding historical script revision to restore an older format.
The active edition is never overwritten by that recovery check.
`pnpm eval:live` explicitly purchases a live reading only when generation is enabled. The hosted
book uses the same persistence and provider path. Full prompts, requests, returned protocol
items, drafts, images and criticism remain available for investigation.

## Editions and mechanism provenance

The development corpus is evidence, not seed material for the reader edition. Keep its database,
media, complete generation receipts and version history outside the public book. The fresh reader
edition uses a separate DATABASE_SCHEMA and matching private asset namespace, without copying
stories, images, agent notes, reviews or reading history. Browser visits, bookmarks and discoveries
are keyed to the edition's identity and creation time.

Set READER_EDITION=true only when initializing a fresh reader edition. Its first startup stores a
mechanism record with source/prompt/runtime checksums, the dependency lock, effective model and
preparation/memory settings, and the deployment revision. New provider receipts retain the actual
mechanism record too. This metadata is outside the creative agent's source context. Existing
development data cannot be relabeled as a pinned edition by changing that flag.

The build records the server, shared types, prompts and artistic inputs. Client-only layout and
reading-control changes do not change that record. A different mechanism pauses new creative work
for investigation; it never clears an edition automatically. Server/dependency fingerprints are
conservative evidence of a change, not a semantic judgment that a new edition is necessary. Review
the actual diff before deciding whether a fix changes the creative process. Preserve the previous
record and corpus whenever deliberately establishing a new process. A named model can still change
on the provider side; pinning records our process and the returned provider model, not a promise of
identical future inference behavior.

The initial $150 allowance covers development and the reader edition together. Before switching,
wait for pending calls, freeze the development allowance at its committed spend, preserve the full
corpus, and allocate only the remaining amount to the fresh edition. Keep an allocation receipt.
Do not copy a $150 configuration into a fresh edition and thereby restart the allowance.
The author subsequently authorized exceeding the initial $150 if needed. Record any deliberate
increase in HANDOFF.md and retain the same combined accounting and operational spending guard.

Production deploys come from passing pushes to main through Railway's GitHub integration. Never use
`railway up` as an alternate deployment path. See HANDOFF.md for the exact deployed revision and
current limitations; a healthy server is not proof of a successful literary experience.
