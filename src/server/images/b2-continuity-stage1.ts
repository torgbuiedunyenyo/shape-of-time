import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { FilesystemRecoveryArchive, writeImmutable } from "../assets/filesystem-recovery-archive.js";
import { canonicalJson, digestJson } from "../domain/digests.js";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
  type CompletedImageOperation,
} from "./durable-image-dispatch.js";
import { compileImageRequest, type CompiledImageRequest } from "./image-contract.js";
import { OpenAiImageClient, type ImageProviderResult } from "./openai-image-client.js";

export const B2_CONTINUITY_ARCHIVE_ID = "b2-visual-study-2026-07";
export const B2_CONTINUITY_RECOVERY_ROOT = "/Users/ratpartyserver/git/shape-of-time-b2-recovery";
export const B2_CONTINUITY_REVIEW_ROOT =
  "/Users/ratpartyserver/git/shape-of-time-b2-review/continuity-v1";
export const B2_CONTINUITY_STAGE1_MAX_ESTIMATE_MICROUSD = 50_000;
export const B2_CONTINUITY_STAGE1_SPEND_CAP_USD = 0.05;
const B2_CONTINUITY_STAGE1_PROMPT_VERSION = "b2-continuity-stage1-root-payment-v1";
const B2_CONTINUITY_STAGE1_SCHEMA = "shape-of-time.b2-continuity-stage1.v1" as const;
const REVIEW_IMAGE_FILE_NAME = "01-root-payment.png";
const REVIEW_REPORT_FILE_NAME = "stage-1.json";

/**
 * Stage 1 of the Treatment B continuity sequence: one text-only candidate plate for Root Folio 02,
 * Payment. It proposes candidate Jay and Tan identities and one root-lineage realization of Clef.
 * Nothing here is an anchor: every crop and every reuse of this image requires later human
 * approval, and the sequence's other seven images are separately authorized stages.
 */
const STAGE1_PROMPT = [
  "One opaque portrait adult illustrated-novel plate.",
  "",
  "Narrative job: the moment a payment fails between two people from different temporal " +
    "coordinates, in an ordinary Oakland corner shop at the evening rush. Depict Jay, the clerk, " +
    "and Tan, the visitor, as two specific young adults whose faces and bearing could be " +
    "recognized again in later plates. Jay has turned his physical phone toward Tan to take " +
    "payment; Tan waits for an interface action this phone cannot perform. The mismatch must be " +
    "legible through their hands, the phone, their faces and glances, the waiting queue, and the " +
    "distance their bodies keep in the narrow space. Jay has already recognized the mismatch and " +
    "is quietly moving to spare Tan public embarrassment, passing the small purchase to her as a " +
    "gift.",
  "",
  "Scene and relationship: end of a working day behind a worn shop counter that serves both " +
    "neighborhood regulars and visitors from wealthier temporal coordinates. Tan looks almost at " +
    "home and slightly wrong in a dozen practical ways; she is embarrassed, not helpless. Jay is " +
    "competent on his own ground, curious about her, already a little attracted. The queue " +
    "behind her is ordinary and impatient. The purchase is Clef: realize Clef for this root " +
    "lineage without being told what Clef is — do not assume it is food, drink, drug, " +
    "preparation, or package; give it whatever specific, ordinary, shelf-real presence the scene " +
    "needs.",
  "",
  "Medium (binding): varied observational ink; restrained transparent watercolor washes; sparse " +
    "colored pencil; visible tactile paper, wear, and repair; natural perspective; concrete " +
    "faces and hands.",
  "",
  "Facts to discover: the image must add material and spatial facts beyond the prose — through " +
    "ordinary shop wear, repair, access, labor, waiting bodies, stock, and arrangement — rather " +
    "than decorating or paraphrasing it. Let the shop's economic arrangement show without " +
    "explaining it.",
  "",
  "Must remain open: do not predefine race or ethnicity, precise facial features, the form of " +
    "Clef, the shop plan, a universal future style, or the incidental palette. No choice in this " +
    "candidate becomes global canon; every detail stays local to this plate until a human " +
    "approves it as a reference.",
  "",
  "Reject: comic panels, graphic-novel frames, speech balloons, urban-sketch prettification, " +
    "generic sci-fi or future-city shorthand, readable text, logos, captions, portals, glowing " +
    "or cosmic time effects, and duplicate people.",
].join("\n");

