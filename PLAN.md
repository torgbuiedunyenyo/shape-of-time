# Shape of Time implementation plan

Written September 6, 2026. Status: P0–P2 first usable path complete; P3–P5 sustained reading, preparation and memory evidence in progress.

Execution update: the user explicitly authorized implementing and testing directly on the existing
Railway production project, with no users or old data requiring preservation. This supersedes the
local-Docker, isolated-staging and old-production-data preservation steps below. P4 now verifies
recovery on that production application; P6 completes and verifies the release there. Continue to
use passing Git-integrated deployments. The implementation go-ahead activates the proposed initial
$150 combined provider allowance; HANDOFF.md tracks actual spend and reservations.

This is the single implementation queue for the agentic replacement. Read SPEC.md for the intended experience, EVALS.md for what counts as evidence, and HANDOFF.md for the actual worktree, progress, costs and next action. The July plan is historical; its completed checkboxes do not describe this implementation.

The purpose is a world exploration harness producing sustained, nested image-and-text narratives that remain coherent as they unfold. Preserve the successful infinite-book's pleasure of reading and discovery. Give an agent rich context, persistent memory and useful capabilities, with freedom to decide what to investigate, create, revisit and develop.

## 1. Decisions that guide the build

1. Use GPT-6 Astra at xhigh for creative work and the initial LLM critic. Use GPT Image 2 for generated imagery. No silent model or effort fallback.
2. Build a fresh creative runtime and publication model in this successor. Retain the existing one-application TypeScript stack and selectively reuse small mechanical components.
3. Use the full recovered world, original root trajectory and writing guidance from the user-selected infinite-book/main template, preserving source wording. The illustrated successor's later prose guide is superseded. Allow some natural explanation of world mechanics while trusting the reader; avoid constant didactic monologues. Retain the approved visual medium. These are creative context, not a program assigning plot changes to numbered pages.
4. Give the creative agent a persistent workspace and access to the actual text and images. It may develop its own notes, plans, references and unfinished material. No required fact ontology, debt ledger, movement scheduler or plan/write/illustrate/judge pipeline.
5. Separate authored compositions from screen pagination. Neither a screen nor a provider response defines a literary unit. No paragraph count or page-word-count acceptance gate.
6. Preserve published work and exact source locations. Store a reader's visit trail separately from the relationships among works.
7. Put both media, actual provider work and contextual criticism into the first usable experiment. A static fixture can test a control; it cannot establish generative success.
8. Use LLM judgment and sustained reading to assess literary and visual meaning. Use ordinary tests for persistence, navigation, tool execution, resource limits and recoverability.

The finite milestones below organize implementation work. They do not impose corresponding stages on the creative agent.

## 2. Working approach and scope

Implementation checkout: /Users/ratpartyserver/git/shape-of-time-agentic, branch codex/agentic-world. Local main in /Users/ratpartyserver/git/shape-of-time also contains the clean starting point. The cleanup checkpoint is tagged checkpoint/agentic-clean-start-2026-09-06. The retired baseline e1a3decb29b33710f26a89f5cf2a415ca6f3ae09 is preserved as archive/folio-prototype-2026-09-06 and in archive/folio-prototype-e1a3dec.tar.gz.

The user requested a clean repository before implementation. The old runtime, migrations, tests, prompts, package/build/start scripts, prepared corpus and deployment configuration have therefore been archived and removed from the active tree. Local main was aligned with this starting point. Subsequent implementation replaced the Railway deployment and removed its old data; retired art-thing remains read-only. The new edition uses the world database schema and matching asset namespace. No old corpus/schema migration is required. Do not restore the archived application as a scaffold.

Retain the selected React, React Router, Vite, Hono and Kysely/pg stack initially. Node 24.18.0 remains pinned in .nvmrc; pnpm 11.15.0 and the previous dependency versions are available in the archived package/lock files. P1 creates a fresh minimal manifest and lockfile for the actual new implementation, consulting those pins instead of reintroducing its scripts or unused dependencies wholesale. Inspect small archived storage helpers individually if useful. Add the official OpenAI TypeScript SDK with a version verified to support the selected Responses interfaces. Consult Context7 and official documentation at implementation time. Do not turn package selection into a separate research project.

