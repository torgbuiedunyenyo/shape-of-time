import path from "node:path";
import { realpath } from "node:fs/promises";

import {
  readerFirstPlateContract,
  readerFirstPlatePrompt,
  verifyReaderFirstPlateEvidence,
} from "../../../scripts/reader-first-plate-evidence.mjs";
import type {
  ReaderFirstPlateId,
  SharedReaderFirstPlateContract,
  TrustedReaderFirstPlateEvidence,
} from "../../../scripts/reader-first-plate-evidence.mjs";

import {
  readImmutableFile,
  writeImmutable,
} from "../assets/filesystem-recovery-archive.js";
import { canonicalJson, digestJson, sha256 } from "../domain/digests.js";
import {
  type DurableImageDispatcher,
  type FilesystemImageDispatchJournal,
  type CompletedImageOperation,
} from "./durable-image-dispatch.js";
import {
  compileImageRequest,
  type CompiledImageRequest,
  type ImageReference,
} from "./image-contract.js";
import type { ImageProviderResult } from "./openai-image-client.js";

export const C0_IMAGE_SPEND_CAP_USD = 0.1;
export const C0_IMAGE_MAX_ESTIMATE_MICROUSD = 100_000;

const PROVIDER_RECEIPT_SCHEMA = "shape-of-time.reader-first-plate-provider-receipt.v2" as const;

export interface ReaderFirstImageDirection {
  concreteScene: string;
  factLeftToImage: string;
  mustRemain: string[];
  narrativeJob: string;
  purposefulChanges: string[];
  unresolvedFacts: string[];
}

export interface ReaderFirstFableCandidate {
  bookId: string;
  evidence: {
    effort: string;
    model: string;
    stopReason: string;
  };
  folioId: string;
  output: {
    imageDirection: ReaderFirstImageDirection | null;
    proseParagraphs: string[];
  };
  version: number;
}

export interface CompiledReaderFirstPlate {
  applicationGuidance: string;
  applicationGuidanceSha256: string;
  bookId: string;
  candidateSha256: string;
  fableImageDirection: ReaderFirstImageDirection;
  fableImageDirectionSha256: string;
  folioId: string;
  plateId: ReaderFirstPlateId;
  request: CompiledImageRequest;
}

export interface ReaderFirstPlateProviderReceipt {
  applicationGuidanceSha256: string;
  bookId: string;
  byteLength: number;
  candidateSha256: string;
  clientRequestId: string;
  dispatchDigest: string;
  estimatedOutputCostMicrousd: number | null;
  estimatedTotalCostMicrousd: number;
  fableImageDirection: ReaderFirstImageDirection;
  fableImageDirectionSha256: string;
  fixtureDigest: string;
  folioId: string;
  height: number;
  imageRecoveryProof: CompletedImageOperation["imageProof"];
  latencyMs: number;
  manifest: CompiledImageRequest["manifest"];
  manifestSha256: string;
  operationDigest: string;
  outputMediaType: "image/png";
  outputSha256: string;
  plateId: ReaderFirstPlateId;
  preparedDigest: string;
  pricingVersion: string;
  providerProcessingMs: number | null;
  providerRequestId: string;
  providerReceiptSha256: string;
  replayRecoveryProof: CompletedImageOperation["replayProof"];
  requestedModelSnapshot: string;
  resultDigest: string;
  schema: typeof PROVIDER_RECEIPT_SCHEMA;
  servedModelEvidence: "unavailable-from-image-api";
  totalCostEstimateUnavailableReason: null;
  usage: ImageProviderResult["usage"];
  width: number;
}

export interface ReaderFirstPlateAcceptance {
  assetPath: string;
  assetSha256: string;
  bookId: string;
  candidateSha256: string;
  fableImageDirectionSha256: string;
  folioId: string;
  mediaType: "image/png";
  plateId: ReaderFirstPlateId;
  providerOutputSha256: string;
  providerReceiptPath: string;
  providerReceiptSha256: string;
  version: 2;
}

