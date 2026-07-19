import { access, mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { FilesystemRecoveryArchive } from "../assets/filesystem-recovery-archive.js";
import { sha256 } from "../domain/digests.js";
import {
  B2_B_V2_SPEND_CAP_USD,
  b2BV2DryRun,
  captureB2BV2Lineage,
  compileB2BV2Candidate,
  readB2BV2Arguments,
  runB2BV2Study,
} from "./b2-visual-study-b-v2.js";
import { compileRepairCandidates } from "./b2-visual-study-repair.js";
import { B2_TREATMENT_ARCHIVE_ID, compileTreatmentCandidates } from "./b2-visual-study.js";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
  type ImageProviderExecutor,
} from "./durable-image-dispatch.js";
import type { CompiledImageRequest } from "./image-contract.js";
import { ImageProviderError, type ImageProviderResult } from "./openai-image-client.js";
import { validPng } from "./png-test-support.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

function successfulResult(compiled: CompiledImageRequest, clientRequestId: string): ImageProviderResult {
  const offset = compiled.manifest.idempotencyKey.charCodeAt(compiled.manifest.idempotencyKey.length - 2) % 32;
  const bytes = validPng(1536, 1024, [47 + offset, 71, 89]);
  const usage = {
    input_tokens: 10,
    input_tokens_details: { image_tokens: 0, text_tokens: 10 },
    output_tokens: 1_000,
    output_tokens_details: { image_tokens: 1_000, text_tokens: 0 },
    total_tokens: 1_010,
  };
  return {
    byteLength: bytes.byteLength,
    bytes,
    clientRequestId,
    digest: sha256(bytes),
    estimatedOutputCostMicrousd: 30_000,
    estimatedTotalCostMicrousd: 30_050,
    height: 1024,
    latencyMs: 50,
    mediaType: "image/png",
    pricingVersion: "openai-standard-token-pricing-2026-07-19",
    providerProcessingMs: 40,
    providerRequestId: `req_${compiled.manifest.idempotencyKey}`,
    requestedModelSnapshot: compiled.manifest.requestedModelSnapshot,
    servedModelEvidence: "unavailable-from-image-api",
    totalCostEstimateUnavailableReason: null,
    usage,
    width: 1536,
  };
}

async function seededHarness() {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "shape-of-time-b2-b-v2-")));
  temporaryRoots.push(root);
  const archive = new FilesystemRecoveryArchive({
    allowTemporaryRoot: true,
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    root: path.join(root, "recovery"),
  });
  const journal = new FilesystemImageDispatchJournal({ archive });
  const initialClient: ImageProviderExecutor = {
    execute: vi.fn(async (compiled, { clientRequestId }) => {
      if (
        compiled.manifest.idempotencyKey === "b2-treatment-b-v1" ||
        compiled.manifest.idempotencyKey === "b2-treatment-c-v1" ||
        compiled.manifest.idempotencyKey === "b2-treatment-b-replacement-v1"
      ) {
        throw new ImageProviderError({
          clientRequestId,
          code: "synthetic_indeterminate",
          disposition: "indeterminate",
          httpStatus: 200,
          message: "synthetic prior failure",
        });
      }
      return successfulResult(compiled, clientRequestId);
    }),
  };
  const seed = new DurableImageDispatcher({ archive, client: initialClient, journal });
  const original = compileTreatmentCandidates();
  const replacements = compileRepairCandidates();
  await seed.execute(original.find(({ treatmentId }) => treatmentId === "A")!.request);
  await expect(seed.execute(original.find(({ treatmentId }) => treatmentId === "B")!.request)).rejects.toMatchObject({
    disposition: "indeterminate",
  });
  await expect(seed.execute(original.find(({ treatmentId }) => treatmentId === "C")!.request)).rejects.toMatchObject({
    disposition: "indeterminate",
  });
  await expect(
    seed.execute(replacements.find(({ treatmentId }) => treatmentId === "B")!.request),
  ).rejects.toMatchObject({ disposition: "indeterminate" });
  await seed.execute(replacements.find(({ treatmentId }) => treatmentId === "C")!.request);
  return { archive, journal, lineage: await captureB2BV2Lineage(journal), root };
}

describe("B2 Treatment B v2 recovery tranche", () => {
  it("binds one fresh B identity, exact prior lineage, and a separate $0.05 cap", () => {
    const candidate = compileB2BV2Candidate();
    expect(candidate.treatmentId).toBe("B");
    expect(candidate.request.manifest).toMatchObject({
      endpoint: "/v1/images/generations",
      idempotencyKey: "b2-treatment-b-replacement-v2-durable-base64",
      quality: "medium",
      size: "1536x1024",
    });
    expect(candidate.request.exactPrompt).toBe(
      compileTreatmentCandidates().find(({ treatmentId }) => treatmentId === "B")?.request.exactPrompt,
    );
    expect(B2_B_V2_SPEND_CAP_USD).toBe(0.05);
    expect(b2BV2DryRun()).toMatchObject({
      maximumPlannedEstimateMicrousd: 50_000,
      plannedProviderOperations: 1,
      spendAuthorizationBoundUsd: 0.05,
    });
  });

  it("requires the exact inspected digest and literal cap", () => {
    const digest = b2BV2DryRun().studyDigest;
    expect(readB2BV2Arguments(["--dry-run"])).toEqual({ dryRun: true });
    expect(
      readB2BV2Arguments(["--confirm-study-digest", digest, "--confirm-spend-cap", "0.05"]),
    ).toEqual({ confirmSpendCap: 0.05, confirmedStudyDigest: digest, dryRun: false });
    expect(() =>
      readB2BV2Arguments(["--confirm-study-digest", "0".repeat(64), "--confirm-spend-cap", "0.05"]),
    ).toThrow(/study[- ]digest/i);
  });

  it(
    "recovers A/C, dispatches B once, and publishes one stable complete contact sheet",
    async () => {
      const setup = await seededHarness();
      const client: ImageProviderExecutor = {
        execute: vi.fn(async (compiled, { clientRequestId }) => successfulResult(compiled, clientRequestId)),
      };
      const dispatcher = new DurableImageDispatcher({ archive: setup.archive, client, journal: setup.journal });
      const run = () =>
        runB2BV2Study({
          archiveId: B2_TREATMENT_ARCHIVE_ID,
          dispatcher,
          expectedLineage: setup.lineage,
          journal: setup.journal,
          reviewRoot: path.join(setup.root, "review"),
        });

      const first = await run();
      const second = await run();

      expect(client.execute).toHaveBeenCalledTimes(1);
      expect(first.candidates.map(({ treatmentId }) => treatmentId)).toEqual(["A", "B", "C"]);
      expect(first.currentRun).toMatchObject({ providerDispatches: 1, retainedReplays: 2 });
      expect(second.currentRun).toMatchObject({ providerDispatches: 0, durableReplays: 1, retainedReplays: 2 });
      expect(JSON.parse(await readFile(path.join(setup.root, "review", "study.json"), "utf8"))).toMatchObject({
        candidates: [{ treatmentId: "A" }, { treatmentId: "B" }, { treatmentId: "C" }],
        judgment: "PENDING_OWNER_REVIEW",
      });
      await expect(access(path.join(setup.root, "review", "index.html"))).resolves.toBeUndefined();
    },
    60_000,
  );
});
