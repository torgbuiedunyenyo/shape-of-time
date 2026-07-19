# ADR 0001 — One-process reader stack on Railway

- **Status: Accepted**
- **Date:** 2026-07-18
- **Decision owner:** project owner

## Context

Shape of Time needs a dependable e-reader, a small HTTP API, Postgres transactions, private image
storage, and eventually a durable in-process generation loop. It does not need server rendering,
accounts, a public platform API, a workspace graph, or independently scaled services. The reader's
hard problems are exact navigation, selection, reflow, calm loading, and literary/visual quality—not
framework routing or distributed infrastructure.

The owner has designated Railway project `8b20e07d-c256-44c9-85be-d1c7e50ac83d` as the prototype
home from the first executable commit. It already contains the GitHub-linked `shape-of-time` service,
sourced from `torgbuiedunyenyo/shape-of-time` on `main`. Its documentation-only deployment failed
because no package manifest or executable exists yet. That is the expected pre-A2 state.

## Decision

Build one TypeScript package and one deployable Node process:

```text
browser
  -> one Railway HTTPS domain
     -> shape-of-time: one Node process
        -> /healthz
        -> /api/*
        -> Vite-built reader assets and GET-only SPA fallback
        -> in-process Postgres-leased generation loop (when D3 enables it)
        -> one Railway Postgres resource
        -> one private Railway object storage bucket
```

The client is a React single-page application built by Vite. React Router is used in Data Mode as a
client library; it does not own the server or create a server-rendered route graph. Hono owns HTTP,
health, API routing, static delivery, and the SPA fallback. API routes are registered before the
fallback; unknown `/api/*` routes and non-GET requests remain real errors.

The application uses Kysely over `pg`. Kysely supplies typed SQL composition, transactions, and its
built-in file migrator without a schema DSL, generated client, migration daemon, or ORM identity
layer. Each migration is a TypeScript module that exports `up` and `down` and issues Kysely schema
operations or explicit raw SQL. The modules compile into the server artifact and run through the
same migration entry point locally, in tests, and as Railway's pre-deploy command.

The executable stack is pinned exactly for the first scaffold:

| Concern | Pin |
|---|---|
| Runtime | `node@24.18.0` |
| Package manager | `pnpm@11.15.0` |
| Language | `typescript@6.0.3` |
| Reader | `react@19.2.7`, `react-dom@19.2.7` |
| Client routing | `react-router@8.2.0` |
| Client build | `vite@8.1.5`, `@vitejs/plugin-react@6.0.3` |
| HTTP | `hono@4.12.31`, `@hono/node-server@2.0.10` |
| Database | `kysely@0.29.4`, `pg@8.22.0` |
| Runtime validation/logging | `zod@4.4.3`, `pino@10.3.1` |
| Object storage | `@aws-sdk/client-s3@3.1090.0`, `@aws-sdk/s3-request-presigner@3.1090.0` |
| Unit/integration tests | `vitest@4.1.10`, `@testcontainers/postgresql@12.0.4` |
| Browser regression tests | `@playwright/test@1.61.1` |
| Lint | `eslint@10.7.0`, `@eslint/js@10.0.1`, `typescript-eslint@8.64.0`, `globals@17.7.0` |
| Development execution | `tsx@4.23.1`, `concurrently@10.0.3` |
| Type declarations | `@types/node@24.13.3`, `@types/react@19.2.17`, `@types/react-dom@19.2.3`, `@types/pg@8.20.0` |

TypeScript 6.0.3 is intentional: the selected `typescript-eslint` release supports TypeScript below
6.1, while the registry's TypeScript 7 release is outside that peer contract. Node 24 is the current
LTS line and satisfies React Router 8, Vite 8, pnpm 11, Kysely, and ESLint 10.

All package entries and the lockfile use exact versions. Dependabot or a deliberate maintenance
slice may advance them after gates pass; install-time floating versions are not part of the contract.

pnpm 11 stores lifecycle-script policy in a root `pnpm-workspace.yaml` even for a single package; it
no longer reads these settings from `package.json`. This file is security configuration, not a
workspace graph: it has no `packages`, catalog, or workspace-linking key. It approves only esbuild's
required install hook, explicitly denies the optional `cpu-features`, `protobufjs`, and `ssh2` hooks,
and records the reviewed Hono patch as the sole release-age exception.

