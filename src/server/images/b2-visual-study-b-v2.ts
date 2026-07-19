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
import { compileRepairCandidates } from "./b2-visual-study-repair.js";
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

export const B2_B_V2_SPEND_CAP_USD = 0.05;
const B2_B_V2_SCHEMA = "shape-of-time.b2-treatment-b-v2.v1" as const;

interface B2BV2Arguments {
  confirmSpendCap?: number;
  confirmedStudyDigest?: string;
  dryRun: boolean;
}

interface CompletedLineageEvidence {
  idempotencyKey: string;
  manifestDigest: string;
  outputDigest: string;
  outputReceiptDigest: string;
  state: "completed";
  terminalDigest: string;
}

interface FailedLineageEvidence {
  idempotencyKey: string;
  manifestDigest: string;
  state: "indeterminate";
  terminalDigest: string;
}

export interface B2BV2Lineage {
  failures: FailedLineageEvidence[];
  retained: CompletedLineageEvidence[];
  schema: "shape-of-time.b2-treatment-b-v2-lineage.v1";
}

export const PRODUCTION_B2_B_V2_LINEAGE: B2BV2Lineage = {
  failures: [
    {
      idempotencyKey: "b2-treatment-b-v1",
      manifestDigest: "8cad92e0696f8f056d2f4c47bb2f5b070a6a5ba13f7aa0f35054bf9586efc0e1",
      state: "indeterminate",
      terminalDigest: "30bb1cef5905d90556acbf97396c7cc87cfe6461ce61df67e074814f625b42a6",
    },
    {
      idempotencyKey: "b2-treatment-c-v1",
      manifestDigest: "c4aa62a9dcd83f4f8349c42201c84ab24b16b498e10b7cce37a208ae53a63412",
      state: "indeterminate",
      terminalDigest: "2af994ff3e0afaf5a65f2e249e9629d1b552bcfa9ca8a56fe0f582e65a8b61d9",
    },
    {
      idempotencyKey: "b2-treatment-b-replacement-v1",
      manifestDigest: "c7a51913fce0f7ef30221e19d600577aecf808bd8ed16492df651d3836b3cf49",
      state: "indeterminate",
      terminalDigest: "a4b2f9659c137e67eb3abd9877d968cd68dfb80dc8a07592d1677ec038c6c0c8",
    },
  ],
  retained: [
    {
      idempotencyKey: "b2-treatment-a-v1",
      manifestDigest: "eec4f7841235d40ee546346e83a3645579976a5d3c1978213a44ab717315dfbd",
      outputDigest: "9b46be15fa3c1b0c944cabdbd5513f72b18186ec87eb314b43375fd99c73a45f",
      outputReceiptDigest: "8f880a7985f16950133ded38036332d742574c732ceceb0d3ad5436ecaf9dec8",
      state: "completed",
      terminalDigest: "301f5326c0d58e7720f670dda980579bfd6b3b174e5fd5eef492a3d7dfbafa3f",
    },
    {
      idempotencyKey: "b2-treatment-c-replacement-v1",
      manifestDigest: "af892d84571fafad68c08f0a0b4661fd5300d1048a5bccb129c2a72d2928e392",
      outputDigest: "93498bd84304576bfa3a9f2886ae6fb69a3d45a74fa2dc092602e204e1483d44",
      outputReceiptDigest: "36eff8ff3a192ccafba343bce56be7781d1bdc0561f4f35d2d95eeaff6e2b23a",
      state: "completed",
      terminalDigest: "4f15231ca02794264449db5bd21fdef5155865e1c0437b4cb8e5c2e9a4704f8c",
    },
  ],
  schema: "shape-of-time.b2-treatment-b-v2-lineage.v1",
};

export function compileB2BV2Candidate(): CompiledTreatmentCandidate {
  const original = compileTreatmentCandidates().find(({ treatmentId }) => treatmentId === "B");
  if (original === undefined) throw new Error("B2 Treatment B definition is missing");
  return {
    ...original,
    request: compileImageRequest({
      idempotencyKey: "b2-treatment-b-replacement-v2-durable-base64",
      kind: "generate",
      prompt: original.request.exactPrompt,
      promptVersion: original.request.manifest.promptVersion,
      purpose: "narrative",
      quality: "medium",
      size: "1536x1024",
    }),
  };
}

