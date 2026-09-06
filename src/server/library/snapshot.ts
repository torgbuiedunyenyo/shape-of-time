import { createReadStream } from 'node:fs';
import { open } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
export type SnapshotRow = Record<string, unknown>;
const encoded = (row: SnapshotRow) => JSON.stringify(row) + '\n';

/** One record at a time: a growing archive must not become one JavaScript string. */
export async function writeRecords(path: string, rows: AsyncIterable<SnapshotRow>) {
  const file = await open(path, 'wx', 0o600);
  const hash = createHash('sha256');
  let count = 0;
  try {
    for await (const row of rows) {
      const line = encoded(row);
      await file.writeFile(line);
      hash.update(line);
      count++;
    }
  } finally { await file.close(); }
  return { count, sha256: hash.digest('hex') };
}
export async function* readRecords(path: string): AsyncGenerator<SnapshotRow> {
  const file = await open(path, 'r');
  try {
    for await (const line of file.readLines()) yield JSON.parse(line);
  } finally { await file.close(); }
}
export async function verifyFile(path: string, expected: string) {
  const hash = createHash('sha256');
  for await (const bytes of createReadStream(path)) hash.update(bytes);
  if (hash.digest('hex') !== expected)
    throw new Error(`Snapshot checksum mismatch: ${path}`);
}
/** Caller owns a transaction. Identifiers come only from the snapshot table allowlist. */
export async function* databaseRecords(connection: PoolClient, table: string) {
  if (!/^[a-z_]+$/.test(table)) throw new Error('Invalid snapshot table');
  await connection.query(`declare snapshot_rows no scroll cursor for select * from "${table}" order by created_at, id`);
  try {
    for (;;) {
      const {rows} = await connection.query<SnapshotRow>('fetch forward 1 from snapshot_rows');
      if (!rows.length) return;
      yield rows[0];
    }
  } finally { await connection.query('close snapshot_rows'); }
}
export async function recordDigest(rows: AsyncIterable<SnapshotRow>) {
  const hash = createHash('sha256');
  let count = 0;
  for await (const row of rows) { hash.update(encoded(row)); count++; }
  return { count, sha256: hash.digest('hex') };
}
