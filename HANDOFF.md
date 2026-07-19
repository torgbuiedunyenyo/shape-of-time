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
  world.md is the sole comprehensive factual and plot authority; the finite pilot brief, explicit
  temporal rules, XML baseline, and optional-example experiment are separate.
- The rejected story-bible, duplicated arc, and typed authority manifest were deleted instead of
  deprecated.
- The visual bible remains a separate pending proposal and is explicitly excluded from the prose
  baseline.
- No application code, package manifest, generated corpus, database, model output, paid generation,
  Railway project, or deployment exists yet.

## Reorganization record

- The private GitHub successor is published at `https://github.com/torgbuiedunyenyo/shape-of-time` with `main` as its default branch.
- Genesis integrity CI passed for the genesis commit.
- `node --test scripts/verify-genesis.test.mjs` passes all three tests, and `node scripts/verify-genesis.mjs` passes the repository audit.
- The retired `auto-biblio` repository now opens on a docs-only archive `main` at `5290dfb41a7ba0d22f3e44c82d097b6cac6eb531`; its root instructions forbid resuming the old plan.
- Historical refs `legacy/deployed-2026-07-18`, `legacy/recovery-checkpoint-2026-07-18`, and `archive/recovery-2026-07-18` are published. The recovery ref is explicitly incomplete, not a release.
- The old repository's full local gate and GitHub CI passed for the archive freeze. Railway staging and production remain healthy on deployed commit `a07d2f2f61176c3737b3b52a4a29dd3160039c29`; no service redeployed.
- Eleven clean temporary or agent worktrees and eight stale worktree registrations were removed. Five dirty forensic worktrees and the user's existing old-repository edits were preserved.

## Locked product direction

The prototype is a finite illustrated Shape of Time anchor story in a stable e-reader. Page turns advance one 120–250-word folio; suggested phrases, arbitrary highlights, and explicit title creation open adjacent finite books; Back restores the exact source passage. Text and images share narrative work. A static prepared garden must be delightful before generation is connected.

The writer is Claude Fable 5 at `xhigh`, without Opus or provider fallback. Images use the pinned GPT Image 2 contract with explicit reference packs. The complete Fable request has a hard 400,000-token ceiling. The initial architecture is one TypeScript application, Postgres, and image storage.

## Canon provenance

- Expanded world source: `content/shape-of-time/world.md`.
- Source repository: `torgbuiedunyenyo/infinite-book`.
- Source commit: `1c3644b7d2e7c7b10a62cfa6c6f876ac53559836`.
- Source path/range: `world_document.md`, line 19 through EOF (source line 373).
- World SHA-256: `e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c`.
- `content/shape-of-time/undertow.md` is a separate sequel seed and is excluded from the pilot arc.

## A0 review state

- Red observed on the replacement contract: the world digest passed while six tests failed because
  the rejected duplicate files still existed and pilot-brief.md, temporal-rules.md, write-folio.md,
  and craft-examples.md did not.
- A second red proved the durable project documents still required the rejected story-bible
  architecture.
- Current local result: `node --test scripts/*.test.mjs` passes 12/12;
  `node scripts/verify-genesis.mjs` and `git diff --check` pass.
- The checked-in world remains byte-exact. No compressed story summary, fact taxonomy, or
  machine-shaped narrative manifest competes with it.
- The first-book brief ends after Jay knowingly accepts Tan's invitation, before travel. It removes
  the invented sponsorship-authorization threshold and does not restate Parts Two through Six.
- The temporal block retains the earlier prompt's useful false-versus-true guardrails while
  correcting overbroad language about repetition, atmosphere, branching, and temporal “glimpses.”
- The three older teaching patterns are retained as explicitly adapted examples outside baseline for
  one controlled A/B only if consecutive reading reveals the specific failures they address.
- The proposed visual direction remains **Oakland Offset**, with unapproved AI-authored character,
  object, location, map, and PRMTT specifics. It is not prose context and it is not yet approved
  visual authority.
- A0 remains open for owner editorial review of the pilot, prompt materials, and visual proposal.
  A1 must not begin until that review resolves the remaining visual decisions.

## Spend and deployment

- Text-generation spend: `$0`.
- Image-generation spend: `$0`.
- Infrastructure mutation: none.
- Deployment: none.

## Next action

Project owner reviews content/shape-of-time/pilot-brief.md, prompts/fable/temporal-rules.md,
prompts/fable/write-folio.md, prompts/fable/craft-examples.md, and the separate pending
content/shape-of-time/visual-bible.md proposal. After any revisions, rerun the content gate, mark A0
complete in this handoff, and only then begin A1 stack selection.
