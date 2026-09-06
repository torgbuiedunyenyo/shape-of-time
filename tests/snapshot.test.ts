import { afterAll, expect, it } from 'vitest';
import { mkdtemp, readFile, appendFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { writeRecords, readRecords, verifyFile } from '../src/server/library/snapshot.js';
const directory = await mkdtemp(join(tmpdir(), 'shape-snapshot-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
it('round-trips multiline protocol records incrementally and detects later byte corruption', async () => {
  const file = join(directory, 'protocol.jsonl');
  const records = [
    { id: 'first', input: [{ role: 'user', content: 'A\n"quoted" source: 黄花 🌻' }] },
    { id: 'second', output: [{ type: 'input_image', image_url: 'data:image/png;base64,' + 'a'.repeat(2_000_000) }] },
    { id: 'third', usage: null, nested: { prior: ['first', 'second'] } },
  ];
  async function* source() { for (const row of records) yield row; }
  const saved = await writeRecords(file, source());
  expect(saved.count).toBe(3);
  expect(saved.sha256).toBe(createHash('sha256').update(await readFile(file)).digest('hex'));
  await verifyFile(file, saved.sha256);
  const loaded = []; for await (const row of readRecords(file)) loaded.push(row);
  expect(loaded).toEqual(records);
  await expect(writeRecords(file, source())).rejects.toThrow();
  await appendFile(file, '\n');
  await expect(verifyFile(file, saved.sha256)).rejects.toThrow('Snapshot checksum mismatch');
});
