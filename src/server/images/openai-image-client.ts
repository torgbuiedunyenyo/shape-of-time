import { inflateSync } from "node:zlib";

import { canonicalJson, digestJson, sha256 } from "../domain/digests.js";
import type {
  GPT_IMAGE_SNAPSHOT,
  CompiledImageRequest,
  ImageQuality,
  ImageRequestManifest,
  PrototypeImageSize,
} from "./image-contract.js";
import { snapshotCompiledImageRequest } from "./image-contract.js";

export const GPT_IMAGE_PRICING_VERSION = "openai-standard-token-pricing-2026-07-19" as const;
const OPENAI_IMAGE_API_ORIGIN = "https://api.openai.com" as const;

interface ImageUsage {
  input_tokens: number;
  input_tokens_details: {
    image_tokens: number;
    text_tokens: number;
  };
  output_tokens: number;
  output_tokens_details?: {
    image_tokens: number;
    text_tokens: number;
  };
  total_tokens: number;
}

export interface ImageProviderResult {
  byteLength: number;
  bytes: Uint8Array;
  clientRequestId: string;
  digest: string;
  estimatedOutputCostMicrousd: number;
  estimatedTotalCostMicrousd: number | null;
  height: number;
  latencyMs: number;
  mediaType: "image/png";
  pricingVersion: string;
  providerProcessingMs: number | null;
  providerRequestId: string;
  requestedModelSnapshot: typeof GPT_IMAGE_SNAPSHOT;
  servedModelEvidence: "unavailable-from-image-api";
  totalCostEstimateUnavailableReason: "usage-unavailable" | null;
  usage: ImageUsage | null;
  width: number;
}

export type SanitizedImageResult = Omit<ImageProviderResult, "bytes">;

export interface ImageReplayFixture {
  fixtureDigest: string;
  manifest: ImageRequestManifest;
  manifestDigest: string;
  result: SanitizedImageResult;
  resultDigest: string;
  schema: "shape-of-time.gpt-image-2-replay.v2";
}

export class ImageProviderError extends Error {
  readonly clientRequestId: string;
  readonly code: string;
  readonly disposition: "indeterminate" | "rejected";
  readonly httpStatus: number | null;
  readonly latencyMs: number | null;
  readonly latencyUnavailableReason: "not-captured-by-executor" | null;
  readonly moderationDetails: unknown;
  readonly pricingVersion: typeof GPT_IMAGE_PRICING_VERSION;
  readonly providerProcessingMs: number | null;
  readonly providerRequestId: string | null;
  readonly totalCostEstimateUnavailableReason: "attempt-failed-before-usage";
  readonly usage: null;

  constructor(input: {
    cause?: unknown;
    clientRequestId: string;
    code: string;
    disposition: "indeterminate" | "rejected";
    httpStatus: number | null;
    latencyMs?: number | null;
    message: string;
    moderationDetails?: unknown;
    providerRequestId?: string | null;
    providerProcessingMs?: number | null;
  }) {
    super(input.message, input.cause === undefined ? undefined : { cause: input.cause });
    this.name = "ImageProviderError";
    this.clientRequestId = input.clientRequestId;
    this.code = input.code;
    this.disposition = input.disposition;
    this.httpStatus = input.httpStatus;
    this.latencyMs = input.latencyMs ?? null;
    this.latencyUnavailableReason = this.latencyMs === null ? "not-captured-by-executor" : null;
    this.moderationDetails = input.moderationDetails ?? null;
    this.pricingVersion = GPT_IMAGE_PRICING_VERSION;
    this.providerProcessingMs = input.providerProcessingMs ?? null;
    this.providerRequestId = input.providerRequestId ?? null;
    this.totalCostEstimateUnavailableReason = "attempt-failed-before-usage";
    this.usage = null;
  }

  withAttemptEvidence(input: { latencyMs: number; providerProcessingMs: number | null }): ImageProviderError {
    return new ImageProviderError({
      cause: this.cause,
      clientRequestId: this.clientRequestId,
      code: this.code,
      disposition: this.disposition,
      httpStatus: this.httpStatus,
      latencyMs: input.latencyMs,
      message: this.message,
      moderationDetails: this.moderationDetails,
      providerProcessingMs: input.providerProcessingMs,
      providerRequestId: this.providerRequestId,
    });
  }
}

export class OpenAiImageClient {
  readonly #apiKey: string;
  readonly #fetch: typeof fetch;
  readonly #now: () => number;

