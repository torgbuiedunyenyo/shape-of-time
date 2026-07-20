# Handoff

_Updated 2026-07-19._

## Current state

- Repository: `torgbuiedunyenyo/shape-of-time`.
- Active implementation branch: `codex/reader-first-slice`.
- Active isolated worktree: `/Users/ratpartyserver/git/shape-of-time-reader-first`.
- Authority checkpoint: `8fafde0`; another agent may be working in the `main` checkout, which this
  worktree must not modify.
- **CURRENT ITEM: C0 — Build the reader-first vertical slice.** Reader mechanics and a deliberately unaccepted
  working content fixture are in flight in this worktree. They are not C0 completion evidence.
- The current C0 checkpoint passes 67 non-acceptance content/architecture tests, 116 unit tests, 20
  real-Postgres integration tests, 11 built-reader browser regressions, lint, typecheck, and
  production build under Node 24.18.0. The two production-content tests remain deliberately red.
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
- B0 is complete. The owner read the folio bodies, requested direct titles and relational Primas
  language, and then delegated subsequent decisions; the requested revisions and three independent
  adversarial rereads all pass.
- B1 is complete. The exact GPT Image 2 request adapter, required-anchor/reference compiler, strict
  opaque-PNG response validator, replay v2, durable one-dispatch journal, and external recovery path
  pass the complete repository gate and three final independent adversarial reviews.
- The first six Fable-authored folios, Payment, The gift, The band, Your tomorrow or mine, The venue,
  and After closing, plus the Payment and Band plates are accepted into private editorial progress.
  Current C0 progress is 6/10 folios and 2/4 plates. The remaining
  working 8+2 prose in `content/reader-first/slice.json` is still an editorial draft, not accepted
  production content.
  Treatment B remains the shared medium rather than a source of characters, place, palette, or
  composition. No narrative slice asset has been published to the Railway bucket.

## C0 reader-first slice in flight

- The file-backed shell now has an explicit Library/cover, eight root and two child folios, varied
  layouts, Previous/Next, arrows, touch swipe, the exact prepared aperture, exact Back, arbitrary
  cross-paragraph selection, local title filtering, distinct disconnected title creation, bookmark,
  reload/resume, responsive layout, reduced motion, and movement-rest surfaces. It makes no runtime
  API or provider request.
- Reader state is one versioned local record. Resume stores a stable nearest-block anchor and returns
  to that focused block. The header remains quietly sticky so using Library does not first erase the
  reader's place. Updates are persisted synchronously so an immediate reload cannot lose the latest
  place.
- Aperture journeys are scoped to their destination book and share one tested pure page-turn
  decision with the production hook. A child-to-Library-to-root visit no longer leaks “Back to
  passage”; browser-history reversal is symmetric and does not push duplicate folios.
- The disconnected creation surface is a native modal dialog with contained focus. Page-turn keys
  ignore interactive/modal targets. Swipe cancellation and interactive origins are ignored; mobile
  bookmark state is visible; filtered children retain child-cover styling; invalid client routes do
  not change hook order; selection state clears on folio change.
- Six browser regressions were observed red before those repairs: stable-block resume, journey leak,
  Previous-then-Next duplication, modal focus/background navigation, cancelled swipe, and 320px
  bookmark/dialog behavior. That reader-shell checkpoint passed 39 authority/architecture
  tests, 110 unit tests, 20 real-Postgres integration tests, and 11 built-reader browser tests plus
  lint, typecheck, and production build. Two historical B2 filesystem orchestration tests received
  15-second per-test ceilings after the complete unit run proved their former 5-second limit flaky;
  their assertions are unchanged. The two C0 production-content tests remain deliberately red.
- Early in-app Browser inspection found the Library, desktop reader, and mobile reader visually
  coherent; it directly verified exact block resume and modal key containment after repair. This is
  development evidence only, not the complete C1 or D6 walkthrough.
- `scripts/verify-reader-first-content.test.mjs` remains intentionally red because
  `content/reader-first/production-manifest.json` and all four final WebP plates are absent. The four
  current plate URLs 404 and their alt text is explicitly draft text. C0 cannot pass in this state.
