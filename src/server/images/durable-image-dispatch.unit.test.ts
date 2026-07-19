import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { FilesystemRecoveryArchive } from "../assets/filesystem-recovery-archive.js";
import { digestJson, sha256 } from "../domain/digests.js";
import { compileImageRequest } from "./image-contract.js";
import {
  DurableImageDispatcher,
  FilesystemImageDispatchJournal,
  ImageDispatchStateError,
  type ImageDispatchJournal,
  type ImageProviderExecutor,
} from "./durable-image-dispatch.js";
import { GPT_IMAGE_SNAPSHOT } from "./image-contract.js";
import { ImageProviderError, type ImageProviderResult } from "./openai-image-client.js";
import { validPng } from "./png-test-support.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

async function harness(execute: ImageProviderExecutor["execute"]) {
  const root = await mkdtemp(path.join(tmpdir(), "shape-of-time-dispatch-"));
  roots.push(root);
  const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "dispatch-test", root });
  const journal = new FilesystemImageDispatchJournal({
    archive,
    randomUuid: () => "77777777-7777-4777-8777-777777777777",
  });
  const client: ImageProviderExecutor = { execute: vi.fn(execute) };
  return { archive, client, dispatcher: new DurableImageDispatcher({ archive, client, journal }), journal, root };
}

function request(prompt = "A ceramic cup on a plain table.") {
  return compileImageRequest({
    idempotencyKey: "durable-operation",
    kind: "generate",
    prompt,
    promptVersion: "v1",
    quality: "low",
    size: "1024x1024",
  });
}

function providerResult(): ImageProviderResult {
  const bytes = validPng(1024, 1024, [12, 34, 56]);
  return {
    byteLength: bytes.byteLength,
    bytes,
    clientRequestId: "77777777-7777-4777-8777-777777777777",
    digest: sha256(bytes),
    estimatedOutputCostMicrousd: 6_000,
    estimatedTotalCostMicrousd: null,
    height: 1024,
    latencyMs: 50,
    mediaType: "image/png",
    pricingVersion: "openai-standard-token-pricing-2026-07-19",
    providerProcessingMs: 40,
    providerRequestId: "req_durable",
    requestedModelSnapshot: GPT_IMAGE_SNAPSHOT,
    servedModelEvidence: "unavailable-from-image-api",
    totalCostEstimateUnavailableReason: "usage-unavailable",
    usage: null,
    width: 1024,
  };
}

function approvedReference(assetId: string, role: string, color: readonly [number, number, number]) {
  const bytes = validPng(8, 8, color);
  return {
    assetId,
    byteLength: bytes.byteLength,
    bytes,
    description: `Approved ${role} reference`,
    digest: sha256(bytes),
    mediaType: "image/png" as const,
    provenance: {
      evidenceId: `approval-${assetId}`,
      kind: "human-approved-anchor" as const,
      scope: role === "identity" ? ("recurring-identity" as const) : ("book-local" as const),
    },
    role,
  };
}

