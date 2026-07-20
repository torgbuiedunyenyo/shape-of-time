import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import {
  parseAcceptanceArguments,
  requireReviewOperationForFolio,
} from "./reader-first-accept-arguments.mjs";

const candidateSha256 = "a".repeat(64);
const operationDigest = "b".repeat(64);
const candidatePath = path.resolve("/tmp/candidate.json");

function argv(...extra) {
  return [
    "node",
    "reader-first-accept.mjs",
    "--candidate",
    candidatePath,
    "--candidate-sha",
    candidateSha256,
    "--confirm-accept",
    candidateSha256,
    ...extra,
  ];
}

test("text-led folio acceptance does not require an image review operation", () => {
  const parsed = parseAcceptanceArguments(argv());
  assert.equal(parsed.reviewOperationDigest, undefined);
  assert.equal(requireReviewOperationForFolio({ plate: null }, parsed.reviewOperationDigest), undefined);
});

test("illustrated folio acceptance requires the exact reviewed operation digest", () => {
  const parsed = parseAcceptanceArguments(argv("--review-operation-digest", operationDigest));
  assert.equal(
    requireReviewOperationForFolio({ plate: { id: "plate-root-band" } }, parsed.reviewOperationDigest),
    operationDigest,
  );
  assert.throws(
    () => requireReviewOperationForFolio({ plate: { id: "plate-root-band" } }, undefined),
    /illustrated folio requires --review-operation-digest/u,
  );
});

test("text-led folio acceptance rejects an unrelated image review operation", () => {
  const parsed = parseAcceptanceArguments(argv("--review-operation-digest", operationDigest));
  assert.throws(
    () => requireReviewOperationForFolio({ plate: null }, parsed.reviewOperationDigest),
    /text-led folio must not name --review-operation-digest/u,
  );
});

test("optional image review digest is still exact when supplied", () => {
  assert.throws(
    () => parseAcceptanceArguments(argv("--review-operation-digest", "not-a-digest")),
    /--review-operation-digest must be an exact SHA-256 digest/u,
  );
});
