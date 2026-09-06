# The Shape of Time

An agent-led world exploration harness: read a sustained illustrated narrative, follow a passage or
image into another book, and return to your place. The successful text-only infinite-book is the
experiential baseline. The retired folio prototype is preserved only in `archive/` and Git history.

Read AGENTS.md, SPEC.md, EVALS.md, PLAN.md and HANDOFF.md for the current intent and actual evidence.
The new application is being implemented directly on the existing Railway production project.

## Running and development

Use Node 24.18.0 and pnpm 11.15.0. Install with `pnpm install`. The application uses the existing
Railway Postgres service and S3-compatible assets bucket; Docker is not required.

For development, link the Railway project and run `python3 scripts/configure-local.py`. This copies
selected credentials to ignored `.env` without printing them and leaves generation disabled.
`pnpm server` starts the API; `pnpm dev` starts the reader. `pnpm build` builds both, and `pnpm start`
runs the production application. In Railway, `DATABASE_URL` uses private networking. The local
configuration uses its Postgres TCP proxy.

Configuration is listed in `.env.example`. Required: DATABASE_URL and S3_ENDPOINT/S3_BUCKET/
S3_REGION/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY. Live generation additionally needs OPENAI_API_KEY,
GENERATION_ENABLED=true and an explicitly funded PROVIDER_BUDGET_USD. The allowance is stored in the
edition when first initialized; changing the environment alone does not silently increase it.
The text model is GPT-6 Astra at xhigh; images use gpt-image-2-2026-04-21. There is no fallback.

`pnpm gates` runs typecheck, lint, real Railway persistence/storage tests and the production build.
Tests use the `world_checks` schema, never purchase generation, and do not claim literary quality.
`pnpm inspect` reports requests, provider operations and shared spending without credentials.
`pnpm eval:live` explicitly purchases a live reading only when generation is enabled. The hosted
reader uses the same persistence and provider path. Full prompts, requests, returned protocol
items, drafts, images and criticism remain available for investigation.

Production deploys come from passing pushes to main through Railway's GitHub integration. Never use
`railway up` as an alternate deployment path. See HANDOFF.md for the exact deployed revision and
current limitations; a healthy server is not proof of a successful literary experience.
