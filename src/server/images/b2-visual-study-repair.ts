import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { FilesystemRecoveryArchive, writeImmutable } from "../assets/filesystem-recovery-archive.js";
import { canonicalJson, digestJson, sha256 } from "../domain/digests.js";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
  type CompletedImageOperation,
  type DurableImageExecution,
} from "./durable-image-dispatch.js";
import {
  B2_TREATMENT_ARCHIVE_ID,
  B2_TREATMENT_MAX_ESTIMATE_MICROUSD,
  B2_TREATMENT_RECOVERY_ROOT,
  B2_TREATMENT_REVIEW_ROOT,
  compileTreatmentCandidates,
  type CompiledTreatmentCandidate,
} from "./b2-visual-study.js";
import { compileImageRequest } from "./image-contract.js";
import { OpenAiImageClient, type ImageProviderResult } from "./openai-image-client.js";

export const B2_REPAIR_SPEND_CAP_USD = 0.1;
export const B2_REPLACEMENT_B_FAILURE = {
  idempotencyKey: "b2-treatment-b-replacement-v1",
  manifestDigest: "c7a51913fce0f7ef30221e19d600577aecf808bd8ed16492df651d3836b3cf49",
  terminalDigest: "a4b2f9659c137e67eb3abd9877d968cd68dfb80dc8a07592d1677ec038c6c0c8",
} as const;
const B2_REPAIR_SCHEMA = "shape-of-time.b2-treatment-replacement.v1" as const;
const ORIGINAL_STUDY_DIGEST = "46ee5049dd7e663769f0f2f769d0759674f1f5202285249a3c0a38e68fda8da3";
const RETAINED_A_OUTPUT_DIGEST = "9b46be15fa3c1b0c944cabdbd5513f72b18186ec87eb314b43375fd99c73a45f";
const RETAINED_A_MANIFEST_DIGEST = "eec4f7841235d40ee546346e83a3645579976a5d3c1978213a44ab717315dfbd";
const RETAINED_A_RECOVERY_RECEIPT = "8f880a7985f16950133ded38036332d742574c732ceceb0d3ad5436ecaf9dec8";
const INITIAL_FAILURES = [
  {
    idempotencyKey: "b2-treatment-b-v1",
    terminalDigest: "30bb1cef5905d90556acbf97396c7cc87cfe6461ce61df67e074814f625b42a6",
    treatmentId: "B",
  },
  {
    idempotencyKey: "b2-treatment-c-v1",
    terminalDigest: "2af994ff3e0afaf5a65f2e249e9629d1b552bcfa9ca8a56fe0f582e65a8b61d9",
    treatmentId: "C",
  },
] as const;

interface RepairArguments {
  acknowledgedIndeterminate?: AcknowledgedIndeterminate;
  confirmSpendCap?: number;
  confirmedStudyDigest?: string;
  dryRun: boolean;
}

interface AcknowledgedIndeterminate {
  idempotencyKey: typeof B2_REPLACEMENT_B_FAILURE.idempotencyKey;
  terminalDigest: string;
}

interface FailedReplacementEvidence {
  code: string;
  disposition: "indeterminate";
  idempotencyKey: string;
  providerRequestId: string | null;
  state: "indeterminate";
  terminalDigest: string;
  treatmentId: "B";
}

export interface B2RepairDependencies {
  dispatcher: Pick<DurableImageDispatcher, "executeWithEvidence">;
  journal: Pick<FilesystemImageDispatchJournal, "inspect">;
}

export interface RetainedCandidateA {
  bytes: Uint8Array;
  evidence: Record<string, unknown> & {
    digest: string;
    fileName: string;
    name: string;
    treatmentId: "A";
  };
}

export function compileRepairCandidates(): CompiledTreatmentCandidate[] {
  return compileTreatmentCandidates()
    .filter(({ treatmentId }) => treatmentId === "B" || treatmentId === "C")
    .map((candidate) => ({
      ...candidate,
      request: compileImageRequest({
        idempotencyKey: `b2-treatment-${candidate.treatmentId.toLowerCase()}-replacement-v1`,
        kind: "generate",
        prompt: candidate.request.exactPrompt,
        promptVersion: candidate.request.manifest.promptVersion,
        purpose: "narrative",
        quality: "medium",
        size: "1536x1024",
      }),
    }));
}