Use one Node application with an internal durable-work pump, Postgres and image storage. Start with one active creative run per connected edition. This makes related publications visible to one continuing author while we learn what the agent needs. A read-only critic may have its own model context. No distributed agent framework, Redis queue, vector service or mandatory agent team is needed for the first experiment.

## 3. Proposed code boundaries

Paths in this table are repository-relative implementation destinations; new files are not claimed to exist yet. Combine adjacent modules if that keeps the implementation clearer. Do not test a prescribed file count or directory shape.

| Area | Files to introduce or adapt | Responsibility |
|---|---|---|
| Agent conversation | src/server/agent/runner.ts, context.ts, tools.ts | Continue Astra's chosen tool loop, deliver results, preserve resumable state and yield to reader demand. |
| Creative workspace | src/server/workspace/documents.ts, archive.ts | Versioned free-form drafts/notes; list, search and read actual published text/images and source material. |
| Provider access | src/server/providers/astra.ts, image.ts, operations.ts | Selected API contracts, actual multimodal tool results, durable receipts, recovery and cost accounting. |
| Publishing | src/server/library/works.ts, publications.ts, anchors.ts | Independent works, ordered immutable compositions, source addresses and reader intents. |
| Persistence | src/server/db/migrations/001_agentic_library.ts and focused repositories | New records without repurposing the old folio lifecycle. Use a dedicated replacement database. |
| Reader API | src/server/reader/routes.ts, intents.ts | Read saved content; request continuation, exploration or explicit title creation; report progress truthfully. |
| Reading surface | src/client/reader/BookReader.tsx, Publication.tsx, pagination.ts | Flow/reflow authored material, display images, preserve location and support pagewise navigation. |
| Visits and exploration | src/client/reader/visits.ts, Exploration.tsx, Shelf.tsx | Exact nested return, image/text selection, discovery, bookmarks and resume. |
| Preparation | src/server/agent/preparation.ts | Supply reader interest, available unread work and remaining allowance to bounded background work. |
| Criticism and evaluation | src/server/agent/critic.ts, evals/run.ts, evals/cases/ | Astra criticism with archive access; complete-run reports and preserved comparison material. |
| Authored context | prompts/creative-agent.md, prompts/critic.md; content/shape-of-time/{SOURCE,world,world-essence,prose-guide,visual-direction}.md | Small tool orientation plus the original full world, main-template world/prose guidance and approved visual direction. The source files are already prepared; runtime loading remains P1. |

The old src/server/text contracts, generation/folio-generator.ts, generation/child-books.ts, reader-library.ts, narrative-image-adapter.ts and client single-activeReturn model are now archive-only. They are evidence about failure modes, not active replacement targets. Small asset-store/byte-handling helpers and useful selection ideas may be recovered individually after inspection; no old migration or narrative lifecycle is carried into the new schema.

## 4. Minimum durable model

Store the following responsibilities. Their names are provisional and do not require one table each:

- **Edition:** the chosen source world and artistic context, its root work, and the connected creative workspace. Keep predecessor variants separate.
- **Work:** stable identity, title, founding source/intent and ordered publications. A work can be reached from several places. Titles and matching words are not identity.
- **Publication:** immutable rendered content with stable block IDs, an order within its work, and references to stored assets and linked works. One publication can be shorter or longer than a viewport.
- **Workspace document:** a path or name chosen by the agent, versioned body, and optional source references. This holds drafts, notes, visual collections and plans without mandatory literary fields.
- **Asset:** actual bytes, storage identity, dimensions/media type, source operation and references used. Keep studies and rejected candidates distinguishable from published images without deleting them.
- **Session/run/operation state:** conversation checkpoints, incoming reader intent, active/pending work, returned protocol items, tool-call IDs and results, provider request/response IDs, usage and the remaining allowance.
- **Reading record:** current visit, parent visits, exact text/image locations, bookmarks and discovered works. Browser persistence is sufficient initially; it must preserve the whole visit chain, not one active return.