export function compileReaderFirstPlate(input: {
  candidate: ReaderFirstFableCandidate;
  candidateSha256: string;
  plateId: ReaderFirstPlateId;
  references: readonly ImageReference[];
  trustedPlateEvidence?: readonly TrustedReaderFirstPlateEvidence[];
}): CompiledReaderFirstPlate {
  const definition = readerFirstPlateContract(input.plateId);
  validateCandidate(input.candidate, definition);
  requireDigest(input.candidateSha256, "Fable candidate");
  validateReferences(
    input.references,
    definition.referenceRules,
    input.plateId,
    input.trustedPlateEvidence ?? [],
  );

  const imageDirection = input.candidate.output.imageDirection;
  if (imageDirection === null) throw new Error(`${input.plateId} requires a Fable image direction`);
  const prompt = readerFirstPlatePrompt(input.plateId, imageDirection);
  const references = input.references.map(copyReference);
  const request = compileImageRequest({
    idempotencyKey: definition.idempotencyKey,
    kind: "edit",
    prompt: prompt.exactSourcePrompt,
    promptVersion: "reader-first-narrative-plate-v1",
    purpose: "narrative",
    quality: "medium",
    references,
    // B1 calls these requiredAnchors. Here every ordered input is required, but medium-only and
    // parent-idea references retain their truthful narrower provenance and are not promoted.
    requiredAnchors: references.map(({ assetId, digest, role }) => ({ assetId, digest, role })),
    size: "1024x1536",
  });
  return {
    applicationGuidance: prompt.applicationGuidance,
    applicationGuidanceSha256: prompt.applicationGuidanceSha256,
    bookId: definition.bookId,
    candidateSha256: input.candidateSha256,
    fableImageDirection: structuredClone(imageDirection),
    fableImageDirectionSha256: prompt.fableImageDirectionSha256,
    folioId: definition.folioId,
    plateId: input.plateId,
    request,
  };
}

export function readerFirstPlateDryRun(compiled: CompiledReaderFirstPlate) {
  const base = {
    applicationGuidanceSha256: compiled.applicationGuidanceSha256,
    bookId: compiled.bookId,
    candidateSha256: compiled.candidateSha256,
    fableImageDirectionSha256: compiled.fableImageDirectionSha256,
    folioId: compiled.folioId,
    manifest: compiled.request.manifest,
    manifestSha256: compiled.request.manifestDigest,
    maximumPlannedEstimateMicrousd: C0_IMAGE_MAX_ESTIMATE_MICROUSD,
    plannedProviderOperations: 1,
    plateId: compiled.plateId,
    schema: "shape-of-time.reader-first-plate-dry-run.v1" as const,
    spendAuthorizationBoundUsd: C0_IMAGE_SPEND_CAP_USD,
  };
  return { ...base, operationDigest: digestJson(base) };
}

export async function runReaderFirstPlate(arguments_: {
  authoringRoot: string;
  compiled: CompiledReaderFirstPlate;
  dispatcher: Pick<DurableImageDispatcher, "executeWithEvidence">;
  journal: Pick<FilesystemImageDispatchJournal, "inspect">;
}) {
  const idempotencyKey = arguments_.compiled.request.manifest.idempotencyKey;
  const stateBefore = await arguments_.journal.inspect(idempotencyKey);
  if (
    (stateBefore.status === "absent" || stateBefore.status === "prepared") &&
    C0_IMAGE_MAX_ESTIMATE_MICROUSD > C0_IMAGE_SPEND_CAP_USD * 1_000_000
  ) {
    throw new Error("reader-first plate would exceed its written spend cap");
  }

  const execution = await arguments_.dispatcher.executeWithEvidence(arguments_.compiled.request);
  assertResultWithinScope(execution.result, arguments_.compiled);
  const terminal = await completedEvidence(arguments_.journal, idempotencyKey);
  validateTerminalEvidence(terminal, execution.result, arguments_.compiled);

  const dryRun = readerFirstPlateDryRun(arguments_.compiled);
  const providerReceipt = providerReceiptFor(
    arguments_.compiled,
    dryRun.operationDigest,
    execution.result,
    terminal,
  );
  const authoringRoot = await realpath(path.resolve(arguments_.authoringRoot));
  const reviewRoot = path.join(authoringRoot, "images", "review", arguments_.compiled.plateId);
  const reviewImagePath = path.join(reviewRoot, `${arguments_.compiled.plateId}.png`);
  const providerReceiptPath = path.join(reviewRoot, "provider-receipt.json");
  await writeImmutable(reviewImagePath, execution.result.bytes, authoringRoot);
  await writeImmutable(
    providerReceiptPath,
    new TextEncoder().encode(`${canonicalJson(providerReceipt)}\n`),
    authoringRoot,
  );

  return {
    currentRun: {
      durableReplays: execution.resolution === "provider-dispatch" ? 0 : 1,
      providerDispatches: execution.resolution === "provider-dispatch" ? 1 : 0,
    },
    judgment: "PENDING_REVIEW" as const,
    operationDigest: dryRun.operationDigest,
    providerReceipt,
    providerReceiptPath,
    reviewImagePath,
  };
}

