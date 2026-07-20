import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, realpath, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyReaderFirstPlateEvidence } from "./reader-first-plate-evidence.mjs";

const REPOSITORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUTHORING_ARCHIVE_ROOT = path.resolve(REPOSITORY_ROOT, "../shape-of-time-c0-authoring");
const PROGRESS_PATH = path.join(AUTHORING_ARCHIVE_ROOT, "progress.json");
const MODEL = "claude-fable-5";
const EFFORT = "xhigh";
const ANTHROPIC_API_VERSION = "2023-06-01";
const MAX_OUTPUT_TOKENS = 32_768;
const SAFETY_MARGIN = 4_096;
const CONTEXT_CEILING = 400_000;
const MAX_COUNTED_INPUT = CONTEXT_CEILING - MAX_OUTPUT_TOKENS - SAFETY_MARGIN;
const COUNT_TIMEOUT_MS = 180_000;
const MESSAGE_TIMEOUT_MS = 1_800_000;
const DEFAULT_OPERATION_BUDGET_USD = 2;
const FABLE_INPUT_USD_PER_MILLION = 10;
const FABLE_OUTPUT_USD_PER_MILLION = 50;
const PRICING_VERSION = "anthropic-fable-5-standard-2026-06-09";
const COUNT_URL = "https://api.anthropic.com/v1/messages/count_tokens";
const MESSAGE_URL = "https://api.anthropic.com/v1/messages";
const TARGET_MIN_WORDS = 120;
const TARGET_MAX_WORDS = 250;
const HARD_MAX_WORDS = 260;

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function canonicalJson(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((key) =>
      JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

function exactKeys(value, allowed, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(label + " must be an object");
  }
  const unexpected = Object.keys(value).filter((key) => !allowed.includes(key));
  if (unexpected.length > 0) {
    throw new Error(label + " fields are invalid: " + unexpected.join(", "));
  }
}

function requireExactKeys(value, required, label) {
  exactKeys(value, required, label);
  const missing = required.filter((key) => !Object.hasOwn(value, key));
  if (missing.length > 0) {
    throw new Error(label + " is incomplete: " + missing.join(", "));
  }
}

function requireDigest(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error(label + " must be a SHA-256 digest");
  }
}

function escaped(value) {
  return value.replace(/[\\^$.*+?()[\]{}|]/gu, "\\$&");
}