interface B2ContinuityStage1Arguments {
  confirmSpendCap?: number;
  confirmedStudyDigest?: string;
  dryRun: boolean;
}

export interface B2ContinuityStage1Dependencies {
  dispatcher: Pick<DurableImageDispatcher, "executeWithEvidence">;
  journal: Pick<FilesystemImageDispatchJournal, "inspect">;
}

export interface CompiledContinuityStage1Candidate {
  fileStem: "01-root-payment";
  name: string;
  request: CompiledImageRequest;
}

export function compileB2ContinuityStage1Candidate(): CompiledContinuityStage1Candidate {
  return {
    fileStem: "01-root-payment",
    name: "Root F02 Payment — candidate Jay, Tan, and a root-lineage Clef",
    request: compileImageRequest({
      idempotencyKey: "b2-continuity-root-payment-v1",
      kind: "generate",
      prompt: STAGE1_PROMPT,
      promptVersion: B2_CONTINUITY_STAGE1_PROMPT_VERSION,
      purpose: "narrative",
      quality: "medium",
      size: "1024x1536",
    }),
  };
}

export function b2ContinuityStage1DryRun() {
  const candidate = compileB2ContinuityStage1Candidate();
  const base = {
    archiveId: B2_CONTINUITY_ARCHIVE_ID,
    archiveRoot: B2_CONTINUITY_RECOVERY_ROOT,
    candidate: {
      fileStem: candidate.fileStem,
      manifest: candidate.request.manifest,
      manifestDigest: candidate.request.manifestDigest,
      name: candidate.name,
    },
    maximumPlannedEstimateMicrousd: B2_CONTINUITY_STAGE1_MAX_ESTIMATE_MICROUSD,
    plannedProviderOperations: 1,
    reviewImageFileName: REVIEW_IMAGE_FILE_NAME,
    reviewRoot: B2_CONTINUITY_REVIEW_ROOT,
    schema: B2_CONTINUITY_STAGE1_SCHEMA,
    spendAuthorizationBoundUsd: B2_CONTINUITY_STAGE1_SPEND_CAP_USD,
  };
  return { ...base, studyDigest: digestJson(base) };
}

export function readB2ContinuityStage1Arguments(values: string[]): B2ContinuityStage1Arguments {
  if (values[0] === "--") values = values.slice(1);
  const parsed: B2ContinuityStage1Arguments = { dryRun: false };
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (key === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    const value = values[index + 1];
    if (value === undefined) throw new Error(`missing value for ${key}`);
    if (key === "--confirm-spend-cap") parsed.confirmSpendCap = Number(value);
    else if (key === "--confirm-study-digest") parsed.confirmedStudyDigest = value;
    else throw new Error(`unknown B2 continuity Stage 1 argument: ${key}`);
    index += 1;
  }
  if (parsed.dryRun) {
    if (Object.keys(parsed).length !== 1) {
      throw new Error("B2 continuity Stage 1 dry run accepts no live arguments");
    }
    return parsed;
  }
  if (parsed.confirmSpendCap !== B2_CONTINUITY_STAGE1_SPEND_CAP_USD) {
    throw new Error(
      `B2 continuity Stage 1 requires its literal written spend cap: --confirm-spend-cap ` +
        `${B2_CONTINUITY_STAGE1_SPEND_CAP_USD.toFixed(2)}`,
    );
  }
  const exactDigest = b2ContinuityStage1DryRun().studyDigest;
  if (parsed.confirmedStudyDigest !== exactDigest) {
    throw new Error(
      "B2 continuity Stage 1 requires the exact inspected dry-run study digest: " +
        `--confirm-study-digest ${exactDigest}`,
    );
  }
  return parsed;
}

