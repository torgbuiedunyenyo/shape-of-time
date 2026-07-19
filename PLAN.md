# Shape of Time — Compaction-Safe Execution Plan

> **Status:** A0 authority, A1 architecture, A2 application/Railway spine, B0 movement topology,
> and B1 image/recovery contract are complete.
> **CURRENT ITEM: B2 — visual direction and continuity proof.**

This is the dependency-ordered work queue for a small illustrated hyperbook. It intentionally does
not inherit code, data, schemas, corpus, or compatibility obligations from `auto-biblio`. Git in the
old repository is sufficient evidence of that experiment.

## Product contract

> Read a beautiful illustrated novel. Turn the page to move through its story. Open a phrase to enter
> the illustrated book latent inside it. Return to the exact passage. Every direction can continue,
> but each stretch of reading goes somewhere.

- The containing product is a calm, dependable e-reader; generated text and images change inside it.
- A page turn advances one finite current movement inside a book that has no predetermined last
  folio. It never blocks on chapter-sized generation.
- A semantic aperture opens another illustrated book with its own founding premise and trajectory;
  it does not choose a protagonist's action and is not a chatbot prompt.
- The generation/publication unit is one **folio**, initially about 120–250 words plus an image when
  the beat calls for one. Parts and chapters are literary groupings only.
- The initial garden is a 14-folio Shape of Time movement plus the opening of its next movement,
  three prepared 2–4-folio child opening movements, and at least one child continuation across a
  movement boundary. Each movement reaches a real emotional and causal threshold without pretending
  the book is over.
- Prose owns action, motives, dialogue, causality, thought, and orientation. Images own material
  evidence, place, atmosphere, contradiction, relationship, or deliberate omission; they may not
  merely paraphrase the prose.
- The form is an illustrated novel / artist's folio, not a panel-by-panel graphic novel. Plate,
  split, image-led, text-led, map, document, and artifact layouts may share one reader grammar.
- Suggested phrases are the warm lateral path. Arbitrary highlight and explicit title creation are
  real cold paths. Shelf filtering is local and never silently spends money.
- Exposed folios are immutable and appear atomically only when required prose and images are ready.
  Unseen work may be retried or replaced.
- Exact Back restores source book, folio, phrase/selection, and viewport through navigation, reload,
  responsive reflow, and browser history.
- Normal reading never shows token streaming or a generic loading page. Preparation hides latency;
  a true cold path leaves the reader in place with an honest, book-native creation state.
- Human consecutive reading and hands-on reader use are the primary literary and experience gates.
  A model judge may diagnose but cannot certify delight.
- Oakland anchors the root but does not bound the library. The initial garden must include a
  non-root viewpoint, a primary setting beyond Oakland or the Bay Area, and a materially meaningful
  use of Phantas or Mystas.

## Fixed source and provider constraints

### Canon

The corrected source must be extracted exactly from:

- repository: `https://github.com/torgbuiedunyenyo/infinite-book`
- commit: `1c3644b7d2e7c7b10a62cfa6c6f876ac53559836`
- file/range: `world_document.md`, line 19 through EOF (source line 373)
- expected body SHA-256: `e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c`

Lines 1–15 are editorial preamble, not canon. Retired material must not return: the malevolent dark
thing, an amplifying rather than self-healing disturbance, scattered duplicate selves, Jay's
quasi-mystical temporal sense, or a fixed 2150 chronology. Undertow is a labeled sequel seed, not a
seventh act.

### Text

- Writer: direct Anthropic Messages API with `claude-fable-5`, `output_config.effort: xhigh`, no
  Opus alias, fallback, repair writer, manual thinking budget, provider compaction, or provider
  memory.
- Send the complete world verbatim as the sole comprehensive factual and plot authority. Start with
  a light instruction for clear, absorbing, physically and causally legible prose plus the explicit
  temporal-rules block that protects the world from familiar loops, branches, paradoxes, fate, and
  supernatural time effects. Canon is factual authority, never a style sample.
