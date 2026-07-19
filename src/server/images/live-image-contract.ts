import { FilesystemRecoveryArchive } from "../assets/filesystem-recovery-archive.js";
import { sha256 } from "../domain/digests.js";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
  type CompletedImageOperation,
} from "./durable-image-dispatch.js";
import {
  compileImageRequest,
  type ImageAnchorRequirement,
  type ImageReference,
} from "./image-contract.js";
import { OpenAiImageClient, type ImageProviderResult } from "./openai-image-client.js";
import { validPng } from "./png-test-support.js";

const SPEND_AUTHORIZATION_BOUND_USD = 0.1;
const PROMPT_VERSION = "b1-live-contract-v2";

interface Arguments {
  archiveId?: string;
  confirmSpendCap?: number;
  dryRun: boolean;
  recoveryRoot?: string;
}

async function main(): Promise<void> {
  const arguments_ = readArguments(process.argv.slice(2));
  const generation = compileImageRequest({
    idempotencyKey: "b1-live-generate-journal-v2",
    kind: "generate",
    prompt:
      "A simple unmarked ceramic cup on a plain wood table, neutral daylight, quiet observational illustration, no text or logo.",
    promptVersion: PROMPT_VERSION,
    purpose: "contract-test",
    quality: "low",
    size: "1024x1024",
  });

  if (arguments_.dryRun) {
    const placeholder = validPng(8, 8, [31, 37, 41]);
    const pack = referencesFor(placeholder);
    const edit = compileImageRequest({
      idempotencyKey: "b1-live-edit-journal-v2",
      kind: "edit",
      prompt:
        "Keep the same cup and material. Move it to the left side of the table and add one folded plain napkin. No text or logo.",
      promptVersion: PROMPT_VERSION,
      purpose: "contract-test",
      quality: "low",
      references: pack.references,
      requiredAnchors: pack.requiredAnchors,
      size: "1024x1024",
    });
    process.stdout.write(
      `${JSON.stringify({
        plannedProviderOperations: 2,
        edit: { manifest: edit.manifest, manifestDigest: edit.manifestDigest },
        generation: { manifest: generation.manifest, manifestDigest: generation.manifestDigest },
        mode: "dry-run",
        spendAuthorizationBoundUsd: SPEND_AUTHORIZATION_BOUND_USD,
      })}\n`,
    );
    return;
  }

  if (arguments_.confirmSpendCap !== SPEND_AUTHORIZATION_BOUND_USD) {
    throw new Error(`live image contract requires --confirm-spend-cap ${SPEND_AUTHORIZATION_BOUND_USD.toFixed(2)}`);
  }
  if (arguments_.archiveId === undefined || arguments_.recoveryRoot === undefined) {
    throw new Error("live image contract requires --recovery-root and --archive-id");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey === undefined || apiKey.trim().length === 0) throw new Error("OPENAI_API_KEY is required");
  const archive = new FilesystemRecoveryArchive({
    archiveId: arguments_.archiveId,
    root: arguments_.recoveryRoot,
  });
  const client = new OpenAiImageClient({ apiKey });
  const journal = new FilesystemImageDispatchJournal({ archive });
  const dispatcher = new DurableImageDispatcher({ archive, client, journal });

  const firstExecution = await dispatcher.executeWithEvidence(generation);
  const first = firstExecution.result;
  const pack = referencesFor(first.bytes);
  const edit = compileImageRequest({
    idempotencyKey: "b1-live-edit-journal-v2",
    kind: "edit",
    prompt:
      "Keep the same cup and material. Move it to the left side of the table and add one folded plain napkin. No text or logo.",
    promptVersion: PROMPT_VERSION,
    purpose: "contract-test",
    quality: "low",
    references: pack.references,
    requiredAnchors: pack.requiredAnchors,
    size: "1024x1024",
  });
  const secondExecution = await dispatcher.executeWithEvidence(edit);
  const second = secondExecution.result;
  const firstProof = await completedEvidence(journal, generation.manifest.idempotencyKey);
  const secondProof = await completedEvidence(journal, edit.manifest.idempotencyKey);
  const estimatedOutputCostMicrousd = first.estimatedOutputCostMicrousd + second.estimatedOutputCostMicrousd;
  const estimatedTotalCostMicrousd =
    first.estimatedTotalCostMicrousd === null || second.estimatedTotalCostMicrousd === null
      ? null
      : first.estimatedTotalCostMicrousd + second.estimatedTotalCostMicrousd;
  if (
    estimatedTotalCostMicrousd !== null &&
    estimatedTotalCostMicrousd > SPEND_AUTHORIZATION_BOUND_USD * 1_000_000
  ) {
    throw new Error("usage-derived estimate exceeded the recorded authorization bound");
  }

  process.stdout.write(
    `${JSON.stringify({
      archiveId: arguments_.archiveId,
      currentRun: {
        archiveReconciliations: [firstExecution, secondExecution].filter(
          ({ resolution }) => resolution === "archive-reconciliation",
        ).length,
        durableReplays: [firstExecution, secondExecution].filter(({ resolution }) => resolution === "durable-replay").length,
        providerDispatches: [firstExecution, secondExecution].filter(
          ({ resolution }) => resolution === "provider-dispatch",
        ).length,
      },
      edit: summarize(
        second,
        secondExecution.resolution,
        edit.manifestDigest,
        secondProof.imageProof.receiptDigest,
        secondProof.replayProof.digest,
      ),
      estimatedOutputCostMicrousd,
      estimatedTotalCostMicrousd,
      generation: summarize(
        first,
        firstExecution.resolution,
        generation.manifestDigest,
        firstProof.imageProof.receiptDigest,
        firstProof.replayProof.digest,
      ),
      mode: "live",
      note: "The fixed two-operation scope and literal confirmation implement the written authorization bound; reported total is a usage-derived estimate, not a provider bill.",
      spendAuthorizationBoundUsd: SPEND_AUTHORIZATION_BOUND_USD,
    })}\n`,
  );
}