## Why a client SPA

The prepared garden needs no server rendering. Initial HTML discoverability is not currently a
release criterion, while hydration would add a second state boundary to the exact-history and
selection surface that is central to the experience. Vite produces hashed assets; Hono serves them
and returns the reader shell for direct GET navigation. Public metadata or selective prerendering
may be reconsidered only after a measured need.

React Router Data Mode provides route objects, loaders, errors, and client navigation without
Framework Mode's client/server module graphs, loaders/actions split, hydration, or server adapter.
The application still owns one explicit navigation state machine for page turns, apertures,
browser history, bookmarks, and exact return.

## Postgres, migrations, and tests

There is one process-wide `pg` pool behind one Kysely instance. Transactions use Kysely's transaction
API so every statement remains on the same checked-out connection. The five initial tables and their
indexes are defined by the `up`/`down` migration modules; TypeScript database interfaces are
maintained explicitly beside repository code.

Production uses the pinned Railway SSL image
`ghcr.io/railwayapp-templates/postgres-ssl:18.4`; local and CI integration tests use the matching
`postgres:18.4-alpine` through Testcontainers. Tests apply every migration from an empty database and
exercise locking, transactions, leases, idempotency, and immutable exposure. A2 records
`SHOW server_version` and rejects any server line other than 18.4, so provider and test major/minor
parity is a promotion invariant rather than a manual assumption. The
existing zero-dependency source/authority tests remain on `node:test`; Vitest owns new TypeScript
application tests.

In A2, each `generation_attempts` row is specifically one Folio-publication orchestration attempt.
It is either the current Attempt named by that Folio or an immutable failed predecessor named by its
linked retry. This scope makes the current deferred Folio/Attempt identity and state checks exact.
Later prose, image, layout, and judge provider calls may each need separate paid-operation
provenance; that work must add an explicit attempt kind or a separate operation table in a migration
rather than weakening or silently reinterpreting the A2 orchestration invariant.

Local development does not depend on Railway's intentionally disabled public database proxy. A2
adds a root `compose.yaml` with one `postgres:18.4-alpine` service bound only to
`127.0.0.1:55432`, using disposable development credentials and a named local volume. Development
defaults to `postgresql://shape_of_time:shape_of_time@127.0.0.1:55432/shape_of_time` and
`ASSET_DRIVER=filesystem`, storing content-addressed objects under the
ignored `.local/assets` directory. Production requires the private Railway database reference and
S3 driver variables; it cannot silently fall back to local storage.

The official PostgreSQL 18 image persists at `/var/lib/postgresql` (the versioned data directory is
below it), so the local named volume mounts there rather than at the pre-18
`/var/lib/postgresql/data` path. The repository also pins the npm registry to
`https://registry.npmjs.org/`; this prevents a machine-level insecure registry override from making
the documented frozen install fail.

Playwright may supply repeatable browser regression tests for geometry, selection, history, and
keyboard/touch behavior. It never substitutes for the required visible Codex in-app Browser reader
walkthrough and feel gate.

## Railway execution contract from A2 onward

Use the existing `production` environment because the entire project is the isolated prototype.
Before persistent data exists, move the app to Railway US West and place Postgres alongside it; use
an SJC bucket. Run one replica with sleeping/serverless disabled. The exact initial resource set is:

- existing app service `shape-of-time`;
- one Railway Postgres service pinned to the accepted 18.4 SSL image and its normal volume;
- one private Railway bucket for content-addressed narrative images; and
- one Railway-generated public domain; the public domain is created only after the Git-triggered app deployment is
  healthy; `prototype.shapeoftime.net` remains deferred until that generated domain passes the
  in-app Browser smoke test.

The app reads the private Postgres URL through a Railway variable reference, with the database's
default external TCP proxy disabled. Native daily volume backups are enabled before any nondisposable data
is written. Bucket credentials are injected as references rather than copied into Git or command
output. Narrative assets use immutable digest-derived keys and short-lived presigned GET URLs. The
bucket is storage, not global visual canon and not a second application service. Because Railway
buckets do not provide versioning or native recovery, bucket contents remain disposable until B1
adds and verifies an export/recovery path before retaining paid image output.

