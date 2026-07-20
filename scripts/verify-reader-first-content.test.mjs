import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const DIGEST = /^[a-f0-9]{64}$/u;

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
  assert.equal(manifest.writer.providerCalls, 11);
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
    for (const field of [
      "admissionSha256",
      "candidateSha256",
      "providerProseSha256",
      "requestManifestSha256",
      "responseSha256",
    ]) {
      assert.match(entry[field], DIGEST, `${entry.folioId} lacks ${field}`);
    }
    assert.ok(Array.isArray(entry.copyedits), `${entry.folioId} copyedits are not recorded`);
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
  assert.deepEqual(
    manifest.folios.flatMap((entry) =>
      entry.copyedits.map((copyedit) => `${entry.folioId}:${copyedit.kind}`)),
    [
      "root-folio-04:delete-surplus-final-quotation-mark",
      "root-folio-07:replace-terminal-period-with-question-mark",
      "map-folio-01:delete-redundant-phrase",
      "map-folio-01:clarify-signature-placement",
      "map-folio-02:clarify-credential-holder",
    ],
  );
  const recoveredDirection = manifest.folios.find((entry) => entry.folioId === "map-folio-02")
    ?.directionRecovery;
  assert.equal(recoveredDirection?.kind, "copy-purposeful-change-to-empty-narrative-job-v1");
  assert.match(recoveredDirection?.sourceSha256, DIGEST);
});

test("the four checked-in plates are lossless WebP derivatives of accepted GPT Image 2 outputs", async () => {
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
  const expectedReferences = new Map([
    ["plate-root-payment", []],
    ["plate-root-band", ["plate-root-payment"]],
    ["plate-root-map", ["plate-root-payment", "plate-root-band"]],
    ["plate-map-terminal-wall", []],
  ]);

  for (const entry of manifest.plates) {
    assert.equal(entry.requestedModel, "gpt-image-2-2026-04-21");
    assert.equal(entry.servedModelEvidence, "unavailable");
    assert.equal(entry.directionSource, "fable");
    for (const field of [
      "acceptanceSha256",
      "assetSha256",
      "providerOutputSha256",
      "providerReceiptSha256",
      "requestManifestSha256",
    ]) {
      assert.match(entry[field], DIGEST, `${entry.plateId} lacks ${field}`);
    }
    assert.deepEqual(entry.orderedReferencePlateIds, expectedReferences.get(entry.plateId));
    assert.equal(entry.automaticRetryCount, 0);
    assert.equal(entry.productionConversion, "cwebp-lossless-z9-metadata-none");
    assert.ok(
      entry.assetPath.endsWith(`/${entry.assetSha256}.webp`),
      `${entry.plateId} is not digest-named`,
    );
    const bytes = await readFile(new URL(entry.assetPath, ROOT));
    assert.equal(sha256(bytes), entry.assetSha256, `${entry.plateId} asset digest drifted`);
    assert.equal(bytes.subarray(0, 4).toString("hex"), "52494646", `${entry.plateId} is not WebP`);
  }

  for (const { folio, plate } of plates) {
    const entry = manifest.plates.find((candidate) => candidate.plateId === plate.id);
    assert.ok(entry, `missing production record for ${plate.id}`);
    assert.ok(!/^Draft plate/iu.test(plate.alt), `${plate.id} still has draft alt text`);
    assert.equal(entry.folioId, folio.id);
  }
});