function bookSection(authoringBrief, bookId) {
  const heading = bookId === "shape-of-time"
    ? "## Root book: Shape of Time"
    : "## Child book: The Map on the Wall";
  const start = authoringBrief.indexOf(heading);
  if (start < 0) throw new Error("authoring brief is missing " + heading);
  const bodyStart = start + heading.length;
  const nextHeading = authoringBrief.slice(bodyStart).search(/^## /mu);
  return nextHeading < 0
    ? authoringBrief.slice(bodyStart).trim()
    : authoringBrief.slice(bodyStart, bodyStart + nextHeading).trim();
}

function globalMovementPreamble(authoringBrief) {
  const firstBook = authoringBrief.search(/^## /mu);
  if (firstBook < 0) throw new Error("authoring brief has no book section");
  return authoringBrief.slice(0, firstBook).replace(/^# .+$/mu, "").trim();
}

function movementBrief(authoringBrief, bookId) {
  const section = bookSection(authoringBrief, bookId);
  const firstFolio = section.search(/^### /mu);
  const localPreamble = firstFolio < 0 ? section : section.slice(0, firstFolio).trim();
  return [globalMovementPreamble(authoringBrief), localPreamble].filter(Boolean).join("\n\n");
}

function currentFolioBrief(authoringBrief, bookId, folio) {
  const section = bookSection(authoringBrief, bookId);
  const pattern = new RegExp(
    "^### " + folio.ordinal + "\\. " + escaped(folio.title) + "(?: —.*)?$",
    "mu",
  );
  const match = pattern.exec(section);
  if (match === null) throw new Error("authoring brief is missing " + folio.id);
  const bodyStart = match.index + match[0].length;
  const remainder = section.slice(bodyStart);
  const next = remainder.search(/^### /mu);
  return (next < 0 ? remainder : remainder.slice(0, next)).trim();
}

function originFor(book) {
  if (book.origin === undefined) {
    return "This is the root Shape of Time book. It begins from the complete Jay and Tan story authority rather than from a parent passage.";
  }
  return [
    "This independent book was founded from the exact passage “" + book.origin.quote + "”.",
    "Its source is " + book.origin.sourceBookId + "/" + book.origin.sourceFolioId
      + ", aperture " + book.origin.apertureId + ".",
    "The source supplies a premise and lineage, not a command to continue the parent scene or replay the parent plot.",
  ].join(" ");
}

function locateFolio(fixture, folioId) {
  for (const book of fixture.books) {
    const folio = book.folios.find((candidate) => candidate.id === folioId);
    if (folio !== undefined) return { book, folio };
  }
  throw new Error("unknown reader-first folio " + folioId);
}

function hasPlate(folio) {
  return folio.plate !== undefined && folio.plate !== null;
}

export function schemaForFolioLayout(baseSchema, folio) {
  const variants = baseSchema?.properties?.imageDirection?.anyOf;
  if (!Array.isArray(variants) || variants.length !== 2) {
    throw new Error("base Fable schema must provide null and object image-direction variants");
  }
  const wantedType = hasPlate(folio) ? "object" : "null";
  const matches = variants.filter((variant) => variant?.type === wantedType);
  if (matches.length !== 1) {
    throw new Error("base Fable schema does not provide one " + wantedType + " image-direction variant");
  }
  const schema = structuredClone(baseSchema);
  schema.properties.imageDirection = structuredClone(matches[0]);
  return schema;
}

function textBlock(text) {
  return { type: "text", text };
}

function xmlEscape(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function imageBlock(plate) {
  const bytes = Buffer.from(plate.bytes);
  if (bytes.length === 0) throw new Error(plate.plateId + " accepted plate is empty");
  if (!/^image\/(?:png|jpeg|webp|gif)$/u.test(plate.mediaType)) {
    throw new Error(plate.plateId + " has unsupported media type " + plate.mediaType);
  }
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: plate.mediaType,
      data: bytes.toString("base64"),
    },
  };
}

function contentBlockManifest(content) {
  if (!Array.isArray(content) || content.length === 0) {
    throw new Error("Fable request content must contain at least one block");
  }
  return content.map((block, index) => {
    if (block?.type === "text" && typeof block.text === "string") {
      requireExactKeys(block, ["type", "text"], "Fable text block");
      return { index, type: "text", sha256: sha256(block.text), utf8Bytes: Buffer.byteLength(block.text) };
    }
    if (block?.type === "image") {
      requireExactKeys(block, ["type", "source"], "Fable image block");
      requireExactKeys(block.source, ["type", "media_type", "data"], "Fable image source");
      if (block.source.type !== "base64" || typeof block.source.data !== "string"
        || !/^image\/(?:png|jpeg|webp|gif)$/u.test(block.source.media_type)) {
        throw new Error("Fable image source is invalid");
      }
      const bytes = Buffer.from(block.source.data, "base64");
      if (bytes.length === 0 || bytes.toString("base64") !== block.source.data) {
        throw new Error("Fable image source is not canonical base64");
      }
      return {
        index,
        type: "image",
        mediaType: block.source.media_type,
        sha256: sha256(bytes),
        bytes: bytes.length,
      };
    }
    throw new Error("Fable request contains an unsupported content block");
  });
}

function historyBlocks({ accepted, book, currentIndex }) {
  const expected = book.folios.slice(0, currentIndex);
  const bookHistory = accepted.filter((entry) => entry.bookId === book.id);
  if (bookHistory.length !== expected.length) {
    throw new Error("accepted " + book.id + " history is not the exact prefix before the requested folio");
  }
  for (const [index, folio] of expected.entries()) {
    const entry = bookHistory[index];
    if (entry?.folioId !== folio.id) {
      throw new Error("accepted " + book.id + " history is out of order before " + folio.id);
    }
    if (hasPlate(folio) && entry.plate === undefined) {
      throw new Error(folio.id + " cannot enter history without its accepted plate");
    }
    if (!hasPlate(folio) && entry.plate !== undefined) {
      throw new Error(folio.id + " unexpectedly carries a plate");
    }
    if (hasPlate(folio) && entry.plate.plateId !== folio.plate.id) {
      throw new Error(folio.id + " carries the wrong accepted plate");
    }
  }
  return bookHistory;
}

function requireGlobalPrefix(accepted, fixture, folioId) {
  const sequence = fixture.books.flatMap((book) => book.folios);
  const currentIndex = sequence.findIndex((folio) => folio.id === folioId);
  const expected = sequence.slice(0, currentIndex).map((folio) => folio.id);
  const received = accepted.map((entry) => entry.folioId);
  if (currentIndex < 0 || expected.length !== received.length
    || expected.some((id, index) => id !== received[index])) {
    throw new Error("accepted editorial progress is not the exact global sequence before " + folioId);
  }
}

function replaceOnce(source, placeholder, value) {
  const first = source.indexOf(placeholder);
  if (first < 0 || source.indexOf(placeholder, first + placeholder.length) >= 0) {
    throw new Error("template must contain exactly one " + placeholder);
  }
  return source.slice(0, first) + value + source.slice(first + placeholder.length);
}

function compiledText({ book, folio, source }) {
  let rendered = source.template;
  rendered = replaceOnce(rendered, "{{WORLD_DOCUMENT}}", source.world);
  rendered = replaceOnce(rendered, "{{BOOK_ORIGIN}}", originFor(book));
  rendered = replaceOnce(rendered, "{{CURRENT_MOVEMENT_BRIEF}}", movementBrief(source.authoringBrief, book.id));
  rendered = replaceOnce(rendered, "{{TEMPORAL_RULES}}", source.temporalRules);
  rendered = replaceOnce(
    rendered,
    "{{CURRENT_FOLIO_BRIEF}}",
    folio.title + "\n\n" + currentFolioBrief(source.authoringBrief, book.id, folio),
  );
  const parts = rendered.split("{{STORY_SO_FAR}}");
  if (parts.length !== 2) throw new Error("template must contain exactly one {{STORY_SO_FAR}}");
  return { afterHistory: parts[1], beforeHistory: parts[0] };
}

export function compileEditorialRequest({ accepted, fixture, folioId, source }) {
  requireGlobalPrefix(accepted, fixture, folioId);
  const { book, folio } = locateFolio(fixture, folioId);
  const currentIndex = book.folios.findIndex((candidate) => candidate.id === folio.id);
  const history = historyBlocks({ accepted, book, currentIndex });
  const { afterHistory, beforeHistory } = compiledText({ book, folio, source });
  const content = [];
  let pending = beforeHistory;

  if (history.length === 0) {
    pending += "No exposed folios yet in this book.";
  } else {
    for (const entry of history) {
      pending += [
        "\n<exposed_folio id=\"" + entry.folioId + "\">",
        "<folio_prose>",
        ...entry.proseParagraphs.map((paragraph) => "<paragraph>" + xmlEscape(paragraph) + "</paragraph>"),
        "</folio_prose>",
      ].join("\n");
      if (entry.plate !== undefined) {
        pending += "\n<narrative_image id=\"" + entry.plate.plateId
          + "\">\nThe following actual accepted image belongs here in story order.\n";
        content.push(textBlock(pending));
        content.push(imageBlock(entry.plate));
        pending = "\n</narrative_image>\n";
      }
      pending += "\n</exposed_folio>\n";
    }
  }
  pending += afterHistory;
  content.push(textBlock(pending));

  const blockManifest = contentBlockManifest(content);
  const manifestCore = {
    version: 2,
    model: MODEL,
    effort: EFFORT,
    bookId: book.id,
    folioId: folio.id,
    promptVersion: "write-folio-" + sha256(source.template).slice(0, 16),
    priorEvidence: history.map((entry) => ({
      candidateSha256: entry.candidateSha256 ?? null,
      folioId: entry.folioId,
      operationManifestSha256: entry.operationManifestSha256 ?? null,
      plate: entry.plate === undefined ? null : {
        acceptanceSha256: entry.plate.acceptanceSha256 ?? null,
        plateId: entry.plate.plateId,
        providerOutputSha256: entry.plate.providerOutputSha256 ?? null,
        providerReceiptSha256: entry.plate.providerReceiptSha256 ?? null,
      },
    })),
    priorFolioIds: history.map((entry) => entry.folioId),
    priorPlateIds: history.flatMap((entry) => entry.plate === undefined ? [] : [entry.plate.plateId]),
    sourceDigests: {
      authoringBriefSha256: sha256(source.authoringBrief),
      temporalRulesSha256: sha256(source.temporalRules),
      templateSha256: sha256(source.template),
      worldSha256: sha256(source.world),
    },
    blocks: blockManifest,
  };
  const manifestSha256 = sha256(canonicalJson(manifestCore));
  return { content, manifest: { ...manifestCore, manifestSha256 } };
}

export function buildAnthropicRequests({
  compiled,
  perOperationBudgetUsd = DEFAULT_OPERATION_BUDGET_USD,
  schema,
  systemPrompt,
}) {
  if (typeof systemPrompt !== "string" || systemPrompt.trim() === "") {
    throw new Error("systemPrompt must be nonempty");
  }
  if (typeof schema !== "object" || schema === null || Array.isArray(schema)) {
    throw new Error("schema must be an object");
  }
  if (!(Number.isFinite(perOperationBudgetUsd) && perOperationBudgetUsd > 0)) {
    throw new Error("perOperationBudgetUsd must be positive");
  }
  const countRequest = {
    model: MODEL,
    system: systemPrompt,
    messages: [{ role: "user", content: compiled.content }],
    output_config: {
      effort: EFFORT,
      format: { type: "json_schema", schema },
    },
  };
  const generationRequest = { ...countRequest, max_tokens: MAX_OUTPUT_TOKENS };
  const operationCore = {
    version: 2,
    provider: "anthropic-messages",
    apiVersion: ANTHROPIC_API_VERSION,
    countEndpoint: COUNT_URL,
    messageEndpoint: MESSAGE_URL,
    wireBodyEncoding: "canonical-json-v1",
    model: MODEL,
    effort: EFFORT,
    bookId: compiled.manifest.bookId,
    folioId: compiled.manifest.folioId,
    contentManifestSha256: compiled.manifest.manifestSha256,
    countRequestSha256: sha256(canonicalJson(countRequest)),
    generationRequestSha256: sha256(canonicalJson(generationRequest)),
    schemaSha256: sha256(canonicalJson(schema)),
    systemSha256: sha256(systemPrompt),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    safetyMargin: SAFETY_MARGIN,
    contextCeiling: CONTEXT_CEILING,
    maximumCountedInput: MAX_COUNTED_INPUT,
    countTimeoutMs: COUNT_TIMEOUT_MS,
    messageTimeoutMs: MESSAGE_TIMEOUT_MS,
    perOperationBudgetUsd,
    pricing: {
      inputUsdPerMillion: FABLE_INPUT_USD_PER_MILLION,
      outputUsdPerMillion: FABLE_OUTPUT_USD_PER_MILLION,
      version: PRICING_VERSION,
    },
  };
  const operationManifestSha256 = sha256(canonicalJson(operationCore));
  return {
    countRequest,
    generationRequest,
    operationManifest: { ...operationCore, operationManifestSha256 },
  };
}

export function validateContextAdmission(inputTokens) {
  if (!Number.isSafeInteger(inputTokens) || inputTokens <= 0) {
    throw new Error("provider input token count must be a positive integer");
  }
  const equationTotal = inputTokens + MAX_OUTPUT_TOKENS + SAFETY_MARGIN;
  if (equationTotal > CONTEXT_CEILING) {
    throw new Error("provider count violates the 400000-token context equation");
  }
  return {
    contextCeiling: CONTEXT_CEILING,
    equationTotal,
    inputTokens,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    safetyMargin: SAFETY_MARGIN,
  };
}

function projectedMaximumCost(inputTokens, operationManifest) {
  return (
    inputTokens * operationManifest.pricing.inputUsdPerMillion
    + operationManifest.maxOutputTokens * operationManifest.pricing.outputUsdPerMillion
  ) / 1_000_000;
}

export function admitTokenCount({
  completedAt,
  countLatencyMs = null,
  countRequestId,
  countResponseSha256,
  countResponse,
  operationManifest,
}) {
  if (typeof countRequestId !== "string" || countRequestId.trim() === "") {
    throw new Error("provider count request id is required");
  }
  requireDigest(countResponseSha256, "provider count response");
  const equation = validateContextAdmission(countResponse?.input_tokens);
  const projectedMaximumCostUsd = projectedMaximumCost(equation.inputTokens, operationManifest);
  if (projectedMaximumCostUsd > operationManifest.perOperationBudgetUsd + Number.EPSILON) {
    throw new Error(
      "projected maximum cost $" + projectedMaximumCostUsd.toFixed(6)
      + " exceeds the $" + operationManifest.perOperationBudgetUsd.toFixed(2) + " operation ceiling",
    );
  }
  const core = {
    version: 1,
    admitted: true,
    completedAt,
    countLatencyMs,
    countRequestId,
    countResponseSha256,
    inputTokens: equation.inputTokens,
    maxOutputTokens: equation.maxOutputTokens,
    safetyMargin: equation.safetyMargin,
    contextCeiling: equation.contextCeiling,
    equationTotal: equation.equationTotal,
    projectedMaximumCostUsd,
    operationManifestSha256: operationManifest.operationManifestSha256,
    countRequestSha256: operationManifest.countRequestSha256,
    generationRequestSha256: operationManifest.generationRequestSha256,
    model: operationManifest.model,
    effort: operationManifest.effort,
  };
  return { ...core, admissionSha256: sha256(canonicalJson(core)) };
}

function nonemptyStringArray(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string" || entry.trim() === "")) {
    throw new Error(label + " must be an array of nonempty strings");
  }
}

function validateStructuredOutput(value) {
  exactKeys(value, ["proseParagraphs", "imageDirection"], "Fable structured output");
  if (!Array.isArray(value.proseParagraphs) || value.proseParagraphs.length < 1
    || value.proseParagraphs.length > 3
    || value.proseParagraphs.some((paragraph) => typeof paragraph !== "string" || paragraph.trim() === "")) {
    throw new Error("Fable returned invalid proseParagraphs");
  }
  if (value.imageDirection === null) return value;
  exactKeys(
    value.imageDirection,
    ["narrativeJob", "concreteScene", "factLeftToImage", "mustRemain", "purposefulChanges", "unresolvedFacts"],
    "Fable imageDirection",
  );
  for (const key of ["narrativeJob", "concreteScene", "factLeftToImage"]) {
    if (typeof value.imageDirection[key] !== "string" || value.imageDirection[key].trim() === "") {
      throw new Error("Fable imageDirection." + key + " must be nonempty");
    }
  }
  for (const key of ["mustRemain", "purposefulChanges", "unresolvedFacts"]) {
    nonemptyStringArray(value.imageDirection[key], "Fable imageDirection." + key);
  }
  return value;
}

function usageInteger(usage, key, { positive = false } = {}) {
  const value = usage?.[key] ?? 0;
  if (!Number.isSafeInteger(value) || value < 0 || (positive && value === 0)) {
    throw new Error("Fable usage." + key + " is invalid");
  }
  return value;
}

export function extractSuccessfulMessage({ providerRequestId, response }) {
  if (typeof providerRequestId !== "string" || providerRequestId.trim() === "") {
    throw new Error("provider message request id is required");
  }
  if (response?.type !== "message" || response.role !== "assistant"
    || typeof response.id !== "string" || response.id.trim() === "") {
    throw new Error("Fable returned invalid message identity");
  }
  if (response.model !== MODEL) {
    throw new Error("expected exact Fable model, received " + String(response.model));
  }
  if (response.stop_reason !== "end_turn") {
    throw new Error("Fable stop reason was " + String(response.stop_reason));
  }
  if (!Array.isArray(response.content)) throw new Error("Fable returned invalid content");
  const unexpected = response.content.filter((block) =>
    !["text", "thinking", "redacted_thinking"].includes(block?.type));
  if (unexpected.length > 0) throw new Error("Fable returned an unsupported content block");
  const textBlocks = response.content.filter((block) => block?.type === "text");
  if (textBlocks.length !== 1 || typeof textBlocks[0].text !== "string") {
    throw new Error("Fable must return exactly one text block");
  }
  let parsed;
  try {
    parsed = JSON.parse(textBlocks[0].text);
  } catch {
    throw new Error("Fable text block is not valid JSON");
  }
  const output = validateStructuredOutput(parsed);
  const inputTokens = usageInteger(response.usage, "input_tokens", { positive: true });
  const cacheCreationInputTokens = usageInteger(response.usage, "cache_creation_input_tokens");
  const cacheReadInputTokens = usageInteger(response.usage, "cache_read_input_tokens");
  const outputTokens = usageInteger(response.usage, "output_tokens", { positive: true });
  const observedInputTokens = inputTokens + cacheCreationInputTokens + cacheReadInputTokens;
  if (observedInputTokens > MAX_COUNTED_INPUT) {
    throw new Error("Fable logical input " + observedInputTokens + " violates 363136");
  }
  if (outputTokens > MAX_OUTPUT_TOKENS) {
    throw new Error("Fable output " + outputTokens + " violates 32768");
  }
  const estimatedCostUsd = (
    observedInputTokens * FABLE_INPUT_USD_PER_MILLION
    + outputTokens * FABLE_OUTPUT_USD_PER_MILLION
  ) / 1_000_000;
  return {
    output,
    observedInputTokens,
    evidence: {
      effort: EFFORT,
      estimatedCostUsd,
      model: MODEL,
      pricingVersion: PRICING_VERSION,
      providerMessageId: response.id,
      providerRequestId,
      stopReason: response.stop_reason,
      usage: response.usage,
    },
  };
}

function providerRequestId(response) {
  return response.headers.get("request-id") ?? response.headers.get("x-request-id");
}

async function responseJson(response, label) {
  const bytes = Buffer.from(await response.arrayBuffer());
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(label + " returned non-JSON status " + response.status);
  }
  if (!response.ok) throw new Error(label + " failed with HTTP " + response.status);
  return { bytes, parsed };
}

function anthropicRequest(apiKey, body, timeoutMs) {
  return {
    body: canonicalJson(body),
    headers: {
      "anthropic-version": ANTHROPIC_API_VERSION,
      "content-type": "application/json",
      "x-api-key": apiKey,
    },
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
  };
}

export async function executeAnthropicOperation({
  apiKey,
  claimDispatch,
  fetchImpl = fetch,
  now = () => new Date().toISOString(),
  operationManifest,
  persistAdmission,
  receiveResponse,
  requests,
}) {
  if (typeof apiKey !== "string" || apiKey.trim() === "") {
    throw new Error("ANTHROPIC_API_KEY is required");
  }
  if (canonicalJson(operationManifest) !== canonicalJson(requests.operationManifest)) {
    throw new Error("operation manifest does not match the prepared requests");
  }
  const countStarted = Date.now();
  const countHttpResponse = await fetchImpl(
    COUNT_URL,
    anthropicRequest(apiKey, requests.countRequest, COUNT_TIMEOUT_MS),
  );
  const countId = providerRequestId(countHttpResponse);
  const countResult = await responseJson(countHttpResponse, "Anthropic token count");
  const admission = admitTokenCount({
    completedAt: now(),
    countLatencyMs: Date.now() - countStarted,
    countRequestId: countId,
    countResponse: countResult.parsed,
    countResponseSha256: sha256(countResult.bytes),
    operationManifest,
  });
  await persistAdmission(admission, countResult.bytes, {
    contentType: countHttpResponse.headers.get("content-type"),
    providerRequestId: countId,
    status: countHttpResponse.status,
  });
  await claimDispatch(admission);

  const messageStarted = Date.now();
  const messageHttpResponse = await fetchImpl(
    MESSAGE_URL,
    anthropicRequest(apiKey, requests.generationRequest, MESSAGE_TIMEOUT_MS),
  );
  const messageRequestId = providerRequestId(messageHttpResponse);
  const providerResponseBytes = Buffer.from(await receiveResponse(messageHttpResponse));
  let messageResponse;
  try {
    messageResponse = JSON.parse(providerResponseBytes.toString("utf8"));
  } catch {
    throw new Error("Anthropic message returned non-JSON status " + messageHttpResponse.status);
  }
  if (!messageHttpResponse.ok) {
    throw new Error("Anthropic message failed with HTTP " + messageHttpResponse.status);
  }
  const candidate = extractSuccessfulMessage({
    providerRequestId: messageRequestId,
    response: messageResponse,
  });
  return {
    admission,
    candidate,
    messageLatencyMs: Date.now() - messageStarted,
    providerResponseBytes,
  };
}

function magicMediaType(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "image/png";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF"
    && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  const gif = bytes.subarray(0, 6).toString("ascii");
  if (gif === "GIF87a" || gif === "GIF89a") return "image/gif";
  return null;
}

async function containedExistingPath(archiveRoot, candidate, label) {
  if (typeof candidate !== "string" || !path.isAbsolute(candidate)) {
    throw new Error(label + " must be an absolute path");
  }
  const [rootReal, candidateReal] = await Promise.all([realpath(archiveRoot), realpath(candidate)]);
  if (candidateReal !== rootReal && !candidateReal.startsWith(rootReal + path.sep)) {
    throw new Error(label + " escapes the editorial archive");
  }
  return candidateReal;
}

async function verifiedFile(archiveRoot, file, expectedDigest, label) {
  requireDigest(expectedDigest, label + " digest");
  const verifiedPath = await containedExistingPath(archiveRoot, file, label);
  const bytes = await readFile(verifiedPath);
  if (sha256(bytes) !== expectedDigest) throw new Error(label + " digest mismatch");
  return { bytes, path: verifiedPath };
}

function parsedJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(label + " is not valid JSON");
  }
}