- Keep the adapted craft examples outside the baseline. They may enter one versioned, controlled
  A/B experiment only after consecutive human reading identifies placeless abstraction,
  above-the-scene reporting, or explanatory flattening as a repeated failure. Do not add generated
  exemplars, recursive voice conditioning, a literary ban list, or a model committee.
- Every request is stateless and reproducible from immutable application records. Writer inputs use
  `BOOK_ORIGIN` and `CURRENT_MOVEMENT_BRIEF`; the root plot is context rather than a child template.
- The hard limit covers the exact complete multimodal request:

```text
ABSOLUTE_CONTEXT_CEILING = 400_000
MAX_OUTPUT_TOKENS        = 32_768
SAFETY_MARGIN            = 4_096
MAX_COUNTED_INPUT        = 363_136
```

Before spend, render the exact request and use Anthropic's official token-count endpoint. Require
`input + output + margin <= 400_000`; count failure blocks generation. No character estimate,
cache-adjusted count, silent attachment removal, or request-time truncation is allowed.

### Images

- Use direct GPT Image 2 APIs, initially pinned to `gpt-image-2-2026-04-21`; recheck the current
  official contract before implementation.
- Text-only generation is for initial candidates. When continuity references exist, use the image
  edit path with 2–5 explicitly ordered identity, appearance, place/object, causal-neighbor, or
  parent/opposite-neighbor references.
- Each prompt separates `must remain`, `must change`, the image's narrative job, composition, and
  prohibitions. Persist the snapshot, exact prompt/version, ordered inputs, output digest, provider
  request ID, moderation/error, latency, pricing version, and usage-derived estimated total cost or
  explicitly unavailable components.
- The Image API does not expose the served model or document provider idempotency. Persist the exact
  requested snapshot without relabeling it as response evidence. One application operation dispatches
  once; an ambiguous transport or server result requires reconciliation rather than an automatic
  resend that could duplicate spend.
- A rejected image is never a reference. Shared direction and reusable recurring-identity anchors
  require deliberate human approval. A validated exposed image may become a book-local continuity
  reference without becoming world canon. Clef and other source-open forms are decided only within
  the book that needs them and may differ in another book.

### Small-system boundary

The target is one TypeScript package, one deployable Node process, one composition root, one
Postgres database, and one image bucket/CDN. A small Postgres-leased in-process generation loop is
allowed. Do not introduce a workspace graph, Redis, a separate worker, graph/vector service,
multi-model tribunal, accounts, auth, or backward-compatibility layer without new evidence and a
plan revision.

Initial durable entities are `Book`, `Folio`, `Aperture`, `Asset`, and `GenerationAttempt`. Browser
local state holds bookmarks, discoveries, and current place during the prototype. A sixth derived
`memory_records` table is permitted only by the measured long-form trigger in E0.

## Work rules

1. Only one queue item is in progress. Do not begin a dependent item early.
2. Every item is red → green → refactor. Write its named test, run it, and retain the failure before
   implementing. Never weaken a gate to make it pass.
3. Paid calls require a written spend ceiling and dry-run request inspection first. Live contract
   tests use the smallest useful sample.
4. Static-reader delight must be green before Fable or dynamic generation is connected.
5. Prefer deletion and a smaller composition over abstraction added for hypothetical scale.
6. Use current official documentation before selecting or implementing changing library/provider
   contracts. Pin the resulting versions and record the decision.
7. Each item ends in one coherent commit with tests and evidence. Run fast gates per slice and all
   gates before pushing.
8. Experience walkthroughs use the in-app Browser, not Playwright. CI-level browser automation may
   supplement but never replace the visible reader walkthrough.

## Dependency map