export function b2BV2DryRun() {
  const candidate = compileB2BV2Candidate();
  const base = {
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    archiveRoot: B2_TREATMENT_RECOVERY_ROOT,
    candidate: {
      manifest: candidate.request.manifest,
      manifestDigest: candidate.request.manifestDigest,
      name: candidate.name,
      treatmentId: candidate.treatmentId,
    },
    expectedLineage: PRODUCTION_B2_B_V2_LINEAGE,
    maximumPlannedEstimateMicrousd: B2_TREATMENT_MAX_ESTIMATE_MICROUSD,
    plannedProviderOperations: 1,
    reviewRoot: B2_TREATMENT_REVIEW_ROOT,
    schema: B2_B_V2_SCHEMA,
    spendAuthorizationBoundUsd: B2_B_V2_SPEND_CAP_USD,
  };
  return { ...base, studyDigest: digestJson(base) };
}

export function readB2BV2Arguments(values: string[]): B2BV2Arguments {
  if (values[0] === "--") values = values.slice(1);
  const parsed: B2BV2Arguments = { dryRun: false };
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
    else throw new Error(`unknown B2 Treatment B v2 argument: ${key}`);
    index += 1;
  }
  if (parsed.dryRun) {
    if (Object.keys(parsed).length !== 1) throw new Error("B2 Treatment B v2 dry run accepts no live arguments");
    return parsed;
  }
  if (parsed.confirmSpendCap !== B2_B_V2_SPEND_CAP_USD) {
    throw new Error(`B2 Treatment B v2 requires --confirm-spend-cap ${B2_B_V2_SPEND_CAP_USD.toFixed(2)}`);
  }
  const exactDigest = b2BV2DryRun().studyDigest;
  if (parsed.confirmedStudyDigest !== exactDigest) {
    throw new Error(`B2 Treatment B v2 requires --confirm-study-digest ${exactDigest}`);
  }
  return parsed;
}

export async function captureB2BV2Lineage(
  journal: Pick<FilesystemImageDispatchJournal, "inspect">,
): Promise<B2BV2Lineage> {
  const failureKeys = [
    "b2-treatment-b-v1",
    "b2-treatment-c-v1",
    "b2-treatment-b-replacement-v1",
  ] as const;
  const retainedKeys = ["b2-treatment-a-v1", "b2-treatment-c-replacement-v1"] as const;
  const failures: FailedLineageEvidence[] = [];
  for (const idempotencyKey of failureKeys) {
    const state = await journal.inspect(idempotencyKey);
    if (state.status !== "indeterminate") {
      throw new Error(`B2 Treatment B v2 prerequisite ${idempotencyKey} is not durably indeterminate`);
    }
    failures.push({
      idempotencyKey,
      manifestDigest: state.operation.manifestDigest,
      state: "indeterminate",
      terminalDigest: digestJson(state.terminal),
    });
  }
  const retained: CompletedLineageEvidence[] = [];
  for (const idempotencyKey of retainedKeys) {
    const state = await journal.inspect(idempotencyKey);
    if (state.status !== "completed") {
      throw new Error(`B2 Treatment B v2 prerequisite ${idempotencyKey} is not durably completed`);
    }
    retained.push({
      idempotencyKey,
      manifestDigest: state.operation.manifestDigest,
      outputDigest: state.terminal.imageProof.digest,
      outputReceiptDigest: state.terminal.imageProof.receiptDigest,
      state: "completed",
      terminalDigest: digestJson(state.terminal),
    });
  }
  return { failures, retained, schema: "shape-of-time.b2-treatment-b-v2-lineage.v1" };
}

