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
  B2_REPAIR_SPEND_CAP_USD,
  B2_REPLACEMENT_B_FAILURE,
  assertRetainedAProductionIdentity,
  compileRepairCandidates,
  readB2RepairArguments,
  repairStudyDryRun,
  runB2RepairStudy,
} from "./b2-visual-study-repair.js";
import { B2_TREATMENT_ARCHIVE_ID, compileTreatmentCandidates } from "./b2-visual-study.js";
import type { CompiledImageRequest } from "./image-contract.js";
import { ImageProviderError, type ImageProviderResult } from "./openai-image-client.js";
import { validPng } from "./png-test-support.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

function successfulResult(compiled: CompiledImageRequest, clientRequestId: string): ImageProviderResult {
  const bytes = validPng(1536, 1024, [91, compiled.manifest.idempotencyKey.includes("-b-") ? 53 : 79, 37]);
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

describe("B2 base64-overflow replacement study", () => {
  it("binds exactly two new B/C operation identities to a separate $0.10 tranche", () => {
    const original = compileTreatmentCandidates();
    const replacements = compileRepairCandidates();

    expect(replacements.map(({ treatmentId }) => treatmentId)).toEqual(["B", "C"]);
    expect(replacements.map(({ request }) => request.manifest.idempotencyKey)).toEqual([
      "b2-treatment-b-replacement-v1",
      "b2-treatment-c-replacement-v1",
    ]);
    for (const candidate of replacements) {
      expect(candidate.request.manifest).toMatchObject({
        endpoint: "/v1/images/generations",
        quality: "medium",
        size: "1536x1024",
      });
      expect(candidate.request.manifest.orderedReferences).toEqual([]);
      expect(candidate.request.exactPrompt).toBe(
        original.find(({ treatmentId }) => treatmentId === candidate.treatmentId)?.request.exactPrompt,
      );
    }
    expect(B2_REPAIR_SPEND_CAP_USD).toBe(0.1);
    expect(repairStudyDryRun()).toMatchObject({
      maximumPlannedEstimateMicrousd: 100_000,
      plannedProviderOperations: 2,
      spendAuthorizationBoundUsd: 0.1,
    });
  });

  it("requires the exact repair digest and literal replacement cap", () => {
    const digest = repairStudyDryRun().studyDigest;
    const terminalDigest = B2_REPLACEMENT_B_FAILURE.terminalDigest;
    expect(B2_REPLACEMENT_B_FAILURE).toEqual({
      idempotencyKey: "b2-treatment-b-replacement-v1",
      manifestDigest: "c7a51913fce0f7ef30221e19d600577aecf808bd8ed16492df651d3836b3cf49",
      terminalDigest: "a4b2f9659c137e67eb3abd9877d968cd68dfb80dc8a07592d1677ec038c6c0c8",
    });
    expect(readB2RepairArguments(["--dry-run"])).toEqual({ dryRun: true });
    expect(
      readB2RepairArguments([
        "--confirm-study-digest",
        digest,
        "--confirm-spend-cap",
        "0.10",
      ]),
    ).toEqual({ confirmSpendCap: 0.1, confirmedStudyDigest: digest, dryRun: false });
    expect(
      readB2RepairArguments([
        "--confirm-study-digest",
        digest,
        "--confirm-spend-cap",
        "0.10",
        "--acknowledge-indeterminate",
        `b2-treatment-b-replacement-v1:${terminalDigest}`,
      ]),
    ).toEqual({
      acknowledgedIndeterminate: {
        idempotencyKey: "b2-treatment-b-replacement-v1",
        terminalDigest,
      },
      confirmSpendCap: 0.1,
      confirmedStudyDigest: digest,
      dryRun: false,
    });
    expect(() =>
      readB2RepairArguments([
        "--confirm-study-digest",
        digest,
        "--confirm-spend-cap",
        "0.10",
        "--acknowledge-indeterminate",
        `b2-treatment-b-replacement-v1:${"0".repeat(64)}`,
      ]),
    ).toThrow(/audited.*terminal|terminal.*digest/i);
    expect(() =>
      readB2RepairArguments([
        "--confirm-study-digest",
        "0".repeat(64),
        "--confirm-spend-cap",
        "0.10",
      ]),
    ).toThrow(/study[- ]digest/i);
  });

  it("continues only past the exact replacement terminal while charging its full reserve", async () => {
    const root = await realpath(await mkdtemp(path.join(tmpdir(), "shape-of-time-b2-repair-resume-")));
    temporaryRoots.push(root);
    const archive = new FilesystemRecoveryArchive({
      allowTemporaryRoot: true,
      archiveId: B2_TREATMENT_ARCHIVE_ID,
      root: path.join(root, "recovery"),
    });
    const journal = new FilesystemImageDispatchJournal({ archive });
    const client: ImageProviderExecutor = {
      execute: vi.fn(async (compiled, { clientRequestId }) => {
        if (compiled.manifest.idempotencyKey === "b2-treatment-b-replacement-v1") {
          throw new ImageProviderError({
            clientRequestId,
            code: "invalid_received_result",
            disposition: "indeterminate",
            httpStatus: 200,
            message: "synthetic durable-receive failure",
          });
        }
        return successfulResult(compiled, clientRequestId);
      }),
    };
    const dispatcher = new DurableImageDispatcher({ archive, client, journal });
    const retainedBytes = validPng(1536, 1024, [31, 41, 59]);
    const retainedA = {
      bytes: retainedBytes,
      evidence: {
        digest: sha256(retainedBytes),
        fileName: "A-observed-material.png",
        name: "Observed material illustration",
        treatmentId: "A" as const,
      },
    };
    const run = (terminalDigest?: string) =>
      runB2RepairStudy({
        ...(terminalDigest === undefined
          ? {}
          : {
              acknowledgedIndeterminate: {
                idempotencyKey: "b2-treatment-b-replacement-v1",
                terminalDigest,
              },
            }),
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        dispatcher,
        journal,
        retainedA,
        reviewRoot: path.join(root, "review"),
      });

    await expect(run()).rejects.toMatchObject({ disposition: "indeterminate" });
    expect(client.execute).toHaveBeenCalledTimes(1);
    await expect(run("0".repeat(64))).rejects.toThrow(/acknowledged.*digest/i);
    expect(client.execute).toHaveBeenCalledTimes(1);
    const state = await journal.inspect("b2-treatment-b-replacement-v1");
    if (state.status !== "indeterminate") throw new Error("expected indeterminate replacement B");

    const report = await run(digestJson(state.terminal));

    expect(client.execute).toHaveBeenCalledTimes(2);
    expect(report.candidates.map(({ treatmentId }) => treatmentId)).toEqual(["A", "C"]);
    expect(report.failedCandidates).toEqual([
      expect.objectContaining({ treatmentId: "B", terminalDigest: digestJson(state.terminal) }),
    ]);
    expect(report.cumulativeReplacementEstimatedCostMicrousd).toBe(30_050);
    expect(report.maximumAuthorizationConsumedMicrousd).toBe(80_050);
    expect(report.currentRun).toMatchObject({ acknowledgedIndeterminate: 1, providerDispatches: 1 });
    await expect(journal.inspect("b2-treatment-c-replacement-v1")).resolves.toMatchObject({ status: "completed" });
    await expect(access(path.join(root, "review", "study.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(access(path.join(root, "review", "index.html"))).rejects.toMatchObject({ code: "ENOENT" });

    const replay = await run(digestJson(state.terminal));
    expect(client.execute).toHaveBeenCalledTimes(2);
    expect(replay.currentRun).toMatchObject({
      acknowledgedIndeterminate: 1,
      durableReplays: 1,
      providerDispatches: 0,
    });
  });

  it("rejects a self-consistent review copy that does not match retained A's fixed output digest", () => {
    const substituted = validPng(1536, 1024, [7, 11, 13]);
    expect(() =>
      assertRetainedAProductionIdentity({
        bytes: substituted,
        evidence: {
          digest: sha256(substituted),
          fileName: "A-observed-material.png",
          imageRecoveryProof: {
            receiptDigest: "8f880a7985f16950133ded38036332d742574c732ceceb0d3ad5436ecaf9dec8",
          },
          manifestDigest: "eec4f7841235d40ee546346e83a3645579976a5d3c1978213a44ab717315dfbd",
          name: "Observed material illustration",
          treatmentId: "A",
        },
      }),
    ).toThrow(/fixed output digest|retained Treatment A/i);
  });

  it("recovers both replacements and replays the fixed archive without duplicate provider calls", async () => {
    const root = await realpath(await mkdtemp(path.join(tmpdir(), "shape-of-time-b2-repair-")));
    temporaryRoots.push(root);
    const archive = new FilesystemRecoveryArchive({
      allowTemporaryRoot: true,
      archiveId: B2_TREATMENT_ARCHIVE_ID,
      root: path.join(root, "recovery"),
    });
    const journal = new FilesystemImageDispatchJournal({ archive });
    const client: ImageProviderExecutor = {
      execute: vi.fn(async (compiled, { clientRequestId }) => successfulResult(compiled, clientRequestId)),
    };
    const dispatcher = new DurableImageDispatcher({ archive, client, journal });
    const retainedBytes = validPng(1536, 1024, [31, 41, 59]);
    const retainedA = {
      bytes: retainedBytes,
      evidence: {
        digest: sha256(retainedBytes),
        fileName: "A-observed-material.png",
        name: "Observed material illustration",
        treatmentId: "A" as const,
      },
    };
    const run = () =>
      runB2RepairStudy({
        archiveId: B2_TREATMENT_ARCHIVE_ID,
        dispatcher,
        journal,
        retainedA,
        reviewRoot: path.join(root, "review"),
      });

    const first = await run();
    const second = await run();

    expect(client.execute).toHaveBeenCalledTimes(2);
    expect(first.currentRun).toMatchObject({ providerDispatches: 2, durableReplays: 0 });
    expect(second.currentRun).toMatchObject({ providerDispatches: 0, durableReplays: 2 });
    expect(JSON.parse(await readFile(path.join(root, "review", "study.json"), "utf8"))).toMatchObject({
      candidates: [{ treatmentId: "A" }, { treatmentId: "B" }, { treatmentId: "C" }],
      judgment: "PENDING_OWNER_REVIEW",
    });
  });
});