New Railway buckets use virtual-hosted URLs. The S3 client therefore does not force legacy path-style
addressing. Production requires HTTPS bucket endpoints and an exact 40-hex Git commit SHA; health
cannot bless an unattributed local artifact as the deployed application.

Railpack builds the root package. The committed Railway configuration names:

```text
build command       pnpm run build
build expansion     vite build && tsc -p tsconfig.server.json
client output       dist/client/
server output       dist/server/
pre-deploy          pnpm run db:migrate
start command       pnpm run start
start expansion     node dist/server/index.js
health              GET /healthz
listen              0.0.0.0:$PORT
composition root    src/server/app.ts
listen call         src/server/index.ts only
restart             on failure, platform-default 10 retries
drain               10 seconds
```

The root `package.json` script surface is also fixed so the command matrix cannot name commands that
do not exist:

```text
dev                pnpm run dev:infra && pnpm run db:migrate:dev && concurrently -k -n reader,api "vite" "tsx watch src/server/index.ts"
dev:infra          docker compose up -d --wait postgres
dev:infra:down     docker compose down
build              vite build && tsc -p tsconfig.server.json
start              node dist/server/index.js
lint               eslint . --max-warnings 0
typecheck          tsc --noEmit
test:content       node --test scripts/*.test.mjs
test:unit          vitest run --project unit
test:integration   vitest run --project integration
test:browser       playwright test
test               pnpm run test:content && pnpm run test:unit && pnpm run test:integration && pnpm run test:browser
db:migrate:dev     tsx src/server/db/migrate.ts
db:migrate         node dist/server/db/migrate.js
assets:recovery    tsx src/server/assets/recovery-cli.ts
image:contract:live tsx src/server/images/live-image-contract.ts
gates              pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build
```

The two B1 commands are short-lived, operator-invoked verification commands. They do not listen,
remain resident, or add a worker or second deployed process.

The complete gate therefore requires Docker and the Chromium binary; CI installs both before
`pnpm run gates`. CI uses the current `actions/checkout@v6`, `pnpm/action-setup@v6`, and
`actions/setup-node@v6` actions. The browser regression starts the built Hono production spine with
real local Postgres; Vite is not its HTTP substitute.

`/healthz` validates startup configuration and performs a bounded `SELECT 1`; it never calls a model
provider or writes an object. It verifies the exact migration-content checksum and pinned PostgreSQL
18.4 server line. A failed migration or healthcheck blocks promotion. Background work
uses Postgres leases before paid generation begins so overlapping zero-downtime containers cannot
duplicate spend.

All `shape-of-time` application source deployments are Git-triggered. `railway up` is forbidden;
manual redeploy and Deploy Latest Commit are also forbidden because they can obscure a failed source-linked build.
Provisioning Postgres or a bucket necessarily creates resource deployments; those are not app source
deployments.

A2 uses this order so the current documentation-only source never redeploys during setup:

1. finish and commit the runnable A2 application locally without pushing `main`;
2. keep app autodeploy disabled before changing region, variables, or service configuration;
3. provision the pinned Postgres and private bucket and wait for those resources independently;
4. enable daily database volume backups, disable the external TCP proxy, and configure the app's
   region, references, start/pre-deploy/health settings, and Wait for CI through Railway's staged
   commit-without-deploy path;
5. enable app autodeploy and push the runnable commits to `main`;
6. let that passing push alone create the first app source deployment, then verify migration,
   schema digest, `/healthz`, and active commit equality; and
7. create the public domain only after the deployment is healthy, then perform the reader smoke test.

Every later app source deployment follows the same passing-`main` rule and verifies that the active
Railway deployment SHA equals the pushed commit.

## Fresh-clone command matrix

These commands become executable in A2:

| Purpose | Command |
|---|---|
| Select runtime | `nvm install 24.18.0 && nvm use 24.18.0` |
| Activate package manager | `corepack enable pnpm` (`packageManager` selects `pnpm@11.15.0`) |
| Install | `pnpm install --frozen-lockfile` |
| Verify Docker prerequisite | `docker info` |
| Start local Postgres | `pnpm run dev:infra` (`docker compose up -d --wait postgres`) |
| Stop local Postgres | `pnpm run dev:infra:down` (`docker compose down`) |
| Install local browser | `pnpm exec playwright install chromium` |
| Install CI browser/dependencies | `pnpm exec playwright install --with-deps chromium` |
| Develop | `pnpm run dev` (starts Postgres, migrates it, then watches reader/API) |
| Content/source checks | `pnpm run test:content` |
| Unit tests | `pnpm run test:unit` |
| Real-Postgres integration | `pnpm run test:integration` |
| Browser regressions | `pnpm run test:browser` |
| Lint | `pnpm run lint` |
| Typecheck | `pnpm run typecheck` |
| Build | `pnpm run build` |
| Local migration | `pnpm run db:migrate:dev` |
| Production migration | `pnpm run db:migrate` |
| Production start | `pnpm run start` |
| Complete local/CI gate | `pnpm run gates` |

Development may run the Vite dev server and watched Hono server as two local subprocesses in this one
package. `src/server/app.ts` is the sole composition root. The deployed artifact always has one
listen call in `src/server/index.ts` and one Node process; Vite preview is never the production server.

## Rejected alternatives

### Fastify plus Vite

Fastify is credible and remains a fallback if measured HTTP/plugin needs appear. Its encapsulation,
schema, lifecycle, and plugin vocabulary do not currently improve the five-entity prototype enough
to justify the larger framework surface.

### React Router Framework Mode

Framework Mode can run in one process, but its server/client build graphs, hydration, route-module
rules, and adapter do not earn their cost here. Its SPA mode still needs an HTTP server for the real
API, making the framework layer redundant. Experimental React Server Components are excluded.

### Express plus Vite

Express 5 can satisfy the topology. Hono provides a smaller Web-standard request/response HTTP
surface without losing necessary Node behavior; the provider and storage adapters remain independent
of that HTTP choice.

### Raw `pg`, Drizzle, or Prisma

Raw `pg` would require rebuilding migration ordering, locking, and typed transaction helpers.
Drizzle and Prisma introduce a schema DSL, generated or ORM-shaped model, and more migration
machinery than five explicit tables require. Kysely stays close to SQL while avoiding bespoke
transaction and migration infrastructure.

### Distributed topology

Redis: rejected. A separate worker: rejected. Turborepo: rejected. A pnpm workspace: rejected. A
frontend service, app volume, auth service, vector database, separate CDN, and staging environment
are also rejected until a measured requirement changes this ADR.

## Consequences

The team must write a small amount of explicit HTTP/static fallback and database typing code. In
return, the entire reader is visible in one composition root, every development dependency has a
specific job, deployment contains one application process, and later generation can reuse the same
transaction and storage boundaries without changing the reader's architecture.

## Current official references

- [Node release status](https://nodejs.org/en/about/previous-releases)
- [Vite supported releases](https://vite.dev/releases) and [Vite 8](https://vite.dev/blog/announcing-vite8)
- [Hono on Node](https://hono.dev/docs/getting-started/nodejs)
- [React Router Data Mode](https://reactrouter.com/start/data/custom) and [v8 requirements](https://reactrouter.com/start/start/changelog)
- [Kysely migrations](https://kysely.dev/docs/migrations)
- [`pg` pooling and transactions](https://node-postgres.com/features/pooling)
- [Vitest](https://vitest.dev/guide/) and [Testcontainers PostgreSQL](https://node.testcontainers.org/modules/postgresql/)
- [Railpack Node](https://railpack.com/languages/node/)
- [Railway GitHub deployments](https://docs.railway.com/deployments/github-autodeploys)
- [Railway staged changes](https://docs.railway.com/deployments/staged-changes)
- [Railway regions](https://docs.railway.com/deployments/regions)
- [Railway PostgreSQL](https://docs.railway.com/databases/postgresql)
- [Railway SSL Postgres image and tag policy](https://github.com/railwayapp-templates/postgres-ssl)
- [Railway volume backups](https://docs.railway.com/volumes/backups)
- [Railway storage buckets](https://docs.railway.com/storage-buckets)
- [Railway pre-deploy commands](https://docs.railway.com/deployments/pre-deploy-command)
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks)
- [Playwright browser installation](https://playwright.dev/docs/browsers)
- [Testcontainers supported runtimes](https://node.testcontainers.org/supported-container-runtimes/)