```text
A0 canon/story/visual lock [DONE]
  -> A1 one-app stack decision [DONE] -> A2 app + Postgres/Railway spine [DONE]
A0 -> B0 movement beats and continuation topology [DONE]
A0 + A2 -> B1 image adapter -> B2 continuity proof
B0 + B2 -> C0 static garden -> C1 reader -> C2 navigation -> C3 delight gate
C3 + A2 -> D0 Fable/count adapter -> D1 full-history compiler -> D2 prose baseline
D2 + B2 -> D3 movement planning + pagewise generation -> D4 dormant provenance seam
D4 + C2 -> D5 predictive preparation -> D6 dynamic highlight/title
D6 -> F0 release gate -> F1 Railway release hardening -> F2 deployed Browser QA
D4 + D6 --only if measured trigger fires--> E0 long-form reconstruction -> F0
```

## Queue

### A0 — Lock canon, story, and visual authority **[DONE]**

**Depends on:** nothing.

**Red:** Create an implementation-independent content and prompt contract first. It must preserve the
checked-in source digest, then fail while lossy duplicate canon remains or the first root movement,
temporal guardrail, XML baseline, child independence, scalable visual grammar, optional-example
boundary, and rendered Undertow/visual exclusion do not exist. Break each source-count, ordering,
scope, and exclusion rule deliberately.

**Implement:**

- preserve content/shape-of-time/world.md byte-exactly as the sole comprehensive factual and plot
  authority, with content/shape-of-time/SOURCE.md as provenance;
- add content/shape-of-time/root-movement-01.md in natural prose with only the first finite
  movement's beginning, dramatic question, and resting boundary, while stating that the root book
  continues from its changed state;
- add prompts/fable/temporal-rules.md, preserving the useful false-versus-true anti-trope function
  without IDs, citations, a fact taxonomy, or a compressed substitute for the world;
- add prompts/fable/write-folio.md with whole-document XML boundaries, `BOOK_ORIGIN`,
  `CURRENT_MOVEMENT_BRIEF`, full current-book history, and the current folio and light writing
  request last; make the child founding premise explicit and reject root-plot replay;
- preserve the teaching function of the three older micro-demonstrations as clearly labeled
  adaptations in prompts/fable/craft-examples.md, explicitly excluded from baseline and available
  only for one controlled experiment;
- rewrite content/shape-of-time/visual-bible.md as location-neutral story-wide grammar plus the
  contracts for book-local profiles, folio briefs, and ordered reference images; it is never a prose
  prompt input and it leaves Clef, casts, places, devices, and scenes open until their actual scope
  needs them;
- keep content/shape-of-time/undertow.md byte-exact and excluded from the current narrative; and
- delete the derived story bible, duplicated six-part arc, and typed narrative-authority manifest.

Human review approves the shared direction and reusable recurring-identity references. Book-local
places, objects, and open concepts may be decided by the current movement's local generation and
exposed prose or imagery, but they cannot leak into siblings or global canon.

**Green:** The exact source digests pass; prompt mutations reject missing/duplicated/reordered world
input, code-shaped canon, Undertow, visual production material, and accidental activation of the
optional examples. A reviewer can read the complete original world, understand the first root
movement boundary and continued root book, inspect the exact baseline prompt shape, distinguish world,
lineage-local, and folio visual scope, and see how a child avoids root-plot gravity.

### A1 — Deliberately select the one-app stack **[DONE]**

**Depends on:** A0.

**Red:** An architecture contract fails because no supported runtime, package manager, HTTP/build
stack, test runner, database/migration path, browser-test path, or object-storage boundary is pinned.

**Implement:** Consult current official docs and write a short ADR comparing only credible small
options. Select exact versions for one TypeScript package and one Node process serving the React
reader, HTTP endpoints, static assets, and the in-process queue. Specify local/CI Postgres, migration
tooling, tests, lint/typecheck/build, image storage, and Railway execution. Reject any option that
requires a second runtime service or framework-induced deployment graph. Use the owner-designated
Railway project `8b20e07d-c256-44c9-85be-d1c7e50ac83d` from the first executable commit.

**Green:** A fresh-clone command matrix is explicit; the architecture audit proves one package, one
process, one composition root, and no Redis/worker/workspace graph. The decision explains tradeoffs
rather than inheriting a familiar stack by reflex.

### A2 — Scaffold the application and durable state spine **[DONE]**

**Depends on:** A1.

