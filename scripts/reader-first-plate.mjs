import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { FilesystemRecoveryArchive } from "../src/server/assets/filesystem-recovery-archive.ts";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
} from "../src/server/images/durable-image-dispatch.ts";
import {
  C0_IMAGE_SPEND_CAP_USD,
  compileReaderFirstPlate,
  readerFirstPlateDryRun,
  runReaderFirstPlate,
} from "../src/server/images/reader-first-plate.ts";
import { OpenAiImageClient } from "../src/server/images/openai-image-client.ts";
import {
  loadAcceptedProgress,
  loadVerifiedFableCandidate,
} from "./reader-first-fable.mjs";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUTHORING_ROOT = path.resolve(REPOSITORY_ROOT, "../shape-of-time-c0-authoring");
const PROGRESS_PATH = path.join(AUTHORING_ROOT, "progress.json");
const C0_RECOVERY_ROOT = path.join(AUTHORING_ROOT, "images", "recovery");
const C0_ARCHIVE_ID = "shape-of-time-c0-reader-first-2026-07";
const B2_RECOVERY_ROOT = "/Users/ratpartyserver/git/shape-of-time-b2-recovery";
const B2_ARCHIVE_ID = "b2-visual-study-2026-07";
const TREATMENT_B_PROOF = {
  archiveId: B2_ARCHIVE_ID,
  byteLength: 3_661_658,
  digest: "85e55625e3a8bcf3e31c3546689287dc306736bf8deef59172ae8511c6dd2b06",
  key: "sha256/85/85e55625e3a8bcf3e31c3546689287dc306736bf8deef59172ae8511c6dd2b06",
  mediaType: "image/png",
  receiptDigest: "a9ac29f4a649bba572ddb8dce97547e7bd8c27ef8413ec7a9d2d5fa44a1acf5a",
  schema: "shape-of-time.asset-recovery.v1",
};

const PLATES = new Set([
  "plate-root-payment",
  "plate-root-band",
  "plate-root-map",
  "plate-map-terminal-wall",
]);

function parseArguments(values) {
  const command = values[0];
  if (command !== "dry-run" && command !== "run") {
    throw new Error(
      "usage: reader-first-plate.mjs dry-run|run --plate ID --candidate PATH " +
        "--candidate-sha SHA256 [--operation-digest SHA256 --confirm-spend-cap 0.10]",
    );
  }
  const parsed = { command };
  for (let index = 1; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (value === undefined) throw new Error("missing value for " + key);
    if (key === "--plate") parsed.plateId = value;
    else if (key === "--candidate") parsed.candidatePath = value;
    else if (key === "--candidate-sha") parsed.candidateSha256 = value;
    else if (key === "--operation-digest") parsed.operationDigest = value;
    else if (key === "--confirm-spend-cap") parsed.confirmSpendCap = Number(value);
    else throw new Error("unknown reader-first plate argument: " + key);
  }
  if (!PLATES.has(parsed.plateId)) throw new Error("unknown --plate value");
  if (typeof parsed.candidatePath !== "string" || !path.isAbsolute(parsed.candidatePath)) {
    throw new Error("--candidate must be an absolute path");
  }
  if (!/^[a-f0-9]{64}$/u.test(parsed.candidateSha256 ?? "")) {
    throw new Error("--candidate-sha must be an exact SHA-256 digest");
  }
  if (command === "dry-run") {
    if (parsed.operationDigest !== undefined || parsed.confirmSpendCap !== undefined) {
      throw new Error("dry-run does not accept live confirmations");
    }
  } else {
    if (!/^[a-f0-9]{64}$/u.test(parsed.operationDigest ?? "")) {
      throw new Error("run requires the exact reviewed --operation-digest");
    }
    if (parsed.confirmSpendCap !== C0_IMAGE_SPEND_CAP_USD) {
      throw new Error(
        "run requires the literal written --confirm-spend-cap " +
          C0_IMAGE_SPEND_CAP_USD.toFixed(2),
      );
    }
  }
  return parsed;
}

async function treatmentBReference() {
  const archive = new FilesystemRecoveryArchive({
    archiveId: B2_ARCHIVE_ID,
    root: B2_RECOVERY_ROOT,
  });
  const bytes = await archive.read(TREATMENT_B_PROOF);
  return {
    assetId: "treatment-b-medium",
    byteLength: bytes.byteLength,
    bytes,
    description:
      "Approved Treatment B medium only: observational varied ink, restrained transparent color, tactile paper and repair, natural perspective, and concrete faces and hands. Transfer no scene content.",
    digest: TREATMENT_B_PROOF.digest,
    mediaType: "image/png",
    provenance: {
      evidenceId:
        "b5d7e35248d4eb35c68b989cc8b1b94746de6564:content/shape-of-time/visual-direction-candidates.md",
      kind: "human-approved-medium",
      scope: "shared-medium-only",
    },
    role: "shared-medium-only",
  };
}