async function fixedEvidenceFile(archiveRoot, operationDirectory, name, label) {
  const file = await containedExistingPath(
    archiveRoot,
    path.join(operationDirectory, name),
    label,
  );
  return { bytes: await readFile(file), path: file };
}

function validateSelfDigest(record, digestKey, label) {
  requireDigest(record[digestKey], label);
  const core = { ...record };
  delete core[digestKey];
  if (sha256(canonicalJson(core)) !== record[digestKey]) {
    throw new Error(label + " does not match its canonical evidence");
  }
}

function sameCanonical(actual, expected, label) {
  if (canonicalJson(actual) !== canonicalJson(expected)) {
    throw new Error(label + " drifted from its retained evidence");
  }
}

export async function validateCandidateEvidenceChain({ archiveRoot, candidate, candidateFile }) {
  const candidateKeys = [
    "version", "bookId", "folioId", "operationManifestSha256", "contentManifestSha256",
    "priorFolioIds", "priorPlateIds", "admissionSha256", "countedInputTokens",
    "providerMessageId", "providerRequestId", "providerResponseSha256", "usage",
    "estimatedCostUsd", "output", "evidence",
  ];
  requireExactKeys(candidate, candidateKeys, "candidate evidence chain");
  if (path.basename(candidateFile.path) !== "candidate.json") {
    throw new Error("candidate evidence chain must use candidate.json");
  }
  const operationDirectory = path.dirname(candidateFile.path);
  const evidenceFiles = await Promise.all([
    fixedEvidenceFile(archiveRoot, operationDirectory, "request-manifest.json", "operation manifest"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "content-manifest.json", "content manifest"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "count-request.json", "count request"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "generation-request.json", "generation request"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "schema.json", "structured-output schema"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "system.txt", "system prompt"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "count-response.json", "count response"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "count-response-headers.json", "count response headers"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "admission.json", "token admission"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "response-headers.json", "message response headers"),
    fixedEvidenceFile(archiveRoot, operationDirectory, "provider-response.json", "provider response"),
  ]);
  const [
    operationFile,
    contentFile,
    countRequestFile,
    generationRequestFile,
    schemaFile,
    systemFile,
    countResponseFile,
    countHeadersFile,
    admissionFile,
    messageHeadersFile,
    providerResponseFile,
  ] = evidenceFiles;

  const operationManifest = parsedJson(operationFile.bytes, "operation manifest");
  requireExactKeys(operationManifest, [
    "version", "provider", "apiVersion", "countEndpoint", "messageEndpoint", "wireBodyEncoding",
    "model", "effort", "bookId", "folioId", "contentManifestSha256", "countRequestSha256",
    "generationRequestSha256", "schemaSha256", "systemSha256", "maxOutputTokens", "safetyMargin",
    "contextCeiling", "maximumCountedInput", "countTimeoutMs", "messageTimeoutMs",
    "perOperationBudgetUsd", "pricing", "operationManifestSha256",
  ], "operation manifest");
  validateSelfDigest(operationManifest, "operationManifestSha256", "operation manifest digest");
  requireExactKeys(
    operationManifest.pricing,
    ["inputUsdPerMillion", "outputUsdPerMillion", "version"],
    "operation pricing",
  );
  if (candidate.operationManifestSha256 !== operationManifest.operationManifestSha256
    || operationManifest.version !== 2
    || operationManifest.provider !== "anthropic-messages"
    || operationManifest.apiVersion !== ANTHROPIC_API_VERSION
    || operationManifest.countEndpoint !== COUNT_URL
    || operationManifest.messageEndpoint !== MESSAGE_URL
    || operationManifest.wireBodyEncoding !== "canonical-json-v1"
    || operationManifest.model !== MODEL
    || operationManifest.effort !== EFFORT
    || operationManifest.maxOutputTokens !== MAX_OUTPUT_TOKENS
    || operationManifest.safetyMargin !== SAFETY_MARGIN
    || operationManifest.contextCeiling !== CONTEXT_CEILING
    || operationManifest.maximumCountedInput !== MAX_COUNTED_INPUT
    || operationManifest.countTimeoutMs !== COUNT_TIMEOUT_MS
    || operationManifest.messageTimeoutMs !== MESSAGE_TIMEOUT_MS) {
    throw new Error("candidate operation manifest violates the accepted Fable contract");
  }
  if (candidate.bookId !== operationManifest.bookId || candidate.folioId !== operationManifest.folioId) {
    throw new Error("candidate identity disagrees with its operation manifest");
  }

  const contentManifest = parsedJson(contentFile.bytes, "content manifest");
  requireExactKeys(contentManifest, [
    "version", "model", "effort", "bookId", "folioId", "promptVersion", "priorEvidence",
    "priorFolioIds", "priorPlateIds", "sourceDigests", "blocks", "manifestSha256",
  ], "content manifest");
  validateSelfDigest(contentManifest, "manifestSha256", "content manifest digest");
  requireExactKeys(
    contentManifest.sourceDigests,
    ["authoringBriefSha256", "temporalRulesSha256", "templateSha256", "worldSha256"],
    "content source digests",
  );
  for (const [name, digest] of Object.entries(contentManifest.sourceDigests)) {
    requireDigest(digest, "content source " + name);
  }
  if (contentManifest.version !== 2 || contentManifest.model !== MODEL
    || contentManifest.effort !== EFFORT
    || contentManifest.bookId !== candidate.bookId || contentManifest.folioId !== candidate.folioId
    || contentManifest.manifestSha256 !== candidate.contentManifestSha256
    || contentManifest.manifestSha256 !== operationManifest.contentManifestSha256) {
    throw new Error("candidate content manifest is not bound to its operation");
  }
  sameCanonical(candidate.priorFolioIds, contentManifest.priorFolioIds, "candidate prior folios");
  sameCanonical(candidate.priorPlateIds, contentManifest.priorPlateIds, "candidate prior plates");

  const countRequest = parsedJson(countRequestFile.bytes, "count request");
  const generationRequest = parsedJson(generationRequestFile.bytes, "generation request");
  if (countRequestFile.bytes.toString("utf8") !== canonicalJson(countRequest)
    || generationRequestFile.bytes.toString("utf8") !== canonicalJson(generationRequest)
    || sha256(countRequestFile.bytes) !== operationManifest.countRequestSha256
    || sha256(generationRequestFile.bytes) !== operationManifest.generationRequestSha256) {
    throw new Error("retained Fable wire requests do not match their manifest");
  }
  requireExactKeys(countRequest, ["model", "system", "messages", "output_config"], "count request");
  requireExactKeys(
    generationRequest,
    ["model", "system", "messages", "output_config", "max_tokens"],
    "generation request",
  );
  const expectedGeneration = { ...countRequest, max_tokens: MAX_OUTPUT_TOKENS };
  sameCanonical(generationRequest, expectedGeneration, "generation request");
  if (countRequest.model !== MODEL || generationRequest.max_tokens !== MAX_OUTPUT_TOKENS
    || countRequest.output_config?.effort !== EFFORT
    || countRequest.output_config?.format?.type !== "json_schema"
    || !Array.isArray(countRequest.messages) || countRequest.messages.length !== 1
    || countRequest.messages[0]?.role !== "user") {
    throw new Error("retained Fable request violates the accepted model contract");
  }
  requireExactKeys(countRequest.messages[0], ["role", "content"], "Fable user message");
  sameCanonical(
    contentBlockManifest(countRequest.messages[0].content),
    contentManifest.blocks,
    "content block manifest",
  );

  const schema = parsedJson(schemaFile.bytes, "structured-output schema");
  if (sha256(canonicalJson(schema)) !== operationManifest.schemaSha256) {
    throw new Error("structured-output schema digest drifted");
  }
  sameCanonical(countRequest.output_config.format.schema, schema, "structured-output schema");
  const systemPrompt = systemFile.bytes.toString("utf8");
  if (sha256(systemPrompt) !== operationManifest.systemSha256 || countRequest.system !== systemPrompt) {
    throw new Error("system prompt digest drifted");
  }

  const countResponse = parsedJson(countResponseFile.bytes, "count response");
  const countHeaders = parsedJson(countHeadersFile.bytes, "count response headers");
  requireExactKeys(countHeaders, ["contentType", "providerRequestId", "status"], "count response headers");
  const admission = parsedJson(admissionFile.bytes, "token admission");
  requireExactKeys(admission, [
    "version", "admitted", "completedAt", "countLatencyMs", "countRequestId",
    "countResponseSha256", "inputTokens", "maxOutputTokens", "safetyMargin", "contextCeiling",
    "equationTotal", "projectedMaximumCostUsd", "operationManifestSha256", "countRequestSha256",
    "generationRequestSha256", "model", "effort", "admissionSha256",
  ], "token admission");
  validateSelfDigest(admission, "admissionSha256", "token admission digest");
  const reconstructedAdmission = admitTokenCount({
    completedAt: admission.completedAt,
    countLatencyMs: admission.countLatencyMs,
    countRequestId: admission.countRequestId,
    countResponse,
    countResponseSha256: sha256(countResponseFile.bytes),
    operationManifest,
  });
  sameCanonical(admission, reconstructedAdmission, "token admission");
  if (candidate.admissionSha256 !== admission.admissionSha256
    || candidate.countedInputTokens !== admission.inputTokens
    || countHeaders.status !== 200
    || countHeaders.providerRequestId !== admission.countRequestId
    || typeof countHeaders.contentType !== "string"
    || !countHeaders.contentType.includes("application/json")) {
    throw new Error("candidate token admission is not bound to the official count response");
  }

  requireDigest(candidate.providerResponseSha256, "candidate provider response");
  if (sha256(providerResponseFile.bytes) !== candidate.providerResponseSha256) {
    throw new Error("candidate provider response digest mismatch");
  }
  const messageHeaders = parsedJson(messageHeadersFile.bytes, "message response headers");
  requireExactKeys(messageHeaders, ["contentType", "providerRequestId", "status"], "message response headers");
  if (messageHeaders.status !== 200 || messageHeaders.providerRequestId !== candidate.providerRequestId
    || typeof messageHeaders.contentType !== "string"
    || !messageHeaders.contentType.includes("application/json")) {
    throw new Error("candidate message response headers drifted");
  }
  const providerResponse = parsedJson(providerResponseFile.bytes, "provider response");
  const extracted = extractSuccessfulMessage({
    providerRequestId: candidate.providerRequestId,
    response: providerResponse,
  });
  requireExactKeys(
    candidate.evidence,
    ["messageLatencyMs", "model", "effort", "pricingVersion", "stopReason"],
    "candidate response evidence",
  );
  if (!Number.isFinite(candidate.evidence.messageLatencyMs) || candidate.evidence.messageLatencyMs < 0
    || candidate.providerMessageId !== extracted.evidence.providerMessageId
    || candidate.evidence.model !== extracted.evidence.model
    || candidate.evidence.effort !== extracted.evidence.effort
    || candidate.evidence.pricingVersion !== extracted.evidence.pricingVersion
    || candidate.evidence.stopReason !== extracted.evidence.stopReason
    || candidate.estimatedCostUsd !== extracted.evidence.estimatedCostUsd) {
    throw new Error("candidate response evidence disagrees with the retained provider result");
  }
  sameCanonical(candidate.usage, extracted.evidence.usage, "candidate usage");
  sameCanonical(candidate.output, extracted.output, "candidate structured output");
  return { contentManifest, operationManifest };
}