**Red:** Unit and real-Postgres integration tests fail because the app, health route, transaction
boundary, five-table schema, state machines, and object-storage interface are absent. The linked
Railway service also has no successful executable deployment, Postgres, bucket, domain, migration
command, or healthcheck.

**Implement:** Build the ADR-selected Hono/Vite/React shell, strict environment schema, migrations,
repositories, structured logging, CI, and content-addressed Railway-bucket adapter. The Book record
owns an append-only ordered set of movement briefs; Folios identify the brief they advance, without
adding a sixth entity or service. Use unique folio ordinal and generation idempotency keys. Implement
`reserved -> generating -> ready -> exposed|failed`; an atomic exposure freezes prose, layout,
aperture spans, and required assets. Use real test Postgres, not repository mocks.

Finish and commit the runnable application locally before changing Railway. Keep app autodeploy
disabled while provisioning Postgres pinned to
`ghcr.io/railwayapp-templates/postgres-ssl:18.4`, its volume, and one private SJC bucket. Enable daily
volume backups before nondisposable data and disable Postgres's external TCP proxy. Stage the app's
US-West region, private references, Railpack/start/pre-deploy/`/healthz` configuration, and Wait for
CI without deploying. Then enable app autodeploy and push `main`; that passing push alone creates the
first app source deployment. After migration, schema digest, server version, health, and active commit
are verified, generate the public domain and run the reader smoke test. Never run `railway up`, manual
redeploy, or Deploy Latest Commit. Resource provisioning deployments are allowed and recorded.

Railway bucket contents are disposable during A2. B1 must establish and verify an export/recovery
path before any paid image output is retained there.

**Green:** A fresh clone installs, migrates, builds, lints, typechecks, and passes unit plus DB
integration tests. Duplicate reservations spend once; exposed-record mutation is rejected. The
Git-triggered Railway app deployment matches the pushed commit; its pre-deploy succeeded, schema
digest and Postgres 18.4 server version match, backups are enabled, the database has no public proxy,
and the bucket round trip passes. `/healthz` and the post-health generated-domain reader smoke test
are green.

### B0 — Author movement beats and continuation topology **[DONE]**

**Depends on:** A0.

**Red:** A movement-map validator rejects the missing/incomplete 14-folio root movement, its prepared
successor opening, three 2–4-folio child opening movements, and one child movement-boundary crossing.
Structural mutations reject missing portfolio evidence and an axis omitted from the actual child.
The consecutive human read, rather than a keyword proxy, rejects an Oakland-only garden, root
viewpoint replay, or Phantas and Mystas used only as vocabulary.

**Implement:** Write `content/prototype-movements.md` and `content/prepared-children.md` in natural
prose. Each finite movement names its dramatic question, the situation it begins from, the concrete
change it reaches, and its resting point. Each folio gets only the few sentences production needs:
what occurs and changes, why the person acts, what narrative job an image has, and which phrase might
open laterally. Do not create fact IDs, thread ledgers, state-before/state-after records, or a
literary schema. The first root movement covers the meeting, phone/payment incident, courtship,
intelligible temporal orientation, and honest decision/threshold; its successor begins from that
choice instead of replaying courtship.

Each child records the exact founding source, its own viewpoint or experiential center, primary
place and temporal position, inherited givens, lineage-local decisions, causal movement, and local
boundary. A child must not default to Jay, Tan, Oakland, or their six-part sequence merely because
world.md contains them. The garden as a whole includes a non-root viewpoint, a primary setting beyond
Oakland or the Bay Area, and a materially consequential use of Phantas or Mystas. Clef may appear,
but no portfolio rule determines what it is.

**Green:** Structure, mutation, sibling isolation, and coverage tests pass; a human read finds no
filler, lore-only beat, arbitrary cutoff, hidden CYOA action, child root replay, encyclopedia entry,
or image that merely restates the text. The prepared successor demonstrates continuation through a
changed state rather than indefinite tension.

### B1 — Build the GPT Image 2 adapter and replay contract **[DONE]**

**Depends on:** A0, A2.

