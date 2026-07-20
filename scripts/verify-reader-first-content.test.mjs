import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function json(relative) {
  return JSON.parse(await readFile(new URL(relative, ROOT), "utf8"));
}

test("the reader-first prose is one accepted sequential Fable xhigh run", async () => {
  const [slice, manifest] = await Promise.all([
    json("content/reader-first/slice.json"),
    json("content/reader-first/production-manifest.json"),
  ]);
  const folios = slice.books.flatMap((book) => book.folios);

  assert.equal(manifest.version, 1);
  assert.equal(manifest.status, "accepted");
  assert.equal(manifest.writer.model, "claude-fable-5");
  assert.equal(manifest.writer.effort, "xhigh");
  assert.equal(manifest.writer.absoluteContextCeiling, 400_000);
  assert.equal(manifest.writer.maxCountedInput, 363_136);
  assert.equal(manifest.folios.length, 10);
  assert.deepEqual(
    manifest.folios.map((entry) => entry.folioId),
    folios.map((folio) => folio.id),
  );

  const seenByBook = new Map();
  for (const entry of manifest.folios) {
    const folio = folios.find((candidate) => candidate.id === entry.folioId);
    assert.ok(folio, `manifest names unknown folio ${entry.folioId}`);
    const prose = folio.blocks.map((block) => block.text).join("\n\n");
    assert.equal(entry.proseSha256, sha256(prose), `${entry.folioId} prose digest drifted`);
    assert.match(entry.requestManifestSha256, /^[a-f0-9]{64}$/u);
    assert.match(entry.responseSha256, /^[a-f0-9]{64}$/u);
    assert.equal(entry.admissionEvidence, "anthropic-count-tokens");
    assert.ok(entry.countedInputTokens > 0 && entry.countedInputTokens <= 363_136);
    assert.equal(entry.contextWasInterleaved, true);
    assert.equal(entry.fallbackUsed, false);

    const bookId = entry.bookId;
    const prior = seenByBook.get(bookId) ?? [];
    assert.deepEqual(entry.priorFolioIds, prior, `${entry.folioId} prior folio order drifted`);
    seenByBook.set(bookId, [...prior, entry.folioId]);

    const expectsDirection = folio.plate !== undefined;
    assert.equal(
      entry.imageDirection === null,
      !expectsDirection,
      `${entry.folioId} image-direction presence disagrees with its layout`,
    );
    if (entry.imageDirection !== null) {
      for (const field of ["narrativeJob", "concreteScene", "factLeftToImage"]) {
        assert.ok(entry.imageDirection[field]?.trim(), `${entry.folioId} lacks ${field}`);
      }
      assert.ok(Array.isArray(entry.imageDirection.mustRemain));
      assert.ok(Array.isArray(entry.imageDirection.purposefulChanges));
      assert.ok(Array.isArray(entry.imageDirection.unresolvedFacts));
    }
  }
});

test("the four checked-in reader plates are exact GPT Image 2 outputs with ordered references", async () => {
  const [slice, manifest] = await Promise.all([
    json("content/reader-first/slice.json"),
    json("content/reader-first/production-manifest.json"),
  ]);
  const plates = slice.books.flatMap((book) =>
    book.folios.flatMap((folio) => (folio.plate === undefined ? [] : [{ folio, plate: folio.plate }])),
  );

  assert.equal(plates.length, 4);
  assert.equal(manifest.plates.length, 4);
  assert.deepEqual(
    manifest.plates.map((entry) => entry.plateId),
    plates.map(({ plate }) => plate.id),
  );

  for (const entry of manifest.plates) {
    assert.equal(entry.requestedModel, "gpt-image-2-2026-04-21");
    assert.equal(entry.servedModelEvidence, "unavailable");
    assert.equal(entry.directionSource, "fable");
    assert.match(entry.requestManifestSha256, /^[a-f0-9]{64}$/u);
    assert.match(entry.outputSha256, /^[a-f0-9]{64}$/u);
    assert.ok(Array.isArray(entry.orderedReferencePlateIds));
    assert.equal(entry.automaticRetryCount, 0);
    const bytes = await readFile(new URL(entry.assetPath, ROOT));
    assert.equal(sha256(bytes), entry.outputSha256, `${entry.plateId} asset digest drifted`);
    assert.equal(bytes.subarray(0, 4).toString("hex"), "52494646", `${entry.plateId} is not WebP`);
  }

  for (const { folio, plate } of plates) {
    const entry = manifest.plates.find((candidate) => candidate.plateId === plate.id);
    assert.ok(entry, `missing production record for ${plate.id}`);
    assert.ok(!/^Draft plate/iu.test(plate.alt), `${plate.id} still has draft alt text`);
    assert.equal(entry.folioId, folio.id);
  }
});
