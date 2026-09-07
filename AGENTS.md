# Agent instructions

## Purpose and authority

Build the book, The Shape of Time, as a world exploration harness that produces sustained, nested image-and-text narratives coherent with themselves as they unfold. The successful infinite-book is the experiential baseline. Give the creative agent context, persistent memory, useful tools and room to decide how to develop its work.

Read SPEC.md, EVALS.md, PLAN.md and HANDOFF.md in that order before product work. The user's current instructions control over these documents. PLAN.md is the sole implementation queue; HANDOFF.md records actual status. Do not create competing plans or a second repository status file.

This branch replaces the July folio design. Everything under archive/, earlier checkouts and the retired art-thing is historical evidence, not current product instructions. Their gates and completed checkboxes do not carry over.

## Terminology

The user is the **author**. The overall system is the **book**. Its users are **readers**. The
model generating and developing the narratives is the **creative agent**; the model providing
criticism is the **critic agent**. The UI is the **reading interface**, and individual narratives
inside the book are **works** or **nested narratives**. Follow SPEC.md's definitions in plans,
documentation, prompts and conversation. Say **reader continuation request** for a request to
continue reading; distinguish it from a creative-agent turn or a reading screen.

Preserve historical quotations, raw provider receipts and literal internal identifiers. An older
identifier such as the stored session role `author` names the creative agent in that implementation;
it does not redefine the author. Explain that distinction when citing historical evidence.

## Clean starting point

The previous application is preserved at Git tag archive/folio-prototype-2026-09-06 and in archive/folio-prototype-e1a3dec.tar.gz, with a complete checksum manifest. It has been removed from active source paths. Read archive/README.md for deliberate historical inspection. Do not restore its package scripts, database migrations, prompts, prepared corpus or agent instructions as the new scaffold. Recover a small component only after checking it against the current purpose and plan.

The active creative inputs are identified by content/shape-of-time/SOURCE.md. Archive text is excluded from ordinary searches by .ignore and is never loaded into the creative agent. CLAUDE.md is only a pointer to this file. The new application supplies its own build, start, migration and test commands. Consult README.md and HANDOFF.md for current execution and deployment state.

## Models and creative freedom

- Text, the creative agent and the initial contextual critic use GPT-6 Astra at medium through the Responses API.
- Generated imagery uses GPT Image 2; the verified initial snapshot is recorded in PLAN.md.
- No silent model substitution or reduction of reasoning effort.
- Use the original infinite-book/main world and writing material identified in content/shape-of-time/SOURCE.md, including the full recovered world. Preserve source wording. The illustrated successor's later prose guide is superseded.
- Allow some natural explanation of world mechanics while trusting the reader; avoid constant didactic monologues. Preserve the approved visual medium.
- The agent may investigate, plan, draft, create and inspect images, ask for criticism, revise and publish. These are available actions, not required stages.
- No fixed movement lengths, paragraph quotas, deterministic literary verdicts or compulsory fact/obligation ledger.
- Published work, drafts, character beliefs and agent plans have different meanings. Do not turn plans into already-established events.
- The creative runtime must not load this engineering file or archived development prompts as artistic instructions.

## Implementation and evidence

Use a single development agent unless the user explicitly requests delegation. Use the active codex/agentic-world worktree and preserve unrelated changes. Local main also contains the clean checkpoint so the normal checkout gives the same orientation. Earlier B2/D0/reader-first checkouts remain historical. Keep the initial application small: one TypeScript application, Postgres and image storage.

Use tests that establish required behavior. Stateful tests use real persistence; provider-contract and creative evidence use real APIs when funded. Recorded real provider receipts can test replay. A synthetic paragraph can test a database write, not literary quality.

Write meaningful failure-reproducing tests before fixing defects. Run focused checks during development and the complete applicable pnpm run gates before pushing application work. No package manifest or runnable application exists at the clean starting point; P1 creates the new manifest and appropriate gates. For the completed cleanup, source/archive verification and git diff --check are the applicable checks. Ordinary gates must not make paid calls. Do not spend time testing reversible documentation edits or exact file/table counts.

Requirements intentionally superseded by the user's new direction may be retired with an explanation. Never conceal a remaining requirement's failure by weakening its assertion or relabeling synthetic evidence.

Use Context7 and current official documentation before implementing against changing APIs/libraries. Use the OpenAI Docs skill for OpenAI interfaces and the Railway skill for infrastructure work. Preserve exact source/model/usage evidence where available; do not invent provider guarantees.

## Reader QA

Use the in-app Browser for the actual reader journey: sustained reading, prepared and cold entry, text/image exploration, nested return, keyboard/touch-sized controls, reload, reflow and resume. Automated browser tests supplement this walkthrough. DOM presence is not proof that an interaction works.

## Spend, deployment and preservation

The user authorized implementation, the plan's initial $150 combined provider allowance, and direct Railway production replacement. On September 6 the user also explicitly authorized exceeding $150 if needed. HANDOFF.md records the actual allocation, spend and current remainder. Keep creation, imagery, criticism and paid renewal in the same accounting. Increase the operational allowance only as needed for the authorized work, record the increase, and preserve the spending guard. Do not ask again for actions already covered by a recorded authorization. The overrun authorization does not resume the deferred operator literary study.

Never automatically repeat an ambiguous generation request. Preserve returned output before parsing, keep provider IDs, reconcile pending operations and record uncertain cost.

The user explicitly authorized direct implementation and testing on the existing Railway production project identified in HANDOFF.md. Use its database directly; no Docker or separate staging is needed. Production source deploys come from passing main pushes. Never use railway up, a manual redeploy or Deploy Latest Commit to bypass Git integration.

Preserve historical refs and source material. The user states existing production data need not be preserved; replacement is authorized. Do not reset others' work. Stage explicit paths. Do not commit secrets or raw environment values.

Never delete, prune, truncate or overwrite transcripts under ~/.codex/sessions or ~/.codex/archived_sessions. This applies regardless of available storage or cleanup suggestions.

## Continuity after compaction and at handoff

### Every new attempt starts empty

The author's standing instruction, reaffirmed September 7, 2026:

> We don't need to keep the previous content, it can just go into a stored referenced draft folder like previous. each new attempt has to start from scratch so it has a consistent mechanism throughout the entire book

Before activating changed creative prompts, tools, memory behavior or generation process, preserve
the previous attempt privately in a referenced draft folder with its mechanism/source and usage
evidence. Start the new attempt empty and pin its mechanism before generation. Never seed it with
the previous attempt's fiction, images, notes or session context. Reader interface fixes alone do not
create a new creative attempt. This is a standing instruction, not a reason to ask again about reset.

Immediately read HANDOFF.md and its current PLAN.md section after compaction. Restate the product's purpose before proceeding. Update HANDOFF.md before a foreseeable compaction and at the end of each coherent slice with actual changes, evidence, costs, unresolved operations, deployment and the single next action.

One-time author exception, September 7: change Astra from xhigh to medium in the existing live
book, retaining all content and memory. Record the old and new mechanisms and the switch boundary.
This does not waive the fresh-attempt rule for any other change.