function referencesFor(bytes: Uint8Array): {
  references: ImageReference[];
  requiredAnchors: ImageAnchorRequirement[];
} {
  const identity = {
    assetId: "contract-cup-identity",
    byteLength: bytes.byteLength,
    bytes,
    description: "The exact cup and its proportions",
    digest: sha256(bytes),
    mediaType: "image/png" as const,
    provenance: {
      evidenceId: "b1-live-contract-cup-input",
      kind: "synthetic-contract-fixture" as const,
      scope: "contract-only" as const,
    },
    role: "identity",
  };
  const materialBytes = validPng(8, 8, [224, 218, 204]);
  const material = {
    assetId: "contract-neutral-material",
    byteLength: materialBytes.byteLength,
    bytes: materialBytes,
    description: "A distinct neutral ceramic-and-paper material reference",
    digest: sha256(materialBytes),
    mediaType: "image/png" as const,
    provenance: {
      evidenceId: "b1-live-contract-material-fixture",
      kind: "synthetic-contract-fixture" as const,
      scope: "contract-only" as const,
    },
    role: "object",
  };
  return {
    references: [identity, material],
    requiredAnchors: [
      { assetId: identity.assetId, digest: identity.digest, role: identity.role },
      { assetId: material.assetId, digest: material.digest, role: material.role },
    ],
  };
}

function summarize(
  result: ImageProviderResult,
  resolution: "archive-reconciliation" | "durable-replay" | "provider-dispatch",
  manifestDigest: string,
  receiptDigest: string,
  replayDigest: string,
) {
  return {
    digest: result.digest,
    estimatedOutputCostMicrousd: result.estimatedOutputCostMicrousd,
    estimatedTotalCostMicrousd: result.estimatedTotalCostMicrousd,
    latencyMs: result.latencyMs,
    manifestDigest,
    providerProcessingMs: result.providerProcessingMs,
    providerRequestId: result.providerRequestId,
    receiptDigest,
    replayDigest,
    requestedModelSnapshot: result.requestedModelSnapshot,
    resolution,
    servedModelEvidence: result.servedModelEvidence,
    usage: result.usage,
  };
}

async function completedEvidence(
  journal: FilesystemImageDispatchJournal,
  idempotencyKey: string,
): Promise<CompletedImageOperation> {
  const state = await journal.inspect(idempotencyKey);
  if (state.status !== "completed") throw new Error(`image operation did not complete durably: ${state.status}`);
  return state.terminal;
}

function readArguments(values: string[]): Arguments {
  if (values[0] === "--") values = values.slice(1);
  const parsed: Arguments = { dryRun: false };
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (key === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    const value = values[index + 1];
    if (value === undefined) throw new Error(`missing value for ${key}`);
    if (key === "--archive-id") parsed.archiveId = value;
    else if (key === "--recovery-root") parsed.recoveryRoot = value;
    else if (key === "--confirm-spend-cap") parsed.confirmSpendCap = Number(value);
    else throw new Error(`unknown image contract argument: ${key}`);
    index += 1;
  }
  return parsed;
}

await main();