export async function loadVerifiedFableCandidate({
  archiveRoot,
  candidatePath,
  candidateSha256,
}) {
  const candidateFile = await verifiedFile(
    archiveRoot,
    candidatePath,
    candidateSha256,
    "candidate",
  );
  const candidate = parsedJson(candidateFile.bytes, "candidate");
  const manifests = await validateCandidateEvidenceChain({ archiveRoot, candidate, candidateFile });
  return {
    candidate,
    candidatePath: candidateFile.path,
    candidateSha256,
    ...manifests,
  };
}

export async function loadAcceptedProgress({ archiveRoot, fixture, progressPath }) {
  if (progressPath === undefined) return [];
  let progressFile;
  try {
    progressFile = await containedExistingPath(archiveRoot, progressPath, "progress file");
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
  const progress = JSON.parse(await readFile(progressFile, "utf8"));
  exactKeys(progress, ["accepted", "version"], "editorial progress");
  if (progress.version !== 2 || !Array.isArray(progress.accepted)) {
    throw new Error("invalid editorial progress file");
  }
  const sequence = fixture.books.flatMap((book) =>
    book.folios.map((folio) => ({ book, folio })));
  if (progress.accepted.length > sequence.length) throw new Error("editorial progress is too long");

  const accepted = [];
  for (const [index, entry] of progress.accepted.entries()) {
    exactKeys(
      entry,
      [
        "candidatePath",
        "candidateSha256",
        "discardedImageDirectionSha256",
        "plateAcceptancePath",
        "plateAcceptanceSha256",
      ],
      "progress entry fields",
    );
    const expected = sequence[index];
    const candidateFile = await verifiedFile(
      archiveRoot,
      entry.candidatePath,
      entry.candidateSha256,
      "candidate",
    );
    const candidate = JSON.parse(candidateFile.bytes.toString("utf8"));
    const { contentManifest } = await validateCandidateEvidenceChain({
      archiveRoot,
      candidate,
      candidateFile,
    });
    if (candidate.version !== 2 || candidate.bookId !== expected.book.id
      || candidate.folioId !== expected.folio.id) {
      throw new Error("candidate does not match the exact editorial sequence");
    }
    requireDigest(candidate.operationManifestSha256, "candidate operation manifest");
    requireDigest(candidate.providerResponseSha256, "candidate provider response");
    if (typeof candidate.providerMessageId !== "string" || candidate.providerMessageId.trim() === "") {
      throw new Error("candidate provider message id is missing");
    }
    const output = validateStructuredOutput(candidate.output);
    validateCandidateForFolio(
      { output },
      expected.folio,
      { discardedImageDirectionSha256: entry.discardedImageDirectionSha256 },
    );
    const sameBookHistory = accepted.filter((prior) => prior.bookId === candidate.bookId);
    const expectedPriorEvidence = sameBookHistory.map((prior) => ({
      candidateSha256: prior.candidateSha256,
      folioId: prior.folioId,
      operationManifestSha256: prior.operationManifestSha256,
      plate: prior.plate === undefined ? null : {
        acceptanceSha256: prior.plate.acceptanceSha256,
        plateId: prior.plate.plateId,
        providerOutputSha256: prior.plate.providerOutputSha256,
        providerReceiptSha256: prior.plate.providerReceiptSha256,
      },
    }));
    sameCanonical(
      contentManifest.priorEvidence,
      expectedPriorEvidence,
      "candidate accepted-history evidence",
    );
    sameCanonical(
      contentManifest.priorFolioIds,
      sameBookHistory.map((prior) => prior.folioId),
      "candidate accepted-history folios",
    );
    sameCanonical(
      contentManifest.priorPlateIds,
      sameBookHistory.flatMap((prior) => prior.plate === undefined ? [] : [prior.plate.plateId]),
      "candidate accepted-history plates",
    );
    const loaded = {
      bookId: candidate.bookId,
      candidatePath: candidateFile.path,
      candidateSha256: entry.candidateSha256,
      folioId: candidate.folioId,
      imageDirection: hasPlate(expected.folio) ? output.imageDirection : null,
      operationManifestSha256: candidate.operationManifestSha256,
      proseParagraphs: output.proseParagraphs,
    };
    if (entry.discardedImageDirectionSha256 !== undefined) {
      loaded.discardedImageDirectionSha256 = entry.discardedImageDirectionSha256;
    }

    if (hasPlate(expected.folio)) {
      if (typeof entry.plateAcceptancePath !== "string"
        || typeof entry.plateAcceptanceSha256 !== "string") {
        throw new Error(expected.folio.id + " requires accepted plate evidence");
      }
      const acceptanceFile = await verifiedFile(
        archiveRoot,
        entry.plateAcceptancePath,
        entry.plateAcceptanceSha256,
        "plate acceptance",
      );
      const acceptance = JSON.parse(acceptanceFile.bytes.toString("utf8"));
      exactKeys(acceptance, [
        "assetPath", "assetSha256", "bookId", "candidateSha256", "fableImageDirectionSha256",
        "folioId", "mediaType", "plateId", "providerOutputSha256", "providerReceiptPath",
        "providerReceiptSha256", "version",
      ], "plate acceptance");
      if (acceptance.version !== 2 || acceptance.bookId !== expected.book.id
        || acceptance.folioId !== expected.folio.id || acceptance.plateId !== expected.folio.plate.id
        || acceptance.candidateSha256 !== entry.candidateSha256
        || acceptance.fableImageDirectionSha256 !== sha256(canonicalJson(output.imageDirection))) {
        throw new Error("plate acceptance does not match the requested folio plate");
      }
      const expectedAcceptancePath = path.join(
        await realpath(archiveRoot),
        "images",
        "accepted",
        acceptance.plateId,
        "acceptance.json",
      );
      if (acceptanceFile.path !== expectedAcceptancePath) {
        throw new Error("plate acceptance is outside its fixed accepted namespace");
      }
      const [asset, receipt] = await Promise.all([
        verifiedFile(archiveRoot, acceptance.assetPath, acceptance.assetSha256, "accepted plate asset"),
        verifiedFile(
          archiveRoot,
          acceptance.providerReceiptPath,
          acceptance.providerReceiptSha256,
          "image provider receipt",
        ),
      ]);
      if (acceptance.providerOutputSha256 !== acceptance.assetSha256) {
        throw new Error("accepted plate output digest does not match its asset");
      }
      await verifyReaderFirstPlateEvidence({
        authoringRoot: archiveRoot,
        candidate,
        candidateSha256: entry.candidateSha256,
        imageBytes: asset.bytes,
        imagePath: asset.path,
        plateId: acceptance.plateId,
        providerReceiptBytes: receipt.bytes,
        providerReceiptPath: receipt.path,
        trustedPlateEvidence: accepted.flatMap((prior) => prior.plate === undefined ? [] : [{
          acceptanceSha256: prior.plate.acceptanceSha256,
          plateId: prior.plate.plateId,
          providerOutputSha256: prior.plate.providerOutputSha256,
        }]),
      });
      if (magicMediaType(asset.bytes) !== acceptance.mediaType) {
        throw new Error("accepted plate media type does not match its bytes");
      }
      loaded.plate = {
        acceptancePath: acceptanceFile.path,
        acceptanceSha256: entry.plateAcceptanceSha256,
        bytes: asset.bytes,
        mediaType: acceptance.mediaType,
        plateId: acceptance.plateId,
        providerOutputSha256: acceptance.providerOutputSha256,
        providerReceiptSha256: acceptance.providerReceiptSha256,
      };
    } else if (entry.plateAcceptancePath !== undefined || entry.plateAcceptanceSha256 !== undefined) {
      throw new Error(expected.folio.id + " cannot carry plate evidence");
    }
    accepted.push(loaded);
  }
  return accepted;
}

export async function appendAcceptedProgress({
  archiveRoot,
  entry,
  fixture,
  progressPath,
}) {
  requireExactKeys(entry, [
    "candidatePath",
    "candidateSha256",
    "discardedImageDirectionSha256",
    "plateAcceptancePath",
    "plateAcceptanceSha256",
  ].filter((key) => Object.hasOwn(entry, key)), "new progress entry");
  if (typeof entry.candidatePath !== "string" || entry.candidatePath.trim() === "") {
    throw new Error("new progress entry requires a candidate path");
  }
  requireDigest(entry.candidateSha256, "new progress candidate");
  if (entry.discardedImageDirectionSha256 !== undefined) {
    requireDigest(entry.discardedImageDirectionSha256, "discarded image direction");
  }
  const hasPlatePath = Object.hasOwn(entry, "plateAcceptancePath");
  const hasPlateDigest = Object.hasOwn(entry, "plateAcceptanceSha256");
  if (hasPlatePath !== hasPlateDigest) {
    throw new Error("new progress entry plate path and digest must be supplied together");
  }
  if (hasPlatePath) {
    if (typeof entry.plateAcceptancePath !== "string" || entry.plateAcceptancePath.trim() === "") {
      throw new Error("new progress entry plate acceptance path is invalid");
    }
    requireDigest(entry.plateAcceptanceSha256, "new progress plate acceptance");
  }

  const rootReal = await realpath(archiveRoot);
  const target = path.join(await realpath(path.dirname(path.resolve(progressPath))), path.basename(progressPath));
  const relative = path.relative(rootReal, target);
  if (relative === "" || relative === ".." || relative.startsWith(".." + path.sep)
    || path.isAbsolute(relative)) {
    throw new Error("progress file escapes the editorial archive or names its root");
  }
  const release = await acquireProgressLock(target);
  try {
    let previousBytes = null;
    let previous = { accepted: [], version: 2 };
    try {
      previousBytes = await readFile(target);
      previous = parsedJson(previousBytes, "editorial progress");
      requireExactKeys(previous, ["accepted", "version"], "editorial progress");
      if (previous.version !== 2 || !Array.isArray(previous.accepted)) {
        throw new Error("invalid editorial progress file");
      }
      await loadAcceptedProgress({ archiveRoot, fixture, progressPath: target });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    const last = previous.accepted.at(-1);
    if (last !== undefined && canonicalJson(last) === canonicalJson(entry)) {
      return previous;
    }
    const sequenceLength = fixture.books.flatMap((book) => book.folios).length;
    if (previous.accepted.length >= sequenceLength) {
      throw new Error("editorial progress is already complete");
    }
    const next = { accepted: [...previous.accepted, structuredClone(entry)], version: 2 };
    const nextBytes = Buffer.from(JSON.stringify(next, null, 2) + "\n");
    const staging = path.join(path.dirname(target), `.progress.${randomUUID()}.tmp`);
    await writePrivate(staging, nextBytes);
    try {
      await loadAcceptedProgress({ archiveRoot, fixture, progressPath: staging });
      let currentBytes = null;
      try {
        currentBytes = await readFile(target);
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      const unchanged = previousBytes === null
        ? currentBytes === null
        : currentBytes !== null && previousBytes.equals(currentBytes);
      if (!unchanged) throw new Error("editorial progress changed despite its exclusive lock");
      await rename(staging, target);
      await syncDirectory(path.dirname(target));
    } catch (error) {
      await unlink(staging).catch((unlinkError) => {
        if (unlinkError?.code !== "ENOENT") throw unlinkError;
      });
      throw error;
    }
    return next;
  } finally {
    await release();
  }
}

async function acquireProgressLock(progressPath) {
  const lockPath = progressPath + ".lock";
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const token = randomUUID();
    const record = Buffer.from(JSON.stringify({
      acquiredAt: new Date().toISOString(),
      pid: process.pid,
      token,
    }, null, 2) + "\n");
    try {
      await writePrivate(lockPath, record);
      return async () => {
        const current = await readFile(lockPath);
        if (!current.equals(record)) throw new Error("editorial progress lock ownership changed");
        await unlink(lockPath);
        await syncDirectory(path.dirname(lockPath));
      };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
    }

    let bytes;
    let metadata;
    try {
      [bytes, metadata] = await Promise.all([readFile(lockPath), stat(lockPath)]);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    const ageMs = Date.now() - metadata.mtimeMs;
    let owner;
    try {
      owner = JSON.parse(bytes.toString("utf8"));
    } catch {
      if (ageMs <= 60_000) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        continue;
      }
    }
    if (owner !== undefined) {
      const complete = owner !== null && typeof owner === "object" && !Array.isArray(owner)
        && Object.keys(owner).sort().join(",") === "acquiredAt,pid,token"
        && typeof owner.acquiredAt === "string" && !Number.isNaN(Date.parse(owner.acquiredAt))
        && Number.isSafeInteger(owner.pid) && owner.pid > 0
        && typeof owner.token === "string" && owner.token.length > 0;
      if (!complete && ageMs <= 60_000) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        continue;
      }
      if (complete && processExists(owner.pid)) {
        if (ageMs > 30 * 60 * 1_000) {
          throw new Error("editorial progress lock is older than 30 minutes but its process is still alive");
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
        continue;
      }
    }

    const stalePath = lockPath + ".stale." + randomUUID();
    try {
      await rename(lockPath, stalePath);
      await unlink(stalePath);
      await syncDirectory(path.dirname(lockPath));
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
  }
  throw new Error("could not acquire the editorial progress lock within five seconds");
}

function processExists(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

async function syncDirectory(directory) {
  const handle = await open(directory, "r");
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function words(paragraphs) {
  return paragraphs.join(" ").trim().split(/\s+/u).filter(Boolean).length;
}

export function validateCandidateForFolio(
  candidate,
  folio,
  { discardedImageDirectionSha256 } = {},
) {
  const wordCount = words(candidate.output.proseParagraphs);
  if (wordCount < TARGET_MIN_WORDS) {
    throw new Error(folio.id + " has " + wordCount + " words, expected at least 120");
  }
  if (wordCount > HARD_MAX_WORDS) {
    throw new Error(
      folio.id + " has " + wordCount
      + ` words, above hard maximum ${HARD_MAX_WORDS}`
      + ` (target ${TARGET_MIN_WORDS}–${TARGET_MAX_WORDS})`,
    );
  }
  if (hasPlate(folio)) {
    if (candidate.output.imageDirection === null || discardedImageDirectionSha256 !== undefined) {
      throw new Error(folio.id + " image direction disagrees with the folio layout");
    }
    return;
  }
  if (candidate.output.imageDirection === null) {
    if (discardedImageDirectionSha256 !== undefined) {
      throw new Error(folio.id + " cannot discard an absent image direction");
    }
    return;
  }
  if (discardedImageDirectionSha256 === undefined) {
    throw new Error(folio.id + " image direction disagrees with the folio layout");
  }
  requireDigest(discardedImageDirectionSha256, "discarded image direction");
  if (discardedImageDirectionSha256 !== sha256(canonicalJson(candidate.output.imageDirection))) {
    throw new Error(folio.id + " discarded image direction digest mismatch");
  }
}

export function buildFableCandidateRecord({
  admission,
  compiled,
  extracted,
  folioId,
  messageLatencyMs,
  operationManifest,
  providerResponseBytes,
}) {
  if (!Number.isFinite(messageLatencyMs) || messageLatencyMs < 0) {
    throw new Error("candidate message latency is invalid");
  }
  return {
    version: 2,
    bookId: compiled.manifest.bookId,
    folioId,
    operationManifestSha256: operationManifest.operationManifestSha256,
    contentManifestSha256: compiled.manifest.manifestSha256,
    priorFolioIds: compiled.manifest.priorFolioIds,
    priorPlateIds: compiled.manifest.priorPlateIds,
    admissionSha256: admission.admissionSha256,
    countedInputTokens: admission.inputTokens,
    providerMessageId: extracted.evidence.providerMessageId,
    providerRequestId: extracted.evidence.providerRequestId,
    providerResponseSha256: sha256(providerResponseBytes),
    usage: extracted.evidence.usage,
    estimatedCostUsd: extracted.evidence.estimatedCostUsd,
    output: extracted.output,
    evidence: {
      messageLatencyMs,
      model: extracted.evidence.model,
      effort: extracted.evidence.effort,
      pricingVersion: extracted.evidence.pricingVersion,
      stopReason: extracted.evidence.stopReason,
    },
  };
}

export async function persistCompletedFableCandidate({ candidatePath, candidateRecord, folio }) {
  const candidateBytes = Buffer.from(JSON.stringify(candidateRecord, null, 2) + "\n");
  await writePrivate(candidatePath, candidateBytes);
  validateCandidateForFolio({ output: candidateRecord.output }, folio);
  return { candidateBytes, candidateSha256: sha256(candidateBytes) };
}

async function sourceFiles() {
  const read = (relative) => readFile(path.join(REPOSITORY_ROOT, relative), "utf8");
  return {
    authoringBrief: await read("content/reader-first/authoring-brief.md"),
    temporalRules: await read("prompts/fable/temporal-rules.md"),
    template: await read("prompts/fable/write-folio.md"),
    world: await read("content/shape-of-time/world.md"),
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}

async function writePrivate(file, value) {
  const handle = await open(file, "wx", 0o600);
  try {
    await handle.writeFile(value, typeof value === "string" ? { encoding: "utf8" } : undefined);
    await handle.sync();
  } finally {
    await handle.close();
  }
  const directoryHandle = await open(path.dirname(file), "r");
  try {
    await directoryHandle.sync();
  } finally {
    await directoryHandle.close();
  }
}

async function createDurableDirectory(directory) {
  try {
    await mkdir(directory, { mode: 0o700 });
  } catch (error) {
    if (error?.code === "EEXIST") return;
    throw error;
  }
  const directoryHandle = await open(directory, "r");
  try {
    await directoryHandle.sync();
  } finally {
    await directoryHandle.close();
  }
  const parentHandle = await open(path.dirname(directory), "r");
  try {
    await parentHandle.sync();
  } finally {
    await parentHandle.close();
  }
}

export async function claimFolioDispatch({
  admission,
  archiveRoot,
  folioId,
  operationDirectory,
  operationManifestSha256,
  sequence,
  startedAt,
}) {
  requireDigest(admission.admissionSha256, "dispatch admission");
  requireDigest(operationManifestSha256, "dispatch operation manifest");
  if (!Number.isSafeInteger(sequence) || sequence <= 0) throw new Error("dispatch sequence is invalid");
  const claimsDirectory = path.join(archiveRoot, "fable", "claims");
  await createDurableDirectory(claimsDirectory);
  const record = JSON.stringify({
    admissionSha256: admission.admissionSha256,
    folioId,
    operationManifestSha256,
    startedAt,
  }, null, 2) + "\n";
  const claimPath = path.join(claimsDirectory, String(sequence).padStart(2, "0") + "-" + folioId + ".json");
  await writePrivate(claimPath, record);
  await writePrivate(path.join(operationDirectory, "dispatch-started.json"), record);
  return { claimPath };
}

async function ensurePrivate(file, value) {
  try {
    await writePrivate(file, value);
  } catch (error) {
    if (error?.code !== "EEXIST") throw error;
    const existing = await readFile(file);
    const expected = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
    if (!existing.equals(expected)) {
      throw new Error("prepared operation drifted at " + file, { cause: error });
    }
  }
}

async function operationBundle(folioId) {
  const [fixture, baseSchemaText, source] = await Promise.all([
    readFile(path.join(REPOSITORY_ROOT, "content/reader-first/slice.json"), "utf8").then(JSON.parse),
    readFile(path.join(REPOSITORY_ROOT, "content/reader-first/fable-output.schema.json"), "utf8"),
    sourceFiles(),
  ]);
  const accepted = await loadAcceptedProgress({
    archiveRoot: AUTHORING_ARCHIVE_ROOT,
    fixture,
    progressPath: PROGRESS_PATH,
  });
  const compiled = compileEditorialRequest({ accepted, fixture, folioId, source });
  const { folio } = locateFolio(fixture, folioId);
  const schema = schemaForFolioLayout(JSON.parse(baseSchemaText), folio);
  const schemaText = JSON.stringify(schema, null, 2) + "\n";
  const systemPrompt = "Write the requested Shape of Time folio. The user message contains the complete authority and output contract for this bounded editorial operation. Use no tools.";
  const requests = buildAnthropicRequests({ compiled, schema, systemPrompt });
  const allFolios = fixture.books.flatMap((book) => book.folios);
  const sequence = allFolios.findIndex((folio) => folio.id === folioId) + 1;
  if (sequence <= 0) throw new Error("unknown folio " + folioId);
  const operationName = String(sequence).padStart(2, "0") + "-" + folioId + "-"
    + requests.operationManifest.operationManifestSha256.slice(0, 12);
  return {
    compiled,
    fixture,
    operationDirectory: path.join(AUTHORING_ARCHIVE_ROOT, "fable", operationName),
    requests,
    schemaText,
    sequence,
    systemPrompt,
  };
}

function preparedFiles(bundle) {
  return new Map([
    ["content-manifest.json", JSON.stringify(bundle.compiled.manifest, null, 2) + "\n"],
    ["count-request.json", canonicalJson(bundle.requests.countRequest)],
    ["generation-request.json", canonicalJson(bundle.requests.generationRequest)],
    ["request-manifest.json", JSON.stringify(bundle.requests.operationManifest, null, 2) + "\n"],
    ["schema.json", bundle.schemaText],
    ["system.txt", bundle.systemPrompt],
  ]);
}

async function prepareOperation(bundle) {
  await mkdir(path.dirname(bundle.operationDirectory), { recursive: true, mode: 0o700 });
  await mkdir(bundle.operationDirectory, { recursive: true, mode: 0o700 });
  await Promise.all([...preparedFiles(bundle)].map(([name, value]) =>
    ensurePrivate(path.join(bundle.operationDirectory, name), value)));
}

async function verifyPreparedOperation(bundle) {
  for (const [name, value] of preparedFiles(bundle)) {
    const existing = await readFile(path.join(bundle.operationDirectory, name));
    const expected = Buffer.from(value, "utf8");
    if (!existing.equals(expected)) throw new Error("prepared operation drifted at " + name);
  }
}

async function archiveResponse(operationDirectory, response) {
  const headers = {
    contentType: response.headers.get("content-type"),
    providerRequestId: providerRequestId(response),
    status: response.status,
  };
  await writePrivate(
    path.join(operationDirectory, "response-headers.json"),
    JSON.stringify(headers, null, 2) + "\n",
  );
  if (response.body === null) throw new Error("Anthropic message response had no body");
  const partialPath = path.join(operationDirectory, "provider-response.partial");
  const finalPath = path.join(operationDirectory, "provider-response.json");
  const handle = await open(partialPath, "wx", 0o600);
  try {
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      await handle.write(Buffer.from(value));
      await handle.sync();
    }
  } finally {
    await handle.close();
  }
  await rename(partialPath, finalPath);
  return readFile(finalPath);
}

async function runCli() {
  const command = process.argv[2];
  if (!new Set(["prepare", "run"]).has(command)) {
    throw new Error("usage: reader-first-fable.mjs prepare|run --folio ID [--manifest SHA256]");
  }
  const folioId = argument("--folio");
  if (folioId === undefined) throw new Error("--folio is required");
  if (command === "prepare") await mkdir(AUTHORING_ARCHIVE_ROOT, { recursive: true, mode: 0o700 });
  const bundle = await operationBundle(folioId);
  if (command === "prepare") {
    await prepareOperation(bundle);
    process.stdout.write(JSON.stringify({
      folioId,
      operationDirectory: bundle.operationDirectory,
      requestManifestSha256: bundle.requests.operationManifest.operationManifestSha256,
    }) + "\n");
    return;
  }

  const expectedManifest = argument("--manifest");
  if (expectedManifest !== bundle.requests.operationManifest.operationManifestSha256) {
    throw new Error("--manifest must match the reviewed prepared operation");
  }
  await verifyPreparedOperation(bundle);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const result = await executeAnthropicOperation({
    apiKey,
    claimDispatch: (admission) => claimFolioDispatch({
      admission,
      archiveRoot: AUTHORING_ARCHIVE_ROOT,
      folioId,
      operationDirectory: bundle.operationDirectory,
      operationManifestSha256: bundle.requests.operationManifest.operationManifestSha256,
      sequence: bundle.sequence,
      startedAt: new Date().toISOString(),
    }),
    operationManifest: bundle.requests.operationManifest,
    persistAdmission: async (admission, countResponseBytes, countResponseHeaders) => {
      await writePrivate(
        path.join(bundle.operationDirectory, "count-response.json"),
        countResponseBytes,
      );
      await writePrivate(
        path.join(bundle.operationDirectory, "count-response-headers.json"),
        JSON.stringify(countResponseHeaders, null, 2) + "\n",
      );
      await writePrivate(
        path.join(bundle.operationDirectory, "admission.json"),
        JSON.stringify(admission, null, 2) + "\n",
      );
    },
    receiveResponse: (response) => archiveResponse(bundle.operationDirectory, response),
    requests: bundle.requests,
  });
  const { folio } = locateFolio(bundle.fixture, folioId);
  const candidateRecord = buildFableCandidateRecord({
    admission: result.admission,
    compiled: bundle.compiled,
    extracted: result.candidate,
    folioId,
    messageLatencyMs: result.messageLatencyMs,
    operationManifest: bundle.requests.operationManifest,
    providerResponseBytes: result.providerResponseBytes,
  });
  const candidatePath = path.join(bundle.operationDirectory, "candidate.json");
  const persisted = await persistCompletedFableCandidate({ candidatePath, candidateRecord, folio });
  process.stdout.write(JSON.stringify({
    candidatePath,
    candidateSha256: persisted.candidateSha256,
    countedInputTokens: result.admission.inputTokens,
    estimatedCostUsd: result.candidate.evidence.estimatedCostUsd,
    folioId,
    model: result.candidate.evidence.model,
    operationDirectory: bundle.operationDirectory,
    requestManifestSha256: bundle.requests.operationManifest.operationManifestSha256,
  }) + "\n");
}

if (process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli().catch((error) => {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + "\n");
    process.exitCode = 1;
  });
}