export async function runB2BV2Study(arguments_: {
  archiveId: string;
  dispatcher: Pick<DurableImageDispatcher, "executeWithEvidence">;
  expectedLineage: B2BV2Lineage;
  journal: Pick<FilesystemImageDispatchJournal, "inspect">;
  reviewRoot: string;
}) {
  if (arguments_.archiveId !== B2_TREATMENT_ARCHIVE_ID) {
    throw new Error(`B2 Treatment B v2 is fixed to archive ${B2_TREATMENT_ARCHIVE_ID}`);
  }
  const actualLineage = await captureB2BV2Lineage(arguments_.journal);
  if (canonicalJson(actualLineage) !== canonicalJson(arguments_.expectedLineage)) {
    throw new Error("B2 Treatment B v2 prerequisite lineage does not match the inspected authorization");
  }

  const original = compileTreatmentCandidates();
  const repairs = compileRepairCandidates();
  const retainedCandidates = [
    original.find(({ treatmentId }) => treatmentId === "A"),
    repairs.find(({ treatmentId }) => treatmentId === "C"),
  ];
  if (retainedCandidates.some((candidate) => candidate === undefined)) {
    throw new Error("B2 Treatment B v2 retained candidate definitions are missing");
  }
  const retainedExecutions = await Promise.all(
    retainedCandidates.map((candidate) => arguments_.dispatcher.executeWithEvidence(candidate!.request)),
  );
  if (retainedExecutions.some(({ resolution }) => resolution !== "durable-replay")) {
    throw new Error("B2 Treatment B v2 retained A/C must replay from completed durable evidence");
  }
  for (const [index, execution] of retainedExecutions.entries()) {
    if (execution.result.digest !== actualLineage.retained[index]?.outputDigest) {
      throw new Error("B2 Treatment B v2 retained output does not match its fixed lineage digest");
    }
  }

  const candidate = compileB2BV2Candidate();
  const stateBefore = await arguments_.journal.inspect(candidate.request.manifest.idempotencyKey);
  if (
    (stateBefore.status === "absent" || stateBefore.status === "prepared") &&
    B2_TREATMENT_MAX_ESTIMATE_MICROUSD > B2_B_V2_SPEND_CAP_USD * 1_000_000
  ) {
    throw new Error("B2 Treatment B v2 would exceed its written spend cap");
  }
  const execution = await arguments_.dispatcher.executeWithEvidence(candidate.request);
  if (execution.result.estimatedTotalCostMicrousd === null) {
    throw new Error("B2 Treatment B v2 has incomplete usage-derived cost evidence");
  }
  if (execution.result.estimatedTotalCostMicrousd > B2_B_V2_SPEND_CAP_USD * 1_000_000) {
    throw new Error("B2 Treatment B v2 exceeded its written spend cap");
  }
  const bTerminal = await completedEvidence(arguments_.journal, candidate.request.manifest.idempotencyKey);

  const ordered = [
    { candidate: retainedCandidates[0]!, execution: retainedExecutions[0]! },
    { candidate, execution },
    { candidate: retainedCandidates[1]!, execution: retainedExecutions[1]! },
  ];
  const reviewRoot = path.resolve(arguments_.reviewRoot);
  await mkdir(reviewRoot, { recursive: true });
  const summaries = [];
  for (const item of ordered) {
    const terminal =
      item.candidate.treatmentId === "B"
        ? bTerminal
        : await completedEvidence(arguments_.journal, item.candidate.request.manifest.idempotencyKey);
    const summary = summarizeCandidate(item.candidate, item.execution.result, terminal);
    await writeImmutable(path.join(reviewRoot, summary.fileName), item.execution.result.bytes, reviewRoot);
    if (item.candidate.treatmentId === "B") {
      await writeImmutable(
        path.join(reviewRoot, `${item.candidate.fileStem}.json`),
        new TextEncoder().encode(`${canonicalJson(summary)}\n`),
        reviewRoot,
      );
    }
    summaries.push(summary);
  }

  const dryRun = b2BV2DryRun();
  const reportBase = {
    archiveId: arguments_.archiveId,
    bV2EstimatedCostMicrousd: execution.result.estimatedTotalCostMicrousd,
    candidates: summaries,
    judgment: "PENDING_OWNER_REVIEW",
    lineageDigest: digestJson(actualLineage),
    schema: B2_B_V2_SCHEMA,
    spendAuthorizationBoundUsd: B2_B_V2_SPEND_CAP_USD,
    studyDigest: dryRun.studyDigest,
  } as const;
  const report = { ...reportBase, reportDigest: digestJson(reportBase) };
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
  return {
    ...report,
    currentRun: {
      durableReplays: execution.resolution === "durable-replay" ? 1 : 0,
      providerDispatches: execution.resolution === "provider-dispatch" ? 1 : 0,
      retainedReplays: retainedExecutions.length,
    },
  };
}

