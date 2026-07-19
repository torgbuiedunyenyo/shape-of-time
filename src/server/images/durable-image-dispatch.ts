import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  createImmutableFile,
  type FilesystemRecoveryArchive,
  readImmutableFile,
  type RecoveryProof,
  writeImmutable,
} from "../assets/filesystem-recovery-archive.js";
import { canonicalJson, digestJson, sha256 } from "../domain/digests.js";
import {
  snapshotCompiledImageRequest,
  type CompiledImageRequest,
  type ImageRequestManifest,
} from "./image-contract.js";
import {
  ImageProviderError,
  GPT_IMAGE_PRICING_VERSION,
  replayImageResult,
  sanitizeImageResult,
  validateImageReplayFixture,
  type ImageProviderResult,
  type ImageReplayFixture,
} from "./openai-image-client.js";

export interface ImageProviderExecutor {
  execute(
    compiled: CompiledImageRequest,
    options: { clientRequestId: string },
  ): Promise<ImageProviderResult>;
}

export interface PreparedImageOperation {
  archiveId: string;
  clientRequestId: string;
  idempotencyKeyDigest: string;
  manifest: ImageRequestManifest;
  manifestDigest: string;
  preparedDigest: string;
  referenceProofs: RecoveryProof[];
  schema: "shape-of-time.image-operation-prepared.v1";
}

interface DispatchedImageOperation {
  clientRequestId: string;
  dispatchDigest: string;
  manifestDigest: string;
  preparedDigest: string;
  schema: "shape-of-time.image-operation-dispatched.v1";
}

interface ReceivedImageOperation {
  clientRequestId: string;
  dispatchDigest: string;
  fixture: ImageReplayFixture;
  manifestDigest: string;
  outputBase64: string;
  preparedDigest: string;
  schema: "shape-of-time.image-operation-received.v1";
}

interface ImageResolutionBase {
  clientRequestId: string;
  dispatchDigest: string;
  evidenceDigest: string;
  manifestDigest: string;
  preparedDigest: string;
  schema: "shape-of-time.image-operation-resolution.v1";
}

export interface CompletedImageOperation {
  clientRequestId: string;
  dispatchDigest: string;
  fixtureDigest: string;
  imageProof: RecoveryProof;
  manifestDigest: string;
  preparedDigest: string;
  replayProof: RecoveryProof;
  resultDigest: string;
  schema: "shape-of-time.image-operation-terminal.v1";
  state: "completed";
}

interface FailedImageOperation {
  clientRequestId: string;
  code: string;
  dispatchDigest: string;
  disposition: "indeterminate" | "rejected";
  httpStatus: number | null;
  latencyMs: number | null;
  latencyUnavailableReason: "not-captured-by-executor" | null;
  manifestDigest: string;
  message: string;
  moderationDetails: unknown;
  preparedDigest: string;
  pricingVersion: string;
  providerProcessingMs: number | null;
  providerRequestId: string | null;
  schema: "shape-of-time.image-operation-terminal.v1";
  state: "indeterminate" | "rejected";
  totalCostEstimateUnavailableReason: "attempt-failed-before-usage";
  usage: null;
}

type ImageResolutionRecord =
  | (ImageResolutionBase & { received: ReceivedImageOperation; state: "received" })
  | (ImageResolutionBase & {
      state: "indeterminate" | "rejected";
      terminal: FailedImageOperation;
    });

type TerminalImageOperation = CompletedImageOperation | FailedImageOperation;

export type ImageOperationInspection =
  | { status: "absent" }
  | { operation: PreparedImageOperation; status: "prepared" }
  | { operation: PreparedImageOperation; status: "dispatching" }
  | { operation: PreparedImageOperation; status: "completed"; terminal: CompletedImageOperation }
  | { operation: PreparedImageOperation; received: ReceivedImageOperation; status: "received" }
  | { operation: PreparedImageOperation; status: "indeterminate" | "rejected"; terminal: FailedImageOperation };

export class ImageDispatchStateError extends Error {
  readonly disposition: "indeterminate" | "rejected";
  readonly status: "dispatching" | "indeterminate" | "rejected";

  constructor(status: "dispatching" | "indeterminate" | "rejected", message: string) {
    super(message);
    this.name = "ImageDispatchStateError";
    this.status = status;
    this.disposition = status === "rejected" ? "rejected" : "indeterminate";
  }
}

