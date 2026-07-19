# Handoff

_Updated 2026-07-18._

## Current state

- Repository: `torgbuiedunyenyo/shape-of-time`.
- Branch: `main`.
- Genesis commit: `7f7b5b112140db7ecb0bc2a85f28a0f38adda441`.
- The repository has been separated from the retired `auto-biblio` implementation.
- The initial authority, verified expanded world source, source provenance, and implementation queue
  are present.
- A0's prose architecture has been corrected:
  world.md is the sole comprehensive factual and plot authority; the first finite root movement,
  explicit temporal rules, XML baseline, and optional-example experiment are separate.
- The rejected story-bible, duplicated arc, and typed authority manifest were deleted instead of
  deprecated.
- The visual bible is now a location-neutral pending proposal for shared grammar and scoped local
  continuity; it is explicitly excluded from the prose baseline and contains no fixed Clef, scene,
  shop, device, or universal future design.
- The owner approved A0 and directed the project to build on Railway from the beginning.
- A1 selects a Vite-built React SPA, React Router Data Mode, one Hono Node process, Kysely/`pg`, real
  Postgres tests, and a private Railway bucket. Exact versions and rejected alternatives are in
  `docs/adr/0001-one-process-stack.md`.
- No application code, package manifest, generated corpus, database, model output, paid generation,
  or successful runnable deployment exists yet.

## Reorganization record

- The private GitHub successor is published at `https://github.com/torgbuiedunyenyo/shape-of-time` with `main` as its default branch.
- Genesis integrity CI passed for the genesis commit.
- `node --test scripts/verify-genesis.test.mjs` passes all three tests, and `node scripts/verify-genesis.mjs` passes the repository audit.
- The retired `auto-biblio` repository now opens on a docs-only archive `main` at `5290dfb41a7ba0d22f3e44c82d097b6cac6eb531`; its root instructions forbid resuming the old plan.
- Historical refs `legacy/deployed-2026-07-18`, `legacy/recovery-checkpoint-2026-07-18`, and `archive/recovery-2026-07-18` are published. The recovery ref is explicitly incomplete, not a release.
- The old repository's full local gate and GitHub CI passed for the archive freeze. Railway staging and production remain healthy on deployed commit `a07d2f2f61176c3737b3b52a4a29dd3160039c29`; no service redeployed.
- Eleven clean temporary or agent worktrees and eight stale worktree registrations were removed. Five dirty forensic worktrees and the user's existing old-repository edits were preserved.

## Locked product direction

The prototype is an illustrated Shape of Time hyperbook in a stable e-reader. Page turns advance one
120–250-word folio through finite narrative movements; the root and child books can continue through
further movements without a predetermined terminal folio. Suggested phrases, arbitrary highlights,
and explicit title creation open adjacent books with independent founding premises; Back restores
the exact source passage. Text and images share narrative work. A static prepared garden must be
delightful before generation is connected.

The writer is Claude Fable 5 at `xhigh`, without Opus or provider fallback. Images use the pinned GPT Image 2 contract with explicit reference packs. The complete Fable request has a hard 400,000-token ceiling. The initial architecture is one TypeScript application, Postgres, and image storage.

## Canon provenance

- Expanded world source: `content/shape-of-time/world.md`.
- Source repository: `torgbuiedunyenyo/infinite-book`.
- Source commit: `1c3644b7d2e7c7b10a62cfa6c6f876ac53559836`.
- Source path/range: `world_document.md`, line 19 through EOF (source line 373).
- World SHA-256: `e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c`.
- `content/shape-of-time/undertow.md` is a separate sequel seed and is excluded from the current root
  movement and from automatic post-arc continuation.

## A0 completion

- Red observed on the replacement contract: the world digest passed while six tests failed because
  the rejected duplicate files still existed and pilot-brief.md, temporal-rules.md, write-folio.md,
  and craft-examples.md did not.
- A second red proved the durable project documents still required the rejected story-bible
  architecture.
- A later owner-review red recorded eight expected failures for the missing root-movement rename,
  finite-movement continuation, child root-plot isolation, Clef openness, future plurality,
  non-Oakland range, and separation of shared/book/folio visual scope.
- Current local result: `node --test scripts/*.test.mjs` passes 18/18;
  `node scripts/verify-genesis.mjs` and `git diff --check` pass.
