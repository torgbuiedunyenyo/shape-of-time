# The Shape of Time

The book is a world exploration harness: read a sustained illustrated narrative, follow a passage or
image into a nested narrative, and return to your place. The successful text-only infinite-book is the
experiential baseline. The retired folio prototype is preserved only in `archive/` and Git history.

The human creator is the author; people exploring the book are readers. A creative agent develops
the nested narratives and imagery, and a critic agent can provide contextual feedback. The UI is
the reading interface. See SPEC.md for these terms and the distinction between reader requests,
creative-agent turns and reading screens.

Read AGENTS.md, SPEC.md, EVALS.md, PLAN.md and HANDOFF.md for the current intent and actual evidence.
The new application is being implemented directly on the existing Railway production project.

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
The text model is GPT-6 Astra at xhigh; images use gpt-image-2-2026-04-21. There is no fallback.
PREPARATION_ENABLED=true allows one preparation opportunity at an actively read publication frontier.
Recent visible reading refreshes its context; explicit requests take priority, stale unstarted
preparation waits, and an unread prepared continuation prevents another opportunity ahead of it.
Preparation shares the same edition allowance and does not run unless generation is also enabled.
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
responses continue to use Astra xhigh. Both paid utilities require generation deliberately enabled.
`corpus.ts export .local/SNAPSHOT` saves all records and original media with checksums while the
creative agent is idle. `corpus.ts restore .local/SNAPSHOT` verifies and restores to a fresh
`DATABASE_SCHEMA=world_restore_NAME`, with generation disabled, and checks every restored row/object.
Snapshot tables use incremental JSONL (format jsonl-v2) so the growing archive need not fit in one
JavaScript string. Use the corresponding historical script revision to restore an older format.
The active edition is never overwritten by that recovery check.
`pnpm eval:live` explicitly purchases a live reading only when generation is enabled. The hosted
book uses the same persistence and provider path. Full prompts, requests, returned protocol
items, drafts, images and criticism remain available for investigation.

Production deploys come from passing pushes to main through Railway's GitHub integration. Never use
`railway up` as an alternate deployment path. See HANDOFF.md for the exact deployed revision and
current limitations; a healthy server is not proof of a successful literary experience.