export interface ImageDispatchJournal {
  acquireDispatch(operation: PreparedImageOperation): Promise<boolean>;
  complete(
    operation: PreparedImageOperation,
    evidence: {
      fixture: ImageReplayFixture;
      imageProof: RecoveryProof;
      replayProof: RecoveryProof;
    },
  ): Promise<void>;
  fail(operation: PreparedImageOperation, error: ImageProviderError): Promise<void>;
  inspect(idempotencyKey: string): Promise<ImageOperationInspection>;
  prepare(compiled: CompiledImageRequest): Promise<PreparedImageOperation>;
  recordReceived(operation: PreparedImageOperation, fixture: ImageReplayFixture, bytes: Uint8Array): Promise<void>;
}

export interface DurableImageExecution {
  resolution: "archive-reconciliation" | "durable-replay" | "provider-dispatch";
  result: ImageProviderResult;
}

interface StoredEnvelope<T> {
  record: T;
  recordDigest: string;
  schema: "shape-of-time.immutable-record-envelope.v1";
}

export class FilesystemImageDispatchJournal implements ImageDispatchJournal {
  readonly #archive: FilesystemRecoveryArchive;
  readonly #randomUuid: () => string;

  constructor(options: { archive: FilesystemRecoveryArchive; randomUuid?: () => string }) {
    this.#archive = options.archive;
    this.#randomUuid = options.randomUuid ?? randomUUID;
  }