- The earlier Claude Code CLI proposal was rejected before dispatch. Although it could supply actual
  prior images, it could not prove the provider-counted pre-spend boundary or exact 32,768-token
  output maximum required by SPEC. C0 now uses a minimal direct Messages API request path shared
  with later D0; C0 does not connect it to the reader runtime or claim D0 complete.
- The baseline output contract now matches SPEC: one structured Fable result contains prose and an
  optional natural-language image direction; text-led folios require `null`. This replaced the stale
  prose-only XML result after a named red proved the contradiction. Input authority remains organized
  with XML document boundaries.
- `content/reader-first/authoring-brief.md` defines the readable 8+2 compression and four narrow
  application reference decisions without becoming another world summary. Shared guidance no longer
  leaks either book's trajectory into the other. The bounded harness compiles exact current-book
  history with verified accepted images immediately after their prose, binds the immutable candidate
  and image evidence behind every history block, and confines every referenced file to one fixed
  private archive.
- The direct request path pins Fable/xhigh/no tools/no fallback, binds exact canonical count and
  generation bodies plus system/schema/source/image digests, calls the official count endpoint,
  persists its request ID and response digest before one inference claim, sets `max_tokens: 32768`,
  uses a 30-minute response boundary appropriate to xhigh, streams the raw response into durable
  private evidence, and rejects model/stop/context/output drift. Admission, the first claim directory,
  and the fixed folio claim are flushed before dispatch; the claim prevents a second paid operation
  even if a manifest changes. Accepted history now resolves and verifies the complete fixed-path
  request, count, admission, response, and candidate chain before sending any prose or image onward.
  Twenty-three focused Fable-authoring tests and all 67 non-acceptance content/architecture tests pass,
  along with lint
  and typecheck.