export function repairStudyDryRun() {
  const candidates = compileRepairCandidates();
  const base = {
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    archiveRoot: B2_TREATMENT_RECOVERY_ROOT,
    initialFailures: INITIAL_FAILURES,
    originalStudyDigest: ORIGINAL_STUDY_DIGEST,
    maximumPlannedEstimateMicrousd: B2_TREATMENT_MAX_ESTIMATE_MICROUSD * candidates.length,
    plannedProviderOperations: candidates.length,
    replacements: candidates.map(({ name, request, treatmentId }) => ({
      manifest: request.manifest,
      manifestDigest: request.manifestDigest,
      name,
      treatmentId,
    })),
    retainedCandidate: {
      manifestDigest: RETAINED_A_MANIFEST_DIGEST,
      outputDigest: RETAINED_A_OUTPUT_DIGEST,
      recoveryReceiptDigest: RETAINED_A_RECOVERY_RECEIPT,
      treatmentId: "A",
    },
    reviewRoot: B2_TREATMENT_REVIEW_ROOT,
    schema: B2_REPAIR_SCHEMA,
    spendAuthorizationBoundUsd: B2_REPAIR_SPEND_CAP_USD,
  };
  return { ...base, studyDigest: digestJson(base) };
}

export function readB2RepairArguments(values: string[]): RepairArguments {
  if (values[0] === "--") values = values.slice(1);
  const parsed: RepairArguments = { dryRun: false };
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
    else if (key === "--acknowledge-indeterminate") {
      if (parsed.acknowledgedIndeterminate !== undefined) {
        throw new Error("B2 repair accepts only one indeterminate acknowledgement");
      }
      parsed.acknowledgedIndeterminate = parseIndeterminateAcknowledgement(value);
    }
    else throw new Error(`unknown B2 repair argument: ${key}`);
    index += 1;
  }
  if (parsed.dryRun) {
    if (Object.keys(parsed).length !== 1) throw new Error("B2 repair dry run accepts no live arguments");
    return parsed;
  }
  if (parsed.confirmSpendCap !== B2_REPAIR_SPEND_CAP_USD) {
    throw new Error(`B2 repair requires --confirm-spend-cap ${B2_REPAIR_SPEND_CAP_USD.toFixed(2)}`);
  }
  const exactDigest = repairStudyDryRun().studyDigest;
  if (parsed.confirmedStudyDigest !== exactDigest) {
    throw new Error(`B2 repair requires --confirm-study-digest ${exactDigest}`);
  }
  return parsed;
}

