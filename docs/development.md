# Development and operation

See the [README](../README.md) for the book and creative approach, and the
[specification](../SPEC.md) for intended behavior.

## Local setup

Use Node 24.18.0 and pnpm 11.15.0. Install with `pnpm install`. The application needs PostgreSQL
and an S3-compatible object store. Railway can host both;
Docker is not required.

Copy `.env.example` to `.env` and fill in credentials for your own database and object store. Keep
generation disabled until you deliberately fund it. For a linked Railway project with services
named `shape-of-time` and `Postgres`, `python3 scripts/configure-local.py` copies selected credentials
to ignored `.env` without printing them and leaves generation disabled. It overwrites that file.
`pnpm server` starts the API; `pnpm dev` starts the reading interface. `pnpm build` builds both, and `pnpm start`
runs the production application. In Railway, `DATABASE_URL` uses private networking. The local
configuration uses its Postgres TCP proxy.

## Configuration and preparation

Configuration is listed in [`.env.example`](../.env.example). Required: DATABASE_URL and S3_ENDPOINT/S3_BUCKET/
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

## Testing and inspection

`pnpm gates` runs typecheck, lint, real Railway persistence/storage tests and the production build.
Tests use the `world_checks` schema, never purchase generation, and do not claim literary quality.
`pnpm inspect` reports requests, provider operations and shared spending without credentials.
Operator scripts run with `tsx --env-file=.env scripts/NAME.ts`. `resume.ts REQUEST_ID` resumes only a
reconciled paused/failed request. `critique.ts REVIEW_KEY [WORK_IDS...]` commissions an explicitly
funded contextual review.

## Context renewal

Before a new reader request, the creative agent automatically renews an active
context above 250,000 tokens. This timing follows the first live renewal and observed longer-context
costs; it is an operational boundary, not a story-length constraint. It preserves the full archive
and complete canonical returned window. It shares the edition allowance, reuses a saved receipt on
restart, and pauses an uncertain outcome. A single unusually long creative agent turn still pauses before
the 880,000-token dispatch guard; inspect it before manual renewal/resume.
`renew.ts RENEWAL_KEY` also preserves and renews the idle creative agent's context;
its standalone compaction interface does not expose a reasoning-effort setting. Creative agent/critic
responses continue to use Astra medium. Both paid utilities require generation deliberately enabled.


## Corpus backup and restore

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

## Deployment

For a Railway project connected to GitHub, deploy through passing pushes to its configured
branch. Do not use `railway up` or manual deployments as a fallback for a failed Git integration.
Before a deployment, let paid operations settle and prevent new work from starting during the
release. Verify the deployed Git revision and release temporary holds afterward.

## Private operational records

Keep credentials, local handoffs, corpus snapshots, spending allocations and run-specific ledgers
outside version control. Preserve uncertain provider costs and carry committed spending across
edition transitions; a fresh edition must not silently renew the operator’s allowance. Explicit
funding changes should retain an allocation receipt and the operational spending guard.

## Optional reading password

Set `READER_PASSWORD` and a random `READER_COOKIE_SECRET` of at least 32 characters to require
a shared password before reading. Keep both in environment variables. The server protects story,
image and generation endpoints; the browser remembers access with an HttpOnly cookie for 30 days.
Changing either value invalidates existing access cookies. This gate lives outside the creative
runtime and does not change its mechanism. Leave the password unset for an open book.
