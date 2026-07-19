# Shape of Time — Compaction-Safe Execution Plan

> **Status:** fresh repository; no product implementation exists.
> **CURRENT / NEXT TASK: A0 — lock the canon, finite story, and visual authority.**
> A1 selects the one-app stack before any application scaffolding. Do not skip ahead.

This is the dependency-ordered work queue for a small illustrated hyperbook. It intentionally does
not inherit code, data, schemas, corpus, or compatibility obligations from `auto-biblio`. Git in the
old repository is sufficient evidence of that experiment.

## Product contract

> Read a beautiful illustrated novel. Turn the page to move through its story. Open a phrase to enter
> the finite illustrated book latent inside it. Return to the exact passage. Every book ends; the
> library does not.

- The containing product is a calm, dependable e-reader; generated text and images change inside it.
- A page turn advances a planned finite story. It never blocks on chapter-sized generation.
- A semantic aperture opens another finite illustrated book; it does not choose a protagonist's
  action and is not a chatbot prompt.
- The generation/publication unit is one **folio**, initially about 120–250 words plus an image when
  the beat calls for one. Parts and chapters are literary groupings only.
- The initial garden is a 14-folio Shape of Time movement plus three prepared 2–4-folio aperture
  books. The root movement must reach a real emotional and causal threshold.
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
- Start with a light instruction for clear, absorbing, physically and causally legible prose. Canon
  is factual authority, never a style sample. Do not add generated exemplars, recursive voice
  conditioning, a literary ban list, or a model committee.
- Every request is stateless and reproducible from immutable application records.
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
  request ID, moderation/error, latency, and cost.
- A rejected image is never a reference. A generated image becomes a canonical anchor only through
  deliberate human approval.

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
A0 canon/story/visual lock [CURRENT]
  -> A1 one-app stack decision -> A2 app + Postgres spine