**Red:** Dry-run and minimal live-contract tests fail until exact snapshot pinning, ordered reference
inputs, GPT Image 2's intrinsic high-fidelity edit behavior, request provenance, application-level
idempotency, one-dispatch failure semantics, moderation/error handling, and honest
usage/pricing/cost/latency capture are enforced.

**Implement:** Add typed generation/edit requests, reference-pack compilation, content-addressed
storage, exact request archival, one application idempotency identity, and a sanitized metadata
record/replay fixture. Omit `input_fidelity`, because GPT Image 2 applies high fidelity intrinsically,
and do not send an undocumented provider idempotency header. The requested snapshot is exact evidence;
the served model is not exposed by the Image API. An ambiguous dispatch is never retried automatically.
Before a paid result enters the Railway bucket, write and restore-test an operator-owned recovery
archive outside the repository and live Railway bucket. Reject missing required anchors, moderation
failure, malformed output, or an unprotected sole copy.

**Green:** Request compilation and sanitized replay are deterministic without secrets or generated
binary leakage; replay verifies the recorded result and does not regenerate pixels. Input order
changes the manifest; invalid/rejected outputs cannot become assets or anchors; every retained paid
image has a verified recoverable copy outside the live Railway bucket.

### B2 — Select visual direction and prove continuity **[CURRENT]**

**Depends on:** B1.

**Red:** The human scorecard and 8–12-image stress sequence are absent.

**Implement:** Compare two or three genuinely distinct treatments of the location-neutral shared
medium, then select one. Create only the reusable identity anchors the actual sequence needs; create
place, object, and open-concept references at book scope. Stress a recurring root figure in close and
wide views, a purposeful appearance change, return to a changed place, two materially distinct
cultures at different Primas coordinates, one non-Oakland place, a non-root central figure,
meaningful Phantas or Mystas geography, parent-to-child inheritance, a book-local realization of an
open object, and a neighbor repair. Iterate prompt/reference roles, not reader architecture.

**Green:** Side-by-side human review approves identity, place, purposeful change, coherent medium,
temporal-coordinate plurality, geographic/temporal range, and meaningful text/image division of labor.
`anchors.json` records scope: shared, recurring identity, or book-local. No Clef form, shop plan,
device silhouette, or generic coordinate style is promoted globally by accident.

### C0 — Build the complete static garden fixture

**Depends on:** B0, B2.

**Red:** Fixture validation fails on missing root/child folios, successor openings, movement-boundary
metadata, images, alt text, aperture spans, return coordinates, layouts, or portfolio range.

**Implement:** Produce the full 14-folio first root movement, one or two folios of its successor,
three prepared child opening movements, and at least one child successor opening with approved
prose/images. Human writing and heavy editing are allowed: this fixture tests the product, not the
generator. Add cover, discovered-library metadata, image roles, exact apertures, and deterministic
cold-path demo states. No placeholder title or legacy generated corpus is permitted.

**Green:** Every visible aperture resolves, ordinary Next crosses root and child movement boundaries,
every required image contributes new narrative information, the portfolio proves temporal and
geographic range, and the entire journey can run without network or paid calls.

### C1 — Build the instant reader shell

**Depends on:** A2, C0.

**Red:** Browser tests expose cover auto-advance, title flicker, global/banner leakage, dead page
controls, unstable mounts, inaccessible controls, or broken responsive layout.

**Implement:** Add restrained library and explicit cover entry; composed folio layouts; readable
typography controls; Previous/Next, keyboard arrows, swipe, bookmark/resume; stable focus; reduced
motion; responsive behavior; and quiet book-scoped status placement.

**Green:** Ten fixture turns work without flicker or duplicate history; keyboard/touch/focus/contrast
checks pass; no global status or cross-book banner can render over a page.

### C2 — Unify apertures, selection, search, and exact return

**Depends on:** C1.

**Red:** One integrated journey fails prepared phrase travel, arbitrary later-page/cross-paragraph
selection, local shelf filtering, explicit title-creation handoff, browser Back, reload, reflow, or
exact return to the founding passage.