export async function acceptReaderFirstPlate(arguments_: {
  authoringRoot: string;
  candidate: ReaderFirstFableCandidate;
  candidateSha256: string;
  folioId: string;
  plateId: ReaderFirstPlateId;
  providerReceiptPath: string;
  reviewImagePath: string;
  trustedPlateEvidence?: readonly TrustedReaderFirstPlateEvidence[];
}) {
  requireDigest(arguments_.candidateSha256, "Fable candidate");
  const definition = readerFirstPlateContract(arguments_.plateId);
  if (arguments_.folioId !== definition.folioId) {
    throw new Error(`plate acceptance folio must be ${definition.folioId}`);
  }
  const authoringRoot = await realpath(path.resolve(arguments_.authoringRoot));
  const [imageBytes, providerReceiptBytes] = await Promise.all([
    readImmutableFile(arguments_.reviewImagePath, authoringRoot),
    readImmutableFile(arguments_.providerReceiptPath, authoringRoot),
  ]);
  const providerReceipt = parseProviderReceipt(providerReceiptBytes);
  await verifyReaderFirstPlateEvidence({
    authoringRoot,
    candidate: arguments_.candidate,
    candidateSha256: arguments_.candidateSha256,
    imageBytes,
    imagePath: arguments_.reviewImagePath,
    plateId: arguments_.plateId,
    providerReceiptBytes,
    providerReceiptPath: arguments_.providerReceiptPath,
    ...(arguments_.trustedPlateEvidence === undefined
      ? {}
      : { trustedPlateEvidence: arguments_.trustedPlateEvidence }),
  });
  if (
    providerReceipt.bookId !== definition.bookId ||
    providerReceipt.folioId !== definition.folioId ||
    providerReceipt.plateId !== arguments_.plateId ||
    providerReceipt.candidateSha256 !== arguments_.candidateSha256
  ) {
    throw new Error("plate acceptance candidate or identity does not match its provider receipt");
  }
  const assetSha256 = sha256(imageBytes);
  if (
    assetSha256 !== providerReceipt.outputSha256 ||
    imageBytes.byteLength !== providerReceipt.byteLength
  ) {
    throw new Error("plate acceptance image does not match its provider output evidence");
  }
  const acceptance: ReaderFirstPlateAcceptance = {
    assetPath: path.resolve(arguments_.reviewImagePath),
    assetSha256,
    bookId: definition.bookId,
    candidateSha256: arguments_.candidateSha256,
    fableImageDirectionSha256: providerReceipt.fableImageDirectionSha256,
    folioId: arguments_.folioId,
    mediaType: "image/png",
    plateId: arguments_.plateId,
    providerOutputSha256: providerReceipt.outputSha256,
    providerReceiptPath: path.resolve(arguments_.providerReceiptPath),
    providerReceiptSha256: sha256(providerReceiptBytes),
    version: 2,
  };
  const acceptancePath = path.join(
    authoringRoot,
    "images",
    "accepted",
    arguments_.plateId,
    "acceptance.json",
  );
  const acceptanceBytes = new TextEncoder().encode(`${canonicalJson(acceptance)}\n`);
  await writeImmutable(acceptancePath, acceptanceBytes, authoringRoot);
  return {
    acceptance,
    acceptancePath,
    acceptanceSha256: sha256(acceptanceBytes),
  };
}