function summarizeCandidate(
  candidate: CompiledTreatmentCandidate,
  result: ImageProviderResult,
  terminal: CompletedImageOperation,
) {
  return {
    byteLength: result.byteLength,
    digest: result.digest,
    estimatedTotalCostMicrousd: result.estimatedTotalCostMicrousd,
    fileName: `${candidate.fileStem}.png`,
    imageRecoveryProof: terminal.imageProof,
    latencyMs: result.latencyMs,
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
  if (state.status !== "completed") throw new Error(`B2 Treatment B v2 operation ${idempotencyKey} is not completed`);
  return state.terminal;
}

function renderContactSheet(studyDigest: string): string {
  const cards = [
    ["A", "Observed material illustration", "A-observed-material.png"],
    ["B", "Inked reportage with transparent watercolor", "B-inked-reportage.png"],
    ["C", "Cut-paper assemblage with screenprinted drawing", "C-cut-paper-print.png"],
  ] as const;
  const renderCards = (size: string) =>
    cards
      .map(
        ([id, name, file]) =>
          `<figure><img src="${file}" alt="Unapproved Treatment ${id} at ${size}: ${name}"><figcaption><strong>Treatment ${id}</strong><br>${name}</figcaption></figure>`,
      )
      .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B2 shared-medium comparison</title><style>
:root{font-family:Georgia,serif;background:#e9e5dc;color:#201e1a}body{margin:0;padding:32px}header,h2{max-width:70ch;margin:0 auto 24px}h1{font-size:1.6rem;font-weight:500}p,figcaption{line-height:1.45}.scroll{overflow-x:auto;padding:4px 0 18px}.grid{display:grid;gap:24px;margin:0 auto}.desktop{grid-template-columns:repeat(3,minmax(360px,1fr));min-width:1128px}.mobile{grid-template-columns:repeat(3,280px);width:max-content}figure{margin:0;padding:14px;background:#f8f5ed;box-shadow:0 2px 18px #0002}img{display:block;width:100%;aspect-ratio:3/2;object-fit:cover}figcaption{padding:12px 2px 2px}footer{font:12px ui-monospace,monospace;overflow-wrap:anywhere}
</style></head><body><header><h1>B2 shared-medium comparison</h1><p>Three neutral treatments of the same scene. All remain unapproved; only medium-level qualities may be selected.</p></header><section><h2>Desktop reading-size comparison</h2><div class="scroll"><div class="grid desktop">${renderCards("desktop reading size")}</div></div></section><section><h2>Mobile reading-size comparison</h2><div class="scroll"><div class="grid mobile">${renderCards("mobile reading size")}</div></div></section><footer>Treatment B v2 study digest: ${studyDigest}</footer></body></html>`;
}

async function runLive(arguments_: B2BV2Arguments & { confirmSpendCap: number; confirmedStudyDigest: string }) {
  if (arguments_.confirmedStudyDigest !== b2BV2DryRun().studyDigest) {
    throw new Error("B2 Treatment B v2 live execution is not bound to the current dry run");
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey === undefined || apiKey.trim().length === 0) throw new Error("OPENAI_API_KEY is required");
  const archive = new FilesystemRecoveryArchive({
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    root: B2_TREATMENT_RECOVERY_ROOT,
  });
  const journal = new FilesystemImageDispatchJournal({ archive });
  const dispatcher = new DurableImageDispatcher({
    archive,
    client: new OpenAiImageClient({ apiKey }),
    journal,
  });
  return runB2BV2Study({
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    dispatcher,
    expectedLineage: PRODUCTION_B2_B_V2_LINEAGE,
    journal,
    reviewRoot: B2_TREATMENT_REVIEW_ROOT,
  });
}

async function main(): Promise<void> {
  const arguments_ = readB2BV2Arguments(process.argv.slice(2));
  if (arguments_.dryRun) {
    process.stdout.write(`${canonicalJson({ mode: "dry-run", ...b2BV2DryRun() })}\n`);
    return;
  }
  const report = await runLive(
    arguments_ as B2BV2Arguments & { confirmSpendCap: number; confirmedStudyDigest: string },
  );
  process.stdout.write(`${canonicalJson({ mode: "live", ...report })}\n`);
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) await main();