**Implement:** Use one navigation state machine with opaque entries containing book/folio, source
span, selection, scroll/viewport, aperture ancestry, and return target. Add subtle phrase apertures,
a selection toolbar, “Open as a book,” distinct “Create a book called …” confirmation, shelf/history,
and Back to passage. `popstate` must restore and never push.

**Green:** Every mechanic uses the same state model; exact return and bookmark/resume survive reload
and responsive reflow; filtering cannot call generation; no mechanic is a disconnected demo.

### C3 — Pass the static in-app Browser delight gate

**Depends on:** C2.

**Red:** Use the in-app Browser on desktop and mobile-sized layouts to perform the entire clean-reader
journey. Record every friction, comprehension break, dead affordance, visual discontinuity, flicker,
stranded state, and incorrect return before fixing anything.

**Implement:** Iterate only the static content, composition, navigation, and interaction until the
reader feels like one stable object that invites another page and another aperture. Commit the
walkthrough, screenshots, and findings under `docs/qa/`.

**Green:** A reader can enter deliberately, read, turn, cross a movement boundary, open a prepared
phrase, return exactly, highlight later text, distinguish filter from creation, reload/resume, and
wants to continue both forward and laterally.

**Stop:** If the static garden is not pleasurable after focused iteration, revisit concept/content.
Do not connect text generation to compensate for a dull reader.

### D0 — Pin Fable xhigh and exact 400k admission

**Depends on:** A2, A0, C3.

**Red:** Dry-run and minimal live-contract tests fail until the served model is exactly Fable,
`xhigh` is accepted, the exact multimodal request is officially counted, and empty/refusal/
truncation/unsupported-stop/count failures are distinct. Record a spend ceiling first.

**Implement:** Add the strict adapter, request archive, exact token preflight, usage/cost/latency
postflight, resilient async transport, and same-key transient retry. Caching may improve latency but
may not alter the manifest or count. There is no fallback writer.

**Green:** Fable mismatch, Opus alias, refusal, empty output, truncation, count error, and any request
over the hard equation fail before publication or additional spend.

### D1 — Compile complete current-book history deterministically

**Depends on:** D0, B0.

**Red:** A randomized-insertion test fails until folio N receives, exactly once and in order: the
full world source, `BOOK_ORIGIN`, `CURRENT_MOVEMENT_BRIEF`, every prior exposed current-book folio
and narrative image, the approved temporal-rules block, current folio brief, then the light writing
request and output contract.

**Implement:** Build a stateless compiler with stable document boundaries, IDs/digests/order,
exclusions, prompt-cache hints, exact rendered-request archive, context manifest, and official token
count. Full history remains active while admitted.

**Green:** Identical sources produce identical context digests; any source/image/plan change changes
the digest. The rendered baseline contains the complete world exactly once and contains no Undertow,
visual-production authority, or optional craft examples. No rolling summary, recent-N window,
provider memory/compaction, `chars/4`, or silent truncation path exists. The initial garden never enters
long-form mode.

### D2 — Establish the lightly steered prose baseline

**Depends on:** D1, B0.

**Red:** There is no uninterrupted 8–14-folio Fable run or blind human scorecard.

**Implement:** Generate one consecutive run without line splicing. Archive exact prompts, model,
counts, outputs, latency, and cost. Readers record what physically happened, what each actor wanted,
why the page changed, missing orientation, forced exposition, uncashable abstraction, desire to turn,
and desire to open an aperture. Change one prompt/beat variable only for a repeated named failure,
then rerun blind. If the repeated failure is placeless abstraction, above-the-scene reporting, or
explanatory summary, the first tested change is one controlled A/B that adds the complete adapted
craft-example block and changes nothing else.

**Green:** At least eight consecutive folios are concrete, causally intelligible, canon-compatible,
paraphrasable, and worth continuing. A model score cannot override human failure.

**Stop:** If a small number of targeted experiments cannot make the baseline readable, reconsider
the story plan or writing contract; do not build a multi-model tribunal.

