# Paused reading buffer

The author requested 40 additional reader requests: 20 core and 20 side-story requests, then paused
the run to prioritize usage credits. **Do not resume without their instruction.**

`ledger.json` is a checkpoint, not live state. The active local ledger is
`.local/reader-buffer-40/ledger.json`; a `hold` file beside it prevents further submissions.
`run.ts` preserves the driver used for this run, with an additional explicit `--run` safeguard.
It submits ordinary reader API requests, never direct provider calls or plot instructions.
The old `.local/review-second` driver remains stopped independently.

## Resumption, only when requested

1. Read HANDOFF.md and verify the live edition and medium mechanism still match this ledger.
2. Use the existing local ledger if present. If recovering elsewhere, copy this checkpoint into
   `.local/reader-buffer-40/ledger.json` and create its hold before doing anything else.
3. Read production status for every saved request ID. Preserve those IDs and idempotency keys.
   Reconcile in-flight or paused provider work; never replay an ambiguous provider operation.
4. Review remaining allowance, recording any authorized increase without resetting spending.
5. Remove only `.local/reader-buffer-40/hold`, then run from the repository root:
   `node --env-file=.env --import tsx operations/reader-buffer-40/run.ts --run`.
6. Verify 20 completed core and 20 completed side requests, actual publications, reachable openings,
   available images and mechanism receipts. Keep the checkpoint and HANDOFF current.

The driver saves each request body before submission and reuses its application idempotency key
on recovery. It does not count earlier UAT or other reader requests toward this separate 40.
It alternates core and side requests, with depth across five side paths; new sources come from
actual core illustrations or already offered openings. No narrative development is prescribed.

Credentials, raw provider content and private draft snapshots remain outside Git. The tracked
checkpoint contains only identities, request routing and progress.