async function loadedProgress() {
  const fixture = JSON.parse(
    await readFile(path.join(REPOSITORY_ROOT, "content/reader-first/slice.json"), "utf8"),
  );
  return loadAcceptedProgress({
    archiveRoot: AUTHORING_ROOT,
    fixture,
    progressPath: PROGRESS_PATH,
  });
}

function acceptedPlateReference(accepted, folioId, role, description) {
  const entry = accepted.find((candidate) => candidate.folioId === folioId);
  if (entry?.plate === undefined) {
    throw new Error(folioId + " has no verified accepted plate in editorial progress");
  }
  const bytes = new Uint8Array(entry.plate.bytes);
  return {
    assetId: entry.plate.plateId,
    byteLength: bytes.byteLength,
    bytes,
    description,
    digest: entry.plate.providerOutputSha256,
    mediaType: entry.plate.mediaType,
    provenance: {
      evidenceId: entry.plate.acceptanceSha256,
      kind: "exposed-folio-image",
      scope: "book-local",
    },
    role,
  };
}

async function referencesFor(plateId) {
  if (plateId === "plate-root-payment") {
    return { references: [await treatmentBReference()], trustedPlateEvidence: [] };
  }
  const accepted = await loadedProgress();
  const trustedPlateEvidence = accepted.flatMap((entry) => entry.plate === undefined ? [] : [{
    acceptanceSha256: entry.plate.acceptanceSha256,
    plateId: entry.plate.plateId,
    providerOutputSha256: entry.plate.providerOutputSha256,
  }]);
  if (plateId === "plate-root-band") {
    return {
      references: [acceptedPlateReference(
        accepted,
        "root-folio-01",
        "root-payment-identity-and-world",
        "Accepted Payment plate, governing Jay and Tan identity and the exposed root-book visual world.",
      )],
      trustedPlateEvidence,
    };
  }
  if (plateId === "plate-root-map") {
    return { references: [
      acceptedPlateReference(
        accepted,
        "root-folio-01",
        "root-payment-identity-and-world",
        "Accepted Payment plate, governing Jay and Tan identity and early root-book visual continuity.",
      ),
      acceptedPlateReference(
        accepted,
        "root-folio-03",
        "root-band-identity-and-world",
        "Accepted Band plate, governing Jay and Tan identity in a second view and the exposed root-book visual world.",
      ),
    ], trustedPlateEvidence };
  }
  return { references: [
    await treatmentBReference(),
    acceptedPlateReference(
      accepted,
      "root-folio-07",
      "parent-map-evidence-idea-only",
      "Accepted root Map plate, governing only the inherited idea of mapped evidence crossing from private control into public use; transfer no identity, place, palette, or composition.",
    ),
  ], trustedPlateEvidence };
}

async function compile(arguments_) {
  const loaded = await loadVerifiedFableCandidate({
    archiveRoot: AUTHORING_ROOT,
    candidatePath: arguments_.candidatePath,
    candidateSha256: arguments_.candidateSha256,
  });
  const referenceBundle = await referencesFor(arguments_.plateId);
  return compileReaderFirstPlate({
    candidate: loaded.candidate,
    candidateSha256: loaded.candidateSha256,
    plateId: arguments_.plateId,
    references: referenceBundle.references,
    trustedPlateEvidence: referenceBundle.trustedPlateEvidence,
  });
}

async function runLive(arguments_, compiled) {
  const dryRun = readerFirstPlateDryRun(compiled);
  if (arguments_.operationDigest !== dryRun.operationDigest) {
    throw new Error("--operation-digest does not match the current exact dry run");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (typeof apiKey !== "string" || apiKey.trim().length === 0) {
    throw new Error("OPENAI_API_KEY is required");
  }
  const archive = new FilesystemRecoveryArchive({
    archiveId: C0_ARCHIVE_ID,
    root: C0_RECOVERY_ROOT,
  });
  const journal = new FilesystemImageDispatchJournal({ archive });
  const dispatcher = new DurableImageDispatcher({
    archive,
    client: new OpenAiImageClient({ apiKey }),
    journal,
  });
  return runReaderFirstPlate({
    authoringRoot: AUTHORING_ROOT,
    compiled,
    dispatcher,
    journal,
  });
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  const compiled = await compile(arguments_);
  const dryRun = readerFirstPlateDryRun(compiled);
  if (arguments_.command === "dry-run") {
    process.stdout.write(JSON.stringify({ mode: "dry-run", ...dryRun }) + "\n");
    return;
  }
  const report = await runLive(arguments_, compiled);
  process.stdout.write(
    JSON.stringify({
      currentRun: report.currentRun,
      judgment: report.judgment,
      mode: "live",
      operationDigest: report.operationDigest,
      outputSha256: report.providerReceipt.outputSha256,
      providerReceiptPath: report.providerReceiptPath,
      reviewImagePath: report.reviewImagePath,
    }) + "\n",
  );
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  });
}