export async function runB2RepairStudy(
  arguments_: B2RepairDependencies & {
    acknowledgedIndeterminate?: AcknowledgedIndeterminate;
    archiveId: string;
    retainedA: RetainedCandidateA;
    reviewRoot: string;
  },
) {
  if (arguments_.archiveId !== B2_TREATMENT_ARCHIVE_ID) {
    throw new Error(`B2 repair is fixed to archive ${B2_TREATMENT_ARCHIVE_ID}`);
  }
  validateRetainedA(arguments_.retainedA);
  const reviewRoot = path.resolve(arguments_.reviewRoot);
  await mkdir(reviewRoot, { recursive: true });
  await writeImmutable(
    path.join(reviewRoot, arguments_.retainedA.evidence.fileName),
    arguments_.retainedA.bytes,
    reviewRoot,
  );
  await writeImmutable(
    path.join(reviewRoot, "A-observed-material.json"),
    new TextEncoder().encode(`${canonicalJson(arguments_.retainedA.evidence)}\n`),
    reviewRoot,
  );

  if (arguments_.acknowledgedIndeterminate !== undefined) {
    const acknowledged = await arguments_.journal.inspect(arguments_.acknowledgedIndeterminate.idempotencyKey);
    if (acknowledged.status !== "indeterminate") {
      throw new Error("acknowledged B2 replacement operation is not durably indeterminate");
    }
    if (digestJson(acknowledged.terminal) !== arguments_.acknowledgedIndeterminate.terminalDigest) {
      throw new Error("acknowledged B2 replacement terminal digest does not match durable evidence");
    }
    if (acknowledged.operation.manifestDigest !== B2_REPLACEMENT_B_FAILURE.manifestDigest) {
      throw new Error("acknowledged B2 replacement manifest does not match the audited failure lineage");
    }
  }

  let cumulativeEstimatedCostMicrousd = 0;
  let maximumAuthorizationConsumedMicrousd = 0;
  const completed: ReturnType<typeof summarizeRepairCandidate>[] = [];
  const failed: FailedReplacementEvidence[] = [];
  const resolutions: DurableImageExecution["resolution"][] = [];
  for (const candidate of compileRepairCandidates()) {
    const idempotencyKey = candidate.request.manifest.idempotencyKey;
    const stateBefore = await arguments_.journal.inspect(idempotencyKey);
    if (
      candidate.treatmentId === "B" &&
      stateBefore.status === "indeterminate" &&
      arguments_.acknowledgedIndeterminate?.idempotencyKey === idempotencyKey
    ) {
      maximumAuthorizationConsumedMicrousd += B2_TREATMENT_MAX_ESTIMATE_MICROUSD;
      if (maximumAuthorizationConsumedMicrousd > B2_REPAIR_SPEND_CAP_USD * 1_000_000) {
        throw new Error("acknowledged B2 replacement consumes the remaining spend cap");
      }
      failed.push({
        code: stateBefore.terminal.code,
        disposition: "indeterminate",
        idempotencyKey,
        providerRequestId: stateBefore.terminal.providerRequestId,
        state: "indeterminate",
        terminalDigest: digestJson(stateBefore.terminal),
        treatmentId: "B",
      });
      continue;
    }
    if (
      (stateBefore.status === "absent" || stateBefore.status === "prepared") &&
      maximumAuthorizationConsumedMicrousd + B2_TREATMENT_MAX_ESTIMATE_MICROUSD >
        B2_REPAIR_SPEND_CAP_USD * 1_000_000
    ) {
      throw new Error(`B2 replacement ${candidate.treatmentId} would exceed the written spend cap`);
    }
    const execution = await arguments_.dispatcher.executeWithEvidence(candidate.request);
    const result = execution.result;
    if (result.estimatedTotalCostMicrousd === null) {
      throw new Error(`B2 replacement ${candidate.treatmentId} has incomplete usage-derived cost evidence`);
    }
    cumulativeEstimatedCostMicrousd += result.estimatedTotalCostMicrousd;
    maximumAuthorizationConsumedMicrousd += result.estimatedTotalCostMicrousd;
    if (maximumAuthorizationConsumedMicrousd > B2_REPAIR_SPEND_CAP_USD * 1_000_000) {
      throw new Error("B2 replacement study exceeded the written spend cap");
    }
    const terminal = await completedEvidence(arguments_.journal, candidate.request.manifest.idempotencyKey);
    const evidence = summarizeRepairCandidate(candidate, result, terminal);
    await writeImmutable(path.join(reviewRoot, evidence.fileName), result.bytes, reviewRoot);
    await writeImmutable(
      path.join(reviewRoot, `${candidate.fileStem}.json`),
      new TextEncoder().encode(`${canonicalJson(evidence)}\n`),
      reviewRoot,
    );
    completed.push(evidence);
    resolutions.push(execution.resolution);
  }

  const dryRun = repairStudyDryRun();
  const stableBase = {
    archiveId: arguments_.archiveId,
    candidates: [arguments_.retainedA.evidence, ...completed],
    cumulativeReplacementEstimatedCostMicrousd: cumulativeEstimatedCostMicrousd,
    failedCandidates: failed,
    initialFailures: INITIAL_FAILURES,
    judgment: failed.length === 0 ? "PENDING_OWNER_REVIEW" : "INCOMPLETE_REPLACEMENT_SET",
    maximumAuthorizationConsumedMicrousd,
    originalStudyDigest: ORIGINAL_STUDY_DIGEST,
    repairStudyDigest: dryRun.studyDigest,
    schema: B2_REPAIR_SCHEMA,
    spendAuthorizationBoundUsd: B2_REPAIR_SPEND_CAP_USD,
  };
  const report = { ...stableBase, reportDigest: digestJson(stableBase) };
  if (failed.length === 0) {
    await writeImmutable(
      path.join(reviewRoot, "study.json"),
      new TextEncoder().encode(`${canonicalJson(report)}\n`),
      reviewRoot,
    );
    await writeImmutable(
      path.join(reviewRoot, "index.html"),
      new TextEncoder().encode(renderContactSheet(dryRun.studyDigest)),
      reviewRoot,
    );
  }
  return {
    ...report,
    currentRun: {
      acknowledgedIndeterminate: failed.length,
      archiveReconciliations: resolutions.filter((resolution) => resolution === "archive-reconciliation").length,
      durableReplays: resolutions.filter((resolution) => resolution === "durable-replay").length,
      providerDispatches: resolutions.filter((resolution) => resolution === "provider-dispatch").length,
    },
  };
}