- The written C0 ceiling is ten direct Fable operations at a `$2.00` worst-case projected maximum
  each and `$20.00` aggregate, plus six GPT Image 2 operations at a `$0.10` request-scope estimate
  each and `$0.60` aggregate. Four operations are for the required plates; the two bounded repair
  slots exist only after a preserved visual rejection and a newly inspected dry run.
  The first Fable operation was dispatched exactly once at private path
  `/Users/ratpartyserver/git/shape-of-time-c0-authoring/fable/01-root-folio-01-1630c5df2f00`;
  request-manifest digest `1630c5df2f00914bcea58076859c66257cfa41ce3ca6a578de841b8480c590ec`.
  Its 13,112-token officially counted input contains no Undertow, craft examples, visual-production
  material, or child trajectory. Fable returned 242 words plus one image direction using exact
  `claude-fable-5`, `xhigh`, and `end_turn`; usage-derived estimate `$0.370920`. Candidate SHA-256 is
  `ed52dd2d072314454500515d20350561bf964fa212d3dc69f8ec50e702177986`. Three earlier prepared
  operations remain obsolete and undispatched. Payment is the first exact entry in verified
  `progress.json`.
  The gift was then officially counted at 15,545 input tokens and completed once under operation
  manifest `84a92169124e65c9080fc8c192fb04c96bd2a9359547ba2cee31429b72f0d899`.
  Fable returned 253 direct, legible words with `imageDirection: null`, exact model/effort, and
  `end_turn`; usage-derived estimate `$0.278350`. The old postflight refused the otherwise valid
  result for exceeding 250 words by three. It was not redispatched or edited. A one-time no-provider
  recovery reconstructed candidate `fd9c0ab6d3acedb9abc9b596fcd9a3509f38b1cd41d5da2f351db2f19dc91d46`
  from the immutable response. The operational hard stop now remains narrow at 260 while the
  prompt/layout target remains 120–250, and the runner permanently writes a provider-complete
  candidate before applying that editorial check. The text-only acceptance path appended it without
  an image digest.
  The band followed under exact operation manifest
  `32465d99ec4aadacd9d22139aaf8308c55ba539364c67f60bd32fff572c98d48` and 16,108 officially
  counted input tokens. Fable returned 234 words plus one image direction with exact model/effort and
  `end_turn`; candidate `07cf1a49a80a945d2c6e97ad1ed4ff255de214e68e67bad312da5bf96634d613`,
  usage-derived estimate `$0.400230`.
  Your tomorrow or mine followed under exact operation manifest
  `418a98198e7381479dec488a674bb31319b7bcf33d617100323e05b9d5884a7a` and 18,578 officially
  counted input tokens. Fable returned 260 words with `imageDirection: null`, exact model/effort,
  and `end_turn`; candidate `8e1d7778cf20b440838ab19f2c01b6d7934b97be781796e577eae38dd61d9a99`,
  usage-derived estimate `$0.318130`. Its exact source result has one surplus terminal quotation
  mark; the archived candidate remains unchanged, and the reader fixture will record removal of only
  that mechanical mark in production provenance.
  The venue then completed once under operation manifest
  `d4243a8020de1ba51b3b5b208595f263279e457ecf1cf2098ecc0bed262c0917` and 19,142 officially
  counted input tokens. Fable returned 247 words plus an unrequested image direction with exact
  model/effort and `end_turn`; candidate
  `92ac4f65ee2bb04f2a4bafdd91ff7299b7f5a7f0b32b48692acb46a1a61f4576`, usage-derived estimate
  `$0.501970`. Strict postflight preserved then refused the layout mismatch. No retry or image call
  occurred. A red-first disposition path now requires the exact unwanted-direction digest before a
  text-led acceptance can expose only the prose; ordinary postflight remains strict. The discarded
  digest is `d6718038158319d2a4a881fccbbbd3acb45bf86d1d983df0af408becd2110cce`.
  After closing completed once under operation manifest
  `acb26c64b3983173bee043ee99343e2cfe49f0f8aeec0897cd5ec0eba9d31008` and 19,633 officially
  counted input tokens. Fable returned 254 words plus another unrequested image direction with exact
  model/effort and `end_turn`; candidate
  `e1887b6f0d1986df1a520f1f8541698032fd6530400a2df17045c21227cbce5d`, usage-derived estimate
  `$0.504830`. No retry or image call occurred. Acceptance exposes only the prose and binds discarded
  direction digest `45b1a6f669583787f1cc7281c513cfbe88acbec7357b04721cf5d5cc0f4c01c7`.
  The repeated mismatch exposed a schema contradiction: every request had allowed either null or an
  object while prose asked for null on text-led folios. A red-first fix now resolves the exact schema
  by layout before hashing or dispatch, making null mandatory for text-led folios and the complete
  direction object mandatory for illustrated folios. C0 Fable provider calls executed: six; accepted
  prose folios: six.
