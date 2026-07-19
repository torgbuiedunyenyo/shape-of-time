import { access, mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { FilesystemRecoveryArchive } from "../assets/filesystem-recovery-archive.js";
import { digestJson, sha256 } from "../domain/digests.js";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
  type ImageProviderExecutor,
} from "./durable-image-dispatch.js";
import {
  B2_TREATMENT_ARCHIVE_ID,
  runB2TreatmentStudy,
  type B2TreatmentStudyDependencies,
} from "./b2-visual-study.js";
import type { CompiledImageRequest } from "./image-contract.js";
import { ImageProviderError, type ImageProviderResult } from "./openai-image-client.js";
import { validPng } from "./png-test-support.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

async function createHarness(execute: ImageProviderExecutor["execute"]) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "shape-of-time-b2-study-")));
  temporaryRoots.push(root);
  const archive = new FilesystemRecoveryArchive({
    allowTemporaryRoot: true,
    archiveId: B2_TREATMENT_ARCHIVE_ID,
    root: path.join(root, "recovery"),
  });
  const journal = new FilesystemImageDispatchJournal({ archive });
  const client: ImageProviderExecutor = { execute: vi.fn(execute) };
  const dispatcher = new DurableImageDispatcher({ archive, client, journal });
  return {
    client,
    dependencies: { dispatcher, journal } satisfies B2TreatmentStudyDependencies,
    journal,
    reviewRoot: path.join(root, "review"),
  };
}

function successfulResult(
  compiled: CompiledImageRequest,
  clientRequestId: string,
  options: { missingUsage?: boolean; outputTokens?: number } = {},
): ImageProviderResult {
  const treatmentOffset = compiled.manifest.idempotencyKey.charCodeAt("b2-treatment-".length) % 32;
  const bytes = validPng(1536, 1024, [52 + treatmentOffset, 73, 91]);
  const outputTokens = options.outputTokens ?? 1_000;
  const usage = options.missingUsage
    ? null
    : {
        input_tokens: 10,
        input_tokens_details: { image_tokens: 0, text_tokens: 10 },
        output_tokens: outputTokens,
        output_tokens_details: { image_tokens: outputTokens, text_tokens: 0 },
        total_tokens: outputTokens + 10,
      };
  return {
    byteLength: bytes.byteLength,
    bytes,
    clientRequestId,
    digest: sha256(bytes),
    estimatedOutputCostMicrousd: usage === null ? 41_000 : outputTokens * 30,
    estimatedTotalCostMicrousd: usage === null ? null : outputTokens * 30 + 50,
    height: 1024,
    latencyMs: 50,
    mediaType: "image/png",
    pricingVersion: "openai-standard-token-pricing-2026-07-19",
    providerProcessingMs: 40,
    providerRequestId: `req_${compiled.manifest.idempotencyKey}`,
    requestedModelSnapshot: compiled.manifest.requestedModelSnapshot,
    servedModelEvidence: "unavailable-from-image-api",
    totalCostEstimateUnavailableReason: usage === null ? "usage-unavailable" : null,
    usage,
    width: 1536,
  };
}