async function runLive(arguments_: RepairArguments & { confirmSpendCap: number; confirmedStudyDigest: string }) {
  if (arguments_.confirmedStudyDigest !== repairStudyDryRun().studyDigest) {
    throw new Error("B2 repair live execution is not bound to the current dry run");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey === undefined || apiKey.trim().length === 0) throw new Error("OPENAI_API_KEY is required");
  const archive = new FilesystemRecoveryArchive({
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    root: B2_TREATMENT_RECOVERY_ROOT,
  });
  const journal = new FilesystemImageDispatchJournal({ archive });
  await verifyInitialLineage(journal);
  const retainedA = await loadRetainedA();
  const dispatcher = new DurableImageDispatcher({
    archive,
    client: new OpenAiImageClient({ apiKey }),
    journal,
  });
  return runB2RepairStudy({
    ...(arguments_.acknowledgedIndeterminate === undefined
      ? {}
      : { acknowledgedIndeterminate: arguments_.acknowledgedIndeterminate }),
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    dispatcher,
    journal,
    retainedA,
    reviewRoot: B2_TREATMENT_REVIEW_ROOT,
  });
}

function parseIndeterminateAcknowledgement(value: string): AcknowledgedIndeterminate {
  const matched = /^(b2-treatment-b-replacement-v1):([a-f0-9]{64})$/.exec(value);
  if (matched === null || matched[1] === undefined || matched[2] === undefined) {
    throw new Error(
      "B2 repair indeterminate acknowledgement must be b2-treatment-b-replacement-v1:<terminal-digest>",
    );
  }
  if (matched[2] !== B2_REPLACEMENT_B_FAILURE.terminalDigest) {
    throw new Error("B2 repair acknowledgement does not match the audited replacement-B terminal digest");
  }
  return { idempotencyKey: matched[1] as AcknowledgedIndeterminate["idempotencyKey"], terminalDigest: matched[2] };
}

async function verifyInitialLineage(journal: Pick<FilesystemImageDispatchJournal, "inspect">): Promise<void> {
  const retained = await journal.inspect("b2-treatment-a-v1");
  if (
    retained.status !== "completed" ||
    retained.terminal.manifestDigest !== RETAINED_A_MANIFEST_DIGEST ||
    retained.terminal.imageProof.digest !== RETAINED_A_OUTPUT_DIGEST ||
    retained.terminal.imageProof.receiptDigest !== RETAINED_A_RECOVERY_RECEIPT
  ) {
    throw new Error("B2 repair requires the exact completed Treatment A recovery proof");
  }
  for (const failure of INITIAL_FAILURES) {
    const state = await journal.inspect(failure.idempotencyKey);
    if (state.status !== "indeterminate" || digestJson(state.terminal) !== failure.terminalDigest) {
      throw new Error(`B2 repair precursor ${failure.treatmentId} does not match its immutable terminal`);
    }
  }
}

async function loadRetainedA(): Promise<RetainedCandidateA> {
  const bytes = new Uint8Array(await readFile(path.join(B2_TREATMENT_REVIEW_ROOT, "A-observed-material.png")));
  const evidence = JSON.parse(
    await readFile(path.join(B2_TREATMENT_REVIEW_ROOT, "A-observed-material.json"), "utf8"),
  ) as RetainedCandidateA["evidence"];
  const retained = { bytes, evidence };
  assertRetainedAProductionIdentity(retained);
  return retained;
}

