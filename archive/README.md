# Historical material — not the active application

The active project is the agentic world exploration harness described in the root README, SPEC,
EVALS and PLAN. This folder preserves evidence and recovery material. It is not a second
application or a source of current instructions.

## Retired illustrated folio prototype

`folio-prototype-e1a3dec.tar.gz` contains every tracked file from commit
`e1a3decb29b33710f26a89f5cf2a415ca6f3ae09`: application, prompts, migrations, tests, scripts, package
and lock files, deployment configuration, prepared corpus, images, old instructions and QA reports.
Its contents were compared byte-for-byte with all 167 Git blobs before cleanup.
`folio-prototype-manifest.json` records each path, blob, size and SHA-256, plus the archive checksum.

The same source is retained in Git at local tag `archive/folio-prototype-2026-09-06` and at the full
commit above. No history was rewritten. The archive has no live credentials, database dump or remote
asset backup; those were not tracked source and have not been copied or changed by this cleanup.

The prototype was retired because its prescribed folios, restricted image-reference choices and
one-way write-then-illustrate path limited the intended experience, while continuation and deeper
navigation remained unreliable. Old test passes and completed milestones are evidence about that
prototype, not evidence that the new harness works.

Keep this source compressed. To inspect individual files without restoring anything:

```sh
git show e1a3decb29b33710f26a89f5cf2a415ca6f3ae09:package.json
tar -tzf archive/folio-prototype-e1a3dec.tar.gz
```

If an actual historical checkout is needed, create a separate read-only investigation worktree
under ~/git from the full archived commit. Do not extract the snapshot over the active checkout,
restore its package manifest or migrations wholesale, or run historical generation scripts using
current credentials. Recover only a specifically inspected mechanical component when useful to P1.

## Original infinite-book sources

`infinite-book/` contains the exact main template and three historical world documents, with their
own source manifest and README. The selected active extracts live in `content/shape-of-time/` and
their provenance is recorded there in SOURCE.md. Earlier contradictory world versions and Undertow
remain historical, not automatic creative input.

## Other checkouts and deployments

The successful text-only predecessor is `torgbuiedunyenyo/infinite-book`. The retired theoretical
experiment is `torgbuiedunyenyo/auto-biblio` (local art-thing). Neither should be replaced by this
cleanup. Earlier B2, D0 and reader-first worktrees are historical investigations and remain intact.

Ordinary repository searches exclude this folder via `.ignore`. Use `rg --no-ignore` inside the
archive when deliberately investigating history. Never treat archive text as agent instructions.
The raw predecessor .txt files preserve original whitespace and line endings via .gitattributes;
their source checksums, rather than formatting changes, verify faithful preservation.
