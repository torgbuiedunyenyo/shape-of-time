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
- A2's runnable one-package application spine is complete locally and on Railway. Its first verified
  Git-triggered deployment matched commit `b068cf73d5891da9d9d4af0521ea6fdec9921e9a`.
- B0's movement documents and structural validator are implemented. Independent adversarial reviews
  of the repaired root, children, and validator pass. The owner’s consecutive read remains the only
  open B0 gate, so B1 has not begun.
- No generated corpus, model output, paid generation, or retained Railway image object exists. The
  private bucket is empty after its synthetic verification object was deleted.

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
  finite-movement continuation, child root-plot isolation, Clef openness, temporal-coordinate
  plurality, non-Oakland range, and separation of shared/book/folio visual scope.
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
  material-illustration candidate, story-wide physical/medium rules, temporal-coordinate plurality,
  and contracts for book-local profiles, folio briefs, and ordered reference images.
- Clef remains materially open. A book may realize it locally and preserve that occurrence through
  image references; another book may decide differently.
- Oakland anchors the root but does not bound the library. Static and generated coverage must include
  non-root viewpoints, places beyond the Bay Area, distinct cultures at other Primas coordinates,
  and meaningful Phantas or Mystas settings.
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

## A2 application spine

- Red was observed first: the application-spine audit reported 26 absent files; Vitest then failed
  to resolve the missing state, configuration, storage, database, repository, and HTTP modules.
- Adversarial follow-up reds caught failures that the initial happy path missed: failed-to-reserved
  retry was illegal; a stale worker received no fencing identity; UTF-16 aperture text violated a
  PostgreSQL character-count check; a direct ready Folio insert bypassed guards; the live schema had
  no artifact checksum; static asset misses fell through to HTML; and production config accepted
  unattributed or insecure storage settings. Final review added reds for stale apertures on rejected
  ready-candidate retry, direct non-reserved Attempts, Folio/Attempt state drift, orphan
  orchestration Attempts, opposing row-lock order, bigint lease-epoch concatenation, false storage
  driver provenance, empty media type, and mutable Book/Folio identities.
- The executable stack is one root package and one listener. `src/server/app.ts` constructs config,
  Pino, one Kysely/pg pool, one AssetStore, and Hono; `src/server/index.ts` only listens and drains.
- The migration creates exactly five product tables: `books`, `folios`, `apertures`, `assets`, and
  `generation_attempts`. Kysely and the content-checksum ledger are infrastructure metadata.
- Book and Folio reservations are idempotent and reject key reuse with changed intent. PostgreSQL
  advisory locks serialize concurrent reservations; database-clock leases return unique fencing
  tokens and atomically increment bigint epochs; a reclaimed lease rejects the previous worker.
- Deferred database constraints require each current Folio and orchestration Attempt to agree on
  state, Book, and ordinal at transaction commit. Attempt-before-Folio lifecycle locking prevents
  recovery/publication deadlocks. Books and Folios cannot be deleted or have their durable founding
  identities rewritten; the Folio's Attempt pointer changes only through a linked retry.
- A complete unseen Folio may fail and receive one linked idempotent retry without changing Folio
  identity. A retry deletes only the rejected unseen candidate's apertures inside the same
  transaction. Ready surfaces validate prose, layout, digests, UTF-16 aperture spans, and every
  required stored Asset; exposure is a separate atomic transition and database triggers reject
  later mutation.
- Asset rows can be inserted only after a real store put/get digest-and-length round trip. Both local
  filesystem and virtual-hosted S3 adapters use `sha256/<prefix>/<digest>` keys. Read URLs are limited
  to one hour. The AssetStore, not a caller, supplies durable driver identity; S3 collision recovery
  verifies digest, length, and content type before database registration.
- `/healthz` performs bounded database work and fails closed unless PostgreSQL, the exact Kysely
  migration set, the running artifact's migration-content checksum, and the pinned PostgreSQL 18.4
  server line agree. It reports the Git SHA, PostgreSQL version, migration, and schema digest without
  touching storage or a model.
- Local PostgreSQL uses `postgres:18.4-alpine`, loopback port 55432, and the PostgreSQL 18 persistence
  root `/var/lib/postgresql`. The disposable pre-commit local volume was removed once when the initial
  migration checksum changed; a fresh volume was created and verified.
- Current exact-runtime gate under Node 24.18.0/pnpm 11.15.0: 21 content/architecture tests, 12 unit
  tests, 20 real-Postgres integration tests, and one production-Hono Chromium regression all pass;
  lint, typecheck, build, application audit, frozen install, and production dependency audit pass.
- The visible in-app Browser smoke test of the local built reader deep link passed. It showed one calm
  stable folio surface and one honestly disabled future Library control; there are intentionally no
  reader mechanics to exercise before C1/C2.

## A2 Railway completion

- Local commits `17f3491` (A1) and `b068cf7` (A2) were pushed to `main` once after app autodeploy was
  disabled, all resource/configuration changes were staged, and the GitHub trigger was proven to
  wait for CI. GitHub `Application gates` run `29675936565` passed before Railway built the app.
- App service `39bf3c12-b426-40ce-836a-2839ea1bc213` runs one replica in `us-west2`. Deployment
  `2e40fc50-3c26-4a56-904f-30aa3cdacee8` is `SUCCESS` on the exact A2 SHA.
- Postgres service `294c4570-91e2-4bb2-8639-4a802a475ab8` is pinned to
  `ghcr.io/railwayapp-templates/postgres-ssl:18.4`, with image auto-updates disabled and one replica
  plus volume in `us-west2`. Deployment `47be411f-a1a7-4ddd-9880-31ac806a4e9e` is `SUCCESS`.
