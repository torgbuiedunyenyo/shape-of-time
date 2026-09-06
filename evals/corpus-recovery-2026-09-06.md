# Connected corpus recovery

The first-root snapshot had restored successfully, but it did not establish recovery of a growing
multimodal author archive. The next real snapshot at deployed1778df9944ebcea6a9df6be95506ee35f83d350d
included three works, six publications and the renewed author context.

The initial full export failed with `RangeError: Invalid string length` at
`JSON.stringify(rows)` for the operations table. The database reported132operations, about850MB
of request storage and25MB of response storage. It made no production writes. Its partial local
snapshot remains at .local/corpus-nested-renewed-2026-09-06; it has no completion manifest and is
not a valid backup. No original request, image or transcript was deleted.

The replacement uses a PostgreSQL cursor inside a consistent read transaction and writes individual
records as newline-delimited JSON, hashing the bytes incrementally. Restore verifies every file
before creating its fresh schema, inserts records individually and compares every restored record
and object against the snapshot. The format is jsonl-v2; historical snapshots retain their matching
historical exporter. Each individual record/object must still fit memory, but the entire growing
archive need not fit a single JavaScript string or collection.

The focused mechanical check preserves multiline/Unicode/nested protocol content, refuses to
overwrite an existing snapshot file and detects later byte corruption. It is not a literary test
or a fresh provider call. The real replacement export has passed the previous failure point:
132operations occupy893MiB of JSONL. Final export and restore evidence are pending.
