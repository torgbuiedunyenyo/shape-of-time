import path from "node:path";

function argument(argv, name) {
  const index = argv.indexOf(name);
  return index < 0 ? undefined : argv[index + 1];
}

export function parseAcceptanceArguments(argv = process.argv) {
  const candidatePath = argument(argv, "--candidate");
  const candidateSha256 = argument(argv, "--candidate-sha");
  const reviewOperationDigest = argument(argv, "--review-operation-digest");
  const discardedImageDirectionSha256 = argument(argv, "--discard-image-direction-sha");
  const confirmation = argument(argv, "--confirm-accept");
  if (typeof candidatePath !== "string" || !path.isAbsolute(candidatePath)) {
    throw new Error("--candidate must be an absolute path");
  }
  if (!/^[a-f0-9]{64}$/u.test(candidateSha256 ?? "")) {
    throw new Error("--candidate-sha must be an exact SHA-256 digest");
  }
  if (
    reviewOperationDigest !== undefined
    && !/^[a-f0-9]{64}$/u.test(reviewOperationDigest)
  ) {
    throw new Error("--review-operation-digest must be an exact SHA-256 digest");
  }
  if (
    discardedImageDirectionSha256 !== undefined
    && !/^[a-f0-9]{64}$/u.test(discardedImageDirectionSha256)
  ) {
    throw new Error("--discard-image-direction-sha must be an exact SHA-256 digest");
  }
  if (confirmation !== candidateSha256) {
    throw new Error("--confirm-accept must repeat the exact reviewed candidate SHA-256");
  }
  return {
    candidatePath,
    candidateSha256,
    discardedImageDirectionSha256,
    reviewOperationDigest,
  };
}

export function requireReviewOperationForFolio(folio, reviewOperationDigest) {
  const illustrated = folio.plate !== null && folio.plate !== undefined;
  if (illustrated && reviewOperationDigest === undefined) {
    throw new Error("illustrated folio requires --review-operation-digest");
  }
  if (!illustrated && reviewOperationDigest !== undefined) {
    throw new Error("text-led folio must not name --review-operation-digest");
  }
  return reviewOperationDigest;
}