export async function runB2ContinuityStage1(arguments_: B2ContinuityStage1Dependencies & {
  archiveId: string;
  reviewRoot: string;
}) {
  if (arguments_.archiveId !== B2_CONTINUITY_ARCHIVE_ID) {
    throw new Error(`B2 continuity Stage 1 is fixed to archive ${B2_CONTINUITY_ARCHIVE_ID}`);
  }
  const candidate = compileB2ContinuityStage1Candidate();
  const idempotencyKey = candidate.request.manifest.idempotencyKey;

  const stateBefore = await arguments_.journal.inspect(idempotencyKey);
  if (
    (stateBefore.status === "absent" || stateBefore.status === "prepared") &&
    B2_CONTINUITY_STAGE1_MAX_ESTIMATE_MICROUSD >
      B2_CONTINUITY_STAGE1_SPEND_CAP_USD * 1_000_000
  ) {
    throw new Error("B2 continuity Stage 1 would exceed its written spend cap");
  }

  const execution = await arguments_.dispatcher.executeWithEvidence(candidate.request);
  const result = execution.result;
  if (result.estimatedTotalCostMicrousd === null) {
    throw new Error(
      "B2 continuity Stage 1 has incomplete usage-derived cost evidence; no review material is published",
    );
  }
  if (result.estimatedTotalCostMicrousd > B2_CONTINUITY_STAGE1_SPEND_CAP_USD * 1_000_000) {
    throw new Error(
      "B2 continuity Stage 1 exceeded its written spend cap; no review material is published",
    );
  }

  const terminal = await completedRecoveryEvidence(arguments_.journal, idempotencyKey);
  if (
    terminal.imageProof.digest !== result.digest ||
    terminal.imageProof.byteLength !== result.byteLength
  ) {
    throw new Error(
      "B2 continuity Stage 1 completed recovery evidence does not match the returned output",
    );
  }

  const dryRun = b2ContinuityStage1DryRun();
  const reportBase = {
    archiveId: arguments_.archiveId,
    candidate: summarizeCandidate(candidate, result, terminal),
    estimatedTotalCostMicrousd: result.estimatedTotalCostMicrousd,
    judgment: "PENDING_OWNER_CONTINUITY_REVIEW",
    plannedProviderOperations: 1,
    schema: B2_CONTINUITY_STAGE1_SCHEMA,
    spendAuthorizationBoundUsd: B2_CONTINUITY_STAGE1_SPEND_CAP_USD,
    studyDigest: dryRun.studyDigest,
  };
  const report = { ...reportBase, reportDigest: digestJson(reportBase) };

  const reviewRoot = path.resolve(arguments_.reviewRoot);
  await mkdir(reviewRoot, { recursive: true });
  await writeImmutable(path.join(reviewRoot, REVIEW_IMAGE_FILE_NAME), result.bytes, reviewRoot);
  await writeImmutable(
    path.join(reviewRoot, REVIEW_REPORT_FILE_NAME),
    new TextEncoder().encode(`${canonicalJson(report)}\n`),
    reviewRoot,
  );

  return {
    ...report,
    currentRun: {
      durableReplays: execution.resolution === "durable-replay" ? 1 : 0,
      providerDispatches: execution.resolution === "provider-dispatch" ? 1 : 0,
    },
  };
}

