import { mkdtemp, readFile, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { FilesystemRecoveryArchive } from "../assets/filesystem-recovery-archive.js";
import { canonicalJson, sha256 } from "../domain/digests.js";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
  type CompletedImageOperation,
} from "./durable-image-dispatch.js";
import type { ImageReference } from "./image-contract.js";
import type { ImageProviderResult } from "./openai-image-client.js";
import { validPng } from "./png-test-support.js";
import {
  acceptReaderFirstPlate,
  C0_IMAGE_SPEND_CAP_USD,
  compileReaderFirstPlate,
  readerFirstPlateDryRun,
  runReaderFirstPlate,
  type ReaderFirstFableCandidate,
} from "./reader-first-plate.js";
import type { TrustedReaderFirstPlateEvidence } from "../../../scripts/reader-first-plate-evidence.mjs";

function mediumReference(): ImageReference {
  const bytes = validPng(8, 8, [42, 87, 101]);
  return {
    assetId: "treatment-b-medium",
    byteLength: bytes.byteLength,
    bytes,
    description: "Treatment B medium only; transfer no scene content.",
    digest: sha256(bytes),
    mediaType: "image/png",
    provenance: {
      evidenceId: "owner-approved-treatment-b-2026-07-19",
      kind: "human-approved-medium",
      scope: "shared-medium-only",
    },
    role: "shared-medium-only",
  };
}

function candidate(): ReaderFirstFableCandidate {
  return {
    bookId: "shape-of-time",
    evidence: {
      effort: "xhigh",
      model: "claude-fable-5",
      stopReason: "end_turn",
    },
    folioId: "root-folio-01",
    output: {
      imageDirection: {
        concreteScene: "Jay behind the counter, Tan opposite him, and two people waiting.",
        factLeftToImage: "The shop's wear and the unequal distribution of attention.",
        mustRemain: ["The phone is face down."],
        narrativeJob: "Establish Jay, Tan, and the shop as recurring presences.",
        purposefulChanges: ["This is the first plate."],
        unresolvedFacts: ["Do not define Clef beyond the exposed prose."],
      },
      proseParagraphs: ["Payment happens at the counter."],
    },
    version: 2,
  };
}

function bandCandidate(): ReaderFirstFableCandidate {
  const result = candidate();
  return {
    ...result,
    folioId: "root-folio-03",
    output: {
      ...result.output,
      imageDirection: {
        ...result.output.imageDirection!,
        concreteScene: "Jay and Tan inside the crowd at a local show.",
        narrativeJob: "Preserve Jay and Tan while revealing the recording at the room's edge.",
        purposefulChanges: ["The setting changes from the shop to a crowded performance."],
      },
    },
  };
}

function exposedPaymentReference(): ImageReference {
  const bytes = validPng(8, 8, [17, 31, 47]);
  return {
    assetId: "plate-root-payment",
    byteLength: bytes.byteLength,
    bytes,
    description: "Accepted Payment identity and root-book visual continuity.",
    digest: sha256(bytes),
    mediaType: "image/png",
    provenance: {
      evidenceId: "d".repeat(64),
      kind: "exposed-folio-image",
      scope: "book-local",
    },
    role: "root-payment-identity-and-world",
  };
}

function trustedPaymentReference(reference: ImageReference): TrustedReaderFirstPlateEvidence {
  return {
    acceptanceSha256: reference.provenance.evidenceId,
    plateId: "plate-root-payment",
    providerOutputSha256: reference.digest,
  };
}

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