- The exact GPT Image 2 route is the existing direct Image API adapter and journal. It proves the
  requested `gpt-image-2-2026-04-21` snapshot, request ID, usage, latency, and output digest; the API
  exposes no served-model field. The Codex image-generation tool cannot prove that contract and must
  not be used for accepted assets. The C0 Payment dry run binds Fable's direction unchanged plus one
  verified Treatment B medium-only reference, one operation, and a `$0.10` cap. The original v1
  dispatch reached OpenAI once but was rejected before generation because Railway's stored key was
  invalid; it returned no image, usage, or reported cost and remains immutable. A distinct local
  owner-managed key passed an authenticated no-cost model lookup. Credential-repair v2 then completed
  once with output `44a44b4f26e00b61e1002636406fd6e5c1597cf3314072fef9c01cc0aee51ac8`
  and a `$0.056578` usage estimate, but visual review rejected visible amber Clef contents, a misplaced
  six-pack, near-derelict shop treatment, and navy/beige medium leakage. It remains unaccepted.
  Review paths are now operation-specific so a preserved rejection cannot block a replacement.
  Visual-repair v3 retained Fable's direction and references, adding only those observed corrections.
  Its manifest digest is `f1a41f196087feabc46251058b3b7dcae8c9db574dea81c29b90a8e89adb2245`;
  reviewed operation digest is `193a510ed79ec4b7c583d2924107e6fa28b04f4742bbac861076f52eba04429e`.
  It completed once under provider request `req_ff1f68e1a3a64490969ff900202a95a8`, output digest
  `d9c7efe3f5f7efcbb5cda61b309bc1aa909bffbfe2ff05623c46d1f1546f181c`, and a `$0.057068`
  usage-derived estimate. Reading-size visual review passed the functional worn shop, face-down phone,
  visibly held six-pack, obscured Clef, four coherent people, and scene-local green/brown palette.
  The separate no-provider command then validated and accepted it before atomically appending
  progress. The acceptance verifier rejects fabricated receipts, header-only PNGs,
  substituted Treatment B or exposed-plate references, candidates built from the wrong accepted
  history, and replay/receipt field drift. Concurrent replay of the exact same progress entry appends
  once, and acceptance preflights the next global folio before writing its fixed immutable path.
  Neither provider key is exported into the current process. A read-only Railway variable-name audit
  confirmed both names on the designated production service, but the OpenAI value is invalid and must
  not be used for C0.
  The Band plate then completed in one dispatch with Payment as its sole narrative continuity
  reference: operation `cf492bb5edff409266b3d82c7ff94854d14230705bf2f5d6332a81b3e49640f1`,
  provider request `req_72ab756044b34ffd94310b3b51bec1ad`, output
  `93b388838c3dd73c94ce61658e4df8fc00eb1e166e8a425a5b3b65bdd7d2f2c4`, and `$0.056818`
  usage-derived estimate. Reading-size review passed identity, medium, relationship change, coherent
  band, and the unnoticed ordinary recorder that performs the plate's narrative job. Acceptance
  digest `867bb9f056cf01fc30677d1d7f1ab0c772bb96de0cc1f9ec480ad12c4bf4ed92`.
  C0 image dispatch attempts: four; accepted C0 narrative images: two. The two remaining slots are
  exactly the root Map and Lagos terminal wall, with no repair headroom.

## Reorganization record

- A second agent advanced a divergent `fable/d0-fable-adapter` worktree through backend prototypes;
  its latest local checkpoint is `7e5a861` and `origin/main` currently points to its earlier
  `3e1493d`. It is preserved as an implementation bank, not current authority. It has no reader/API
  composition, substitutes text descriptions for actual prior images, forces image generation, and
  conflicts with the reader-first queue. Do not merge or cherry-pick it wholesale. After C1, manually
  adapt only its narrow HTTP-test, deterministic-ordering, repository-query, and concurrency-test
  ideas onto the hardened C0 path.

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
the exact source passage. Text and images share narrative work. The first proof is a file-backed
reader-first slice: eight root folios, the independent two-folio *Map on the Wall*, four actual
narrative plates, and one exact aperture/return. It must be delightful before generation is connected
to the reader runtime; broader garden expansion follows the complete dynamic-reader gate.

The writer is Claude Fable 5 at `xhigh`, without Opus or provider fallback. For every new folio,
Fable receives prior current-book prose and actual narrative images interleaved in story order. It
returns new prose plus an optional natural-language image direction. Images use the pinned GPT Image
2 contract: the application supplies that Fable-authored direction plus the smallest relevant ordered
prior-image references while retaining control of scope and technical settings. The complete Fable
request has a hard 400,000-token ceiling. The architecture remains one TypeScript application,
Postgres, and image storage.

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
- At the owner's direction on 2026-07-19, the baseline folio request now contains one compact
  human-authored `<prose_guidance>` block adapted for fiction. It asks for direct, concrete,
  well-oriented narration and guards against invented thematic labels, empty abstraction, narrator
  self-grading, and manufactured profundity. It explicitly preserves character voice, texture,
  summary, and useful exposition, so it is neither a rigid show-don't-tell rule nor a style sample.
- The guidance lives inside `prompts/fable/write-folio.md`, not in a second style bible. The named red
  first failed because the block was absent; focused structural tests now prove that exactly one
  sub-400-word block remains inside the writing request and that prose quality stays a consecutive
  human-reading judgment rather than a vocabulary filter. No provider call or spend occurred.
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

## B1 image contract and recovery