  constructor(options: {
    apiKey: string;
    fetch?: typeof fetch;
    now?: () => number;
  }) {
    const unsupportedOptions = Object.keys(options).filter(
      (key) => !["apiKey", "fetch", "now"].includes(key),
    );
    if (unsupportedOptions.length > 0) {
      throw new Error(`unsupported OpenAI image client option: ${unsupportedOptions.join(", ")}`);
    }
    if (options.apiKey.trim().length === 0) throw new Error("OpenAI API key cannot be empty");
    this.#apiKey = options.apiKey;
    this.#fetch = options.fetch ?? fetch;
    this.#now = options.now ?? (() => performance.now());
  }

  async execute(
    compiled: CompiledImageRequest,
    options: { clientRequestId: string },
  ): Promise<ImageProviderResult> {
    assertUuid(options.clientRequestId);
    const requestSnapshot = snapshotCompiledImageRequest(compiled);
    const request = buildWireRequest(requestSnapshot, this.#apiKey, options.clientRequestId);
    const started = this.#now();
    let response: Response;
    try {
      response = await this.#fetch(`${OPENAI_IMAGE_API_ORIGIN}${requestSnapshot.manifest.endpoint}`, request);
    } catch (cause) {
      throw new ImageProviderError({
        cause,
        clientRequestId: options.clientRequestId,
        code: "transport_ambiguous",
        disposition: "indeterminate",
        httpStatus: null,
        latencyMs: Math.max(0, Math.round(this.#now() - started)),
        message: "image request transport failed after dispatch; automatic replay is forbidden",
      });
    }
    const providerRequestId = response.headers.get("x-request-id");
    const providerProcessingMs = parseOptionalMilliseconds(response.headers.get("openai-processing-ms"));
    try {
      const body = await parseJson(response, options.clientRequestId, providerRequestId);

      if (!response.ok) {
        const error = readProviderError(body);
        throw new ImageProviderError({
          clientRequestId: options.clientRequestId,
          code: error.code,
          disposition: isAmbiguousHttpStatus(response.status) ? "indeterminate" : "rejected",
          httpStatus: response.status,
          message: error.message,
          moderationDetails: error.moderationDetails,
          providerRequestId,
        });
      }
      if (providerRequestId === null || providerRequestId.trim().length === 0) {
        throw invalidResponse(options.clientRequestId, "successful image response is missing x-request-id");
      }

      const output = readSingleOutput(body, options.clientRequestId, providerRequestId);
      const bytes = decodeBase64Strict(output, options.clientRequestId, providerRequestId);
      const dimensions = readPngDimensions(bytes, options.clientRequestId, providerRequestId);
      const [expectedWidth, expectedHeight] = requestSnapshot.manifest.size.split("x").map(Number);
      if (dimensions.width !== expectedWidth || dimensions.height !== expectedHeight) {
        throw invalidResponse(
          options.clientRequestId,
          `image dimensions ${dimensions.width}x${dimensions.height} do not match ${requestSnapshot.manifest.size}`,
          providerRequestId,
        );
      }
      assertOptionalEchoes(body, requestSnapshot, options.clientRequestId, providerRequestId);
      const usage = readUsage(body.usage, options.clientRequestId, providerRequestId);
      const cost = estimateCost(requestSnapshot.manifest.size, requestSnapshot.manifest.quality, usage);
      return {
        byteLength: bytes.byteLength,
        bytes,
        clientRequestId: options.clientRequestId,
        digest: sha256(bytes),
        estimatedOutputCostMicrousd: cost.output,
        estimatedTotalCostMicrousd: cost.total,
        height: dimensions.height,
        latencyMs: Math.max(0, Math.round(this.#now() - started)),
        mediaType: "image/png",
        pricingVersion: GPT_IMAGE_PRICING_VERSION,
        providerProcessingMs,
        providerRequestId,
        requestedModelSnapshot: requestSnapshot.manifest.requestedModelSnapshot,
        servedModelEvidence: "unavailable-from-image-api",
        totalCostEstimateUnavailableReason: cost.total === null ? "usage-unavailable" : null,
        usage,
        width: dimensions.width,
      };
    } catch (cause) {
      if (cause instanceof ImageProviderError) {
        throw cause.withAttemptEvidence({
          latencyMs: Math.max(0, Math.round(this.#now() - started)),
          providerProcessingMs,
        });
      }
      throw cause;
    }
  }
}

export function sanitizeImageResult(
  compiled: CompiledImageRequest,
  result: ImageProviderResult,
): ImageReplayFixture {
  const request = snapshotCompiledImageRequest(compiled);
  if (result.digest !== sha256(result.bytes) || result.byteLength !== result.bytes.byteLength) {
    throw new Error("image result bytes do not match its digest and length");
  }
  const dimensions = readPngDimensions(result.bytes, result.clientRequestId, result.providerRequestId);
  const [expectedWidth, expectedHeight] = request.manifest.size.split("x").map(Number);
  if (
    dimensions.width !== expectedWidth ||
    dimensions.height !== expectedHeight ||
    result.width !== dimensions.width ||
    result.height !== dimensions.height
  ) {
    throw new Error("image result bytes, recorded dimensions, and requested size do not agree");
  }
  const sanitized: SanitizedImageResult = {
    byteLength: result.byteLength,
    clientRequestId: result.clientRequestId,
    digest: result.digest,
    estimatedOutputCostMicrousd: result.estimatedOutputCostMicrousd,
    estimatedTotalCostMicrousd: result.estimatedTotalCostMicrousd,
    height: result.height,
    latencyMs: result.latencyMs,
    mediaType: result.mediaType,
    pricingVersion: result.pricingVersion,
    providerProcessingMs: result.providerProcessingMs,
    providerRequestId: result.providerRequestId,
    requestedModelSnapshot: result.requestedModelSnapshot,
    servedModelEvidence: result.servedModelEvidence,
    totalCostEstimateUnavailableReason: result.totalCostEstimateUnavailableReason,
    usage: sanitizeUsage(result.usage),
    width: result.width,
  };
  validateSanitizedResult(request.manifest, sanitized);
  const resultDigest = digestJson(sanitized);
  const base = {
    manifest: request.manifest,
    manifestDigest: request.manifestDigest,
    result: sanitized,
    resultDigest,
    schema: "shape-of-time.gpt-image-2-replay.v2" as const,
  };
  const fixture = { ...base, fixtureDigest: digestJson(base) };
  validateImageReplayFixture(request.manifest, fixture);
  return fixture;
}

export function replayImageResult(
  compiled: CompiledImageRequest,
  fixture: ImageReplayFixture,
): SanitizedImageResult {
  const request = snapshotCompiledImageRequest(compiled);
  return validateImageReplayFixture(request.manifest, fixture);
}

export function validateImageReplayFixture(
  manifest: ImageRequestManifest,
  fixture: ImageReplayFixture,
): SanitizedImageResult {
  assertExactRecordKeys(
    fixture,
    ["fixtureDigest", "manifest", "manifestDigest", "result", "resultDigest", "schema"],
    "image replay fixture",
  );
  const base = {
    manifest: fixture.manifest,
    manifestDigest: fixture.manifestDigest,
    result: fixture.result,
    resultDigest: fixture.resultDigest,
    schema: fixture.schema,
  };
  if (
    fixture.schema !== "shape-of-time.gpt-image-2-replay.v2" ||
    fixture.manifestDigest !== digestJson(manifest) ||
    digestJson(fixture.manifest) !== fixture.manifestDigest ||
    canonicalJson(fixture.manifest) !== canonicalJson(manifest) ||
    digestJson(fixture.result) !== fixture.resultDigest ||
    digestJson(base) !== fixture.fixtureDigest
  ) {
    throw new Error("image replay manifest, result, or fixture digest does not match the recorded request");
  }
  validateSanitizedResult(manifest, fixture.result);
  return fixture.result;
}

function buildWireRequest(
  compiled: CompiledImageRequest,
  apiKey: string,
  clientRequestId: string,
): RequestInit {
  const common = {
    background: compiled.manifest.background,
    model: compiled.manifest.requestedModelSnapshot,
    moderation: compiled.manifest.moderation,
    n: 1,
    output_format: compiled.manifest.outputFormat,
    prompt: compiled.exactPrompt,
    quality: compiled.manifest.quality,
    size: compiled.manifest.size,
  } as const;
  if (compiled.manifest.endpoint === "/v1/images/generations") {
    return {
      body: JSON.stringify(common),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Client-Request-Id": clientRequestId,
      },
      method: "POST",
      redirect: "error",
    };
  }
  const form = new FormData();
  for (const [key, value] of Object.entries(common)) form.set(key, String(value));
  compiled.references.forEach((reference, index) => {
    const safeName = reference.assetId.replace(/[^a-zA-Z0-9_-]/g, "-");
    const extension = reference.mediaType === "image/jpeg" ? "jpg" : reference.mediaType.split("/")[1]!;
    const copiedBytes = new ArrayBuffer(reference.bytes.byteLength);
    new Uint8Array(copiedBytes).set(reference.bytes);
    form.append(
      "image[]",
      new File([copiedBytes], `${String(index + 1).padStart(2, "0")}-${safeName}.${extension}`, {
        type: reference.mediaType,
      }),
    );
  });
  return {
    body: form,
    headers: { Authorization: `Bearer ${apiKey}`, "X-Client-Request-Id": clientRequestId },
    method: "POST",
    redirect: "error",
  };
}

async function parseJson(response: Response, clientRequestId: string, providerRequestId: string | null) {
  let text: string;
  try {
    text = await response.text();
  } catch (cause) {
    throw new ImageProviderError({
      cause,
      clientRequestId,
      code: "response_body_unreadable",
      disposition: response.ok || isAmbiguousHttpStatus(response.status) ? "indeterminate" : "rejected",
      httpStatus: response.status,
      message: "image provider response body could not be read after dispatch",
      providerRequestId,
    });
  }
  try {
    const body: unknown = JSON.parse(text);
    if (body === null || typeof body !== "object" || Array.isArray(body)) throw new Error("not an object");
    return body as Record<string, unknown>;
  } catch (cause) {
    throw new ImageProviderError({
      cause,
      clientRequestId,
      code: "invalid_json_response",
      disposition: response.ok || isAmbiguousHttpStatus(response.status) ? "indeterminate" : "rejected",
      httpStatus: response.status,
      message: "image provider returned invalid JSON",
      providerRequestId,
    });
  }
}

function readProviderError(body: Record<string, unknown>): {
  code: string;
  message: string;
  moderationDetails: unknown;
} {
  const value = body.error;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { code: "http_error", message: "image provider returned an HTTP error", moderationDetails: null };
  }
  const error = value as Record<string, unknown>;
  return {
    code: typeof error.code === "string" ? error.code : "http_error",
    message: typeof error.message === "string" ? error.message : "image provider rejected the request",
    moderationDetails: error.moderation_details ?? null,
  };
}

function readSingleOutput(
  body: Record<string, unknown>,
  clientRequestId: string,
  providerRequestId: string,
): string {
  if (!Array.isArray(body.data) || body.data.length !== 1) {
    throw invalidResponse(clientRequestId, "image response must contain exactly one output", providerRequestId);
  }
  const item = body.data[0];
  if (item === null || typeof item !== "object" || Array.isArray(item)) {
    throw invalidResponse(clientRequestId, "image response output is malformed", providerRequestId);
  }
  const encoded = (item as Record<string, unknown>).b64_json;
  if (typeof encoded !== "string" || encoded.length === 0) {
    throw invalidResponse(clientRequestId, "image response has no base64 output", providerRequestId);
  }
  return encoded;
}

function decodeBase64Strict(value: string, clientRequestId: string, providerRequestId: string): Uint8Array {
  if (
    value.length % 4 !== 0 ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)
  ) {
    throw invalidResponse(clientRequestId, "image response base64 is invalid", providerRequestId);
  }
  const bytes = Buffer.from(value, "base64");
  if (bytes.length === 0 || bytes.toString("base64") !== value) {
    throw invalidResponse(clientRequestId, "image response base64 is not canonical", providerRequestId);
  }
  return new Uint8Array(bytes);
}

function readPngDimensions(
  bytes: Uint8Array,
  clientRequestId: string,
  providerRequestId: string,
): { height: number; width: number } {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.byteLength < 57 || !signature.every((value, index) => bytes[index] === value)) {
    throw invalidResponse(clientRequestId, "image output is not a structurally valid PNG", providerRequestId);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = -1;
  let sawHeader = false;
  let sawPalette = false;
  let paletteEntries = 0;
  let sawImageData = false;
  let imageDataEnded = false;
  let sawEnd = false;
  const compressedParts: Buffer[] = [];
  while (offset < bytes.byteLength) {
    if (bytes.byteLength - offset < 12) {
      throw invalidResponse(clientRequestId, "image output has a truncated PNG chunk", providerRequestId);
    }
    const length = view.getUint32(offset);
    if (length > bytes.byteLength - offset - 12) {
      throw invalidResponse(clientRequestId, "image output PNG chunk exceeds the file boundary", providerRequestId);
    }
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const typeBytes = bytes.subarray(typeStart, dataStart);
    const type = Buffer.from(typeBytes).toString("ascii");
    if (!/^[A-Za-z]{4}$/.test(type) || (typeBytes[2]! & 0x20) !== 0) {
      throw invalidResponse(
        clientRequestId,
        "image output has an invalid PNG chunk type or reserved bit",
        providerRequestId,
      );
    }
    const expectedCrc = view.getUint32(dataEnd);
    const actualCrc = crc32(bytes.subarray(typeStart, dataEnd));
    if (actualCrc !== expectedCrc) {
      throw invalidResponse(clientRequestId, `image output PNG ${type} checksum is invalid`, providerRequestId);
    }
    if (!sawHeader && type !== "IHDR") {
      throw invalidResponse(clientRequestId, "image output PNG must begin with IHDR", providerRequestId);
    }
    if (type === "IHDR") {
      if (sawHeader || length !== 13) {
        throw invalidResponse(clientRequestId, "image output has an invalid or repeated PNG IHDR", providerRequestId);
      }
      sawHeader = true;
      width = view.getUint32(dataStart);
      height = view.getUint32(dataStart + 4);
      bitDepth = bytes[dataStart + 8]!;
      colorType = bytes[dataStart + 9]!;
      const compression = bytes[dataStart + 10];
      const filter = bytes[dataStart + 11];
      const interlace = bytes[dataStart + 12];
      if (
        width === 0 ||
        height === 0 ||
        width * height > 20_000_000 ||
        compression !== 0 ||
        filter !== 0 ||
        interlace !== 0 ||
        !validPngColorMode(colorType, bitDepth)
      ) {
        throw invalidResponse(clientRequestId, "image output PNG header is unsupported or invalid", providerRequestId);
      }
    } else if (type === "PLTE") {
      paletteEntries = length / 3;
      if (
        sawPalette ||
        sawImageData ||
        colorType === 0 ||
        colorType === 4 ||
        length === 0 ||
        length % 3 !== 0 ||
        length > 768 ||
        (colorType === 3 && paletteEntries > 2 ** bitDepth)
      ) {
        throw invalidResponse(clientRequestId, "image output PNG palette is invalid", providerRequestId);
      }
      sawPalette = true;
    } else if (type === "tRNS") {
      throw invalidResponse(
        clientRequestId,
        "image output PNG transparency contradicts the opaque image contract",
        providerRequestId,
      );
    } else if (type === "IDAT") {
      if (imageDataEnded || length === 0) {
        throw invalidResponse(clientRequestId, "image output PNG image data is empty or nonconsecutive", providerRequestId);
      }
      sawImageData = true;
      compressedParts.push(Buffer.from(bytes.subarray(dataStart, dataEnd)));
    } else {
      if (sawImageData) imageDataEnded = true;
      if (type === "IEND") {
        if (length !== 0 || !sawImageData || dataEnd + 4 !== bytes.byteLength) {
          throw invalidResponse(clientRequestId, "image output PNG has an invalid IEND or trailing bytes", providerRequestId);
        }
        sawEnd = true;
      } else if ((type.charCodeAt(0) & 0x20) === 0) {
        throw invalidResponse(clientRequestId, `image output PNG contains unsupported critical chunk ${type}`, providerRequestId);
      }
    }
    offset = dataEnd + 4;
    if (sawEnd) break;
  }
  if (!sawHeader || !sawImageData || !sawEnd || (colorType === 3 && !sawPalette)) {
    throw invalidResponse(clientRequestId, "image output PNG is missing required image structure", providerRequestId);
  }
  validatePngImageData(
    Buffer.concat(compressedParts),
    { bitDepth, colorType, height, paletteEntries, width },
    clientRequestId,
    providerRequestId,
  );
  return { height, width };
}

function validPngColorMode(colorType: number, bitDepth: number): boolean {
  const modes: Record<number, readonly number[]> = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16],
  };
  return modes[colorType]?.includes(bitDepth) === true;
}

function validatePngImageData(
  compressed: Uint8Array,
  image: { bitDepth: number; colorType: number; height: number; paletteEntries: number; width: number },
  clientRequestId: string,
  providerRequestId: string,
): void {
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[image.colorType]!;
  const rowBytes = Math.ceil((image.width * channels * image.bitDepth) / 8);
  const expectedBytes = image.height * (rowBytes + 1);
  if (!Number.isSafeInteger(expectedBytes) || expectedBytes > 64 * 1024 * 1024) {
    throw invalidResponse(clientRequestId, "image output PNG expands beyond the accepted limit", providerRequestId);
  }
  let decoded: Buffer;
  let compressedBytesConsumed: number;
  try {
    const inflated = inflateSync(compressed, { info: true, maxOutputLength: expectedBytes }) as unknown as {
      buffer: Uint8Array;
      engine: { bytesWritten: number };
    };
    decoded = Buffer.from(inflated.buffer);
    compressedBytesConsumed = inflated.engine.bytesWritten;
  } catch (cause) {
    throw new ImageProviderError({
      cause,
      clientRequestId,
      code: "invalid_image_response",
      disposition: "indeterminate",
      httpStatus: 200,
      message: "image output PNG pixel data cannot be decoded",
      providerRequestId,
    });
  }
  if (compressedBytesConsumed !== compressed.byteLength) {
    throw invalidResponse(clientRequestId, "image output PNG contains trailing compressed data", providerRequestId);
  }
  if (decoded.byteLength !== expectedBytes) {
    throw invalidResponse(clientRequestId, "image output PNG decoded byte length is invalid", providerRequestId);
  }
  const bytesPerPixel = Math.max(1, Math.ceil((channels * image.bitDepth) / 8));
  let previous = Buffer.alloc(rowBytes);
  for (let row = 0; row < image.height; row += 1) {
    const rowOffset = row * (rowBytes + 1);
    const filter = decoded[rowOffset]!;
    if (filter > 4) {
      throw invalidResponse(clientRequestId, "image output PNG contains an invalid row filter", providerRequestId);
    }
    const current = Buffer.allocUnsafe(rowBytes);
    for (let column = 0; column < rowBytes; column += 1) {
      const encoded = decoded[rowOffset + 1 + column]!;
      const left = column >= bytesPerPixel ? current[column - bytesPerPixel]! : 0;
      const above = previous[column]!;
      const aboveLeft = column >= bytesPerPixel ? previous[column - bytesPerPixel]! : 0;
      const predictor =
        filter === 0
          ? 0
          : filter === 1
            ? left
            : filter === 2
              ? above
              : filter === 3
                ? Math.floor((left + above) / 2)
                : paethPredictor(left, above, aboveLeft);
      current[column] = (encoded + predictor) & 0xff;
    }
    if (image.colorType === 3) {
      const mask = (1 << image.bitDepth) - 1;
      for (let pixel = 0; pixel < image.width; pixel += 1) {
        const bitOffset = pixel * image.bitDepth;
        const sample = (current[Math.floor(bitOffset / 8)]! >> (8 - image.bitDepth - (bitOffset % 8))) & mask;
        if (sample >= image.paletteEntries) {
          throw invalidResponse(clientRequestId, "image output PNG palette sample is out of range", providerRequestId);
        }
      }
    }
    if (image.colorType === 4 || image.colorType === 6) {
      const bytesPerSample = image.bitDepth / 8;
      const pixelBytes = channels * bytesPerSample;
      const alphaOffset = (channels - 1) * bytesPerSample;
      for (let pixel = 0; pixel < image.width; pixel += 1) {
        for (let byte = 0; byte < bytesPerSample; byte += 1) {
          if (current[pixel * pixelBytes + alphaOffset + byte] !== 0xff) {
            throw invalidResponse(
              clientRequestId,
              "image output PNG alpha contradicts the opaque image contract",
              providerRequestId,
            );
          }
        }
      }
    }
    previous = current;
  }
}

function paethPredictor(left: number, above: number, aboveLeft: number): number {
  const estimate = left + above - aboveLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const aboveLeftDistance = Math.abs(estimate - aboveLeft);
  if (leftDistance <= aboveDistance && leftDistance <= aboveLeftDistance) return left;
  if (aboveDistance <= aboveLeftDistance) return above;
  return aboveLeft;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function assertOptionalEchoes(
  body: Record<string, unknown>,
  compiled: CompiledImageRequest,
  clientRequestId: string,
  providerRequestId: string,
): void {
  const expected = {
    background: compiled.manifest.background,
    output_format: compiled.manifest.outputFormat,
    quality: compiled.manifest.quality,
    size: compiled.manifest.size,
  } as const;
  for (const [key, value] of Object.entries(expected)) {
    if (body[key] !== undefined && body[key] !== value) {
      throw invalidResponse(clientRequestId, `image response ${key} does not match the request`, providerRequestId);
    }
  }
}

function readUsage(value: unknown, clientRequestId: string, providerRequestId: string): ImageUsage | null {
  if (value === undefined) return null;
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw invalidResponse(clientRequestId, "image usage is malformed", providerRequestId);
  }
  const usage = value as Record<string, unknown>;
  const details = usage.input_tokens_details;
  if (details === null || typeof details !== "object" || Array.isArray(details)) {
    throw invalidResponse(clientRequestId, "image input usage details are malformed", providerRequestId);
  }
  const outputDetails = usage.output_tokens_details;
  if (
    outputDetails !== undefined &&
    (outputDetails === null || typeof outputDetails !== "object" || Array.isArray(outputDetails))
  ) {
    throw invalidResponse(clientRequestId, "image output usage details are malformed", providerRequestId);
  }
  const parsed: ImageUsage = {
    input_tokens: readNonnegativeInteger(usage.input_tokens, "input_tokens", clientRequestId, providerRequestId),
    input_tokens_details: {
      image_tokens: readNonnegativeInteger(
        (details as Record<string, unknown>).image_tokens,
        "image_tokens",
        clientRequestId,
        providerRequestId,
      ),
      text_tokens: readNonnegativeInteger(
        (details as Record<string, unknown>).text_tokens,
        "text_tokens",
        clientRequestId,
        providerRequestId,
      ),
    },
    output_tokens: readNonnegativeInteger(usage.output_tokens, "output_tokens", clientRequestId, providerRequestId),
    ...(outputDetails === undefined
      ? {}
      : {
          output_tokens_details: {
            image_tokens: readNonnegativeInteger(
              (outputDetails as Record<string, unknown>).image_tokens,
              "output image_tokens",
              clientRequestId,
              providerRequestId,
            ),
            text_tokens: readNonnegativeInteger(
              (outputDetails as Record<string, unknown>).text_tokens,
              "output text_tokens",
              clientRequestId,
              providerRequestId,
            ),
          },
        }),
    total_tokens: readNonnegativeInteger(usage.total_tokens, "total_tokens", clientRequestId, providerRequestId),
  };
  const inputTotal = parsed.input_tokens_details.image_tokens + parsed.input_tokens_details.text_tokens;
  const grandTotal = parsed.input_tokens + parsed.output_tokens;
  const outputTotal =
    parsed.output_tokens_details === undefined
      ? parsed.output_tokens
      : parsed.output_tokens_details.image_tokens + parsed.output_tokens_details.text_tokens;
  if (
    !Number.isSafeInteger(inputTotal) ||
    !Number.isSafeInteger(outputTotal) ||
    !Number.isSafeInteger(grandTotal) ||
    inputTotal !== parsed.input_tokens ||
    outputTotal !== parsed.output_tokens ||
    grandTotal !== parsed.total_tokens ||
    !costArithmeticIsSafe(parsed)
  ) {
    throw invalidResponse(clientRequestId, "image usage token arithmetic is inconsistent", providerRequestId);
  }
  return parsed;
}

function readNonnegativeInteger(
  value: unknown,
  label: string,
  clientRequestId: string,
  providerRequestId: string,
): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw invalidResponse(clientRequestId, `image usage ${label} is invalid`, providerRequestId);
  }
  return value as number;
}