A0 -> B0 finite beat maps
A0 + A2 -> B1 image adapter -> B2 continuity proof
B0 + B2 -> C0 static garden -> C1 reader -> C2 navigation -> C3 delight gate
C3 + A2 -> D0 Fable/count adapter -> D1 full-history compiler -> D2 prose baseline
D2 + B2 -> D3 pagewise generation -> D4 dormant provenance seam
D4 + C2 -> D5 predictive preparation -> D6 dynamic highlight/title
D6 -> F0 release gate -> F1 isolated Railway deploy -> F2 deployed Browser QA
D4 + D6 --only if measured trigger fires--> E0 long-form reconstruction -> F0
```

## Queue

### A0 — Lock canon, story, and visual authority **[CURRENT / NEXT]**

**Depends on:** nothing.

**Red:** Create an implementation-independent content contract test first. It must confirm the
checked-in source digest, then fail because the complete six-part arc, finite pilot boundary, stable
character/place/object decisions, visual rules, and machine-checked Undertow exclusion do not yet
exist.

**Implement:** Add reviewed `content/shape-of-time/` authority:

- preserve the existing byte-exact `world.md` and its separate `SOURCE.md` provenance;
- `story-bible.md`: cited invariants, terminology, known unknowns, and forbidden contradictions;
- `arc.md`: the complete finite six-part Jay/Tan story, including its true ending;
- `visual-bible.md`: selected art direction and binding/variable/unspecified traits for Jay, Tan,
  Clef, recurring Oakland locations, temporal maps/transit, and important objects;
- `undertow.md`: clearly separated sequel seed.

Resolve open authorial questions before generation; a first image cannot silently decide canon.
Human review is part of this task.

**Green:** The exact digest passes; mutation tests reject preamble and retired material; a reviewer
can answer what happens, where the pilot may stop, and what must remain visually consistent without
consulting generated prose or images.

### A1 — Deliberately select the one-app stack

**Depends on:** A0.

**Red:** An architecture contract fails because no supported runtime, package manager, HTTP/build
stack, test runner, database/migration path, browser-test path, or object-storage boundary is pinned.

**Implement:** Consult current official docs and write a short ADR comparing only credible small
options. Select exact versions for one TypeScript package and one Node process serving the React
reader, HTTP endpoints, static assets, and the in-process queue. Specify local/CI Postgres, migration
tooling, tests, lint/typecheck/build, image storage, and Railway execution. Reject any option that
requires a second runtime service or framework-induced deployment graph.

**Green:** A fresh-clone command matrix is explicit; the architecture audit proves one package, one
process, one composition root, and no Redis/worker/workspace graph. The decision explains tradeoffs
rather than inheriting a familiar stack by reflex.

### A2 — Scaffold the application and durable state spine

**Depends on:** A1.

**Red:** Unit and real-Postgres integration tests fail because the app, health route, transaction
boundary, five-table schema, state machines, and object-storage interface are absent.

**Implement:** Build the minimal reader/server shell, strict environment schema, migrations,
repositories, structured logging, CI, and content-addressed asset adapter. Use unique folio ordinal
and generation idempotency keys. Implement `reserved -> generating -> ready -> exposed|failed`; an
atomic exposure freezes prose, layout, aperture spans, and required assets. Use real test Postgres,
not repository mocks.

**Green:** A fresh clone installs, migrates, builds, lints, typechecks, and passes unit plus DB
integration tests. Duplicate reservations spend once; exposed-record mutation is rejected.

### B0 — Author and validate finite beat maps

**Depends on:** A0.

**Red:** A beat-map validator rejects the missing/incomplete 14-folio root and three 2–4-folio
satellite arcs.

**Implement:** Add `prototype-beats.json` and `aperture-books.json`. Every beat names concrete action
and motivation, causal predecessor, state before/after, required world facts, open/resolved thread
IDs, exact ending contribution, image job, and one or two possible semantic apertures. Root scope
covers the meeting, phone/payment incident, courtship, intelligible temporal orientation, and an
honest decision/threshold. Satellites cover the 1989 earthquake tourism, Clef/extraction economy,
and maps/visas/cross-era dependency in forms suited to each subject.

**Green:** Schema and mutation tests pass; a human table read finds no filler, lore-only beat,
arbitrary cutoff, hidden CYOA action, or image that merely restates the text.

### B1 — Build the GPT Image 2 adapter and replay contract

**Depends on:** A0, A2.

**Red:** Dry-run and minimal live-contract tests fail until snapshot pinning, ordered reference
inputs, high-fidelity edit behavior, request provenance, idempotency, moderation/error handling, and
cost/latency capture are enforced.

**Implement:** Add typed generation/edit requests, reference-pack compilation, content-addressed
storage, exact request archival, transient retry with one idempotency key, and a sanitized metadata
record/replay fixture. Reject served-model mismatch, missing required anchors, or failed moderation.

**Green:** Replay is deterministic without secrets or generated binary leakage; input order changes
the manifest; invalid/rejected outputs cannot become assets or anchors.

### B2 — Select visual direction and prove continuity

**Depends on:** B1.

**Red:** The human scorecard and 8–12-image stress sequence are absent.

**Implement:** Compare two or three genuinely distinct treatments, select one, create approved
identity/location/object anchors, then stress Jay alone, Jay/Tan together, close-up, wide shop,
wardrobe/lighting change, Oakland exterior, temporal transit/map, return to shop, and optionally a
neighbor repair and aperture child. Iterate prompt/reference roles, not reader architecture.

**Green:** Side-by-side human review approves identity, place, purposeful change, coherent medium,
and meaningful text/image division of labor. Only approved outputs enter `anchors.json`.

### C0 — Build the complete static garden fixture

**Depends on:** B0, B2.

**Red:** Fixture validation fails on missing root/child folios, images, alt text, aperture spans,
return coordinates, layouts, or finite endings.

**Implement:** Produce the full 14-folio root and three prepared books with approved prose/images.
Human writing and heavy editing are allowed: this fixture tests the product, not the generator. Add
cover, discovered-library metadata, image roles, exact apertures, and deterministic cold-path demo
states. No placeholder title or legacy generated corpus is permitted.

**Green:** Every visible aperture resolves, every book ends, every required image contributes new
narrative information, and the entire journey can run without network or paid calls.

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

**Green:** A reader can enter deliberately, read, turn, open a prepared phrase, return exactly,
highlight later text, distinguish filter from creation, reload/resume, and reach a real ending—and
wants to continue exploring.

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

**Red:** A randomized-insertion test fails until folio N receives, exactly once and in order: output
contract, full world source, finite book arc, parent aperture/source when applicable, every prior
exposed current-book folio and narrative image, explicit current state/open threads, current beat and
causal predecessor, then the writing request.

**Implement:** Build a stateless compiler with stable document boundaries, IDs/digests/order,
exclusions, prompt-cache hints, exact rendered-request archive, context manifest, and official token
count. Full history remains active while admitted.

**Green:** Identical sources produce identical context digests; any source/image/plan change changes
the digest. No rolling summary, recent-N window, provider memory/compaction, `chars/4`, or silent
truncation path exists. The pilot never enters long-form mode.

### D2 — Establish the lightly steered prose baseline

**Depends on:** D1, B0.

**Red:** There is no uninterrupted 8–14-folio Fable run or blind human scorecard.

**Implement:** Generate one consecutive run without line splicing. Archive exact prompts, model,
counts, outputs, latency, and cost. Readers record what physically happened, what each actor wanted,
why the page changed, missing orientation, forced exposition, uncashable abstraction, desire to turn,
and desire to open an aperture. Change one prompt/beat variable only for a repeated named failure,
then rerun blind.

**Green:** At least eight consecutive folios are concrete, causally intelligible, canon-compatible,
paraphrasable, and worth continuing. A model score cannot override human failure.

**Stop:** If a small number of targeted experiments cannot make the baseline readable, reconsider
the story plan or writing contract; do not build a multi-model tribunal.

### D3 — Add finite planning and pagewise generation

**Depends on:** D2, B2.

**Red:** A real-DB integration test fails until one idempotent book plan reserves exactly one folio,
obtains one Fable result and the required reference-bound image, validates both, and exposes them in
one atomic ready transition.

**Implement:** Keep anchor/prepared plans human-authored. A new dynamic book may use one bounded
planning call, then one prose call and normally one image call per folio. Persist attempts and exact
founding context; use Postgres leases; retry only a named failure. Never generate a chapter as one
blocking unit and never stream prose into normal reading.

**Green:** Duplicate requests spend once; a process crash resumes safely; required text and image
appear together; unseen work can be replaced; exposed work cannot mutate; every generated book has
a finite plan and ending.

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

**Implement:** Persist exact founding span/title intent and navigation ancestry, create a finite
plan, keep the source reader mounted with a book-native creation state, and enter only when the first
folio is atomically ready. Search filtering and title creation remain distinct paths.

**Green:** Dynamic children are finite, idempotent, and returnable through nested books and reload;
selection and explicit confirmation survive the cold path; no auth wall or global spinner appears.

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
- approved visual identity/place continuity and meaningful images;
- keyboard, touch, focus, contrast, alt text, reduced motion, responsive layout, reload, bookmark,
  exact Back, and nested-return coverage;
- hard proof every text attempt is Fable + `xhigh`, exactly counted, below 400k, and has no fallback;
- documented latency, cost, prefetch hit rate, and waste rate;
- no title flicker, auto-advance, banner leakage, dead Next, lost selection, auth wall, or incorrect
  history behavior.

Fix evidenced failures and rerun; do not waive them.

### F1 — Deploy to an isolated Railway prototype environment

**Depends on:** F0.

**Red:** A read-only Railway preflight has not yet proven the exact project, isolated environment,
GitHub source branch, one app service, Postgres service, bucket/CDN, migration command, health route,
and required variable names. Never print secret values.

**Implement:** Use the Railway skill. The existing Shape of Time project
`7ab4e3ad-05f8-4e64-8026-0f77800e814a` is a read-only reference and must not be repurposed by
assumption. Create or select an explicitly separate prototype project, configure only that target,
commit and push, and rely exclusively on the Git-triggered deployment. Never use `railway up`.

**Green:** The running deployment matches the pushed commit, migrations ran exactly once, health and
reader smoke checks pass, provenance is inspectable, and no unrelated environment changed.

### F2 — Pass deployed in-app Browser and human QA

**Depends on:** F1.

**Red:** From a clean deployed session, use the in-app Browser at desktop and mobile sizes to run:
library → explicit cover → ten page turns → prepared aperture → exact return → arbitrary highlight
creation → nested return → shelf filter → confirmed title creation → bookmark/reload/resume → real
ending. Record failures before fixes.

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