function providerReceiptFor(
  compiled: CompiledReaderFirstPlate,
  operationDigest: string,
  result: ImageProviderResult,
  terminal: CompletedImageOperation,
): ReaderFirstPlateProviderReceipt {
  const core = {
    applicationGuidanceSha256: compiled.applicationGuidanceSha256,
    bookId: compiled.bookId,
    byteLength: result.byteLength,
    candidateSha256: compiled.candidateSha256,
    clientRequestId: result.clientRequestId,
    dispatchDigest: terminal.dispatchDigest,
    estimatedOutputCostMicrousd: result.estimatedOutputCostMicrousd,
    estimatedTotalCostMicrousd: result.estimatedTotalCostMicrousd as number,
    fableImageDirection: compiled.fableImageDirection,
    fableImageDirectionSha256: compiled.fableImageDirectionSha256,
    fixtureDigest: terminal.fixtureDigest,
    folioId: compiled.folioId,
    height: result.height,
    imageRecoveryProof: terminal.imageProof,
    latencyMs: result.latencyMs,
    manifest: compiled.request.manifest,
    manifestSha256: compiled.request.manifestDigest,
    operationDigest,
    outputMediaType: result.mediaType,
    outputSha256: result.digest,
    plateId: compiled.plateId,
    preparedDigest: terminal.preparedDigest,
    pricingVersion: result.pricingVersion,
    providerProcessingMs: result.providerProcessingMs,
    providerRequestId: result.providerRequestId,
    replayRecoveryProof: terminal.replayProof,
    requestedModelSnapshot: result.requestedModelSnapshot,
    resultDigest: terminal.resultDigest,
    schema: PROVIDER_RECEIPT_SCHEMA,
    servedModelEvidence: result.servedModelEvidence,
    totalCostEstimateUnavailableReason: result.totalCostEstimateUnavailableReason as null,
    usage: result.usage,
    width: result.width,
  };
  return { ...core, providerReceiptSha256: digestJson(core) };
}

function parseProviderReceipt(bytes: Uint8Array): ReaderFirstPlateProviderReceipt {
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch (cause) {
    throw new Error("reader-first plate provider receipt is not valid JSON", { cause });
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("reader-first plate provider receipt is not an object");
  }
  if (`${canonicalJson(parsed)}\n` !== new TextDecoder().decode(bytes)) {
    throw new Error("reader-first plate provider receipt is not canonically encoded");
  }
  return parsed as ReaderFirstPlateProviderReceipt;
}

function validateCandidate(
  candidate: ReaderFirstFableCandidate,
  definition: SharedReaderFirstPlateContract,
): void {
  if (
    candidate.version !== 2 ||
    candidate.bookId !== definition.bookId ||
    candidate.folioId !== definition.folioId
  ) {
    throw new Error(
      `candidate folio must be ${definition.bookId}/${definition.folioId} for the requested plate`,
    );
  }
  if (
    candidate.evidence?.model !== "claude-fable-5" ||
    candidate.evidence.effort !== "xhigh" ||
    candidate.evidence.stopReason !== "end_turn"
  ) {
    throw new Error("reader-first plate requires an accepted Fable 5 xhigh end-turn candidate");
  }
  const direction = candidate.output?.imageDirection;
  if (direction === null || direction === undefined) {
    throw new Error("reader-first plate candidate has no image direction");
  }
  for (const key of ["concreteScene", "factLeftToImage", "narrativeJob"] as const) {
    if (typeof direction[key] !== "string" || direction[key].trim().length === 0) {
      throw new Error(`Fable image direction ${key} is empty`);
    }
  }
  for (const key of ["mustRemain", "purposefulChanges", "unresolvedFacts"] as const) {
    if (
      !Array.isArray(direction[key]) ||
      direction[key].some((entry) => typeof entry !== "string" || entry.trim().length === 0)
    ) {
      throw new Error(`Fable image direction ${key} is invalid`);
    }
  }
}

