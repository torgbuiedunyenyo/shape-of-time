import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { acceptReaderFirstPlate } from "../src/server/images/reader-first-plate.ts";
import {
  appendAcceptedProgress,
  loadAcceptedProgress,
  loadVerifiedFableCandidate,
} from "./reader-first-fable.mjs";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUTHORING_ROOT = path.resolve(REPOSITORY_ROOT, "../shape-of-time-c0-authoring");
const PROGRESS_PATH = path.join(AUTHORING_ROOT, "progress.json");

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

function requireArguments() {
  const candidatePath = argument("--candidate");
  const candidateSha256 = argument("--candidate-sha");
  const confirmation = argument("--confirm-accept");
  if (typeof candidatePath !== "string" || !path.isAbsolute(candidatePath)) {
    throw new Error("--candidate must be an absolute path");
  }
  if (!/^[a-f0-9]{64}$/u.test(candidateSha256 ?? "")) {
    throw new Error("--candidate-sha must be an exact SHA-256 digest");
  }
  if (confirmation !== candidateSha256) {
    throw new Error("--confirm-accept must repeat the exact reviewed candidate SHA-256");
  }
  return { candidatePath, candidateSha256 };
}

function locateFolio(fixture, folioId) {
  for (const book of fixture.books) {
    const folio = book.folios.find((candidate) => candidate.id === folioId);
    if (folio !== undefined) return { book, folio };
  }
  throw new Error("candidate names an unknown reader-first folio");
}

async function main() {
  const arguments_ = requireArguments();
  const fixture = JSON.parse(
    await readFile(path.join(REPOSITORY_ROOT, "content/reader-first/slice.json"), "utf8"),
  );
  const loaded = await loadVerifiedFableCandidate({
    archiveRoot: AUTHORING_ROOT,
    candidatePath: arguments_.candidatePath,
    candidateSha256: arguments_.candidateSha256,
  });
  const { folio } = locateFolio(fixture, loaded.candidate.folioId);
  const alreadyAccepted = await loadAcceptedProgress({
    archiveRoot: AUTHORING_ROOT,
    fixture,
    progressPath: PROGRESS_PATH,
  });
  const sequence = fixture.books.flatMap((book) => book.folios);
  const expected = sequence[alreadyAccepted.length];
  const exactReplay = alreadyAccepted.at(-1)?.candidateSha256 === loaded.candidateSha256;
  if (!exactReplay && expected?.id !== loaded.candidate.folioId) {
    throw new Error("candidate is not the next exact editorial acceptance");
  }
  const trustedPlateEvidence = alreadyAccepted.flatMap((entry) => entry.plate === undefined ? [] : [{
    acceptanceSha256: entry.plate.acceptanceSha256,
    plateId: entry.plate.plateId,
    providerOutputSha256: entry.plate.providerOutputSha256,
  }]);
  const entry = {
    candidatePath: loaded.candidatePath,
    candidateSha256: loaded.candidateSha256,
  };
  let plateAcceptance = null;
  if (folio.plate !== null && folio.plate !== undefined) {
    const reviewRoot = path.join(AUTHORING_ROOT, "images", "review", folio.plate.id);
    plateAcceptance = await acceptReaderFirstPlate({
      authoringRoot: AUTHORING_ROOT,
      candidate: loaded.candidate,
      candidateSha256: loaded.candidateSha256,
      folioId: folio.id,
      plateId: folio.plate.id,
      providerReceiptPath: path.join(reviewRoot, "provider-receipt.json"),
      reviewImagePath: path.join(reviewRoot, `${folio.plate.id}.png`),
      trustedPlateEvidence,
    });
    entry.plateAcceptancePath = plateAcceptance.acceptancePath;
    entry.plateAcceptanceSha256 = plateAcceptance.acceptanceSha256;
  }
  const progress = await appendAcceptedProgress({
    archiveRoot: AUTHORING_ROOT,
    entry,
    fixture,
    progressPath: PROGRESS_PATH,
  });
  process.stdout.write(
    JSON.stringify({
      acceptedCount: progress.accepted.length,
      candidateSha256: loaded.candidateSha256,
      folioId: loaded.candidate.folioId,
      plateAcceptancePath: plateAcceptance?.acceptancePath ?? null,
      progressPath: PROGRESS_PATH,
    }) + "\n",
  );
}

main().catch((error) => {
  process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