### D3 — Add movement planning and pagewise generation

**Depends on:** D2, B2.

**Red:** Real-DB integration tests fail until one idempotent movement plan reserves exactly one folio,
obtains one Fable result and the required reference-bound image, validates both, and exposes them in
one atomic ready transition. Separate mutations catch root-phase replay, a post-arc movement that
undoes the true ending, child continuation of the parent scene, root-plot recasting, and sibling
contamination.

**Implement:** Keep anchor/prepared plans human-authored. At a movement boundary, use one bounded
planning call to produce a short natural-prose brief before generating the next folio. Before the
root arc resolves, the brief advances the next unresolved source movement. A post-arc movement starts
from the true ending's changed situation and creates a new dramatic engine without importing
Undertow by default. A new child starts from its exact founding passage or title intent and defines
its own viewpoint, place/time, question, intended change, and boundary; the root plot is reference,
not its template. Later child movements grow only from that book's exposed history and lineage-local
decisions. Enforce sibling isolation in the normal path.

After planning, use one prose call and normally one image call per folio. Persist attempts, exact
origin, movement brief, and scoped visual profile; use Postgres leases; retry only a named failure.
Never generate a movement as one blocking prose unit and never stream prose into normal reading.

**Green:** Duplicate requests spend once; a process crash resumes safely; required text and image
appear together; unseen work can be replaced; exposed work cannot mutate; root and child books cross
movement boundaries without replay, terminal screens, or scope leakage.

### D4 — Prove the dormant long-form provenance seam

**Depends on:** D3.

**Red:** Provenance reconstruction fails because stable entity/time/causal/epistemic/visual IDs,
direct source spans/digests, state deltas, aperture scope, and exact context manifests are incomplete.

**Implement:** Persist this source-grounded metadata in the existing five entities and attempts.
Build no retrieval runtime, embeddings, graph, rolling summary, or sixth table.

**Green:** After deleting all derived development artifacts, the same folio and asset provenance can
be reconstructed from exact primary records. No generated prose or image is silently promoted to
canon.

### D5 — Prepare likely pages and apertures during reading time

**Depends on:** D4, C2.

**Red:** A latency fixture reaches the next/second-next folio or visible prepared aperture before a
durable reservation exists, or duplicates work under concurrency.

**Implement:** On exposure reserve next, second-next, and visible suggested-aperture openings inside
a small concurrency/cost budget. Visibility/hover/touch may reprioritize. Measure dwell, generation
latency, prepared-hit rate, and waste before tuning the horizon. A GET route and browser-only lock may
never purchase generation.

**Green:** Normal prepared turns are cache hits; duplicate spend is impossible; failed preparation
leaves navigation honest; measured hit/waste data justifies the horizon.

### D6 — Connect dynamic highlight and explicit title creation

**Depends on:** D5.

**Red:** A later-page arbitrary selection or novel-title request fails end to end, spends without
explicit action, duplicates a child, loses its source, replaces the reader with a generic loader, or
cannot return exactly after reload.

**Implement:** Persist exact founding span/title intent and navigation ancestry, create the child's
independent first-movement brief and book-local visual profile, keep the source reader mounted with a
book-native creation state, and enter only when the first folio is atomically ready. Search filtering
and title creation remain distinct paths.

**Green:** Dynamic children have independent premises, are idempotent, continue through finite
movements, and remain returnable through nested books and reload; selection and explicit
confirmation survive the cold path; no auth wall, global spinner, root replay, or sibling leakage
appears.

### E0 — Add long-form reconstruction only when measured **[CONDITIONAL / DEFERRED]**

**Depends on:** D4, D6, all static/dynamic gates, and an exact projected request above 300,000 input
tokens. This task is not on the initial prototype critical path.

**Red:** First build a 400k+ fixture with ancient causal callbacks, irrelevant recent distractors,
knowledge asymmetry, story-time changes, visual epochs, sibling-aperture contamination traps, and
contradictory assertions. It must fail without reconstruction.