function validateReferences(
  references: readonly ImageReference[],
  rules: SharedReaderFirstPlateContract["referenceRules"],
  plateId: ReaderFirstPlateId,
  trustedPlateEvidence: readonly TrustedReaderFirstPlateEvidence[],
): void {
  if (references.length !== rules.length) {
    throw new Error(`${plateId} requires exactly ${rules.length} ordered reference images`);
  }
  references.forEach((reference, index) => {
    const rule = rules[index];
    if (
      rule === undefined ||
      reference.assetId !== rule.assetId ||
      reference.role !== rule.role ||
      reference.provenance.kind !== rule.kind ||
      reference.provenance.scope !== rule.scope ||
      (rule.digest !== undefined && reference.digest !== rule.digest)
    ) {
      throw new Error(`${plateId} reference ${index + 1} has the wrong scope, provenance, or order`);
    }
    if (rule.kind === "exposed-folio-image") {
      const matches = trustedPlateEvidence.filter((entry) => entry.plateId === rule.sourcePlateId);
      const trusted = matches[0];
      if (
        matches.length !== 1 ||
        trusted === undefined ||
        reference.digest !== trusted.providerOutputSha256 ||
        reference.provenance.evidenceId !== trusted.acceptanceSha256
      ) {
        throw new Error(`${plateId} reference ${index + 1} is not its verified accepted source plate`);
      }
    }
  });
}

function copyReference(reference: ImageReference): ImageReference {
  return {
    ...reference,
    bytes: new Uint8Array(reference.bytes),
    provenance: structuredClone(reference.provenance),
  };
}

function assertResultWithinScope(
  result: ImageProviderResult,
  compiled: CompiledReaderFirstPlate,
): void {
  if (result.estimatedTotalCostMicrousd === null) {
    throw new Error("reader-first plate has incomplete usage-derived cost evidence");
  }
  if (result.estimatedTotalCostMicrousd > C0_IMAGE_MAX_ESTIMATE_MICROUSD) {
    throw new Error("reader-first plate exceeded its written spend cap");
  }
  if (
    result.requestedModelSnapshot !== compiled.request.manifest.requestedModelSnapshot ||
    result.servedModelEvidence !== "unavailable-from-image-api" ||
    result.width !== 1024 ||
    result.height !== 1536 ||
    result.mediaType !== "image/png" ||
    result.byteLength !== result.bytes.byteLength ||
    result.digest !== sha256(result.bytes)
  ) {
    throw new Error("reader-first plate result violates its reviewed request or output contract");
  }
}

async function completedEvidence(
  journal: Pick<FilesystemImageDispatchJournal, "inspect">,
  idempotencyKey: string,
): Promise<CompletedImageOperation> {
  const state = await journal.inspect(idempotencyKey);
  if (state.status !== "completed") {
    throw new Error(`reader-first plate requires completed recovery evidence; operation is ${state.status}`);
  }
  return state.terminal;
}

function validateTerminalEvidence(
  terminal: CompletedImageOperation,
  result: ImageProviderResult,
  compiled: CompiledReaderFirstPlate,
): void {
  if (
    terminal.manifestDigest !== compiled.request.manifestDigest ||
    terminal.clientRequestId !== result.clientRequestId ||
    terminal.imageProof.digest !== result.digest ||
    terminal.imageProof.byteLength !== result.byteLength ||
    terminal.imageProof.mediaType !== result.mediaType
  ) {
    throw new Error("reader-first plate recovery evidence does not match its request and output");
  }
}

function requireDigest(value: string, label: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} SHA-256 is invalid`);
}
