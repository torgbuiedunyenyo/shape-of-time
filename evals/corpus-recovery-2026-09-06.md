# Connected corpus recovery

The first-root snapshot had restored successfully, but it did not establish recovery of a growing
multimodal creative agent archive. The next real snapshot at deployed1778df9944ebcea6a9df6be95506ee35f83d350d
included three works, six publications and the renewed creative agent context.

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
132operations occupy893MiB of JSONL. The full replacement export and restore then succeeded. Snapshot
.local/corpus-nested-renewed-v2-2026-09-06 contains1,011,238,197 table bytes and192,746,639 object
bytes. Every restored row in ten tables and all171objects matched their checksums in
world_restore_nested_renewed and its corresponding object namespace, with generation disabled.
The six publications,14assets, renewed context and all132operations are preserved. The live creative agent
continued independently after export while restore used that separate schema. No production edition
was overwritten. Small receipt: tests/receipts/corpus-nested-restore.json. Full27-test/typecheck/lint/
build gate passed. The revised exporter is deployed in eec8fddb7b837fbb50e3f8bca024a39ff969d88e.