**Implement only if triggered:** Add one rebuildable `memory_records` table for direct-source
assertions, episodes, sealed-part dossiers, and visual bindings. Reconstruct from a mandatory lane
(canon, plan, beat, causal predecessor, active state/promises, parent, visual bindings) plus ranked
exact evidence. Permit at most one cue-driven second pass and escalate uncertain claims to immutable
raw folios/assets. No summary may cite another summary; corrections append `supersedes`; unresolved
conflict blocks. Postgres search and optional `pgvector` are enough.

**Green:** Mutation tests prove ancient-over-recent relevance, deterministic insertion order,
sibling isolation, story-time/epistemic scope, correct visual epoch, conflict blocking, source-span
integrity, no summary chain, index-loss fail-closed behavior, and the hard context equation. Blind
continuations match the full-history oracle on clarity, causality, continuity, and desire to read.

Until this is green, full history remains active only while the exact input is admissible; no request
may cross 363,136 input tokens while waiting.

### F0 — Pass the release gate

**Depends on:** D6; E0 only if its trigger fired.

**Red:** Run the complete suite plus a fresh human reading and in-app Browser journey.

**Green requires:**

- ten expected prepared page turns under 250 ms P95 and prepared apertures under 500 ms P95;
- a true cold creation state visible within one second without replacing the reader;
- eight consecutive generated folios passing human clarity and desire review;
- root and child movement-boundary crossings that begin from changed state rather than replay;
- a child with an independent premise plus normal-path sibling isolation;
- approved visual identity/place continuity, two distinct futures, a non-Oakland setting, and
  meaningful images;
- keyboard, touch, focus, contrast, alt text, reduced motion, responsive layout, reload, bookmark,
  exact Back, and nested-return coverage;
- hard proof every text attempt is Fable + `xhigh`, exactly counted, below 400k, and has no fallback;
- documented latency, cost, prefetch hit rate, and waste rate;
- no title flicker, auto-advance, banner leakage, dead Next, lost selection, auth wall, or incorrect
  history behavior.

Fix evidenced failures and rerun; do not waive them.

### F1 — Harden the existing Railway prototype for release

**Depends on:** F0.

**Red:** The already-running Railway prototype has not yet proven release configuration, backups,
active commit equality, production migrations, bounded connections, health, asset delivery,
generation provenance, and the complete reader smoke path for the F0 commit. Never print secret
values.

**Implement:** Use the Railway skill against owner-designated project
`8b20e07d-c256-44c9-85be-d1c7e50ac83d` only. Audit and harden its existing app, Postgres, bucket,
domain, backup, migration, health, and variable-reference configuration; commit and push any required
change and rely exclusively on the Git-triggered deployment. Never use `railway up`.

**Green:** The running deployment matches the pushed commit, that commit's pre-deploy succeeded, the
schema digest is correct, every migration identifier appears once in the migration ledger, health and
reader smoke checks pass, provenance is inspectable, and no unrelated environment changed.

### F2 — Pass deployed in-app Browser and human QA

**Depends on:** F1.

**Red:** From a clean deployed session, use the in-app Browser at desktop and mobile sizes to run:
library → explicit cover → ten page turns → prepared aperture → exact return → arbitrary highlight
creation → nested return → shelf filter → confirmed title creation → bookmark/reload/resume → root
and child movement-boundary crossings. Record failures before fixes.

**Implement:** Fix only observed release issues, rerun all gates, and redeploy through Git.

**Green:** Commit the walkthrough, screenshots, timings, model/context evidence, actual spend,
prefetch metrics, human reading notes, known limitations, deployment ID, and commit SHA. The product
is complete only if a reader wants to inhabit another page, open something latent in it, and return.

## Explicitly deferred

- EPUB export until the live reader is delightful and export remains cheap.
- Accounts, social features, collaborative notes, and cross-device synchronization.
- Image-region apertures, arbitrary cropping, panels, speech balloons, and animation continuity.
- Public quota/billing UX, global title ontology/deduplication, and autonomous retcons.
- Any long-form retrieval runtime before E0's measured trigger.
