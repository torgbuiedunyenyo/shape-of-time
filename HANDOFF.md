# Handoff

Updated September 6, 2026. After compaction, read this file and the current PLAN.md section.

## Purpose

Build a world exploration harness whose agent develops sustained, nested image-and-text narratives
with persistent context and memory. Preserve the successful infinite-book's reading pleasure and
nesting. The agent owns creative sequencing; software preserves its work and the reader's place.

## Current position

P0 is complete: implementation plan, original-source correction and user-requested repository
cleanup. **P1–P6 are not implemented.** The active tree has current instructions, specifications and
creative inputs; no runnable application, package manifest, old migrations, generation scripts,
prepared corpus, test suite, CI application gate or deployment configuration remains.

- Implementation worktree: /Users/ratpartyserver/git/shape-of-time-agentic, codex/agentic-world.
- Normal checkout: /Users/ratpartyserver/git/shape-of-time, local main at the same clean starting point.
- Starting checkpoint: checkpoint/agentic-clean-start-2026-09-06.
- Retired baseline: e1a3decb29b33710f26a89f5cf2a415ca6f3ae09, tagged archive/folio-prototype-2026-09-06.
- Changes are committed locally. Nothing was pushed or deployed. Local main is ahead of remote main;
  this pre-implementation checkpoint must not trigger a production deployment.

Read archive/README.md before historical investigation. archive/folio-prototype-e1a3dec.tar.gz and its
manifest preserve all 167 old tracked files exactly. Original Git history and earlier B2/D0/reader
worktrees are intact. Do not restore the old app as a scaffold. Recover small mechanical components
only after inspecting their fit with the new design. Old checks and milestones are historical.

The normal checkout's ignored .env, node_modules, dist and test-results were moved intact into its
ignored .local/retired-folio-e1a3dec directory. No secret values were read or committed. Databases,
remote assets and deployed services were not changed. The new runtime needs fresh configuration,
database and asset namespace.

## Artistic inputs and models

Use content/shape-of-time/SOURCE.md and its selected inputs in full: world.md, world-essence.md,
prose-guide.md and visual-direction.md. Preserve original wording. The 4,512-word corrected world
is byte-identical to infinite-book's historical source. The world description and writing guidance
come from the user-selected infinite-book/main template. The illustrated successor's later prose
guide is superseded. Permit useful natural explanation of world mechanics while trusting the reader
and avoiding constant didactic monologues. Writer and critic receive this same direction.

The approved inked-reportage medium is retained without the old fixed image briefs, per-reference
approval sequence or mandatory division of narrative work between text and images. Source history
is under archive/infinite-book; earlier contradictory world versions and Undertow are not automatic
creative input. No additional longer world document or the referred-to “Document 1” was found among
60 reachable predecessor commits. The reason for historical condensation/deletion is unverified.

Text, creative agent and initial contextual critic: GPT-6 Astra at xhigh. Images: GPT Image 2
(initial documented snapshot gpt-image-2-2026-04-21). No silent fallback or effort reduction.

## Spending and deployment

This housekeeping request authorizes repository cleanup, not provider generation or infrastructure
changes. Replacement allowance authorized/spent: $0/$0. PLAN.md proposes $150 for the first combined
live experiment; it is not yet authorized. Do not reuse historical Fable budgets.

Existing Railway project: 8b20e07d-c256-44c9-85be-d1c7e50ac83d. Last read-only production investigation
found e1a3dec and a failed old continuation; that is historical evidence, not current runtime QA.
The cleanup made no Railway calls. A later authorized release uses a passing Git-triggered deploy.

## Validation

Archive contents and all 167 file hashes match the retired Git tree. Selected world/source bytes
and predecessor manifests match their preserved origins. Active document links and instructions
were checked; obsolete executable entry points are absent. git diff --check passed. Both current
checkouts have a clean Git status after the local commit/fast-forward, and the starting and retired
tags resolve to their recorded checkpoints. No history was rewritten.

No application build/test pass is claimed: the old suite is archived and the new code does not yet
exist. P1 must create meaningful tests with the new implementation, not restore obsolete gates to
manufacture a green result.

## Single next action

When implementation is requested, begin P1a in codex/agentic-world: create the fresh minimal
application configuration, new persistence and a thin reader, then continue directly to the actual
Astra/image/critic loop within P1. Read PLAN.md first. The detailed historical reassessment remains
at /Users/ratpartyserver/git/claude/infinite-library-reassessment-2026-09-05 as supporting evidence;
the repository's current documents are self-contained and are the implementation authority.