function summarizeCandidate(
  candidate: CompiledContinuityStage1Candidate,
  result: ImageProviderResult,
  terminal: CompletedImageOperation,
) {
  return {
    byteLength: result.byteLength,
    digest: result.digest,
    estimatedOutputCostMicrousd: result.estimatedOutputCostMicrousd,
    estimatedTotalCostMicrousd: result.estimatedTotalCostMicrousd,
    fileName: REVIEW_IMAGE_FILE_NAME,
    imageRecoveryProof: terminal.imageProof,
    latencyMs: result.latencyMs,
    manifest: candidate.request.manifest,
    manifestDigest: candidate.request.manifestDigest,
    name: candidate.name,
    providerProcessingMs: result.providerProcessingMs,
    providerRequestId: result.providerRequestId,
    replayRecoveryProof: terminal.replayProof,
    requestedModelSnapshot: result.requestedModelSnapshot,
    servedModelEvidence: result.servedModelEvidence,
    usage: result.usage,
  };
}

async function completedRecoveryEvidence(
  journal: Pick<FilesystemImageDispatchJournal, "inspect">,
  idempotencyKey: string,
): Promise<CompletedImageOperation> {
  const state = await journal.inspect(idempotencyKey);
  if (state.status !== "completed") {
    throw new Error(
      `B2 continuity Stage 1 requires completed recovery evidence before review material is ` +
        `written; operation ${idempotencyKey} is ${state.status}`,
    );
  }
  return state.terminal;
}

function assertExternalRoot(root: string, label: string): void {
  if (!path.isAbsolute(root) || path.resolve(root) === path.parse(path.resolve(root)).root) {
    throw new Error(`B2 continuity Stage 1 ${label} root must be a bounded absolute directory`);
  }
  if (rootsOverlap(root, process.cwd())) {
    throw new Error(`B2 continuity Stage 1 ${label} root must be outside the project worktree`);
  }
}

function rootsOverlap(left: string, right: string): boolean {
  return isWithin(left, right) || isWithin(right, left);
}

function isWithin(candidate: string, parent: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

async function runLive(
  arguments_: B2ContinuityStage1Arguments & { confirmSpendCap: number; confirmedStudyDigest: string },
) {
  if (arguments_.confirmedStudyDigest !== b2ContinuityStage1DryRun().studyDigest) {
    throw new Error("B2 continuity Stage 1 live execution is not bound to the current dry run");
  }
  assertExternalRoot(B2_CONTINUITY_RECOVERY_ROOT, "recovery");
  assertExternalRoot(B2_CONTINUITY_REVIEW_ROOT, "review");
  if (rootsOverlap(B2_CONTINUITY_RECOVERY_ROOT, B2_CONTINUITY_REVIEW_ROOT)) {
    throw new Error("B2 continuity Stage 1 recovery and review roots must be non-overlapping");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey === undefined || apiKey.trim().length === 0) throw new Error("OPENAI_API_KEY is required");
  const archive = new FilesystemRecoveryArchive({
    archiveId: B2_CONTINUITY_ARCHIVE_ID,
    root: B2_CONTINUITY_RECOVERY_ROOT,
  });
  const journal = new FilesystemImageDispatchJournal({ archive });
  const dispatcher = new DurableImageDispatcher({
    archive,
    client: new OpenAiImageClient({ apiKey }),
    journal,
  });
  return runB2ContinuityStage1({
    archiveId: B2_CONTINUITY_ARCHIVE_ID,
    dispatcher,
    journal,
    reviewRoot: B2_CONTINUITY_REVIEW_ROOT,
  });
}

async function main(): Promise<void> {
  const arguments_ = readB2ContinuityStage1Arguments(process.argv.slice(2));
  if (arguments_.dryRun) {
    process.stdout.write(`${canonicalJson({ mode: "dry-run", ...b2ContinuityStage1DryRun() })}\n`);
    return;
  }
  const report = await runLive(
    arguments_ as B2ContinuityStage1Arguments & {
      confirmSpendCap: number;
      confirmedStudyDigest: string;
    },
  );
  process.stdout.write(`${canonicalJson({ mode: "live", ...report })}\n`);
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) await main();
