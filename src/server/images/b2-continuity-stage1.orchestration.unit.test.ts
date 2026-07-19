import { access, mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { FilesystemRecoveryArchive } from "../assets/filesystem-recovery-archive.js";
import { sha256 } from "../domain/digests.js";
import {
  B2_CONTINUITY_ARCHIVE_ID,
  runB2ContinuityStage1,
  type B2ContinuityStage1Dependencies,
} from "./b2-continuity-stage1.js";
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

/**
 * The durable pipeline enforces exact usage-derived cost arithmetic (openai-image-client.ts
 * estimateCost: output tokens x 30, text x 5, image x 8 micro-USD; a null-usage 1024x1536 medium
 * result carries the fixed 41,000 output estimate and a null total). The original fixture invented
 * costs the real pipeline can never emit, so recordReceived rejected it before the orchestrator's
 * own cap/evidence checks could run. This repair makes every synthetic result satisfy the same
 * invariants a real dispatch would; the tests' assertions are unchanged.
 */
function usageForExactTotal(totalMicrousd: number) {
  for (let imageTokens = 0; imageTokens < 30; imageTokens += 1) {
    for (let textTokens = 0; textTokens < 30; textTokens += 1) {
      const remainder = totalMicrousd - imageTokens * 8 - textTokens * 5;
      if (remainder >= 0 && remainder % 30 === 0) {
        const outputTokens = remainder / 30;
        return {
          input_tokens: imageTokens + textTokens,
          input_tokens_details: { image_tokens: imageTokens, text_tokens: textTokens },
          output_tokens: outputTokens,
          output_tokens_details: { image_tokens: outputTokens, text_tokens: 0 },
          total_tokens: imageTokens + textTokens + outputTokens,
        };
      }
    }
  }
  throw new Error(`no exact usage decomposition for ${totalMicrousd} micro-USD`);
}

function successfulResult(
  compiled: CompiledImageRequest,
  clientRequestId: string,
  options: { estimatedCostMicrousd?: number; missingUsage?: boolean } = {},
): ImageProviderResult {
  const bytes = validPng(1024, 1536, [53, 71, 89]);
  const usage = options.missingUsage ? null : usageForExactTotal(options.estimatedCostMicrousd ?? 30_100);
  const estimatedTotalCostMicrousd = options.missingUsage ? null : (options.estimatedCostMicrousd ?? 30_100);
  return {
    byteLength: bytes.byteLength,
    bytes,
    clientRequestId,
    digest: sha256(bytes),
    // Null usage means the fixed 1024x1536 medium output estimate; otherwise output tokens x 30.
    estimatedOutputCostMicrousd: usage === null ? 41_000 : usage.output_tokens * 30,
    estimatedTotalCostMicrousd,
    height: 1536,
    latencyMs: 50,
    mediaType: "image/png",
    pricingVersion: "openai-standard-token-pricing-2026-07-19",
    providerProcessingMs: 40,
    providerRequestId: `req_${compiled.manifest.idempotencyKey}`,
    requestedModelSnapshot: compiled.manifest.requestedModelSnapshot,
    servedModelEvidence: "unavailable-from-image-api",
    totalCostEstimateUnavailableReason: usage === null ? "usage-unavailable" : null,
    usage,
    width: 1024,
  };
}

async function createHarness(execute: ImageProviderExecutor["execute"]) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "shape-of-time-b2-continuity-stage1-")));
  temporaryRoots.push(root);
  const archive = new FilesystemRecoveryArchive({
    allowTemporaryRoot: true,
    archiveId: B2_CONTINUITY_ARCHIVE_ID,
    root: path.join(root, "recovery"),
  });
  const journal = new FilesystemImageDispatchJournal({ archive });
  const client: ImageProviderExecutor = { execute: vi.fn(execute) };
  const dispatcher = new DurableImageDispatcher({ archive, client, journal });
  return {
    client,
    dependencies: { dispatcher, journal } satisfies B2ContinuityStage1Dependencies,
    journal,
    reviewRoot: path.join(root, "review"),
  };
}