describe("durable image dispatch", () => {
  it("rejects non-PNG bytes from an executor before they can become durable image evidence", async () => {
    const bytes = new TextEncoder().encode("not a PNG");
    const setup = await harness(async () => ({
      ...providerResult(),
      byteLength: bytes.byteLength,
      bytes,
      digest: sha256(bytes),
    }));

    await expect(setup.dispatcher.execute(request())).rejects.toMatchObject({ code: "invalid_received_result" });
    await expect(setup.journal.inspect("durable-operation")).resolves.toMatchObject({ status: "indeterminate" });
  });

  it("archives the exact claim before dispatch and replays a completed same-key operation without a second call", async () => {
    let sawDispatchingClaim = false;
    const setup = await harness(async (compiled, { clientRequestId }) => {
      sawDispatchingClaim = (await setup.journal.inspect(compiled.manifest.idempotencyKey)).status === "dispatching";
      expect(clientRequestId).toBe("77777777-7777-4777-8777-777777777777");
      return providerResult();
    });

    const first = await setup.dispatcher.execute(request());
    const second = await setup.dispatcher.execute(request());

    expect(sawDispatchingClaim).toBe(true);
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    expect({ ...second, bytes: undefined }).toEqual({ ...first, bytes: undefined });
    expect(Buffer.from(second.bytes).equals(Buffer.from(first.bytes))).toBe(true);
    expect((await setup.journal.inspect("durable-operation")).status).toBe("completed");
  });

  it("rejects changed intent under the same application idempotency key", async () => {
    const setup = await harness(async () => providerResult());
    await setup.dispatcher.execute(request());

    await expect(setup.dispatcher.execute(request("A different scene."))).rejects.toThrow(/idempotency.*intent/i);
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
  });

  it("permits only one dispatch when two journal instances race for the same operation", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "shape-of-time-dispatch-race-"));
    roots.push(root);
    const archive = new FilesystemRecoveryArchive({ allowTemporaryRoot: true, archiveId: "dispatch-race", root });
    const execute = vi.fn(async (_compiled: ReturnType<typeof request>, { clientRequestId }: { clientRequestId: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { ...providerResult(), clientRequestId };
    });
    const firstJournal = new FilesystemImageDispatchJournal({
      archive,
      randomUuid: () => "77777777-7777-4777-8777-777777777777",
    });
    const secondJournal = new FilesystemImageDispatchJournal({
      archive,
      randomUuid: () => "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    const first = new DurableImageDispatcher({ archive, client: { execute }, journal: firstJournal });
    const second = new DurableImageDispatcher({ archive, client: { execute }, journal: secondJournal });

    const results = await Promise.allSettled([first.execute(request()), second.execute(request())]);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results.filter(({ status }) => status === "rejected")).toHaveLength(1);
  });

  it("persists a definitive rejection and never purchases it again", async () => {
    const setup = await harness(async (_compiled, { clientRequestId }) => {
      throw new ImageProviderError({
        clientRequestId,
        code: "moderation_blocked",
        disposition: "rejected",
        httpStatus: 400,
        message: "image request was rejected",
        moderationDetails: { stage: "input" },
        providerRequestId: "req_rejected",
      });
    });

    await expect(setup.dispatcher.execute(request())).rejects.toMatchObject({ disposition: "rejected" });
    await expect(setup.dispatcher.execute(request())).rejects.toMatchObject({ disposition: "rejected" });
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    const state = await setup.journal.inspect("durable-operation");
    expect(state.status).toBe("rejected");
    if (state.status !== "rejected") throw new Error("expected rejected operation");
    expect(state.terminal).toMatchObject({
      latencyMs: null,
      latencyUnavailableReason: "not-captured-by-executor",
      pricingVersion: "openai-standard-token-pricing-2026-07-19",
      totalCostEstimateUnavailableReason: "attempt-failed-before-usage",
      usage: null,
    });
  });

  it("records an indeterminate dispatch and never sends it again", async () => {
    const setup = await harness(async (_compiled, { clientRequestId }) => {
      throw new ImageProviderError({
        clientRequestId,
        code: "transport_ambiguous",
        disposition: "indeterminate",
        httpStatus: null,
        message: "connection reset after dispatch",
      });
    });

    await expect(setup.dispatcher.execute(request())).rejects.toMatchObject({ disposition: "indeterminate" });
    await expect(setup.dispatcher.execute(request())).rejects.toBeInstanceOf(ImageDispatchStateError);
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    expect((await setup.journal.inspect("durable-operation")).status).toBe("indeterminate");
  });

  it("blocks a claimed dispatch with no completion instead of guessing whether the provider received it", async () => {
    const setup = await harness(async () => providerResult());
    const operation = await setup.journal.prepare(request());
    await expect(setup.journal.acquireDispatch(operation)).resolves.toBe(true);

    await expect(setup.dispatcher.execute(request())).rejects.toMatchObject({ disposition: "indeterminate" });
    expect(setup.client.execute).not.toHaveBeenCalled();
  });

  it("resumes a prepared operation that was never marked dispatched", async () => {
    const setup = await harness(async () => providerResult());
    await setup.journal.prepare(request());

    await expect(setup.dispatcher.execute(request())).resolves.toMatchObject({ providerRequestId: "req_durable" });
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
  });

  it("refuses to terminalize an operation until its durable dispatch marker exists", async () => {
    const setup = await harness(async () => providerResult());
    const operation = await setup.journal.prepare(request());
    const failure = new ImageProviderError({
      clientRequestId: operation.clientRequestId,
      code: "synthetic_failure",
      disposition: "rejected",
      httpStatus: 400,
      message: "must not terminalize before dispatch",
    });

    await expect(setup.journal.fail(operation, failure)).rejects.toThrow(/dispatch/i);
    expect((await setup.journal.inspect("durable-operation")).status).toBe("prepared");
  });

  it("archives and binds every ordered edit reference before dispatch", async () => {
    const setup = await harness(async () => providerResult());
    const identity = approvedReference("identity", "identity", [2, 3, 5]);
    const place = approvedReference("place", "place", [7, 11, 13]);
    const compiled = compileImageRequest({
      idempotencyKey: "durable-edit-operation",
      kind: "edit",
      prompt: "Move the approved figure across the approved room.",
      promptVersion: "v1",
      quality: "low",
      references: [identity, place],
      requiredAnchors: [
        { assetId: identity.assetId, digest: identity.digest, role: identity.role },
        { assetId: place.assetId, digest: place.digest, role: place.role },
      ],
      size: "1024x1024",
    });

    await setup.dispatcher.execute(compiled);
    const state = await setup.journal.inspect("durable-edit-operation");
    expect(state.status).toBe("completed");
    if (state.status !== "completed") throw new Error("expected completed edit operation");
    expect(state.operation.referenceProofs.map(({ digest }) => digest)).toEqual([identity.digest, place.digest]);
    const snapshot = await setup.archive.snapshot();
    expect(snapshot.entries.map(({ digest }) => digest)).toEqual(
      expect.arrayContaining([identity.digest, place.digest]),
    );
  });

  it("reconciles archived provider output after a crash before terminal linkage without redispatch", async () => {
    const setup = await harness(async () => providerResult());
    let interruptCompletion = true;
    const real = setup.journal;
    const interrupted: ImageDispatchJournal = {
      acquireDispatch: (operation) => real.acquireDispatch(operation),
      complete: async (operation, evidence) => {
        if (interruptCompletion) {
          interruptCompletion = false;
          throw new Error("synthetic crash before terminal link");
        }
        await real.complete(operation, evidence);
      },
      fail: (operation, error) => real.fail(operation, error),
      inspect: (idempotencyKey) => real.inspect(idempotencyKey),
      prepare: (compiled) => real.prepare(compiled),
      recordReceived: (operation, fixture, bytes) => real.recordReceived(operation, fixture, bytes),
    };
    const dispatcher = new DurableImageDispatcher({ archive: setup.archive, client: setup.client, journal: interrupted });

    await expect(dispatcher.execute(request())).rejects.toMatchObject({ code: "post_dispatch_evidence_failure" });
    expect((await real.inspect("durable-operation")).status).toBe("received");
    await expect(dispatcher.execute(request())).resolves.toMatchObject({ providerRequestId: "req_durable" });
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
    expect((await real.inspect("durable-operation")).status).toBe("completed");
  });

  it("reconciles exact received bytes after a crash before recovery archival without redispatch", async () => {
    const setup = await harness(async () => providerResult());
    let interruptAfterReceive = true;
    const real = setup.journal;
    const interrupted: ImageDispatchJournal = {
      acquireDispatch: (operation) => real.acquireDispatch(operation),
      complete: (operation, evidence) => real.complete(operation, evidence),
      fail: (operation, error) => real.fail(operation, error),
      inspect: (idempotencyKey) => real.inspect(idempotencyKey),
      prepare: (compiled) => real.prepare(compiled),
      recordReceived: async (operation, fixture, bytes) => {
        await real.recordReceived(operation, fixture, bytes);
        if (interruptAfterReceive) {
          interruptAfterReceive = false;
          throw new Error("synthetic crash after durable receive");
        }
      },
    };
    const dispatcher = new DurableImageDispatcher({ archive: setup.archive, client: setup.client, journal: interrupted });

    await expect(dispatcher.execute(request())).rejects.toMatchObject({ code: "post_dispatch_evidence_failure" });
    expect((await real.inspect("durable-operation")).status).toBe("received");
    await expect(dispatcher.execute(request())).resolves.toMatchObject({ providerRequestId: "req_durable" });
    expect(setup.client.execute).toHaveBeenCalledTimes(1);
  });

  it("rejects fabricated completion proofs and a failed result from another client request", async () => {
    const setup = await harness(async () => providerResult());
    const operation = await setup.journal.prepare(request());
    await setup.journal.acquireDispatch(operation);
    const fixture = await import("./openai-image-client.js").then(({ sanitizeImageResult }) =>
      sanitizeImageResult(request(), providerResult()),
    );
    await setup.journal.recordReceived(operation, fixture, providerResult().bytes);
    const fakeProof = {
      archiveId: "dispatch-test",
      byteLength: 1,
      digest: "0".repeat(64),
      key: `sha256/00/${"0".repeat(64)}`,
      mediaType: "image/png",
      receiptDigest: "0".repeat(64),
      schema: "shape-of-time.asset-recovery.v1" as const,
    };
    await expect(
      setup.journal.complete(operation, { fixture, imageProof: fakeProof, replayProof: fakeProof }),
    ).rejects.toThrow(/recovery|proof|object/i);

    const otherError = new ImageProviderError({
      clientRequestId: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
      code: "wrong-lineage",
      disposition: "rejected",
      httpStatus: 400,
      message: "wrong client request",
    });
    await expect(setup.journal.fail(operation, otherError)).rejects.toThrow(/client request/i);
  });

  it("refuses completed state when its atomic received resolution is missing", async () => {
    const setup = await harness(async () => providerResult());
    await setup.dispatcher.execute(request());
    const state = await setup.journal.inspect("durable-operation");
    if (state.status !== "completed") throw new Error("expected completed operation");
    await rm(
      path.join(
        setup.root,
        "operations",
        "images",
        "v1",
        state.operation.idempotencyKeyDigest.slice(0, 2),
        state.operation.idempotencyKeyDigest,
        "resolution.json",
      ),
    );

    await expect(setup.journal.inspect("durable-operation")).rejects.toThrow(/received|terminal/i);
  });

  it("refuses completed state after a required recovery object is lost", async () => {
    const setup = await harness(async () => providerResult());
    await setup.dispatcher.execute(request());
    const state = await setup.journal.inspect("durable-operation");
    if (state.status !== "completed") throw new Error("expected completed operation");
    await rm(path.join(setup.root, "objects", state.terminal.imageProof.key));

    await expect(setup.journal.inspect("durable-operation")).rejects.toThrow(/recovery object|inventory/i);
  });

  it("rejects a caller-mutated prepared operation before writing its dispatch marker", async () => {
    const setup = await harness(async () => providerResult());
    const operation = await setup.journal.prepare(request());
    operation.clientRequestId = "ffffffff-ffff-4fff-8fff-ffffffffffff";

    await expect(setup.journal.acquireDispatch(operation)).rejects.toThrow(/preparation evidence|changed/i);
    expect((await setup.journal.inspect("durable-operation")).status).toBe("prepared");
  });

  it("rejects received fixture evidence from another client request", async () => {
    const setup = await harness(async () => providerResult());
    const compiled = request();
    const operation = await setup.journal.prepare(compiled);
    await setup.journal.acquireDispatch(operation);
    const otherResult = {
      ...providerResult(),
      clientRequestId: "88888888-8888-4888-8888-888888888888",
    };
    const fixture = await import("./openai-image-client.js").then(({ sanitizeImageResult }) =>
      sanitizeImageResult(compiled, otherResult),
    );

    await expect(setup.journal.recordReceived(operation, fixture, otherResult.bytes)).rejects.toThrow(
      /client request|received.*evidence/i,
    );
  });

  it("rejects a coherently rehashed replay fixture with invalid result semantics", async () => {
    const setup = await harness(async () => providerResult());
    const compiled = request();
    const operation = await setup.journal.prepare(compiled);
    await setup.journal.acquireDispatch(operation);
    const result = providerResult();
    const fixture = await import("./openai-image-client.js").then(({ sanitizeImageResult }) =>
      sanitizeImageResult(compiled, result),
    );
    const forged = structuredClone(fixture);
    forged.result.pricingVersion = "fabricated";
    forged.resultDigest = digestJson(forged.result);
    const fixtureBase = {
      manifest: forged.manifest,
      manifestDigest: forged.manifestDigest,
      result: forged.result,
      resultDigest: forged.resultDigest,
      schema: forged.schema,
    };
    forged.fixtureDigest = digestJson(fixtureBase);

    await expect(setup.journal.recordReceived(operation, forged, result.bytes)).rejects.toThrow(
      /replay result|invariant|pricing/i,
    );
    await expect(setup.journal.inspect("durable-operation")).resolves.toMatchObject({ status: "dispatching" });
  });

  it("cannot replace durably received provider output with a failed terminal", async () => {
    const setup = await harness(async () => providerResult());
    const compiled = request();
    const operation = await setup.journal.prepare(compiled);
    await setup.journal.acquireDispatch(operation);
    const result = providerResult();
    const fixture = await import("./openai-image-client.js").then(({ sanitizeImageResult }) =>
      sanitizeImageResult(compiled, result),
    );
    await setup.journal.recordReceived(operation, fixture, result.bytes);
    const error = new ImageProviderError({
      clientRequestId: operation.clientRequestId,
      code: "late_failure",
      disposition: "indeterminate",
      httpStatus: 200,
      message: "must not replace received bytes",
    });

    await expect(setup.journal.fail(operation, error)).rejects.toThrow(/state|received|transition/i);
    expect((await setup.journal.inspect("durable-operation")).status).toBe("received");
  });

  it("cannot add received provider output after a failed terminal", async () => {
    const setup = await harness(async () => providerResult());
    const compiled = request();
    const operation = await setup.journal.prepare(compiled);
    await setup.journal.acquireDispatch(operation);
    const error = new ImageProviderError({
      clientRequestId: operation.clientRequestId,
      code: "provider_failure",
      disposition: "rejected",
      httpStatus: 400,
      message: "provider rejected the operation",
    });
    await setup.journal.fail(operation, error);
    const result = providerResult();
    const fixture = await import("./openai-image-client.js").then(({ sanitizeImageResult }) =>
      sanitizeImageResult(compiled, result),
    );

    await expect(setup.journal.recordReceived(operation, fixture, result.bytes)).rejects.toThrow(
      /state|terminal|transition/i,
    );
    expect((await setup.journal.inspect("durable-operation")).status).toBe("rejected");
  });

  it("carries the complete received result in one atomic resolution record", async () => {
    const setup = await harness(async () => providerResult());
    const compiled = request();
    const operation = await setup.journal.prepare(compiled);
    await setup.journal.acquireDispatch(operation);
    const result = providerResult();
    const fixture = await import("./openai-image-client.js").then(({ sanitizeImageResult }) =>
      sanitizeImageResult(compiled, result),
    );
    await setup.journal.recordReceived(operation, fixture, result.bytes);
    await rm(
      path.join(
        setup.root,
        "operations",
        "images",
        "v1",
        operation.idempotencyKeyDigest.slice(0, 2),
        operation.idempotencyKeyDigest,
        "received.json",
      ),
      { force: true },
    );

    await expect(setup.journal.inspect("durable-operation")).resolves.toMatchObject({ status: "received" });
  });

  it("carries the complete failed terminal in one atomic resolution record", async () => {
    const setup = await harness(async () => providerResult());
    const operation = await setup.journal.prepare(request());
    await setup.journal.acquireDispatch(operation);
    await setup.journal.fail(
      operation,
      new ImageProviderError({
        clientRequestId: operation.clientRequestId,
        code: "provider_failure",
        disposition: "rejected",
        httpStatus: 400,
        message: "provider rejected the operation",
      }),
    );
    await rm(
      path.join(
        setup.root,
        "operations",
        "images",
        "v1",
        operation.idempotencyKeyDigest.slice(0, 2),
        operation.idempotencyKeyDigest,
        "terminal.json",
      ),
      { force: true },
    );

    await expect(setup.journal.inspect("durable-operation")).resolves.toMatchObject({ status: "rejected" });
  });
});