- B1 pins `gpt-image-2-2026-04-21`, uses generation for an unanchored first candidate and edit for
  ordered reference work, and omits `input_fidelity` because GPT Image 2 edit inputs are intrinsically
  high fidelity. The Image API exposes no served-model field and no documented provider idempotency.
- Request compilation copies caller-owned reference bytes, requires explicit human-approved,
  exposed-folio, or contract-only provenance, binds required anchors and exact reference order, and
  caps the complete post-guidance prompt at 32,000 characters.
- The adapter sends bearer credentials only to exact `https://api.openai.com` endpoints with redirect
  following disabled. It performs no automatic transport/server retry after a durable dispatch claim.
- Successful output requires canonical base64, exact dimensions, an opaque structurally valid PNG,
  safe usage/cost arithmetic, and request-bound model/cost/timing evidence. Replay fixtures are built
  from an exact allowlist and pass the same semantic validator before durable receipt and replay.
- The filesystem journal archives exact edit references before dispatch, creates one immutable
  prepared record, one dispatch marker, and one atomic received-or-failed resolution. A received
  result can be reconciled into external recovery without redispatch; an ambiguous dispatch without
  received bytes remains indeterminate.
- Paid output recovery lives outside Git and Railway at
  `/Users/ratpartyserver/git/shape-of-time-recovery`, archive ID `owner-archive-2026-07`. Its four
  object/receipt pairs restore cleanly; snapshot digest is
  `86748ab97055f0ad2de402c05b6f033c577ff263a8b59f0aa68a330a2a5c4ae6`.
- The production Railway bucket recovery smoke v4 created, restored, verified, and removed only its
  synthetic owned object. Final bucket count remained zero.
- The two historical low-quality endpoint-contract calls succeeded without retry and have an
  estimated usage-derived total of `$0.028649` under the written `$0.10` scope cap. They predate the
  journal and are not misrepresented as journaled narrative assets.
- Three final independent Sol/xhigh adversarial audits returned PASS after red-first repairs. The
  clean exact-runtime full gate passes 33 content tests, 67 unit tests, 20 real-Postgres integration
  tests, one built-reader Chromium regression, lint, typecheck, and production build. Complete
  evidence is in `docs/qa/2026-07-19-b1-image-contract.md`.
- B1 is complete. No generated narrative image or visual anchor has yet been approved.

## Spend and deployment

- C0 text-generation spend: six Fable calls, usage-derived estimates `$0.370920`, `$0.278350`,
  `$0.400230`, `$0.318130`, `$0.501970`, and `$0.504830`, aggregate `$2.374430`; the provider bill was not
  separately queried.
- C0 narrative-image spend: the rejected Payment v2 estimate is `$0.056578` and accepted Payment v3
  is `$0.057068`, plus accepted Band `$0.056818`, for `$0.170464` across three completed outputs;
  the credential-rejected attempt returned no usage or reported cost. Known C0 text-plus-image
  estimate is `$2.544894`.
- Image-generation provider bill: not reported by the Image API. B1 authorized exactly two calls
  within a `$0.10` request-scope bound. Captured usage and the 2026-07-19 standard rates yield an
  estimated total of `$0.028649` (`$0.011760` image output, `$0.016384` image input, and `$0.000505`
  text input).
- Infrastructure mutation: the owner-designated Railway project now has the one-app, one-Postgres,
  one-private-bucket topology recorded above. Railway usage is active; no dollar cost was queried.
- Deployment: active and healthy at `https://shape-of-time-production.up.railway.app`; deployment
  `81ca9edd-7e22-4b51-9096-e3bb085ac5ef` is `SUCCESS` on exact B1 commit `6fc0038` after GitHub
  Application gates run `29701491746` passed.
  The earlier documentation-only deployment `dd843fec-b1bd-4305-b5a2-2c880d44ebfd` remains historical
  failed/stopped evidence.

## B2 frozen historical checkpoint

- Historical branch: `codex/b2-visual-study` in
  `/Users/ratpartyserver/git/shape-of-time-b2`. It is not the active product worktree.
