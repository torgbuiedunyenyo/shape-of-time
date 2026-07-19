import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { FilesystemRecoveryArchive, writeImmutable } from "../assets/filesystem-recovery-archive.js";
import { canonicalJson, digestJson } from "../domain/digests.js";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
  type CompletedImageOperation,
  type DurableImageExecution,
} from "./durable-image-dispatch.js";
import { compileImageRequest, type CompiledImageRequest } from "./image-contract.js";
import { OpenAiImageClient, type ImageProviderResult } from "./openai-image-client.js";

export const B2_TREATMENT_SPEND_CAP_USD = 0.15;
export const B2_TREATMENT_MAX_ESTIMATE_MICROUSD = 50_000;
export const B2_TREATMENT_ARCHIVE_ID = "b2-visual-study-2026-07";
export const B2_TREATMENT_RECOVERY_ROOT = "/Users/ratpartyserver/git/shape-of-time-b2-recovery";
export const B2_TREATMENT_REVIEW_ROOT =
  "/Users/ratpartyserver/git/shape-of-time-b2-review/medium-comparison-v1";
const B2_TREATMENT_PROMPT_VERSION = "b2-shared-medium-comparison-v1";
const B2_TREATMENT_SCHEMA = "shape-of-time.b2-treatment-study.v1" as const;

interface B2VisualStudyArguments {
  acknowledgedIndeterminate?: AcknowledgedIndeterminate;
  confirmSpendCap?: number;
  confirmedStudyDigest?: string;
  dryRun: boolean;
}

interface AcknowledgedIndeterminate {
  idempotencyKey: string;
  terminalDigest: string;
}

interface FailedTreatmentEvidence {
  code: string;
  disposition: "indeterminate";
  idempotencyKey: string;
  providerRequestId: string | null;
  state: "indeterminate";
  terminalDigest: string;
  treatmentId: "A" | "B" | "C";
}

export interface B2TreatmentStudyDependencies {
  dispatcher: Pick<DurableImageDispatcher, "executeWithEvidence">;
  journal: Pick<FilesystemImageDispatchJournal, "inspect">;
}

interface TreatmentDefinition {
  fileStem: string;
  name: string;
  treatment: string;
  treatmentId: "A" | "B" | "C";
}

export interface CompiledTreatmentCandidate extends TreatmentDefinition {
  request: CompiledImageRequest;
}

const comparisonScene =
  "Use this same comparison scene exactly: an eye-level, medium-wide view at a worn public ferry-terminal ticket counter near the end of an ordinary working day. Two unnamed adults exchange one plain paper ticket while a maintenance worker closes an open service panel in the background. Show bodily ease, attention, accumulated wear, repair, unequal access to the counter, and ordinary ambient light. Nobody poses. The place must not identify a city, country, decade, temporal coordinate, or named culture. Include no readable lettering, logos, story characters, story objects, portals, temporal devices, speculative technology, cosmic effects, duplicate people, or universal era palette.";

const treatments: readonly TreatmentDefinition[] = [
  {
    fileStem: "A-observed-material",
    name: "Observed material illustration",
    treatment:
      "Render as an adult illustrated-novel plate in matte gouache over visible graphite construction on warm uncoated paper. Use restrained dry-brush and print texture, natural perspective, concrete faces and hands, and carefully observed surfaces. The medium is tactile but the scene is not nostalgic, whimsical, or children's editorial art.",
    treatmentId: "A",
  },
  {
    fileStem: "B-inked-reportage",
    name: "Inked reportage with transparent color",
    treatment:
      "Render as precise observational reportage drawing with varied hand-inked line, transparent overlapping watercolor washes, sparse colored-pencil accents, and visible paper. Preserve facial expression, hand position, spatial depth, repair, and material weight. Avoid comic-panel language, urban-sketch shorthand, prettified airiness, or diagrammatic stiffness.",
    treatmentId: "B",
  },
  {
    fileStem: "C-cut-paper-print",
    name: "Cut-paper assemblage with screenprinted drawing",
    treatment:
      "Render as a tactile assemblage of painted paper shapes reproduced with a small locally chosen set of screenprinted inks, visible fibers, restrained registration shifts, and selective graphite detail for faces, hands, wear, and repair. Keep the space coherent and inhabited rather than symbolic, decorative, or reduced to flat cultural motifs.",
    treatmentId: "C",
  },
] as const;