A plain draft can use Markdown with image references such as asset IDs. Publish converts it to a small structural representation: prose, headings, quotations, lists, figures and section breaks. The application assigns stable published block IDs and renders these forms without generated application code. Images, letters and maps can have different arrangements within this vocabulary. Extend it when actual work needs another form.

The publish operation takes a work and a specific saved draft revision. It resolves assets and references and saves the composition atomically. Duplicate submission of that revision returns the existing publication. An unrelated revision cannot silently overwrite published prose. A new edition/revision may correct published work while preserving older addresses.

The public reader reads these same publications; there is no separate hand-maintained demonstration corpus standing in for the runtime.

## 5. Agent environment and interfaces

Supply a stable orientation, the full world and prose/artistic guidance, the reader's current intention, useful starting context and access to more. At edition start, include world.md, world-essence.md, prose-guide.md and visual-direction.md in full, following content/shape-of-time/SOURCE.md. Preserve their original wording and keep them available through context renewal; do not compress this background merely because the predecessor used a shorter prompt. Keep software-development instructions, historical template wrappers, the superseded Fable prose guide and discarded world versions outside the active creative context.

Begin with a small capability set:

| Capability | What it enables |
|---|---|
| List/search/read the archive | Find works, passages, images and notes; read surrounding passages and follow source links. |
| Read/write workspace documents | Keep and revise drafts, plans, observations or reference collections in forms the agent finds useful. |
| Open/create a work | Establish an independent narrative from a source and intended angle, or reuse an existing relevant work. |
| Generate/edit an image | Choose a prompt, supported dimensions/quality and ordered relevant references under the selected model and allowance. |
| View an image or detail | Return actual visual content, including a useful crop when requested, rather than only a description. |
| Ask a critic | Seek a contextual literary or visual reading with access to the relevant work. |
| Publish a saved draft | Make a stable, reader-ready composition available; receive its actual addresses. |
| Offer an opening | Link a specific passage or image location to a work, without requiring an opening on every page. |

These are tools the agent can select, not stages it must complete. It may explore visually before writing, produce several drafts, return to a distant scene, continue without a new image, or decide that criticism is useful. Every request uses automatic tool choice. The agent's final conversational message is not automatically published as fiction.

Text/image selection supplies the exact source address, selected text or image region, the surrounding composition, any explicit reader angle and available ancestry. It also supplies access to the rest of the archive. Avoid the old quote-plus-title-only founding prompt. The agent decides which wider relationships matter.

Reader intentions are durable requests. The server can tell the agent that a reader is waiting for a particular opening, what is already prepared and what resources remain. Start with cooperative switching between provider responses. Astra's asynchronous tools or mid-turn steering can be added if measured waiting warrants them; their presence is not a prerequisite for the first creative loop.

## 6. Provider and memory choices