describe("B2 treatment-study orchestration", () => {
  it("materializes three recovered candidates and replays the same archive without another provider call", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) =>
      successfulResult(compiled, clientRequestId),
    );

    const first = await runB2TreatmentStudy({
      archiveId: B2_TREATMENT_ARCHIVE_ID,
      ...setup.dependencies,
      reviewRoot: setup.reviewRoot,
    });
    const second = await runB2TreatmentStudy({
      archiveId: B2_TREATMENT_ARCHIVE_ID,
      ...setup.dependencies,
      reviewRoot: setup.reviewRoot,
    });

    expect(setup.client.execute).toHaveBeenCalledTimes(3);
    expect(first.currentRun).toMatchObject({ providerDispatches: 3, durableReplays: 0 });
    expect(second.currentRun).toMatchObject({ providerDispatches: 0, durableReplays: 3 });
    expect(JSON.parse(await readFile(path.join(setup.reviewRoot, "study.json"), "utf8"))).toMatchObject({
      judgment: "PENDING_OWNER_REVIEW",
      candidates: [{ treatmentId: "A" }, { treatmentId: "B" }, { treatmentId: "C" }],
    });
  });

  it("stops after a partial rejected run without publishing a complete study", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) => {
      if (compiled.manifest.idempotencyKey.endsWith("c-v1")) {
        throw new ImageProviderError({
          clientRequestId,
          code: "moderation_rejected",
          disposition: "rejected",
          httpStatus: 400,
          message: "rejected test operation",
        });
      }
      return successfulResult(compiled, clientRequestId);
    });

    await expect(
      runB2TreatmentStudy({
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      }),
    ).rejects.toMatchObject({ disposition: "rejected" });
    expect(setup.client.execute).toHaveBeenCalledTimes(3);
    await expect(access(path.join(setup.reviewRoot, "A-observed-material.png"))).resolves.toBeUndefined();
    await expect(access(path.join(setup.reviewRoot, "B-inked-reportage.png"))).resolves.toBeUndefined();
    await expect(access(path.join(setup.reviewRoot, "C-cut-paper-print.png"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(path.join(setup.reviewRoot, "study.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(setup.journal.inspect("b2-treatment-c-v1")).resolves.toMatchObject({ status: "rejected" });
  });

  it("continues only past the exact acknowledged indeterminate terminal without replaying it", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) => {
      if (compiled.manifest.idempotencyKey.endsWith("b-v1")) {
        throw new ImageProviderError({
          clientRequestId,
          code: "transport_ambiguous",
          disposition: "indeterminate",
          httpStatus: null,
          message: "ambiguous test operation",
        });
      }
      return successfulResult(compiled, clientRequestId);
    });
    const run = (terminalDigest?: string) =>
      runB2TreatmentStudy({
        ...(terminalDigest === undefined
          ? {}
          : {
              acknowledgedIndeterminate: {
                idempotencyKey: "b2-treatment-b-v1",
                terminalDigest,
              },
            }),
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      });

    await expect(run()).rejects.toMatchObject({ disposition: "indeterminate" });
    expect(setup.client.execute).toHaveBeenCalledTimes(2);
    await expect(run("0".repeat(64))).rejects.toThrow(/acknowledged.*digest/i);
    expect(setup.client.execute).toHaveBeenCalledTimes(2);
    const state = await setup.journal.inspect("b2-treatment-b-v1");
    if (state.status !== "indeterminate") throw new Error("expected the B2 test operation to be indeterminate");

    const report = await run(digestJson(state.terminal));

    expect(setup.client.execute).toHaveBeenCalledTimes(3);
    expect(report.candidates.map(({ treatmentId }) => treatmentId)).toEqual(["A", "C"]);
    expect(report.failedCandidates).toEqual([
      expect.objectContaining({ state: "indeterminate", treatmentId: "B" }),
    ]);
    expect(report.currentRun).toMatchObject({
      acknowledgedIndeterminate: 1,
      durableReplays: 1,
      providerDispatches: 1,
    });
    await expect(setup.journal.inspect("b2-treatment-c-v1")).resolves.toMatchObject({ status: "completed" });
  });

  it("stops before materialization and further dispatch when usage-derived cost is missing", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) =>
      successfulResult(compiled, clientRequestId, { missingUsage: true }),
    );

    await expect(
      runB2TreatmentStudy({
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      }),
    ).rejects.toThrow(/incomplete usage-derived cost/i);
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    await expect(setup.journal.inspect("b2-treatment-a-v1")).resolves.toMatchObject({ status: "completed" });
    await expect(access(path.join(setup.reviewRoot, "A-observed-material.png"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("stops the tranche before a second dispatch when observed cost consumes the remaining cap", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) =>
      successfulResult(compiled, clientRequestId, { outputTokens: 4_000 }),
    );

    await expect(
      runB2TreatmentStudy({
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      }),
    ).rejects.toThrow(/would exceed the written spend cap/i);
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    await expect(setup.journal.inspect("b2-treatment-b-v1")).resolves.toMatchObject({ status: "absent" });
  });

  it.each([
    ["rejected", 400] as const,
    ["indeterminate", 500] as const,
  ])("does not continue or materialize after a %s provider result", async (disposition, httpStatus) => {
    const setup = await createHarness(async (_compiled, { clientRequestId }) => {
      throw new ImageProviderError({
        clientRequestId,
        code: `${disposition}_test`,
        disposition,
        httpStatus,
        message: `${disposition} test operation`,
      });
    });

    await expect(
      runB2TreatmentStudy({
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      }),
    ).rejects.toMatchObject({ disposition });
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    await expect(access(path.join(setup.reviewRoot, "A-observed-material.png"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("permits at most one provider dispatch path under concurrent study invocation", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return successfulResult(compiled, clientRequestId);
    });
    const run = () =>
      runB2TreatmentStudy({
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      });

    const results = await Promise.allSettled([run(), run()]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
    expect(setup.client.execute).toHaveBeenCalledTimes(3);
  });

  it("requires completed recovery evidence before writing a review candidate", async () => {
    const root = await realpath(await mkdtemp(path.join(tmpdir(), "shape-of-time-b2-unrecovered-")));
    temporaryRoots.push(root);
    const candidate = (await import("./b2-visual-study.js")).compileTreatmentCandidates()[0];
    if (candidate === undefined) throw new Error("B2 treatment fixture is missing candidate A");
    const request = candidate.request;
    const result = successfulResult(request, "77777777-7777-4777-8777-777777777777");
    const dependencies: B2TreatmentStudyDependencies = {
      dispatcher: {
        executeWithEvidence: vi.fn(async () => ({ resolution: "provider-dispatch" as const, result })),
      },
      journal: { inspect: vi.fn(async () => ({ status: "absent" as const })) },
    };

    await expect(
      runB2TreatmentStudy({
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        ...dependencies,
        reviewRoot: path.join(root, "review"),
      }),
    ).rejects.toThrow(/did not complete durably/i);
    await expect(access(path.join(root, "review", "A-observed-material.png"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