- Volume instance `ee3a66a6-9b2a-4628-836b-4e9a86b1f771` has one daily backup schedule
  (`78995e1d-eb8b-4bf8-96e4-bb05a3392d45`, six-day retention). The database has zero TCP proxies.
- Private bucket `545eb437-32e7-4100-a154-3cffd145fac1` (`assets`) is in SJC. A synthetic SDK test
  proved conditional duplicate rejection, digest/length/content-type checks, SDK GET, presigned HTTP
  GET, and deletion; the final object and byte counts are zero.
- Deployment trigger `8dafbd34-688a-4b94-8883-d627e01009fd` watches
  `torgbuiedunyenyo/shape-of-time:main`, has `checkSuites=true`, and reports one valid check suite.
- Generated domain `https://shape-of-time-production.up.railway.app` was created only after the
  deployment became healthy. `/healthz` reports the exact A2 commit, migration `001_initial`, schema
  digest `66eaee6423b1e99b4e8a29e5acc206ed25c6b48531834a81256bb45cf0049fb0`, and PostgreSQL 18.4.
- The production in-app Browser walkthrough passed direct folio deep links, reload, exact Back and
  Forward URLs, visible shell content, and the honestly disabled Library control. A2 intentionally
  has no page-turn, selection, title, aperture, or generation UI to exercise yet.
- A2 is complete.

## B0 movement topology

- The first red ran before either movement document existed. One absence assertion passed and four
  implementation tests failed on the two missing files, including the expected diagnostics
  `missing content/prototype-movements.md` and `missing content/prepared-children.md`.
- `content/prototype-movements.md` now contains a 14-folio first root movement and folios 15–16 of
  its successor. Jay and Tan move from the failed phone payment through a concrete courtship to a
  positive, conditional yes. The successor begins with company paperwork and a substantial crossing;
  it does not replay the romance or compress arrival into the second prepared folio.
- Admission sponsorship, the father’s facilitation, the return carrier, and Tan’s role are distinct.
  Jay can hold a return passage and documents in his own name while remaining practically dependent
  on trained travelers and current maps.
- `content/prepared-children.md` contains three independent four-folio openings: a Phantas-Minor
  municipal ferry in Lagos, shelter labor inside the managed Blitz in Stepney, and music authorship
  under cross-coordinate extraction in Recife. The Lagos child also prepares folios 05–06 of its
  following movement.
- Each child opening calls for three images and makes folio 03 text-led. Image jobs were revised so
  maps, documents, shelter structure, and artifact routes reveal facts the prose withholds. Lagoon
  water and the temporal vector field are explicitly separate. Clef remains open until the root
  lineage realizes it.
- The final validator is strict about the Markdown topology, folio ranges, exact parent citations,
  unique origins, bounded prose, successor continuity, portfolio presence, axis omission, copied
  planning blocks, and code-shaped records. It deliberately does not claim to certify motive,
  viewpoint, place, causality, or material temporal consequence through keywords.
- The initial adversarial reads each returned REVISE and drove causal, visual, canon, and parser
  repairs. Fresh reads of the root and children returned PASS. A final validator review returned PASS
  after four additional red mutations closed portfolio-axis, preamble-heading, empty-title, and
  single-line JSON holes.
- The owner's first consecutive read found the folio bodies broadly sound and returned two concrete
  revisions: "later-Primas" incorrectly treated a relative Primas coordinate as an era, and many
  headings sounded pseudo-literary instead of naming their scenes. The planning language now relates
  Primas coordinates without assigning future/past to Major or Minor. The root and child folio titles
  are direct scene names, while the owner-accepted "Your tomorrow or mine" and "Yesterday's safe
  route" remain.
- The same correction is explicit in the visual bible and B2 image review criteria: past and future
  describe travel along Primas, not kinds of era. The A0 authority test protects that statement so a
  generic "future culture" visual style cannot return unnoticed.
- A tenth B0 test was added red-first. It fixes the reviewed direct-title set and rejects
  "later-Primas" / "later Primas" in the child plans. This is a fixture regression test, not an
  automated claim about literary quality.
- Focused B0 result: 10 tests pass, 0 fail. The exact-runtime full gate also passes: 31
  content/architecture tests, 12 unit tests, 20 real-Postgres integration tests, one built-reader
  Chromium regression, lint, typecheck, and production build. Detailed evidence and the
  consecutive-read checklist are in `docs/qa/2026-07-18-b0-movement-review.md`.
- The owner then delegated subsequent decisions and instructed work to continue. Three independent
  Claude 5.6 Sol xhigh rereads returned PASS: one for the root, one for all children, and one for
  cross-document consistency. They found the requested title and Primas corrections complete and no
  new blocker. The owner's own consecutive read remains the human evidence; the delegated audits do
  not masquerade as additional human readers.
- B0 is complete.

## Spend and deployment

- Text-generation spend: `$0`.
- Image-generation spend: `$0`.
- Infrastructure mutation: the owner-designated Railway project now has the one-app, one-Postgres,
  one-private-bucket topology recorded above. Railway usage is active; no dollar cost was queried.
- Deployment: active and healthy at `https://shape-of-time-production.up.railway.app`; the last
  verified application build is the A2 deployment on `b068cf7`.
  The earlier documentation-only deployment `dd843fec-b1bd-4305-b5a2-2c880d44ebfd` remains historical
  failed/stopped evidence.

## Next action

Begin B1. Build the GPT Image 2 adapter and replay contract red-first, including a restore-tested
content-addressed export path before retaining any paid result in the Railway bucket. Recheck the
official current API contract and record the spend ceiling before the minimal live call.