export function compileTreatmentCandidates(): CompiledTreatmentCandidate[] {
  return treatments.map((definition) => ({
    ...definition,
    request: compileImageRequest({
      idempotencyKey: `b2-treatment-${definition.treatmentId.toLowerCase()}-v1`,
      kind: "generate",
      prompt: `${comparisonScene}\n\n${definition.treatment}\n\nOpaque full-bleed landscape image. No border or caption.`,
      promptVersion: B2_TREATMENT_PROMPT_VERSION,
      purpose: "narrative",
      quality: "medium",
      size: "1536x1024",
    }),
  }));
}

export function readB2VisualStudyArguments(values: string[]): B2VisualStudyArguments {
  if (values[0] === "--") values = values.slice(1);
  const parsed: B2VisualStudyArguments = { dryRun: false };
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
        throw new Error("B2 treatment study accepts only one indeterminate acknowledgement");
      }
      parsed.acknowledgedIndeterminate = parseIndeterminateAcknowledgement(value);
    }
    else throw new Error(`unknown B2 visual-study argument: ${key}`);
    index += 1;
  }
  if (parsed.dryRun) {
    if (Object.keys(parsed).length !== 1) throw new Error("B2 visual-study dry run accepts no live arguments");
    return parsed;
  }
  if (parsed.confirmSpendCap !== B2_TREATMENT_SPEND_CAP_USD) {
    throw new Error(`B2 treatment study requires --confirm-spend-cap ${B2_TREATMENT_SPEND_CAP_USD.toFixed(2)}`);
  }
  const exactStudyDigest = treatmentStudyDryRun().studyDigest;
  if (parsed.confirmedStudyDigest !== exactStudyDigest) {
    throw new Error(`B2 treatment study requires --confirm-study-digest ${exactStudyDigest}`);
  }
  return parsed;
}

export function treatmentStudyDryRun() {
  const candidates = compileTreatmentCandidates();
  const base = {
    candidates: candidates.map(({ fileStem, name, request, treatmentId }) => ({
      fileStem,
      manifest: request.manifest,
      manifestDigest: request.manifestDigest,
      name,
      treatmentId,
    })),
    maximumPlannedEstimateMicrousd: B2_TREATMENT_MAX_ESTIMATE_MICROUSD * candidates.length,
    plannedProviderOperations: candidates.length,
    promptVersion: B2_TREATMENT_PROMPT_VERSION,
    schema: B2_TREATMENT_SCHEMA,
    spendAuthorizationBoundUsd: B2_TREATMENT_SPEND_CAP_USD,
  };
  return { ...base, studyDigest: digestJson(base) };
}

