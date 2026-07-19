# Agent instructions

## Authority

Read these files before product work, in this order:

1. `SPEC.md` — stable product authority.
2. `EVALS.md` — release evidence and proof boundaries.
3. `PLAN.md` — dependency-ordered work queue; take the next unblocked item.
4. `HANDOFF.md` — live branch, state, spend, deployment, and next action.

`README.md` is orientation. `LEGACY.md` and source-history documents are lookup-only. `CLAUDE.md` is a compatibility pointer and adds no rules. Do not create a second status file, invariants file, or competing plan.

## Scope

This is a greenfield successor. The old `auto-biblio` code, schema, corpus, prompts, eval machinery, package boundaries, and deployment topology are evidence, not compatibility targets. Do not copy an old package wholesale or restore a retired mechanism because it already exists.

The intended prototype remains one TypeScript application, one Postgres database, and image storage. Add complexity only when a measured failure requires it.

## Method

For every implementation step:

1. Write the named red test.
2. Run it and record the expected failure reason.
3. Make the smallest coherent change that passes.
4. Refactor with the test green.
5. Run the relevant focused tests and the complete repository gate before pushing.

Never make a gate pass by weakening it, widening an allowlist, adding a skip, or exempting the artifact it caught. Tests that touch persistence use a real test database. Provider contract tests use real APIs only when the plan explicitly authorizes a small spend ceiling.

Use current official documentation before implementing against external frameworks or model APIs. Pin provider contracts and record the served model.

## Reader QA

Use the in-app Browser for the actual reader journey. Drive visible controls as a reader would: cover entry, page turns, keyboard, touch-sized layout, phrase aperture, arbitrary highlight, title creation, exact Back, reload, and resume. DOM presence alone is not evidence of reachability. Do not substitute Playwright for the required in-app Browser walkthrough.

## Git and shared-workspace safety

- Preserve unrelated user changes.
- Stage explicit paths; never default to `git add -A` in a mixed worktree.
- Do not use destructive reset or checkout commands on work you did not create.
- Keep commits small and aligned to one plan item.
- Update `HANDOFF.md` before the final commit of a work slice.
- No secret, token, generated credential, or raw `.env` value enters Git or logs.

Once a package manifest exists, `pnpm run gates` is the required pre-push gate. Before then, run the document/source checks named in `PLAN.md` and `git diff --check`.

## Models, spend, and deployment

- Prose generation uses Claude Fable 5 at `xhigh`; no Opus or silent fallback.
- Narrative images use the pinned GPT Image 2 contract in `SPEC.md` and `PLAN.md`.
- The complete Fable request must remain below 400,000 total context tokens.
- No paid call occurs without the plan item, a recorded ceiling, and provenance capture already in place.
- Deployment eventually uses a separate Railway prototype project/environment and Git-triggered deploys only. Never use `railway up` for this Git-integrated project.

## Session close

Before stopping, make `HANDOFF.md` accurately state what landed, what is in flight, what was tested, what was spent, what is deployed, and the single next action. Do not leave future agents to infer state from chat history.