- Treatment A completed and is recovered. Original B/C are immutable indeterminate operations.
- Replacement B is also immutable indeterminate after HTTP 200 because a duplicated durable-journal
  base64 regex overflowed. Its terminal digest is
  `a4b2f9659c137e67eb3abd9877d968cd68dfb80dc8a07592d1677ec038c6c0c8`; provider request
  `req_739fd4bdd47549648f844ed65006b163`. It must never be retried.
- Replacement C completed and is recovered under output digest `93498bd84304576bfa3a9f2886ae6fb69a3d45a74fa2dc092602e204e1483d44`;
  provider request `req_5c4dbec2154343878378ee21b668fccc`; usage-derived estimate $0.042205.
  Provider and durable decoding now share one bounded linear canonical-base64 decoder, with
  multi-megabyte regressions at both boundaries.
- Treatment B v2 completed and is recovered under output digest
  `85e55625e3a8bcf3e31c3546689287dc306736bf8deef59172ae8511c6dd2b06`; provider request
  `req_e0f6415b63674914bda51745a8b63987`; usage-derived estimate $0.042215. The requested snapshot was
  `gpt-image-2-2026-04-21`; the Image API supplied no served-model evidence.
- The original treatment tranche authorized $0.15, the B/C replacement tranche $0.10, and the
  recorded one-call B-v2 tranche $0.05. Aggregate B2 request-scope authorization is $0.30; the bill
  for indeterminate calls is unknown. No text spend has occurred.
- The project owner reviewed A/B/C together and gave the medium-selection gate a human PASS for
  Treatment B: observational varied ink, transparent restrained color, tactile paper and wear,
  natural perspective, and concrete faces and hands. Every person, place, palette, and compositional
  choice in the comparison scene remains incidental.
- B2 is frozen at the owner-approved Treatment B medium. There is no `anchors.json`, and the
  previously proposed continuity matrix is no longer a prerequisite. Actual reader plates are the
  evidence; a targeted repair is allowed only if those plates reveal a concrete continuity failure.
- Continuity Stage 1 is historical dry-run evidence and must not dispatch. The checked-in eight-image
  Treatment B plan is `content/shape-of-time/visual-continuity-plan.md`; the Stage 1 harness is
  `src/server/images/b2-continuity-stage1.ts` (idempotency key `b2-continuity-root-payment-v1`,
  text-only 1024x1536 medium, zero references, exactly one provider operation, written $0.05 cap,
  archive `b2-visual-study-2026-07`, review root
  `/Users/ratpartyserver/git/shape-of-time-b2-review/continuity-v1`). Its three red tests were
  observed failing first, then pass 9/9 + 2/2 with typecheck, lint, and `git diff --check` green;
  two malformed cost fixtures were narrowly repaired to satisfy B1's usage-arithmetic invariants,
  with assertions untouched. The exact dry run was executed and inspected: study digest
  `bd93dc513e7b002bb8515210ec3a3dfdd8dd93eba2cd9c5b6d5c7bd2797a64b6`, manifest digest
  `f96a6acbc722198467460136382905c773a980d114351c84e622ea79b97b050d`. **No Stage 1 provider call
  and no new spend occurred; provider calls executed: 0.** Treatment B remains human-approved at
  medium scope only; continuity and every anchor remain pending. Evidence:
  `docs/qa/2026-07-19-b2-continuity-stage-1.md`.

## Next action

Review and dispatch the already prepared `root-folio-07` (`The map`) Fable operation exactly once
under request-manifest digest `2643558816187ff44b52e350469d4854010dc51dae167d2ae12d638ff72ee32e`.
Its request contains the six accepted prose folios and both actual accepted plates interleaved in
exact story order; both discarded text-led directions are absent. The layout-specific schema requires
a complete image direction. It is pinned to Fable 5, xhigh, and `max_tokens: 32768`. Continue the sequential
8+2 chain. Never dispatch
the frozen Stage 1 operation or substitute the Codex image-generation tool. Replace the draft fixture,
add production provenance and digest-named WebPs, pass the content verifier, then perform the complete
C1 consecutive read and every-feature in-app Browser walkthrough before D0.