describe("reader-first narrative plate authoring", () => {
  it("passes Fable's direction unchanged beside one verified prior narrative plate", () => {
    const fable = bandCandidate();
    const reference = exposedPaymentReference();
    const compiled = compileReaderFirstPlate({
      candidate: fable,
      candidateSha256: "a".repeat(64),
      plateId: "plate-root-band",
      references: [reference],
      trustedPlateEvidence: [trustedPaymentReference(reference)],
    });

    expect(compiled.request.manifest.endpoint).toBe("/v1/images/edits");
    expect(compiled.request.manifest.orderedReferences).toHaveLength(1);
    expect(compiled.request.manifest.orderedReferences[0]?.provenance.kind).toBe("exposed-folio-image");
    expect(compiled.request.exactPrompt).toContain(canonicalJson(fable.output.imageDirection));
    expect(compiled.request.exactPrompt).toContain("Preserve those continuities");
    expect(compiled.request.manifest.idempotencyKey).toBe("c0-reader-first-plate-root-band-v1");
  });

  it("binds the immutable Fable candidate and ordered references into the reviewed dry run", () => {
    const reference = exposedPaymentReference();
    const input = {
      candidate: bandCandidate(),
      candidateSha256: "a".repeat(64),
      plateId: "plate-root-band" as const,
      references: [reference],
      trustedPlateEvidence: [trustedPaymentReference(reference)],
    };
    const first = readerFirstPlateDryRun(compileReaderFirstPlate(input));
    const second = readerFirstPlateDryRun(compileReaderFirstPlate({ ...input, candidateSha256: "b".repeat(64) }));
    expect(first.plannedProviderOperations).toBe(1);
    expect(first.spendAuthorizationBoundUsd).toBe(C0_IMAGE_SPEND_CAP_USD);
    expect(first.operationDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(first.operationDigest).not.toBe(second.operationDigest);
    expect(() => compileReaderFirstPlate({ ...input, plateId: "plate-root-payment" })).toThrow(/candidate folio/u);
  });

  it("rejects a substituted Treatment B reference before any provider dispatch", () => {
    expect(() => compileReaderFirstPlate({
      candidate: candidate(),
      candidateSha256: "a".repeat(64),
      plateId: "plate-root-payment",
      references: [mediumReference()],
    })).toThrow(/wrong scope, provenance, or order/u);
  });

  it("rejects an exposed reference that is not its verified accepted source plate", () => {
    const reference = exposedPaymentReference();
    expect(() => compileReaderFirstPlate({
      candidate: bandCandidate(),
      candidateSha256: "a".repeat(64),
      plateId: "plate-root-band",
      references: [reference],
      trustedPlateEvidence: [{
        ...trustedPaymentReference(reference),
        providerOutputSha256: "e".repeat(64),
      }],
    })).toThrow(/not its verified accepted source plate/u);
  });

  it("dispatches once and writes provider-bound review evidence without auto-accepting the plate", async () => {
    const reference = exposedPaymentReference();
    const compiled = compileReaderFirstPlate({
      candidate: bandCandidate(),
      candidateSha256: "a".repeat(64),
      plateId: "plate-root-band",
      references: [reference],
      trustedPlateEvidence: [trustedPaymentReference(reference)],
    });
    const bytes = validPng(1024, 1536, [12, 34, 56]);
    const result: ImageProviderResult = {
      byteLength: bytes.byteLength,
      bytes,
      clientRequestId: "00000000-0000-4000-8000-000000000001",
      digest: sha256(bytes),
      estimatedOutputCostMicrousd: 41_000,
      estimatedTotalCostMicrousd: 55_000,
      height: 1536,
      latencyMs: 1_500,
      mediaType: "image/png",
      pricingVersion: "openai-standard-token-pricing-2026-07-19",
      providerProcessingMs: 1_200,
      providerRequestId: "req_payment",
      requestedModelSnapshot: "gpt-image-2-2026-04-21",
      servedModelEvidence: "unavailable-from-image-api",
      totalCostEstimateUnavailableReason: null,
      usage: null,
      width: 1024,
    };
    const imageProof = {
      archiveId: "shape-of-time-c0-images-2026-07",
      byteLength: bytes.byteLength,
      digest: result.digest,
      key: `sha256/${result.digest.slice(0, 2)}/${result.digest}`,
      mediaType: "image/png",
      receiptDigest: "c".repeat(64),
      schema: "shape-of-time.asset-recovery.v1" as const,
    };
    const terminal = {
      clientRequestId: result.clientRequestId,
      dispatchDigest: "d".repeat(64),
      fixtureDigest: "e".repeat(64),
      imageProof,
      manifestDigest: compiled.request.manifestDigest,
      preparedDigest: "f".repeat(64),
      replayProof: { ...imageProof, digest: "1".repeat(64), receiptDigest: "2".repeat(64) },
      resultDigest: "3".repeat(64),
      schema: "shape-of-time.image-operation-terminal.v1",
      state: "completed",
    } satisfies CompletedImageOperation;
    let dispatches = 0;
    let inspections = 0;
    const authoringRoot = await mkdtemp(path.join(os.tmpdir(), "reader-first-plate-review-"));
    const report = await runReaderFirstPlate({
      authoringRoot,
      compiled,
      dispatcher: {
        executeWithEvidence: async () => {
          dispatches += 1;
          return { resolution: "provider-dispatch", result };
        },
      },
      journal: {
        inspect: async () => {
          inspections += 1;
          return inspections === 1
            ? { status: "absent" as const }
            : { operation: {} as never, status: "completed" as const, terminal };
        },
      },
    });

    expect(dispatches).toBe(1);
    expect(report.judgment).toBe("PENDING_REVIEW");
    expect(path.dirname(report.reviewImagePath)).toBe(path.join(
      await realpath(authoringRoot),
      "images",
      "review",
      "plate-root-band",
      report.operationDigest,
    ));
    expect(report.providerReceipt.outputSha256).toBe(result.digest);
    expect(await readFile(report.reviewImagePath)).toEqual(Buffer.from(bytes));
    expect(JSON.parse(await readFile(report.providerReceiptPath, "utf8"))).toMatchObject({
      outputSha256: result.digest,
      plateId: "plate-root-band",
      providerRequestId: "req_payment",
    });

  });

  it("accepts only provider-bound recovered pixels and the candidate's actual direction", async () => {
    const fable = bandCandidate();
    const reference = exposedPaymentReference();
    const compiled = compileReaderFirstPlate({
      candidate: fable,
      candidateSha256: "a".repeat(64),
      plateId: "plate-root-band",
      references: [reference],
      trustedPlateEvidence: [trustedPaymentReference(reference)],
    });
    const bytes = validPng(1024, 1536, [12, 34, 56]);
    const authoringRoot = await mkdtemp(path.join(os.tmpdir(), "reader-first-plate-accept-"));
    const archive = new FilesystemRecoveryArchive({
      allowTemporaryRoot: true,
      archiveId: "shape-of-time-c0-reader-first-2026-07",
      root: path.join(authoringRoot, "images", "recovery"),
    });
    const journal = new FilesystemImageDispatchJournal({ archive });
    let dispatches = 0;
    const usage = usageForExactTotal(30_100);
    const dispatcher = new DurableImageDispatcher({
      archive,
      client: {
        execute: async (_request, { clientRequestId }) => {
          dispatches += 1;
          return {
            byteLength: bytes.byteLength,
            bytes,
            clientRequestId,
            digest: sha256(bytes),
            estimatedOutputCostMicrousd: usage.output_tokens * 30,
            estimatedTotalCostMicrousd: 30_100,
            height: 1536,
            latencyMs: 1_500,
            mediaType: "image/png" as const,
            pricingVersion: "openai-standard-token-pricing-2026-07-19",
            providerProcessingMs: 1_200,
            providerRequestId: "req_band",
            requestedModelSnapshot: "gpt-image-2-2026-04-21" as const,
            servedModelEvidence: "unavailable-from-image-api" as const,
            totalCostEstimateUnavailableReason: null,
            usage,
            width: 1024,
          };
        },
      },
      journal,
    });
    const report = await runReaderFirstPlate({
      authoringRoot,
      compiled,
      dispatcher,
      journal,
    });
    expect(dispatches).toBe(1);
    const accepted = await acceptReaderFirstPlate({
      authoringRoot,
      candidate: fable,
      candidateSha256: "a".repeat(64),
      folioId: "root-folio-03",
      plateId: "plate-root-band",
      providerReceiptPath: report.providerReceiptPath,
      reviewImagePath: report.reviewImagePath,
      trustedPlateEvidence: [trustedPaymentReference(reference)],
    });
    expect(accepted.acceptance).toMatchObject({
      assetSha256: sha256(bytes),
      candidateSha256: "a".repeat(64),
      folioId: "root-folio-03",
      plateId: "plate-root-band",
      providerOutputSha256: sha256(bytes),
      version: 2,
    });
    expect(JSON.parse(await readFile(accepted.acceptancePath, "utf8"))).toEqual(
      accepted.acceptance,
    );
    await expect(
      acceptReaderFirstPlate({
        authoringRoot,
        candidate: { ...fable, output: { ...fable.output, imageDirection: candidate().output.imageDirection } },
        candidateSha256: "a".repeat(64),
        folioId: "root-folio-03",
        plateId: "plate-root-band",
        providerReceiptPath: report.providerReceiptPath,
        reviewImagePath: report.reviewImagePath,
        trustedPlateEvidence: [trustedPaymentReference(reference)],
      }),
    ).rejects.toThrow(/exact Fable candidate/u);
  });
});