- The checked-in world remains byte-exact. No compressed story summary, fact taxonomy, or
  machine-shaped narrative manifest competes with it.
- The first root movement ends after Jay knowingly accepts Tan's invitation, before travel. It
  removes the invented sponsorship-authorization threshold, does not restate Parts Two through Six,
  and explicitly hands its changed situation to the next root movement.
- The temporal block retains the earlier prompt's useful false-versus-true guardrails while
  correcting overbroad language about repetition, atmosphere, branching, and temporal “glimpses.”
- The three older teaching patterns are retained as explicitly adapted examples outside baseline for
  one controlled A/B only if consecutive reading reveals the specific failures they address.
- The old Oakland Offset catalogue was deleted. The revised visual proposal retains only an observed
  material-illustration candidate, story-wide physical/medium rules, future plurality, and contracts
  for book-local profiles, folio briefs, and ordered reference images.
- Clef remains materially open. A book may realize it locally and preserve that occurrence through
  image references; another book may decide differently.
- Oakland anchors the root but does not bound the library. Static and generated coverage must include
  non-root viewpoints, places beyond the Bay Area, distinct future cultures, and meaningful Phantas
  or Mystas settings.
- The legacy repository investigation recovered the useful post-arc new-engine and independent-child
  principles while explicitly rejecting its endless seventh act, running summaries, fact taxonomy,
  and global title identity.
- The owner approved this authority layer on 2026-07-18. A0 is complete.

## A1 architecture decision

- Red observed: the new architecture test failed because
  `docs/adr/0001-one-process-stack.md` did not exist.
- Independent review then drove additional reds: the decision lacked an executable local
  Postgres/filesystem-asset bootstrap, Docker/browser prerequisites, and safe ordered Railway staging;
  the future package-manifest checker also initially allowed version, script, and topology mutations.
  All now reject the recorded failures.
- Current official documentation and live package metadata were checked before selection.
- Runtime: Node 24.18.0 and pnpm 11.15.0.
- Reader/server: React 19.2.7, React Router 8.2.0 Data Mode, Vite 8.1.5, Hono 4.12.31, and one
  `@hono/node-server` process. There is no SSR or framework server graph.
- Persistence: Kysely 0.29.4 over `pg` 8.22.0, Kysely file migrations, Postgres 18 integration
  tests through Testcontainers, and no ORM/codegen daemon.
- Railway target: project `8b20e07d-c256-44c9-85be-d1c7e50ac83d` (`lucky-magic`), existing service
  `shape-of-time`, environment `production`, source `torgbuiedunyenyo/shape-of-time:main`.
- Read-only Railway inspection found one failed/stopped docs-only Railpack deployment for `1b7fbf2`,
  no active deployment, Postgres, bucket, domain, healthcheck, migration command, or start command.
  The app is currently placed in Europe; A2 moves it to US West before persistent data exists.
- Intended A2 topology is exactly one app process, one colocated Railway Postgres resource, one
  private SJC image bucket, and one Railway-generated domain. Every `shape-of-time` application
  source deployment remains Git-triggered; Postgres and bucket resource deployments are allowed.
- A2 first commits the runnable application locally without pushing, then disables app autodeploy
  before provisioning pinned Postgres 18.4 plus the bucket or changing app settings. It enables daily
  database backups, disables the public database proxy, and stages app configuration without
  deployment. Only then does it re-enable autodeploy and push; the domain is created after that source
  deployment is healthy.
- A1 is complete. No package or Railway resource was provisioned early to make the decision appear
  implemented.

## Spend and deployment

- Text-generation spend: `$0`.
- Image-generation spend: `$0`.
- Infrastructure mutation: the local repository was linked to the owner-designated Railway project;
  no remote service, variable, region, database, bucket, domain, or deployment setting changed.
- Deployment: no active deployment. The existing documentation-only deployment
  `dd843fec-b1bd-4305-b5a2-2c880d44ebfd` is failed/stopped as expected.

## Next action

Run A2 red tests, then scaffold and locally commit the single package and five-table durable spine.
With app autodeploy disabled, provision only the designated Railway project's pinned Postgres and
private bucket, stage app configuration without deployment, then re-enable autodeploy and push. Verify
the Git-triggered app deployment, migration, `/healthz`, database, bucket, and reader shell before
creating its domain or beginning B1 or C1.