async function runLive(
  arguments_: B2VisualStudyArguments & {
    confirmSpendCap: number;
    confirmedStudyDigest: string;
    dryRun: false;
  },
) {
  const currentStudyDigest = treatmentStudyDryRun().studyDigest;
  if (arguments_.confirmedStudyDigest !== currentStudyDigest) {
    throw new Error("B2 live execution is not bound to the current dry-run study digest");
  }
  assertExternalRoot(B2_TREATMENT_RECOVERY_ROOT, "recovery");
  assertExternalRoot(B2_TREATMENT_REVIEW_ROOT, "review");
  if (rootsOverlap(B2_TREATMENT_RECOVERY_ROOT, B2_TREATMENT_REVIEW_ROOT)) {
    throw new Error("B2 recovery and review roots must be separate and non-overlapping");
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
  return runB2TreatmentStudy({
    ...(arguments_.acknowledgedIndeterminate === undefined
      ? {}
      : { acknowledgedIndeterminate: arguments_.acknowledgedIndeterminate }),
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    dispatcher,
    journal,
    reviewRoot: B2_TREATMENT_REVIEW_ROOT,
  });
}

export async function runB2TreatmentStudy(
  arguments_: B2TreatmentStudyDependencies & {
    acknowledgedIndeterminate?: AcknowledgedIndeterminate;
    archiveId: string;
    reviewRoot: string;
  },
) {
  if (arguments_.archiveId !== B2_TREATMENT_ARCHIVE_ID) {
    throw new Error(`B2 treatment study is fixed to archive ${B2_TREATMENT_ARCHIVE_ID}`);
  }
  const reviewRoot = path.resolve(arguments_.reviewRoot);
  await mkdir(reviewRoot, { recursive: true });

  if (arguments_.acknowledgedIndeterminate !== undefined) {
    const acknowledged = await arguments_.journal.inspect(arguments_.acknowledgedIndeterminate.idempotencyKey);
    if (acknowledged.status !== "indeterminate") {
      throw new Error("acknowledged B2 operation is not durably indeterminate");
    }
    if (digestJson(acknowledged.terminal) !== arguments_.acknowledgedIndeterminate.terminalDigest) {
      throw new Error("acknowledged B2 indeterminate terminal digest does not match durable evidence");
    }
  }

  let cumulativeEstimatedCostMicrousd = 0;
  let maximumAuthorizationConsumedMicrousd = 0;
  const completed: ReturnType<typeof summarizeCandidate>[] = [];
  const failed: FailedTreatmentEvidence[] = [];
  const resolutions: DurableImageExecution["resolution"][] = [];
  for (const candidate of compileTreatmentCandidates()) {
    const idempotencyKey = candidate.request.manifest.idempotencyKey;
    const stateBefore = await arguments_.journal.inspect(idempotencyKey);
    if (
      stateBefore.status === "indeterminate" &&
      arguments_.acknowledgedIndeterminate?.idempotencyKey === idempotencyKey
    ) {
      maximumAuthorizationConsumedMicrousd += B2_TREATMENT_MAX_ESTIMATE_MICROUSD;
      if (maximumAuthorizationConsumedMicrousd > B2_TREATMENT_SPEND_CAP_USD * 1_000_000) {
        throw new Error("acknowledged B2 indeterminate result consumes the remaining spend cap");
      }
      failed.push({
        code: stateBefore.terminal.code,
        disposition: "indeterminate",
        idempotencyKey,
        providerRequestId: stateBefore.terminal.providerRequestId,
        state: "indeterminate",
        terminalDigest: digestJson(stateBefore.terminal),
        treatmentId: candidate.treatmentId,
      });
      continue;
    }
    if (
      (stateBefore.status === "absent" || stateBefore.status === "prepared") &&
      maximumAuthorizationConsumedMicrousd + B2_TREATMENT_MAX_ESTIMATE_MICROUSD >
        B2_TREATMENT_SPEND_CAP_USD * 1_000_000
    ) {
      throw new Error(`B2 treatment ${candidate.treatmentId} would exceed the written spend cap`);
    }
    const execution = await arguments_.dispatcher.executeWithEvidence(candidate.request);
    const result = execution.result;
    const estimatedCost = result.estimatedTotalCostMicrousd;
    if (estimatedCost === null) {
      throw new Error(`B2 treatment ${candidate.treatmentId} has incomplete usage-derived cost evidence`);
    }
    cumulativeEstimatedCostMicrousd += estimatedCost;
    maximumAuthorizationConsumedMicrousd += estimatedCost;
    if (maximumAuthorizationConsumedMicrousd > B2_TREATMENT_SPEND_CAP_USD * 1_000_000) {
      throw new Error("B2 treatment study exceeded the written spend cap; no review material is published");
    }
    const terminal = await completedEvidence(arguments_.journal, candidate.request.manifest.idempotencyKey);
    await writeImmutable(path.join(reviewRoot, `${candidate.fileStem}.png`), result.bytes, reviewRoot);
    const evidence = summarizeCandidate(candidate, result, terminal);
    await writeImmutable(
      path.join(reviewRoot, `${candidate.fileStem}.json`),
      new TextEncoder().encode(`${canonicalJson(evidence)}\n`),
      reviewRoot,
    );
    completed.push(evidence);
    resolutions.push(execution.resolution);
  }

  const dryRun = treatmentStudyDryRun();
  const stableReportBase = {
    archiveId: arguments_.archiveId,
    candidates: completed,
    cumulativeEstimatedCostMicrousd,
    failedCandidates: failed,
    judgment: "PENDING_OWNER_REVIEW",
    maximumAuthorizationConsumedMicrousd,
    schema: B2_TREATMENT_SCHEMA,
    spendAuthorizationBoundUsd: B2_TREATMENT_SPEND_CAP_USD,
    studyDigest: dryRun.studyDigest,
  };
  const report = { ...stableReportBase, reportDigest: digestJson(stableReportBase) };
  await writeImmutable(
    path.join(reviewRoot, "study.json"),
    new TextEncoder().encode(`${canonicalJson(report)}\n`),
    reviewRoot,
  );
  await writeImmutable(
    path.join(reviewRoot, "index.html"),
    new TextEncoder().encode(renderContactSheet(completed, failed, dryRun.studyDigest)),
    reviewRoot,
  );
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

function summarizeCandidate(
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

function renderContactSheet(
  candidates: ReturnType<typeof summarizeCandidate>[],
  failedCandidates: FailedTreatmentEvidence[],
  studyDigest: string,
): string {
  const renderCards = (sizeLabel: string) => candidates
    .map(
      ({ fileName, name, treatmentId }) => `
        <figure>
          <img src="${fileName}" alt="Unapproved Treatment ${treatmentId} candidate shown at ${sizeLabel}: ${name}">
          <figcaption><strong>Treatment ${treatmentId}</strong><br>${name}</figcaption>
        </figure>`,
    )
    .join("");
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Shape of Time — B2 medium comparison</title>
<style>
  :root { color-scheme: light; font-family: Georgia, serif; background: #e9e5dc; color: #201e1a; }
  body { margin: 0; padding: 32px; }
  header { max-width: 70ch; margin: 0 auto 28px; }
  h1 { font-size: 1.6rem; font-weight: 500; }
  p { line-height: 1.5; }
  section { margin: 32px 0; }
  h2 { font-size: 1rem; font-weight: 500; max-width: 70ch; margin: 0 auto 14px; }
  .comparison-scroll { overflow-x: auto; padding: 4px 0 18px; }
  .comparison { display: grid; gap: 24px; margin: 0 auto; }
  .desktop { grid-template-columns: repeat(3,minmax(360px,1fr)); min-width: 1128px; }
  .mobile { grid-template-columns: repeat(3,280px); width: max-content; }
  figure { margin: 0; padding: 14px; background: #f8f5ed; box-shadow: 0 2px 18px #0002; }
  img { display: block; width: 100%; aspect-ratio: 3/2; object-fit: cover; background: #d7d1c4; }
  figcaption { padding: 12px 2px 2px; line-height: 1.35; }
  footer { margin-top: 28px; font: 12px ui-monospace, monospace; overflow-wrap: anywhere; }
</style>
<body>
<header>
  <h1>B2 shared-medium comparison</h1>
  <p>These ${candidates.length} completed candidates depict the same neutral scene. They are unapproved and confer no
  authority on any person, place, object, palette, or composition. Review them side by side at this
  reading size. Human selection is required before any candidate can become an edit reference.</p>
  ${
    failedCandidates.length === 0
      ? ""
      : `<p>${failedCandidates.map(({ treatmentId }) => `Treatment ${treatmentId}`).join(", ")} is omitted because its provider dispatch became indeterminate and was not retried.</p>`
  }
</header>
<main>
  <section aria-labelledby="desktop-heading">
    <h2 id="desktop-heading">Desktop reading-size comparison</h2>
    <div class="comparison-scroll"><div class="comparison desktop">${renderCards("desktop reading size")}</div></div>
  </section>
  <section aria-labelledby="mobile-heading">
    <h2 id="mobile-heading">Mobile reading-size comparison</h2>
    <div class="comparison-scroll"><div class="comparison mobile">${renderCards("mobile reading size")}</div></div>
  </section>
</main>
<footer>Study digest: ${studyDigest}</footer>
</body>
</html>
`;
}

async function completedEvidence(
  journal: Pick<FilesystemImageDispatchJournal, "inspect">,
  idempotencyKey: string,
): Promise<CompletedImageOperation> {
  const state = await journal.inspect(idempotencyKey);
  if (state.status !== "completed") throw new Error(`B2 treatment did not complete durably: ${state.status}`);
  return state.terminal;
}

function assertExternalRoot(root: string, label: string): void {
  if (!path.isAbsolute(root) || path.resolve(root) === path.parse(path.resolve(root)).root) {
    throw new Error(`B2 ${label} root must be a bounded absolute directory`);
  }
  if (rootsOverlap(root, process.cwd())) {
    throw new Error(`B2 ${label} root must be outside the project worktree`);
  }
}

function rootsOverlap(left: string, right: string): boolean {
  return isWithin(left, right) || isWithin(right, left);
}

function isWithin(candidate: string, parent: string): boolean {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function parseIndeterminateAcknowledgement(value: string): AcknowledgedIndeterminate {
  const matched = /^([^:]+):([a-f0-9]{64})$/.exec(value);
  if (matched === null) {
    throw new Error("B2 indeterminate acknowledgement must be <idempotency-key>:<terminal-digest>");
  }
  const [, idempotencyKey, terminalDigest] = matched;
  if (
    idempotencyKey === undefined ||
    terminalDigest === undefined ||
    !compileTreatmentCandidates().some((candidate) => candidate.request.manifest.idempotencyKey === idempotencyKey)
  ) {
    throw new Error("B2 indeterminate acknowledgement names an unknown treatment operation");
  }
  return { idempotencyKey, terminalDigest };
}

async function main(): Promise<void> {
  const arguments_ = readB2VisualStudyArguments(process.argv.slice(2));
  if (arguments_.dryRun) {
    process.stdout.write(`${canonicalJson({ mode: "dry-run", ...treatmentStudyDryRun() })}\n`);
    return;
  }
  const report = await runLive(
    arguments_ as B2VisualStudyArguments & {
      confirmSpendCap: number;
      confirmedStudyDigest: string;
      dryRun: false;
    },
  );
  process.stdout.write(`${canonicalJson({ mode: "live", ...report })}\n`);
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) await main();