describe("B2 continuity Stage 1 orchestration", () => {
  it("recovers the candidate before review and replays stably without a second provider call", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) =>
      successfulResult(compiled, clientRequestId),
    );
    const run = () =>
      runB2ContinuityStage1({
        archiveId: B2_CONTINUITY_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      });

    const first = await run();
    const second = await run();

    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    expect(first.currentRun).toEqual({ durableReplays: 0, providerDispatches: 1 });
    expect(second.currentRun).toEqual({ durableReplays: 1, providerDispatches: 0 });
    expect(first.reportDigest).toBe(second.reportDigest);
    expect(JSON.parse(await readFile(path.join(setup.reviewRoot, "stage-1.json"), "utf8"))).toMatchObject({
      judgment: "PENDING_OWNER_CONTINUITY_REVIEW",
      plannedProviderOperations: 1,
    });
    await expect(access(path.join(setup.reviewRoot, "01-root-payment.png"))).resolves.toBeUndefined();
  });

  it("stops without review material when usage-derived cost evidence is missing", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) =>
      successfulResult(compiled, clientRequestId, { missingUsage: true }),
    );

    await expect(
      runB2ContinuityStage1({
        archiveId: B2_CONTINUITY_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      }),
    ).rejects.toThrow(/usage-derived cost/i);
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    await expect(setup.journal.inspect("b2-continuity-root-payment-v1")).resolves.toMatchObject({
      status: "completed",
    });
    await expect(access(path.join(setup.reviewRoot, "01-root-payment.png"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("stops without review material when observed cost exceeds the written cap", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) =>
      successfulResult(compiled, clientRequestId, { estimatedCostMicrousd: 50_001 }),
    );

    await expect(
      runB2ContinuityStage1({
        archiveId: B2_CONTINUITY_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      }),
    ).rejects.toThrow(/exceeded.*spend cap/i);
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    await expect(access(path.join(setup.reviewRoot, "01-root-payment.png"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not retry, replace, or publish an indeterminate dispatch", async () => {
    const setup = await createHarness(async (_compiled, { clientRequestId }) => {
      throw new ImageProviderError({
        clientRequestId,
        code: "transport_ambiguous",
        disposition: "indeterminate",
        httpStatus: null,
        message: "synthetic ambiguous dispatch",
      });
    });
    const run = () =>
      runB2ContinuityStage1({
        archiveId: B2_CONTINUITY_ARCHIVE_ID,
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      });

    await expect(run()).rejects.toMatchObject({ disposition: "indeterminate" });
    await expect(run()).rejects.toMatchObject({ disposition: "indeterminate" });
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    await expect(access(path.join(setup.reviewRoot, "01-root-payment.png"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("requires completed recovery evidence before writing review bytes", async () => {
    const root = await realpath(await mkdtemp(path.join(tmpdir(), "shape-of-time-b2-continuity-unrecovered-")));
    temporaryRoots.push(root);
    const bytes = validPng(1024, 1536, [31, 41, 59]);
    const result = successfulResult(
      { manifest: { idempotencyKey: "b2-continuity-root-payment-v1" } } as CompiledImageRequest,
      "77777777-7777-4777-8777-777777777777",
    );
    result.bytes = bytes;
    result.byteLength = bytes.byteLength;
    result.digest = sha256(bytes);
    const dependencies: B2ContinuityStage1Dependencies = {
      dispatcher: {
        executeWithEvidence: vi.fn(async () => ({ resolution: "provider-dispatch" as const, result })),
      },
      journal: { inspect: vi.fn(async () => ({ status: "absent" as const })) },
    };

    await expect(
      runB2ContinuityStage1({
        archiveId: B2_CONTINUITY_ARCHIVE_ID,
        ...dependencies,
        reviewRoot: path.join(root, "review"),
      }),
    ).rejects.toThrow(/completed recovery evidence/i);
    await expect(access(path.join(root, "review", "01-root-payment.png"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects archive and review identities outside the fixed Stage 1 contract", async () => {
    const setup = await createHarness(async (compiled, { clientRequestId }) =>
      successfulResult(compiled, clientRequestId),
    );

    await expect(
      runB2ContinuityStage1({
        archiveId: "another-archive",
        ...setup.dependencies,
        reviewRoot: setup.reviewRoot,
      }),
    ).rejects.toThrow(/fixed to archive/i);
    expect(setup.client.execute).not.toHaveBeenCalled();
  });
});