export function assertRetainedAProductionIdentity(retained: RetainedCandidateA): void {
  validateRetainedA(retained);
  if (
    sha256(retained.bytes) !== RETAINED_A_OUTPUT_DIGEST ||
    retained.evidence.digest !== RETAINED_A_OUTPUT_DIGEST ||
    retained.evidence.manifestDigest !== RETAINED_A_MANIFEST_DIGEST ||
    (retained.evidence.imageRecoveryProof as { receiptDigest?: unknown } | undefined)?.receiptDigest !==
      RETAINED_A_RECOVERY_RECEIPT
  ) {
    throw new Error("B2 retained Treatment A does not match its fixed output digest and recovery lineage");
  }
}

function validateRetainedA(retained: RetainedCandidateA): void {
  if (
    retained.evidence.treatmentId !== "A" ||
    retained.evidence.fileName !== "A-observed-material.png" ||
    retained.evidence.digest !== sha256(retained.bytes)
  ) {
    throw new Error("B2 retained Treatment A bytes and evidence do not agree");
  }
}

function summarizeRepairCandidate(
  candidate: CompiledTreatmentCandidate,
  result: ImageProviderResult,
  terminal: CompletedImageOperation,
) {
  return {
    byteLength: result.byteLength,
    digest: result.digest,
    estimatedOutputCostMicrousd: result.estimatedOutputCostMicrousd,
    estimatedTotalCostMicrousd: result.estimatedTotalCostMicrousd,
    fileName: `${candidate.fileStem}.png`,
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
    treatmentId: candidate.treatmentId,
    usage: result.usage,
  };
}

async function completedEvidence(
  journal: Pick<FilesystemImageDispatchJournal, "inspect">,
  idempotencyKey: string,
): Promise<CompletedImageOperation> {
  const state = await journal.inspect(idempotencyKey);
  if (state.status !== "completed") throw new Error(`B2 replacement did not complete durably: ${state.status}`);
  return state.terminal;
}

function renderContactSheet(studyDigest: string): string {
  const cards = [
    ["A", "A-observed-material.png", "Observed material illustration"],
    ["B", "B-inked-reportage.png", "Inked reportage with transparent color"],
    ["C", "C-cut-paper-print.png", "Cut-paper assemblage with screenprinted drawing"],
  ] as const;
  const renderCards = (size: string) =>
    cards
      .map(
        ([id, file, name]) =>
          `<figure><img src="${file}" alt="Unapproved Treatment ${id} at ${size}: ${name}"><figcaption><strong>Treatment ${id}</strong><br>${name}</figcaption></figure>`,
      )
      .join("");
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shape of Time — B2 medium comparison</title>
<style>
:root{font-family:Georgia,serif;background:#e9e5dc;color:#201e1a}body{margin:0;padding:32px}header,h2{max-width:70ch;margin:0 auto 24px}h1{font-size:1.6rem;font-weight:500}p,figcaption{line-height:1.45}.scroll{overflow-x:auto;padding:4px 0 18px}.grid{display:grid;gap:24px;margin:0 auto}.desktop{grid-template-columns:repeat(3,minmax(360px,1fr));min-width:1128px}.mobile{grid-template-columns:repeat(3,280px);width:max-content}figure{margin:0;padding:14px;background:#f8f5ed;box-shadow:0 2px 18px #0002}img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover}figcaption{padding:12px 2px 2px}footer{font:12px ui-monospace,monospace;overflow-wrap:anywhere}
</style><body><header><h1>B2 shared-medium comparison</h1><p>Treatment A is the retained original. Treatments B and C are new operations replacing indeterminate responses lost to the repaired local base64 validator. All three remain unapproved; only medium-level qualities may be selected.</p></header>
<section><h2>Desktop reading-size comparison</h2><div class="scroll"><div class="grid desktop">${renderCards("desktop reading size")}</div></div></section>
<section><h2>Mobile reading-size comparison</h2><div class="scroll"><div class="grid mobile">${renderCards("mobile reading size")}</div></div></section>
<footer>Replacement study digest: ${studyDigest}</footer></body></html>`;
}

async function main(): Promise<void> {
  const arguments_ = readB2RepairArguments(process.argv.slice(2));
  if (arguments_.dryRun) {
    process.stdout.write(`${canonicalJson({ mode: "dry-run", ...repairStudyDryRun() })}\n`);
    return;
  }
  const report = await runLive(
    arguments_ as RepairArguments & { confirmSpendCap: number; confirmedStudyDigest: string },
  );
  process.stdout.write(`${canonicalJson({ mode: "live", ...report })}\n`);
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) await main();