  async prepare(compiled: CompiledImageRequest): Promise<PreparedImageOperation> {
    const request = snapshotCompiledImageRequest(compiled);
    const root = await this.#archive.resolveRoot();
    const referenceProofs = await Promise.all(
      request.references.map((reference) => this.#archive.archive(reference.bytes, reference.mediaType)),
    );
    const idempotencyKeyDigest = sha256(request.manifest.idempotencyKey);
    const path_ = this.#recordPath(root, idempotencyKeyDigest, "prepared.json");
    const base = {
      archiveId: this.#archive.archiveId,
      clientRequestId: this.#randomUuid(),
      idempotencyKeyDigest,
      manifest: request.manifest,
      manifestDigest: request.manifestDigest,
      referenceProofs,
      schema: "shape-of-time.image-operation-prepared.v1" as const,
    };
    const candidate: PreparedImageOperation = { ...base, preparedDigest: digestJson(base) };
    const created = await createImmutableFile(path_, encodeEnvelope(candidate), root);
    const operation = created ? candidate : await readEnvelope<PreparedImageOperation>(path_, root);
    validatePrepared(operation, this.#archive.archiveId, idempotencyKeyDigest);
    await verifyPreparedReferences(operation, this.#archive);
    if (
      operation.manifestDigest !== request.manifestDigest ||
      canonicalJson(operation.manifest) !== canonicalJson(request.manifest)
    ) {
      throw new Error("image idempotency key was already claimed with different intent");
    }
    return operation;
  }

  async inspect(idempotencyKey: string): Promise<ImageOperationInspection> {
    const root = await this.#archive.resolveRoot();
    const keyDigest = sha256(idempotencyKey);
    const preparedPath = this.#recordPath(root, keyDigest, "prepared.json");
    let operation: PreparedImageOperation;
    try {
      operation = await readEnvelope<PreparedImageOperation>(preparedPath, root);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { status: "absent" };
      throw error;
    }
    validatePrepared(operation, this.#archive.archiveId, keyDigest);
    await verifyPreparedReferences(operation, this.#archive);
    const dispatched = await readOptionalEnvelope<DispatchedImageOperation>(
      this.#recordPath(root, keyDigest, "dispatched.json"),
      root,
    );
    if (dispatched !== null) validateDispatched(dispatched, operation);
    const resolution = await readOptionalEnvelope<ImageResolutionRecord>(
      this.#recordPath(root, keyDigest, "resolution.json"),
      root,
    );
    let received: ReceivedImageOperation | null = null;
    let failedTerminal: FailedImageOperation | null = null;
    if (resolution !== null) {
      if (dispatched === null) throw new Error("image resolution claim has no durable dispatch marker");
      validateResolution(resolution, operation, dispatched);
      if (resolution.state === "received") {
        received = resolution.received;
        validateReceived(received, operation, dispatched);
        if (resolution.evidenceDigest !== digestJson(received)) {
          throw new Error("received image operation does not match its atomic resolution digest");
        }
      } else {
        failedTerminal = resolution.terminal;
        validateTerminal(failedTerminal, operation, dispatched, null);
        if (
          failedTerminal.state !== resolution.state ||
          resolution.evidenceDigest !== digestJson(failedTerminal)
        ) {
          throw new Error("failed image operation does not match its atomic resolution digest");
        }
      }
    }
    const terminal = await readOptionalEnvelope<TerminalImageOperation>(
      this.#recordPath(root, keyDigest, "terminal.json"),
      root,
    );
    if (terminal !== null) {
      if (dispatched === null) throw new Error("terminal image operation has no durable dispatch marker");
      validateTerminal(terminal, operation, dispatched, received);
      if (terminal.state !== "completed" || received === null || resolution?.state !== "received") {
        throw new Error("terminal image operation conflicts with its atomic received resolution");
      }
      await verifyCompletedRecovery(terminal, received, this.#archive);
      return { operation, status: "completed", terminal };
    }
    if (failedTerminal !== null) {
      return { operation, status: failedTerminal.state, terminal: failedTerminal };
    }
    if (dispatched !== null) {
      if (received !== null) {
        return { operation, received, status: "received" };
      }
      return { operation, status: "dispatching" };
    }
    return { operation, status: "prepared" };
  }

  async acquireDispatch(operation: PreparedImageOperation): Promise<boolean> {
    const root = await this.#archive.resolveRoot();
    const state = await this.#inspectExactOperation(operation);
    if (state.status !== "prepared") return false;
    const canonicalOperation = state.operation;
    const dispatchedBase = {
      clientRequestId: canonicalOperation.clientRequestId,
      manifestDigest: canonicalOperation.manifestDigest,
      preparedDigest: canonicalOperation.preparedDigest,
      schema: "shape-of-time.image-operation-dispatched.v1",
    } as const;
    const dispatched: DispatchedImageOperation = {
      ...dispatchedBase,
      dispatchDigest: digestJson(dispatchedBase),
    };
    return createImmutableFile(
      this.#recordPath(root, canonicalOperation.idempotencyKeyDigest, "dispatched.json"),
      encodeEnvelope(dispatched),
      root,
    );
  }

  async complete(
    operation: PreparedImageOperation,
    evidence: {
      fixture: ImageReplayFixture;
      imageProof: RecoveryProof;
      replayProof: RecoveryProof;
    },
  ): Promise<void> {
    const state = await this.#inspectExactOperation(operation);
    if (state.status !== "received") {
      throw new Error(`image operation cannot complete from ${state.status} state`);
    }
    const canonicalOperation = state.operation;
    const root = await this.#archive.resolveRoot();
    const dispatched = await this.#readRequiredDispatch(root, canonicalOperation);
    const received = state.received;
    validateReceived(received, canonicalOperation, dispatched);
    if (canonicalJson(received.fixture) !== canonicalJson(evidence.fixture)) {
      throw new Error("completed image evidence does not match the durably received result");
    }
    await Promise.all([this.#archive.verify(evidence.imageProof), this.#archive.verify(evidence.replayProof)]);
    const imageBytes = await this.#archive.read(evidence.imageProof);
    const replayBytes = await this.#archive.read(evidence.replayProof);
    if (
      evidence.imageProof.digest !== evidence.fixture.result.digest ||
      evidence.imageProof.byteLength !== evidence.fixture.result.byteLength ||
      evidence.imageProof.mediaType !== evidence.fixture.result.mediaType ||
      sha256(imageBytes) !== evidence.fixture.result.digest ||
      evidence.replayProof.mediaType !== "application/vnd.shape-of-time.image-replay+json" ||
      new TextDecoder().decode(replayBytes) !== `${canonicalJson(evidence.fixture)}\n`
    ) {
      throw new Error("completed image recovery proofs do not match the received fixture");
    }
    const terminal: CompletedImageOperation = {
      clientRequestId: canonicalOperation.clientRequestId,
      dispatchDigest: dispatched.dispatchDigest,
      fixtureDigest: evidence.fixture.fixtureDigest,
      imageProof: evidence.imageProof,
      manifestDigest: canonicalOperation.manifestDigest,
      preparedDigest: canonicalOperation.preparedDigest,
      replayProof: evidence.replayProof,
      resultDigest: evidence.fixture.resultDigest,
      schema: "shape-of-time.image-operation-terminal.v1",
      state: "completed",
    };
    await writeImmutable(
      this.#recordPath(root, canonicalOperation.idempotencyKeyDigest, "terminal.json"),
      encodeEnvelope(terminal),
      root,
    );
  }

  async fail(operation: PreparedImageOperation, error: ImageProviderError): Promise<void> {
    if (error.clientRequestId !== operation.clientRequestId) {
      throw new Error("failed image result belongs to a different client request");
    }
    const state = await this.#inspectExactOperation(operation);
    if (state.status !== "dispatching") {
      throw new Error(`image operation cannot fail from ${state.status} state; a durable dispatch is required`);
    }
    const canonicalOperation = state.operation;
    const root = await this.#archive.resolveRoot();
    const dispatched = await this.#readRequiredDispatch(root, canonicalOperation);
    const terminal: FailedImageOperation = {
      clientRequestId: canonicalOperation.clientRequestId,
      code: error.code,
      dispatchDigest: dispatched.dispatchDigest,
      disposition: error.disposition,
      httpStatus: error.httpStatus,
      latencyMs: error.latencyMs,
      latencyUnavailableReason: error.latencyUnavailableReason,
      manifestDigest: canonicalOperation.manifestDigest,
      message: error.message,
      moderationDetails: error.moderationDetails,
      preparedDigest: canonicalOperation.preparedDigest,
      pricingVersion: error.pricingVersion,
      providerProcessingMs: error.providerProcessingMs,
      providerRequestId: error.providerRequestId,
      schema: "shape-of-time.image-operation-terminal.v1",
      state: error.disposition,
      totalCostEstimateUnavailableReason: error.totalCostEstimateUnavailableReason,
      usage: error.usage,
    };
    const resolution: ImageResolutionRecord = {
      clientRequestId: canonicalOperation.clientRequestId,
      dispatchDigest: dispatched.dispatchDigest,
      evidenceDigest: digestJson(terminal),
      manifestDigest: canonicalOperation.manifestDigest,
      preparedDigest: canonicalOperation.preparedDigest,
      schema: "shape-of-time.image-operation-resolution.v1",
      state: terminal.state,
      terminal,
    };
    await this.#writeResolution(root, canonicalOperation, dispatched, resolution);
  }

  async recordReceived(
    operation: PreparedImageOperation,
    fixture: ImageReplayFixture,
    bytes: Uint8Array,
  ): Promise<void> {
    const state = await this.#inspectExactOperation(operation);
    if (state.status !== "dispatching") {
      throw new Error(`image operation cannot record received output from ${state.status} state`);
    }
    const canonicalOperation = state.operation;
    const root = await this.#archive.resolveRoot();
    const dispatched = await this.#readRequiredDispatch(root, canonicalOperation);
    const received: ReceivedImageOperation = {
      clientRequestId: canonicalOperation.clientRequestId,
      dispatchDigest: dispatched.dispatchDigest,
      fixture,
      manifestDigest: canonicalOperation.manifestDigest,
      outputBase64: Buffer.from(bytes).toString("base64"),
      preparedDigest: canonicalOperation.preparedDigest,
      schema: "shape-of-time.image-operation-received.v1",
    };
    validateReceived(received, canonicalOperation, dispatched);
    const resolution: ImageResolutionRecord = {
      clientRequestId: canonicalOperation.clientRequestId,
      dispatchDigest: dispatched.dispatchDigest,
      evidenceDigest: digestJson(received),
      manifestDigest: canonicalOperation.manifestDigest,
      preparedDigest: canonicalOperation.preparedDigest,
      received,
      schema: "shape-of-time.image-operation-resolution.v1",
      state: "received",
    };
    await this.#writeResolution(root, canonicalOperation, dispatched, resolution);
  }

  async #inspectExactOperation(operation: PreparedImageOperation): Promise<ImageOperationInspection> {
    validatePrepared(operation, this.#archive.archiveId, operation.idempotencyKeyDigest);
    const state = await this.inspect(operation.manifest.idempotencyKey);
    if (state.status === "absent") throw new Error("image operation preparation evidence disappeared");
    if (canonicalJson(state.operation) !== canonicalJson(operation)) {
      throw new Error("image operation preparation evidence changed before a state transition");
    }
    return state;
  }

  async #writeResolution(
    root: string,
    operation: PreparedImageOperation,
    dispatched: DispatchedImageOperation,
    resolution: ImageResolutionRecord,
  ): Promise<void> {
    const claimPath = this.#recordPath(root, operation.idempotencyKeyDigest, "resolution.json");
    validateResolution(resolution, operation, dispatched);
    const created = await createImmutableFile(claimPath, encodeEnvelope(resolution), root);
    if (created) return;
    const existing = await readEnvelope<ImageResolutionRecord>(claimPath, root);
    validateResolution(existing, operation, dispatched);
    if (canonicalJson(existing) !== canonicalJson(resolution)) {
      throw new Error("image operation already has a conflicting atomic resolution claim");
    }
  }

  async #readRequiredDispatch(
    root: string,
    operation: PreparedImageOperation,
  ): Promise<DispatchedImageOperation> {
    let dispatched: DispatchedImageOperation;
    try {
      dispatched = await readEnvelope<DispatchedImageOperation>(
        this.#recordPath(root, operation.idempotencyKeyDigest, "dispatched.json"),
        root,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error("image operation cannot be terminalized before durable dispatch", { cause: error });
      }
      throw error;
    }
    validateDispatched(dispatched, operation);
    return dispatched;
  }

  #recordPath(root: string, keyDigest: string, file: string): string {
    return path.join(root, "operations", "images", "v1", keyDigest.slice(0, 2), keyDigest, file);
  }
}

export class DurableImageDispatcher {
  readonly #archive: FilesystemRecoveryArchive;
  readonly #client: ImageProviderExecutor;
  readonly #journal: ImageDispatchJournal;

  constructor(options: {
    archive: FilesystemRecoveryArchive;
    client: ImageProviderExecutor;
    journal: ImageDispatchJournal;
  }) {
    this.#archive = options.archive;
    this.#client = options.client;
    this.#journal = options.journal;
  }

  async execute(compiled: CompiledImageRequest): Promise<ImageProviderResult> {
    return (await this.executeWithEvidence(compiled)).result;
  }

  async executeWithEvidence(compiled: CompiledImageRequest): Promise<DurableImageExecution> {
    const request = snapshotCompiledImageRequest(compiled);
    const operation = await this.#journal.prepare(request);
    const current = await this.#journal.inspect(request.manifest.idempotencyKey);
    if (current.status === "completed") {
      return { resolution: "durable-replay", result: await this.#replay(request, current.terminal) };
    }
    if (current.status === "received") {
      return { resolution: "archive-reconciliation", result: await this.#reconcile(request, current) };
    }
    if (current.status === "rejected" || current.status === "indeterminate") {
      throw new ImageDispatchStateError(current.status, `image operation is terminal: ${current.terminal.code}`);
    }
    if (current.status === "dispatching") {
      throw new ImageDispatchStateError(
        "dispatching",
        "image operation was durably dispatched without a terminal result; automatic replay is forbidden",
      );
    }
    if (current.status === "absent") throw new Error("prepared image operation disappeared before dispatch");
    if (!(await this.#journal.acquireDispatch(operation))) {
      const raced = await this.#journal.inspect(request.manifest.idempotencyKey);
      if (raced.status === "completed") {
        return { resolution: "durable-replay", result: await this.#replay(request, raced.terminal) };
      }
      if (raced.status === "received") {
        return { resolution: "archive-reconciliation", result: await this.#reconcile(request, raced) };
      }
      throw new ImageDispatchStateError(
        "dispatching",
        "another process claimed image dispatch; automatic replay is forbidden",
      );
    }

    let result: ImageProviderResult;
    try {
      result = await this.#client.execute(request, { clientRequestId: operation.clientRequestId });
    } catch (cause) {
      const error =
        cause instanceof ImageProviderError
          ? cause
          : new ImageProviderError({
              cause,
              clientRequestId: operation.clientRequestId,
              code: "unexpected_dispatch_failure",
              disposition: "indeterminate",
              httpStatus: null,
              message: "unexpected image dispatch failure after durable claim",
            });
      await this.#journal.fail(operation, error);
      throw error;
    }

    if (result.clientRequestId !== operation.clientRequestId) {
      const error = new ImageProviderError({
        clientRequestId: operation.clientRequestId,
        code: "client_request_id_mismatch",
        disposition: "indeterminate",
        httpStatus: 200,
        message: "image result does not match its durable dispatch claim",
        providerRequestId: result.providerRequestId,
      });
      await this.#journal.fail(operation, error);
      throw error;
    }

    const stableResult: ImageProviderResult = { ...result, bytes: new Uint8Array(result.bytes) };
    let fixture: ImageReplayFixture;
    try {
      fixture = sanitizeImageResult(request, stableResult);
      await this.#journal.recordReceived(operation, fixture, stableResult.bytes);
    } catch (cause) {
      const persisted = await this.#journal.inspect(request.manifest.idempotencyKey).catch(() => null);
      if (persisted?.status === "received") {
        throw new ImageProviderError({
          cause,
          clientRequestId: operation.clientRequestId,
          code: "post_dispatch_evidence_failure",
          disposition: "indeterminate",
          httpStatus: 200,
          latencyMs: stableResult.latencyMs,
          message: "image bytes were durably received but recovery archival requires reconciliation",
          providerProcessingMs: stableResult.providerProcessingMs,
          providerRequestId: stableResult.providerRequestId,
        });
      }
      const error = new ImageProviderError({
        cause,
        clientRequestId: operation.clientRequestId,
        code: "invalid_received_result",
        disposition: "indeterminate",
        httpStatus: 200,
        latencyMs: stableResult.latencyMs,
        message: "image result could not be bound to its durable dispatch",
        providerProcessingMs: stableResult.providerProcessingMs,
        providerRequestId: stableResult.providerRequestId,
      });
      await this.#journal.fail(operation, error);
      throw error;
    }

    try {
      const imageProof = await this.#archive.archive(stableResult.bytes, stableResult.mediaType);
      const replayProof = await this.#archive.archive(
        new TextEncoder().encode(`${canonicalJson(fixture)}\n`),
        "application/vnd.shape-of-time.image-replay+json",
      );
      await this.#journal.complete(operation, { fixture, imageProof, replayProof });
      return { resolution: "provider-dispatch", result: stableResult };
    } catch (cause) {
      const error = new ImageProviderError({
        cause,
        clientRequestId: operation.clientRequestId,
        code: "post_dispatch_evidence_failure",
        disposition: "indeterminate",
        httpStatus: 200,
        latencyMs: stableResult.latencyMs,
        message: "image result evidence is incomplete after dispatch; reconciliation is required",
        providerProcessingMs: stableResult.providerProcessingMs,
        providerRequestId: stableResult.providerRequestId,
      });
      throw error;
    }
  }

  async #reconcile(
    compiled: CompiledImageRequest,
    state: Extract<ImageOperationInspection, { status: "received" }>,
  ): Promise<ImageProviderResult> {
    const fixture = state.received.fixture;
    const sanitized = replayImageResult(compiled, fixture);
    let receivedBytes: Uint8Array;
    try {
      receivedBytes = decodeReceivedBytes(state.received);
    } catch (cause) {
      throw new ImageDispatchStateError(
        "dispatching",
        `received image operation has invalid durable output bytes: ${cause instanceof Error ? cause.message : "unknown recovery failure"}`,
      );
    }
    const imageProof = await this.#archive.archive(receivedBytes, sanitized.mediaType);
    const replayProof = await this.#archive.archive(
      new TextEncoder().encode(`${canonicalJson(fixture)}\n`),
      "application/vnd.shape-of-time.image-replay+json",
    );
    await this.#journal.complete(state.operation, { fixture, imageProof, replayProof });
    const completed = await this.#journal.inspect(compiled.manifest.idempotencyKey);
    if (completed.status !== "completed") throw new Error("reconciled image operation did not become complete");
    return this.#replay(compiled, completed.terminal);
  }

  async #replay(compiled: CompiledImageRequest, terminal: CompletedImageOperation): Promise<ImageProviderResult> {
    const replayBytes = await this.#archive.read(terminal.replayProof);
    let fixture: ImageReplayFixture;
    try {
      fixture = JSON.parse(new TextDecoder().decode(replayBytes)) as ImageReplayFixture;
    } catch (cause) {
      throw new Error("archived image replay fixture is invalid JSON", { cause });
    }
    if (fixture.fixtureDigest !== terminal.fixtureDigest || fixture.resultDigest !== terminal.resultDigest) {
      throw new Error("completed image operation does not match its archived replay evidence");
    }
    const result = replayImageResult(compiled, fixture);
    const bytes = await this.#archive.read(terminal.imageProof);
    if (sha256(bytes) !== result.digest || bytes.byteLength !== result.byteLength || terminal.imageProof.mediaType !== "image/png") {
      throw new Error("completed image operation output does not match its archived result");
    }
    return { ...result, bytes };
  }
}

function encodeEnvelope<T>(record: T): Uint8Array {
  const envelope: StoredEnvelope<T> = {
    record,
    recordDigest: digestJson(record),
    schema: "shape-of-time.immutable-record-envelope.v1",
  };
  return new TextEncoder().encode(`${canonicalJson(envelope)}\n`);
}

async function readEnvelope<T>(file: string, durableRoot: string): Promise<T> {
  const bytes = await readImmutableFile(file, durableRoot);
  let envelope: StoredEnvelope<T>;
  try {
    envelope = JSON.parse(bytes.toString("utf8")) as StoredEnvelope<T>;
  } catch (cause) {
    throw new Error(`immutable image operation record is invalid JSON: ${file}`, { cause });
  }
  if (
    envelope.schema !== "shape-of-time.immutable-record-envelope.v1" ||
    digestJson(envelope.record) !== envelope.recordDigest ||
    `${canonicalJson(envelope)}\n` !== bytes.toString("utf8")
  ) {
    throw new Error(`immutable image operation record digest or encoding is invalid: ${file}`);
  }
  return envelope.record;
}

async function readOptionalEnvelope<T>(file: string, durableRoot: string): Promise<T | null> {
  try {
    return await readEnvelope<T>(file, durableRoot);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function validatePrepared(operation: PreparedImageOperation, archiveId: string, keyDigest: string): void {
  const { preparedDigest, ...base } = operation;
  if (
    operation.schema !== "shape-of-time.image-operation-prepared.v1" ||
    operation.archiveId !== archiveId ||
    !isUuid(operation.clientRequestId) ||
    operation.idempotencyKeyDigest !== keyDigest ||
    sha256(operation.manifest.idempotencyKey) !== keyDigest ||
    digestJson(operation.manifest) !== operation.manifestDigest ||
    !Array.isArray(operation.referenceProofs) ||
    operation.referenceProofs.length !== operation.manifest.orderedReferences.length ||
    operation.referenceProofs.some((proof, index) => {
      const reference = operation.manifest.orderedReferences[index];
      return (
        reference === undefined ||
        proof.archiveId !== archiveId ||
        proof.digest !== reference.digest ||
        proof.byteLength !== reference.byteLength ||
        proof.mediaType !== reference.mediaType
      );
    }) ||
    digestJson(base) !== preparedDigest
  ) {
    throw new Error("image operation preparation evidence is invalid or changed");
  }
}

function validateResolution(
  resolution: ImageResolutionRecord,
  operation: PreparedImageOperation,
  dispatched: DispatchedImageOperation,
): void {
  const expectedKeys = [
    "clientRequestId",
    "dispatchDigest",
    "evidenceDigest",
    "manifestDigest",
    "preparedDigest",
    resolution.state === "received" ? "received" : "terminal",
    "schema",
    "state",
  ].sort();
  const actualKeys = Object.keys(resolution).sort();
  if (
    actualKeys.length !== expectedKeys.length ||
    actualKeys.some((key, index) => key !== expectedKeys[index]) ||
    resolution.schema !== "shape-of-time.image-operation-resolution.v1" ||
    !["received", "rejected", "indeterminate"].includes(resolution.state) ||
    !/^[a-f0-9]{64}$/.test(resolution.evidenceDigest) ||
    resolution.clientRequestId !== operation.clientRequestId ||
    resolution.dispatchDigest !== dispatched.dispatchDigest ||
    resolution.manifestDigest !== operation.manifestDigest ||
    resolution.preparedDigest !== operation.preparedDigest
  ) {
    throw new Error("image operation atomic resolution claim is invalid");
  }
  if (resolution.state === "received") {
    validateReceived(resolution.received, operation, dispatched);
    if (resolution.evidenceDigest !== digestJson(resolution.received)) {
      throw new Error("image received resolution evidence digest is invalid");
    }
  } else {
    validateTerminal(resolution.terminal, operation, dispatched, null);
    if (
      resolution.terminal.state !== resolution.state ||
      resolution.evidenceDigest !== digestJson(resolution.terminal)
    ) {
      throw new Error("image failed resolution evidence digest is invalid");
    }
  }
}

async function verifyPreparedReferences(
  operation: PreparedImageOperation,
  archive: FilesystemRecoveryArchive,
): Promise<void> {
  for (const proof of operation.referenceProofs) await archive.verify(proof);
}

function validateDispatched(dispatched: DispatchedImageOperation, operation: PreparedImageOperation): void {
  const { dispatchDigest, ...base } = dispatched;
  if (
    dispatched.schema !== "shape-of-time.image-operation-dispatched.v1" ||
    dispatched.clientRequestId !== operation.clientRequestId ||
    dispatched.manifestDigest !== operation.manifestDigest ||
    dispatched.preparedDigest !== operation.preparedDigest ||
    digestJson(base) !== dispatchDigest
  ) {
    throw new Error("dispatched image operation evidence is invalid");
  }
}

function validateReceived(
  received: ReceivedImageOperation,
  operation: PreparedImageOperation,
  dispatched: DispatchedImageOperation,
): void {
  const replayResult = validateImageReplayFixture(operation.manifest, received.fixture);
  if (
    received.schema !== "shape-of-time.image-operation-received.v1" ||
    received.clientRequestId !== operation.clientRequestId ||
    received.dispatchDigest !== dispatched.dispatchDigest ||
    received.manifestDigest !== operation.manifestDigest ||
    received.preparedDigest !== operation.preparedDigest ||
    replayResult.clientRequestId !== operation.clientRequestId
  ) {
    throw new Error("received image operation evidence is invalid");
  }
  decodeReceivedBytes(received);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function decodeReceivedBytes(received: ReceivedImageOperation): Uint8Array {
  if (
    received.outputBase64.length === 0 ||
    received.outputBase64.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(received.outputBase64)
  ) {
    throw new Error("received image output is not canonical base64");
  }
  const bytes = Buffer.from(received.outputBase64, "base64");
  if (
    bytes.toString("base64") !== received.outputBase64 ||
    bytes.byteLength !== received.fixture.result.byteLength ||
    sha256(bytes) !== received.fixture.result.digest
  ) {
    throw new Error("received image output does not match its fixture digest and length");
  }
  return new Uint8Array(bytes);
}

function validateTerminal(
  terminal: TerminalImageOperation,
  operation: PreparedImageOperation,
  dispatched: DispatchedImageOperation,
  received: ReceivedImageOperation | null,
): void {
  if (
    terminal.schema !== "shape-of-time.image-operation-terminal.v1" ||
    terminal.clientRequestId !== operation.clientRequestId ||
    terminal.dispatchDigest !== dispatched.dispatchDigest ||
    terminal.manifestDigest !== operation.manifestDigest ||
    terminal.preparedDigest !== operation.preparedDigest
  ) {
    throw new Error("terminal image operation evidence is invalid");
  }
  if (
    terminal.state === "completed" &&
    (received === null ||
      terminal.fixtureDigest !== received.fixture.fixtureDigest ||
      terminal.resultDigest !== received.fixture.resultDigest)
  ) {
    throw new Error("completed image operation does not match its durable received evidence");
  }
  if (
    terminal.state !== "completed" &&
    (terminal.pricingVersion !== GPT_IMAGE_PRICING_VERSION ||
      (terminal.latencyMs === null) !== (terminal.latencyUnavailableReason !== null) ||
      (terminal.latencyMs !== null && (!Number.isInteger(terminal.latencyMs) || terminal.latencyMs < 0)) ||
      (terminal.providerProcessingMs !== null &&
        (!Number.isFinite(terminal.providerProcessingMs) || terminal.providerProcessingMs < 0)) ||
      terminal.totalCostEstimateUnavailableReason !== "attempt-failed-before-usage" ||
      terminal.usage !== null)
  ) {
    throw new Error("failed image operation cost or timing evidence is invalid");
  }
}

async function verifyCompletedRecovery(
  terminal: CompletedImageOperation,
  received: ReceivedImageOperation,
  archive: FilesystemRecoveryArchive,
): Promise<void> {
  await Promise.all([archive.verify(terminal.imageProof), archive.verify(terminal.replayProof)]);
  const [imageBytes, replayBytes] = await Promise.all([
    archive.read(terminal.imageProof),
    archive.read(terminal.replayProof),
  ]);
  if (
    terminal.imageProof.digest !== received.fixture.result.digest ||
    terminal.imageProof.byteLength !== received.fixture.result.byteLength ||
    terminal.imageProof.mediaType !== received.fixture.result.mediaType ||
    sha256(imageBytes) !== received.fixture.result.digest ||
    terminal.replayProof.mediaType !== "application/vnd.shape-of-time.image-replay+json" ||
    new TextDecoder().decode(replayBytes) !== `${canonicalJson(received.fixture)}\n`
  ) {
    throw new Error("completed image recovery proofs do not match the durable received evidence");
  }
}