function estimateCost(
  size: PrototypeImageSize,
  quality: ImageQuality,
  usage: ImageUsage | null,
): { output: number; total: number | null } {
  const square = { high: 211_000, low: 6_000, medium: 53_000 } as const;
  const rectangle = { high: 165_000, low: 5_000, medium: 41_000 } as const;
  if (usage === null) return { output: (size === "1024x1024" ? square : rectangle)[quality], total: null };
  const output = usage.output_tokens * 30;
  const inputText = usage.input_tokens_details.text_tokens * 5;
  const inputImage = usage.input_tokens_details.image_tokens * 8;
  return { output, total: output + inputText + inputImage };
}

function costArithmeticIsSafe(usage: ImageUsage): boolean {
  const output = usage.output_tokens * 30;
  const inputText = usage.input_tokens_details.text_tokens * 5;
  const inputImage = usage.input_tokens_details.image_tokens * 8;
  return (
    Number.isSafeInteger(output) &&
    Number.isSafeInteger(inputText) &&
    Number.isSafeInteger(inputImage) &&
    Number.isSafeInteger(output + inputText + inputImage)
  );
}

function parseOptionalMilliseconds(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function invalidResponse(clientRequestId: string, message: string, providerRequestId: string | null = null) {
  return new ImageProviderError({
    clientRequestId,
    code: "invalid_image_response",
    disposition: "indeterminate",
    httpStatus: 200,
    message,
    providerRequestId,
  });
}

function sanitizeUsage(usage: ImageUsage | null): ImageUsage | null {
  if (usage === null) return null;
  return {
    input_tokens: usage.input_tokens,
    input_tokens_details: {
      image_tokens: usage.input_tokens_details.image_tokens,
      text_tokens: usage.input_tokens_details.text_tokens,
    },
    output_tokens: usage.output_tokens,
    ...(usage.output_tokens_details === undefined
      ? {}
      : {
          output_tokens_details: {
            image_tokens: usage.output_tokens_details.image_tokens,
            text_tokens: usage.output_tokens_details.text_tokens,
          },
        }),
    total_tokens: usage.total_tokens,
  };
}

function validateSanitizedResult(manifest: ImageRequestManifest, result: SanitizedImageResult): void {
  assertExactRecordKeys(
    result,
    [
      "byteLength",
      "clientRequestId",
      "digest",
      "estimatedOutputCostMicrousd",
      "estimatedTotalCostMicrousd",
      "height",
      "latencyMs",
      "mediaType",
      "pricingVersion",
      "providerProcessingMs",
      "providerRequestId",
      "requestedModelSnapshot",
      "servedModelEvidence",
      "totalCostEstimateUnavailableReason",
      "usage",
      "width",
    ],
    "image replay result",
  );
  const [width, height] = manifest.size.split("x").map(Number);
  if (
    typeof result.digest !== "string" ||
    !/^[a-f0-9]{64}$/.test(result.digest) ||
    !Number.isSafeInteger(result.byteLength) ||
    result.byteLength <= 0 ||
    result.mediaType !== "image/png" ||
    result.width !== width ||
    result.height !== height ||
    result.requestedModelSnapshot !== manifest.requestedModelSnapshot ||
    result.servedModelEvidence !== "unavailable-from-image-api" ||
    typeof result.providerRequestId !== "string" ||
    result.providerRequestId.trim().length === 0 ||
    result.pricingVersion !== GPT_IMAGE_PRICING_VERSION ||
    (result.providerProcessingMs !== null &&
      (!Number.isFinite(result.providerProcessingMs) || result.providerProcessingMs < 0)) ||
    !Number.isSafeInteger(result.latencyMs) ||
    result.latencyMs < 0 ||
    !Number.isSafeInteger(result.estimatedOutputCostMicrousd) ||
    result.estimatedOutputCostMicrousd < 0 ||
    (result.estimatedTotalCostMicrousd !== null &&
      (!Number.isSafeInteger(result.estimatedTotalCostMicrousd) || result.estimatedTotalCostMicrousd < 0))
  ) {
    throw new Error("image replay result invariants are invalid");
  }
  assertUuid(result.clientRequestId);
  if (
    (result.estimatedTotalCostMicrousd === null) !== (result.totalCostEstimateUnavailableReason !== null) ||
    (result.totalCostEstimateUnavailableReason !== null && result.totalCostEstimateUnavailableReason !== "usage-unavailable")
  ) {
    throw new Error("image replay total-cost evidence is inconsistent");
  }
  if (result.usage === null) {
    const expectedCost = estimateCost(manifest.size, manifest.quality, null);
    if (
      result.estimatedOutputCostMicrousd !== expectedCost.output ||
      result.estimatedTotalCostMicrousd !== expectedCost.total
    ) {
      throw new Error("image replay cost evidence is inconsistent with usage and pricing");
    }
    return;
  }
  const usage = result.usage;
  assertExactRecordKeys(
    usage,
    [
      "input_tokens",
      "input_tokens_details",
      "output_tokens",
      ...(usage.output_tokens_details === undefined ? [] : ["output_tokens_details"]),
      "total_tokens",
    ],
    "image replay usage",
  );
  assertExactRecordKeys(
    usage.input_tokens_details,
    ["image_tokens", "text_tokens"],
    "image replay input usage details",
  );
  if (usage.output_tokens_details !== undefined) {
    assertExactRecordKeys(
      usage.output_tokens_details,
      ["image_tokens", "text_tokens"],
      "image replay output usage details",
    );
  }
  const tokenValues = [
    usage.input_tokens,
    usage.input_tokens_details.image_tokens,
    usage.input_tokens_details.text_tokens,
    usage.output_tokens,
    ...(usage.output_tokens_details === undefined
      ? []
      : [usage.output_tokens_details.image_tokens, usage.output_tokens_details.text_tokens]),
    usage.total_tokens,
  ];
  const inputTotal = usage.input_tokens_details.image_tokens + usage.input_tokens_details.text_tokens;
  const outputTotal =
    usage.output_tokens_details === undefined
      ? usage.output_tokens
      : usage.output_tokens_details.image_tokens + usage.output_tokens_details.text_tokens;
  const grandTotal = usage.input_tokens + usage.output_tokens;
  if (
    tokenValues.some((value) => !Number.isSafeInteger(value) || value < 0) ||
    !Number.isSafeInteger(inputTotal) ||
    !Number.isSafeInteger(outputTotal) ||
    !Number.isSafeInteger(grandTotal) ||
    inputTotal !== usage.input_tokens ||
    outputTotal !== usage.output_tokens ||
    grandTotal !== usage.total_tokens ||
    !costArithmeticIsSafe(usage)
  ) {
    throw new Error("image replay usage arithmetic is inconsistent");
  }
  const expectedCost = estimateCost(manifest.size, manifest.quality, usage);
  if (
    result.estimatedOutputCostMicrousd !== expectedCost.output ||
    result.estimatedTotalCostMicrousd !== expectedCost.total
  ) {
    throw new Error("image replay cost evidence is inconsistent with usage and pricing");
  }
}

function assertExactRecordKeys(value: object, allowed: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...allowed].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} contains unexpected or missing fields`);
  }
}

function isAmbiguousHttpStatus(status: number): boolean {
  return status === 408 || status >= 500;
}

function assertUuid(value: string): void {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error("client request ID must be a UUID");
  }
}