**Astra.** Use the Responses API with model gpt-6-astra and reasoning.effort set to xhigh on every creative and initial critic request. The current documentation supports this effort and requires Responses for Astra function calling. Preserve model-returned reasoning items and assistant phase fields as opaque protocol content, alongside ordinary outputs and tool results. Never reduce the conversation to output_text. [Astra model](https://developers.openai.com/api/docs/models/gpt-6-astra), [reasoning and tool support](https://developers.openai.com/api/docs/guides/reasoning#reasoning-effort).

Use an application-owned conversation log and explicit input-array continuation as the initial source of resumability. Provider IDs help retrieve pending work but are not the sole copy of the conversation. Keep every returned output item and use the SDK's supported input conversion. Request and archive encrypted reasoning content using the supported inclusion option when stored/background responses do not return it by default. In the first probe, verify effective reasoning persistence and continuation from self-contained saved items, without relying on an earlier provider response ID. If any item remains provider-dependent, document its recovery limit and a deliberate context-renewal path using saved notes and original material; do not claim indefinite protocol replay. The API does not expose raw reasoning text; the agent's ordinary saved notes remain inspectable memory. [Conversation state](https://developers.openai.com/api/docs/guides/conversation-state), [preserving reasoning](https://developers.openai.com/api/docs/guides/reasoning#preserve-reasoning-across-calls).

Use background Responses for long calls, persist the response ID promptly and poll through the durable operation. For the initial non-ZDR setup, explicitly request store=true for retrievability and archive results locally as they arrive. Verify the account's retention behavior rather than treating provider storage as a backup. If that setting is unavailable, use the documented compatible mode and record its recovery window before live use. Browser closure must not cancel a server operation accidentally. [Background mode](https://developers.openai.com/api/docs/guides/background).

**Images.** Expose an ordinary Astra-callable function backed by the direct Image API. This keeps the requested image model explicit: gpt-image-2-2026-04-21 is the documented snapshot at planning time. Use generation for a new image and edits when supplying references. Return the saved image itself in the function result so Astra can inspect it before choosing further action. The API supports image content in function outputs. [Image model](https://developers.openai.com/api/docs/models/gpt-image-2), [image API](https://developers.openai.com/api/docs/guides/image-generation), [multimodal function results](https://developers.openai.com/api/docs/guides/function-calling#formatting-results).

Reference selection belongs to the agent. Enforce actual provider input limits, not an invented last-five rule. Let the agent explain what should persist or change in ordinary language; remove the required six-field image-direction object. Preserve the approved medium without requiring a portrait, forbidding readable documents, or excluding relevant references from another work. The writer can revise unpublished prose or images in light of what it sees.

**Context renewal.** Start with generous context plus archive tools and explicit notes. Count the exact request, including tools and actual images, with the Responses input-token endpoint. Use current model limits and reserve room for output and subsequent tool results; do not inherit the Fable 400k ceiling. A count/contract error is a recoverable operational failure, not evidence against the prose. Keep saved work while repairing it. [Input-token counting](https://developers.openai.com/api/reference/resources/responses/subresources/input_tokens/methods/count).

Implement explicit compaction/checkpoint support without deleting the full archive. Preserve the complete returned compacted window as the next conversation state, then continue with the creative purpose, source context and workspace access intact. Choose renewal timing from actual context use and cost. Force an early renewal during testing to expose lost state before spending on a novel. Re-test it later on a substantial corpus. [Compaction](https://developers.openai.com/api/docs/guides/compaction).

Begin with ordinary lexical/document search, links and agent-written notes. Measure failures to retrieve relevant material. Add semantic retrieval only if it helps recover evidence the agent is actually missing; do not first build an exhaustive canon graph.

## 7. Publication, recovery and spending

Keep provider operations small enough to inspect and resume without defining a fixed creative workflow:

1. Save the exact request/references and reserve its prospective cost before dispatch.
2. Persist the response ID as soon as available. Save returned output and image bytes before parsing or literary acceptance.
3. Record each tool-call result durably against its call ID. Resume completed tools from saved results.
4. Advance the conversation checkpoint after its output/results are saved. A restart reloads pending operations and continues this same work.
5. Publish only saved compositions with available assets. Missing assets or stale publication targets produce useful errors to the agent, while preserving its draft.

Application idempotency prevents duplicate tool effects and publications. It does not prove that a provider charged exactly once. Disable opaque automatic retries on generation requests. Retrieve known Responses IDs when possible; mark unknown dispatch outcomes for reconciliation and keep their cost reservations. Never automatically purchase another image because the first result's status is uncertain.

A database claim/lease prevents two restarted workers from publishing competing continuations for the same edition. Use one simple ownership mechanism and a revision check; do not recreate the old parallel Folio/Attempt state machines and their duplicated constraints.

**Proposed initial live allowance: $150 total, including Astra creation, images, critic calls and any paid context renewal. This is a suggested ceiling, not spend already authorized by this planning request.** Use at most $20 of it to establish provider/continuation/image-return contracts; put the rest toward the real reading experiment and targeted revisions. Do not create separate hidden budgets for critique or repairs.

At the checked standard rates, Astra short-context input is $10/M tokens and output $50/M; cache reads/writes differ, and inputs above 272k use higher rates for the full request. As an illustration, 50k uncached input tokens and 10k total output tokens cost about $1 before other charges. Reasoning contributes to output usage; reader-visible word count is not the bill. Recheck prices when enabling spend. [Current pricing](https://developers.openai.com/api/docs/pricing).

Record actual cached/input/output usage, images, count calls where charged, latency, model identities and estimated cost against a dated price record. Reserve conservatively without assuming cache hits; retain unknown costs explicitly. The guard should pause new spend before exceeding the allowance while preserving everything already created. It should offer the agent smaller/deferrable work where useful without lowering xhigh or deleting context silently.

A later long-form allowance must be calculated from the first experiment's actual consumption. Do not promise a cost per novel from a short opening. Infrastructure charges are separate and require an explicit deployment scope.

## 8. Milestones and dependencies

| Milestone | Dependency | Inspectable result |
|---|---|---|
| P0 — Align documents and clean the repository | Complete | One current plan, prepared original sources, archived old application and a clean local starting commit. |
| P1 — First saved illustrated reading | P0 | Astra uses real tools and image results; saved prose and imagery appear in a thin real reader; contextual critic available. |
| P2 — Nested exploration and exact return | P1 | Generated root → child → grandchild → parent → root, with durable source context and both media. |
| P3 — Sustained reading and reader refinement | P2 | Consecutive material worth assessing, responsive reading, prepared/cold openings and early artistic revisions. |
| P4 — Recovery on Railway | P3 | The same live path survives interruption and its corpus/media can be restored on the authorized Railway project. |
| P5 — Long-form development and memory | P3; P4 before hosted large spend | A connected substantial corpus, distant recurrences, cross-book continuity and demonstrated context renewal. |
| P6 — Release the replacement | P4 and P5 | Exact deployed revision, restored data/asset proof, actual reader walkthrough and documented literary limitations. |

P1 and P2 are the first usable experiment. They must not wait for an elaborate shelf, exhaustive visual style study, large corpus or infrastructure redesign.

### P0 — Current documents and execution context

**Completed work:** Replaced the governing documents, prepared the original infinite-book sources and adapted writing guidance, extracted the approved visual medium, and archived the entire old tracked application before removing it from the active tree. The archive manifest accounts for all 167 source files byte-for-byte. No old package/start/migration/deployment scripts or competing instructions remain active. Local main and codex/agentic-world share the clean checkpoint; nothing had been pushed or deployed at the cleanup checkpoint. Subsequent implementation is recorded in HANDOFF.md.

**Evidence:** Verified archive completeness/checksums, retained source bytes, active links and instructions, removal of old entry points, and a clean diff. The old test suite is archived with its runtime; no application gate or new runtime success is claimed. No paid calls were required.

**Completion:** The next coding step is P1; no older D6 queue or Fable-only instruction controls it.

### P1 — One real agent, workspace and illustrated reader path

**Execution evidence:** The real root, child and grandchild are readable. The same author resumed
through native context renewal and published root continuatione7eb59f4-58f8-4c3e-b090-859de5018800
with a new referenced illustration after contextual criticism. The builder read both drafts/review
and inspected the image. This completes the initial usable path, not long-form literary proof.
See HANDOFF.md and evals/native-renewal-2026-09-06.md.

Build this as a short sequence of connected commits, not independent subsystems:

**P1a: Save and display work.** Create the new application manifest, minimal tool configuration and fresh database migration, then add records for editions/works, draft revisions, publications, assets and run receipts. Inspect/recover small DB or storage helpers only where they fit the new responsibilities. Add reader endpoints for saved publications and a thin flowing reading surface. A small fixture may verify rendering and persistence only. It is not a literary milestone.

**P1b: Continue Astra through tools.** Add the OpenAI SDK, selected configuration and runner. Implement archive access, document writes, work creation and publish. Use the prepared original-source context and a small tool orientation. Store complete Responses items and tool outcomes. Provide a local run-inspection command showing pending operations, drafts, publications and costs.

**P1c: Let imagery participate.** Add direct GPT Image 2 calls with durable reference/output handling, actual-image function results and visual inspection. Integrate them into the same runner; the loop must allow writing before or after images and revision before publication. Add an Astra critic with read-only access and a free-form review request. Read the first real paired output in the reader and obtain a contextual critique.

**Files:** agent/, workspace/, providers/, library/, the new migration, the thin reader, creative/critic prompts, model configuration and relevant package scripts. Load the prepared infinite-book source material identified by SOURCE.md; do not extract the superseded prose guide from write-folio.md. Keep world.md byte-identical and preserve the documented main-template extraction. Ensure the writer and critic receive the current softer exposition preference.

**Meaningful checks:**

- A saved draft containing more than three paragraphs and arbitrary reasonable length publishes and renders; structure is preserved and no literary word cap is applied.
- A real Postgres transaction cannot publish a missing image; the saved draft and received image result remain recoverable.
- A provider/tool receipt can be resumed after process restart without executing that already-completed tool again.
- The live provider probe verifies Astra/xhigh, tool calls, a genuine GPT Image 2 result delivered as image content, and continuation from saved protocol state. A fixed probe instruction tests the interface, not a mandatory creative sequence.

**Completion:** At least one genuinely generated illustrated sequence can be read from stored publications, reloaded, continued by the same agent and inspected by the critic. Preserve the entire run, including mistakes. Do not claim long-form success at this point.

### P2 — Create nested works from what the reader encountered

**Execution evidence:** Production root→child→grandchild→child→root worked through real image-region
and text selections, after reflow/reload. Bookmarks now preserve that same nested visit. Prepared
links and saved discoveries reopen available works. See evals/nested-reader-and-recovery-2026-09-06.md.

**Work:** Implement a durable exploration intent carrying source publication/block/selection or image region and optional angle. Give the agent surrounding text and actual source images plus archive access. Create a work with its own title and development, or deliberately reopen a relevant existing work. Reserve requests before generation so repeated clicks/reloads do not duplicate the same intent.

Build visits as independent records with visit ID, work ID, parent visit, entry source and current reading anchor. Store the full trail in the reading record; route/browser history refers to visits rather than reconstructing ancestry from a title or the current work's parent. Preserve a trail through page turns, reload, shelf visits and returning via a different source.

Use one quiet Open as a book action for text and whole-image exploration. Add region selection once whole-image entry is sound. Preserve the source screen while work is pending; show a saved ready opening if the reader has moved elsewhere. Searching titles is read-only; explicit title creation is a separate deliberate action.

**Files:** reader/intents.ts and routes.ts, library/anchors.ts and works.ts, client visits/exploration/shelf components, archive tools.

**Meaningful checks:**

- In a real browser, navigate root → child → grandchild, turn pages, reload, then return through both exact source selections.
- A single work entered from two sources returns to the correct source for each visit.
- Cross-paragraph selections and image regions retain their exact meaning after font/viewport changes.
- Duplicate creation submissions reuse the recorded request/result and do not buy another opening.

**Literary evidence:** An LLM critic reads the source and generated child together, with the relevant history/images available. Assess whether the connection is meaningful and consistent and the child has its own life. Continue into a grandchild chosen from the generated child, rather than preparing its premise in advance.

**Completion:** The generated nesting journey works through the real reader and remains intact after reload. Mechanical fixture success alone is insufficient.

### P3 — Make sustained reading inviting

**Execution note:** The first root and child are published, and a third-level book is readable.
The next reader release implements bounded preparation (initially disabled), exact per-visit
source return, persistent return controls, and a library list of all requested openings. It also
loads new publications before the author finishes its turn and reuses work that satisfies a queued
continuation. Twenty mechanical checks pass. Actual production testing and extended reading remain
required; this is not yet completion of P3.

**Work:** Extend the actual corpus through multiple scenes in the root and at least one nested work. Let the agent choose their shape. Improve typography, measure, text size, image sizing, chapter transitions and accessible controls while reading those outputs.

Implement viewport pagination over stable published blocks, retaining a flowing mode if useful. A long publication spans screens without becoming several invented scenes. Page turns within saved work are immediate; the frontier requests continuation through the same intent system. Do not expose token streaming as narrative.

Add bounded preparation: tell the agent which work the reader is in, what remains unread and which openings are plausible. Keep actual requests ahead of speculative work. The agent chooses what to develop; the scheduler enforces resource availability. Do not generate every possible child or start calls merely because a user types in search.

Warm openings enter immediately. Cold openings keep the source readable with truthful status. A result never steals focus after the reader has gone elsewhere. Plain failure copy explains what is unavailable and preserves the reader's place; a technical failure is not fictional closure.

**Files:** pagination/reading components, preparation.ts, intent scheduling, source-opening display and eval runner.

**Evidence:** Use the in-app Browser on desktop and narrow/mobile-sized layouts. Exercise text size, keyboard, touch-sized controls, image enlargement, selection, warm/cold entry, return, reload and resume. Record actual latency distributions for completed reading units/openings, along with wasted preparation and cost. Set performance targets from this evidence rather than promising instantaneous cold generation.

**Artistic iteration:** Read uninterrupted stretches and use LLM-as-judge from EVALS.md. Compare with the successful predecessor as an experiential baseline. For iterations within the new system, keep Astra/xhigh, image model and authored context fixed where possible. Address specific failures without accumulating universal prose or plot rules.

**Completion:** The owner has a meaningful connected sample to read and the criticism explains whether it merits further development. If it is dull or disconnected, revise here before increasing corpus size. An early sample cannot establish a whole novel.

### P4 — Prove interruption recovery on Railway

**Work:** Exercise failure boundaries on the existing P1–P3 path: after provider dispatch, after returned bytes are saved, after a tool result, during publication, and while a child is opening. Verify restarting, resuming, reconciling unknown requests and stopping new spend. Remove any alternate production path that bypasses these mechanisms.

The user authorized direct production replacement and testing, with no old data to preserve. Use
that Railway Postgres/bucket directly. Verify restoration into a fresh test schema and matching
object namespace on the same resources, with generation disabled; do not overwrite the active new
edition. No Docker, separate staging project, or obsolete production-data migration is required.

Use GitHub-integrated deployment from passing main commits. Never use railway up or a manual
redeploy to mask a missing Git-triggered build. Verify the exact commit and environment before the
live walkthrough. The Railway skill governs these operations.

**Files:** operation recovery, configuration/startup, migration tooling, CI/deployment configuration only where required, integration tests and deployment notes.

**Evidence:** Real DB/storage recovery tests, a restorable corpus-plus-assets backup, and an in-app Browser run of continuation and nesting on production. Record the deployed commit and live provider receipts, not only /healthz.

**Completion:** The same system that produced the promising reading survives interruption on the intended host, with no lost publication or hidden duplicate purchase. Unknown provider outcomes remain explicitly unknown until reconciled.

### P5 — Sustain the world through length and context renewal

**Work:** Extend the same edition, initially toward roughly 30,000–50,000 connected words as an experimental scale, then toward a novel-length root and continuation beyond its first resolution. These are reading-study sizes, not output validation rules, authoring quotas or proof thresholds.

Include substantial consecutive root reading and genuinely developed nested works. Observe distant recurrence, a recurring visual identity across works, the consequences of earlier events and a new situation after a resolution. Do not command a particular callback merely to pass an evaluation. The agent may find a different meaningful development.

Deliberately renew the agent's active context and resume a previously visited book. Let it use notes and archive tools. Assess whether it recovers original sources, preserves established images/relationships and carries longer intentions forward. Keep complete pre/post-renewal conversation and corpus evidence.

If retrieval repeatedly misses relevant material, improve source navigation, note usability, search or context construction in response. Compare these changes on the same kinds of reading. A source-linked chronology or reference collection the agent finds useful is welcome; a compulsory global ledger is not the default remedy.

**Files:** context renewal, archive search, agent-authored workspace support as required, long-form evaluation cases and reports. Add a retrieval dependency only for an observed need.

**Evidence:** Contextual LLM criticism, source-grounded continuity investigations, actual image comparison and owner reading of sustained sequences. Distinguish a character's lie, changed belief or viewpoint from a world contradiction. Record unresolved problems and how much was actually read.

**Completion:** Evidence demonstrates extended coherent development and worthwhile nesting at the tested scale, including after context renewal. If the narrative circles or the imagery drifts, retain the run and revise the relevant mechanism. Do not declare indefinite coherence proven.

### P6 — Release and leave a usable handoff

**Work:** Verify that the obsolete Fable, finite-movement, static-reader and fixed-image-reference paths removed in P0 have not been reintroduced. Preserve their archive. Ensure the implemented configuration, prompts, docs and tests agree on Astra/xhigh and GPT Image 2.

Run the complete applicable mechanical gate, the current literary/multimodal evaluation and the deployed in-app reader journey. Confirm backup restoration, global spending controls, pending-operation visibility, source retention and correct cache/media behavior.

Production replacement is authorized. Integrate passing changes into main and verify the Git-triggered Railway deployment. Old production data need not be preserved. Recovery of the new edition means selecting a matching code revision and restoring its saved corpus/media, preserving the active edition while that recovery is checked.

**Completion:** The user can read, explore, return and continue the illustrated world on the intended deployment. HANDOFF.md records the actual corpus, quality limitations, deployed revision, cost and next development question. Remaining artistic uncertainty is reported plainly.

## 9. Test and evaluation workflow

Use ordinary fast unit tests for pure anchor/format/price arithmetic; real Postgres/storage for stateful behavior; recorded real provider receipts for replay tests; and separately enabled real-provider runs for API and creative evidence. A fabricated paragraph may test persistence but is never evidence of successful generation.

Retire old tests when their requirements are deliberately superseded. Record the replacement responsibility; do not weaken an assertion to conceal a still-required failure. Useful checks of source integrity or saving remain. Tests for eight movements, three paragraphs, exact titles or a required number of tables do not govern the new design.

The old test/lint/typecheck/build entry points were removed with the retired runtime. P1 creates meaningful checks for the new code and reinstates pnpm run gates as the complete mechanical gate before any application push; it must not secretly spend on providers. During this clean pre-implementation state, use source/archive verification and git diff --check, without claiming a passing application suite. Add an explicit eval:live entry point with a recorded budget/configuration and a report destination. Report mechanical results, provider-contract results, literary judgments and browser observations separately.

EVALS.md supplies the detailed qualitative practice. It does not demand a model-judge committee or a per-publication approval ritual.

## 10. Execution discipline and remaining decisions

Keep HANDOFF.md current after each coherent slice: active milestone, changes, actual tests, generated corpus, provider spend, unresolved results, deployed revision and the single next action. After compaction read it and the current PLAN section, then restate the product purpose. Keep the creative agent's own workspace separate from developer handoff files.

Implementation decisions already made: selected models, one application, real persistent workspace, direct image tool, immutable published compositions, separate visit trail, contextual LLM evaluation and an early live illustrated experiment.

Decisions to make from evidence: precise preparation depth, preferred paging/flow behavior, a useful context-renewal threshold, image density/arrangement and whether semantic retrieval or overlapping agent work improves the result. These do not block P1.

The implementation go-ahead and subsequent Railway instructions authorize the initial combined $150 provider allowance and direct production replacement. Actual costs and pending operations are in HANDOFF.md. A larger allowance would require new scope.

Current next action: complete the genuine continuation and nested reading journey identified in HANDOFF.md. Do not restart the historical diagnosis or replace the live experiment with a static showcase.
