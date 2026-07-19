# Handoff

_Updated 2026-07-18._

## Current state

- Repository: `torgbuiedunyenyo/shape-of-time`.
- Branch: `main`.
- Genesis commit: `7f7b5b112140db7ecb0bc2a85f28a0f38adda441`.
- The repository has been separated from the retired `auto-biblio` implementation.
- The initial authority, verified expanded world source, source provenance, and implementation queue are present.
- A0's cited story bible, complete six-part arc, pilot boundary, and visual bible are drafted and structurally green, but remain explicitly pending project-owner review.
- No application code, package manifest, generated corpus, database, model output, paid generation, Railway project, or deployment exists yet.

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

- Red observed: the source-digest test passed while five authority tests failed because `authority.json`, `story-bible.md`, `arc.md`, and `visual-bible.md` were absent.
- Current local result: `node --test scripts/*.test.mjs` passes 9/9; `node scripts/verify-genesis.mjs` and `git diff --check` pass.
- Proposed pilot boundary: Part One ends after Jay knowingly accepts Tan's invitation and authorizes sponsorship, before travel begins.
- Proposed visual direction: **Oakland Offset**, a grounded gouache-and-graphite illustrated novel with restrained print texture and artifact/map folios.
- Proposed binding additions include Jay and Tan's physical designs, Clef as a packaged amber-red pressed flake, fixed shop geometry, a cracked cobalt-cased payment phone, tri-axial map grammar, a three-rail PRMTT harness, and a material visa folio.
- Deep unmapped time, Tan's exact future year, company identity and hidden motives, Clef chemistry/effect/consumption, and the exact Part Five reunion location remain intentionally unspecified rather than delegated to generation.
- `content/shape-of-time/authority.json` records `pending-owner`; A0 is not complete and A1 must not begin until the owner approves or revises these decisions.

## Spend and deployment

- Text-generation spend: `$0`.
- Image-generation spend: `$0`.
- Infrastructure mutation: none.
- Deployment: none.

## Next action

Project owner reviews `content/shape-of-time/story-bible.md`, `arc.md`, and `visual-bible.md`, especially the pilot boundary, cast, Clef, shop, phone/payment mechanic, map/PRMTT forms, and preserved unknowns. After explicit approval or revisions, record the review in `authority.json`, rerun the authority gate, mark A0 complete, and only then begin A1 stack selection.
