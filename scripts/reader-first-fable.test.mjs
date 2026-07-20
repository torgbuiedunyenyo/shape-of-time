import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  admitTokenCount,
  appendAcceptedProgress,
  buildAnthropicRequests,
  claimFolioDispatch,
  compileEditorialRequest,
  executeAnthropicOperation,
  extractSuccessfulMessage,
  loadAcceptedProgress,
  validateContextAdmission,
} from "./reader-first-fable.mjs";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function canonicalJson(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((key) =>
      JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

const source = {
  authoringBrief: `# Reader-first editorial brief
Shared constraints only.
## Root book: Shape of Time
Root movement in natural prose.
### 1. Payment — split layout, with a plate
Payment current folio work.
### 2. The gift — text-led
Gift current folio work.
### 3. The band — image-led
Band current folio work.
### 4. Late fee — text-led
Late fee current folio work.
## Child book: The Map on the Wall
Child movement founded from the exact phrase.
### 1. The licensed route — text-led
Licensed route current folio work.
### 2. The terminal wall — image-led, movement rest
Terminal wall current folio work.`,
  temporalRules: "<temporal_rules>ordinary physical temporal travel</temporal_rules>",
  template: `<documents>
<document><source>world</source><document_content>{{WORLD_DOCUMENT}}</document_content></document>
<document><source>origin</source><document_content>{{BOOK_ORIGIN}}</document_content></document>
<document><source>movement</source><document_content>{{CURRENT_MOVEMENT_BRIEF}}</document_content></document>
<document><source>history</source><document_content>{{STORY_SO_FAR}}</document_content></document>
</documents>
{{TEMPORAL_RULES}}
<current_folio>{{CURRENT_FOLIO_BRIEF}}</current_folio>
<writing_request>write it</writing_request>
<output_format>schema</output_format>`,
  world: "THE COMPLETE WORLD",
};

const fixture = {
  version: 1,
  books: [
    {
      id: "shape-of-time",
      title: "Shape of Time",
      folios: [
        { id: "root-folio-01", ordinal: 1, title: "Payment", blocks: [], plate: { id: "plate-root-payment" } },
        { id: "root-folio-02", ordinal: 2, title: "The gift", blocks: [] },
        { id: "root-folio-03", ordinal: 3, title: "The band", blocks: [], plate: { id: "plate-root-band" } },
      ],
    },
    {
      id: "map-on-the-wall",
      title: "The Map on the Wall",
      origin: {
        sourceBookId: "shape-of-time",
        sourceFolioId: "root-folio-07",
        apertureId: "aperture-maps-wrong",
        quote: "The maps were always becoming wrong",
      },
      folios: [
        { id: "map-folio-01", ordinal: 1, title: "The licensed route", blocks: [] },
        { id: "map-folio-02", ordinal: 2, title: "The terminal wall", blocks: [], plate: { id: "plate-map-terminal-wall" } },
      ],
    },
  ],
};

const payment = {
  bookId: "shape-of-time",
  folioId: "root-folio-01",
  proseParagraphs: ["Payment paragraph one.", "Payment paragraph two."],
  imageDirection: {
    narrativeJob: "Show the queue.",
    concreteScene: "The shop counter.",
    factLeftToImage: "Who waits.",
    mustRemain: [],
    purposefulChanges: [],
    unresolvedFacts: ["Clef outside this book."],
  },
  plate: {
    bytes: Buffer.from("accepted-payment-image"),
    mediaType: "image/webp",
    plateId: "plate-root-payment",
  },
};

const gift = {
  bookId: "shape-of-time",
  folioId: "root-folio-02",
  proseParagraphs: ["Gift & apology paragraph one.", "Gift paragraph two."],
  imageDirection: null,
};

const band = {
  bookId: "shape-of-time",
  folioId: "root-folio-03",
  proseParagraphs: ["Band paragraph one.", "Band paragraph two."],
  imageDirection: payment.imageDirection,
  plate: {
    bytes: Buffer.from("accepted-band-image"),
    mediaType: "image/webp",
    plateId: "plate-root-band",
  },
};

async function writeCompleteCandidateEvidence({ archiveRoot, fixture: targetFixture, folioId, output }) {
  const operation = path.join(archiveRoot, "fable", `01-${folioId}-operation`);
  await mkdir(operation, { recursive: true });
  const compiled = compileEditorialRequest({
    accepted: [],
    fixture: targetFixture,
    folioId,
    source,
  });
  const schema = { additionalProperties: false, properties: {}, required: [], type: "object" };
  const systemPrompt = "Write this folio. Use no tools.";
  const requests = buildAnthropicRequests({ compiled, schema, systemPrompt });
  const countResponseBytes = Buffer.from("{\"input_tokens\":1000}");
  const admission = admitTokenCount({
    completedAt: "2026-07-19T12:00:00.000Z",
    countLatencyMs: 25,
    countRequestId: `req_count_${folioId}`,
    countResponse: { input_tokens: 1_000 },
    countResponseSha256: sha256(countResponseBytes),
    operationManifest: requests.operationManifest,
  });
  const response = {
    content: [{ type: "text", text: JSON.stringify(output) }],
    id: `msg_${folioId}`,
    model: "claude-fable-5",
    role: "assistant",
    stop_reason: "end_turn",
    type: "message",
    usage: { input_tokens: 1_000, output_tokens: 250 },
  };
  const providerResponseBytes = Buffer.from(JSON.stringify(response));
  const providerRequestId = `req_message_${folioId}`;
  const extracted = extractSuccessfulMessage({ providerRequestId, response });
  const candidate = {
    version: 2,
    bookId: targetFixture.books[0].id,
    folioId,
    operationManifestSha256: requests.operationManifest.operationManifestSha256,
    contentManifestSha256: compiled.manifest.manifestSha256,
    priorFolioIds: [],
    priorPlateIds: [],
    admissionSha256: admission.admissionSha256,
    countedInputTokens: admission.inputTokens,
    providerMessageId: extracted.evidence.providerMessageId,
    providerRequestId: extracted.evidence.providerRequestId,
    providerResponseSha256: sha256(providerResponseBytes),
    usage: extracted.evidence.usage,
    estimatedCostUsd: extracted.evidence.estimatedCostUsd,
    output,
    evidence: {
      messageLatencyMs: 200,
      model: extracted.evidence.model,
      effort: extracted.evidence.effort,
      pricingVersion: extracted.evidence.pricingVersion,
      stopReason: extracted.evidence.stopReason,
    },
  };
  const candidateBytes = Buffer.from(`${JSON.stringify(candidate, null, 2)}\n`);
  const candidatePath = path.join(operation, "candidate.json");
  await Promise.all([
    writeFile(path.join(operation, "request-manifest.json"), `${JSON.stringify(requests.operationManifest, null, 2)}\n`),
    writeFile(path.join(operation, "content-manifest.json"), `${JSON.stringify(compiled.manifest, null, 2)}\n`),
    writeFile(path.join(operation, "count-request.json"), canonicalJson(requests.countRequest)),
    writeFile(path.join(operation, "generation-request.json"), canonicalJson(requests.generationRequest)),
    writeFile(path.join(operation, "schema.json"), `${JSON.stringify(schema, null, 2)}\n`),
    writeFile(path.join(operation, "system.txt"), systemPrompt),
    writeFile(path.join(operation, "count-response.json"), countResponseBytes),
    writeFile(path.join(operation, "count-response-headers.json"), JSON.stringify({
      contentType: "application/json",
      providerRequestId: `req_count_${folioId}`,
      status: 200,
    })),
    writeFile(path.join(operation, "admission.json"), `${JSON.stringify(admission, null, 2)}\n`),
    writeFile(path.join(operation, "response-headers.json"), JSON.stringify({
      contentType: "application/json",
      providerRequestId,
      status: 200,
    })),
    writeFile(path.join(operation, "provider-response.json"), providerResponseBytes),
    writeFile(candidatePath, candidateBytes),
  ]);
  return {
    candidate,
    candidateBytes,
    candidatePath,
    candidateSha256: sha256(candidateBytes),
  };
}

test("the first editorial call contains authority once and no invented history", () => {
  const compiled = compileEditorialRequest({ accepted: [], fixture, folioId: "root-folio-01", source });
  assert.equal(compiled.content.length, 1);
  const text = compiled.content[0].text;
  assert.equal(text.match(/THE COMPLETE WORLD/gu)?.length, 1);
  assert.match(text, /Root movement in natural prose/u);
  assert.match(text, /Payment current folio work/u);
  assert.match(text, /No exposed folios yet/u);
  assert.doesNotMatch(text, /Gift current folio work/u);
  assert.deepEqual(compiled.manifest.priorFolioIds, []);
});

test("actual accepted images are interleaved immediately after their folio prose", () => {
  const compiled = compileEditorialRequest({
    accepted: [payment, gift],
    fixture,
    folioId: "root-folio-03",
    source,
  });

  assert.deepEqual(compiled.content.map((block) => block.type), ["text", "image", "text"]);
  assert.match(compiled.content[0].text, /Payment paragraph one/u);
  assert.equal(compiled.content[1].source.media_type, "image/webp");
  assert.equal(Buffer.from(compiled.content[1].source.data, "base64").toString(), "accepted-payment-image");
  assert.match(compiled.content[2].text, /Gift &amp; apology paragraph one/u);
  assert.match(compiled.content[2].text, /Band current folio work/u);
  assert.deepEqual(compiled.manifest.priorFolioIds, ["root-folio-01", "root-folio-02"]);
  assert.deepEqual(compiled.manifest.priorPlateIds, ["plate-root-payment"]);
});

test("the content manifest binds the immutable evidence behind every accepted history item", () => {
  const evidencedPayment = {
    ...payment,
    candidateSha256: "1".repeat(64),
    operationManifestSha256: "2".repeat(64),
    plate: {
      ...payment.plate,
      acceptanceSha256: "3".repeat(64),
      providerOutputSha256: "4".repeat(64),
      providerReceiptSha256: "5".repeat(64),
    },
  };
  const evidencedGift = {
    ...gift,
    candidateSha256: "6".repeat(64),
    operationManifestSha256: "7".repeat(64),
  };
  const compiled = compileEditorialRequest({
    accepted: [evidencedPayment, evidencedGift],
    fixture,
    folioId: "root-folio-03",
    source,
  });
  assert.deepEqual(compiled.manifest.priorEvidence, [
    {
      candidateSha256: "1".repeat(64),
      folioId: "root-folio-01",
      operationManifestSha256: "2".repeat(64),
      plate: {
        acceptanceSha256: "3".repeat(64),
        plateId: "plate-root-payment",
        providerOutputSha256: "4".repeat(64),
        providerReceiptSha256: "5".repeat(64),
      },
    },
    {
      candidateSha256: "6".repeat(64),
      folioId: "root-folio-02",
      operationManifestSha256: "7".repeat(64),
      plate: null,
    },
  ]);
});

test("a child begins from its exact origin without importing root story history", () => {
  const compiled = compileEditorialRequest({
    accepted: [payment, gift, band],
    fixture,
    folioId: "map-folio-01",
    source,
  });
  const text = compiled.content.map((block) => block.type === "text" ? block.text : "").join("\n");
  assert.match(text, /The maps were always becoming wrong/u);
  assert.match(text, /Child movement founded from the exact phrase/u);
  assert.match(text, /No exposed folios yet/u);
  assert.doesNotMatch(text, /Payment paragraph/u);
  assert.doesNotMatch(text, /Root movement in natural prose/u);
  assert.match(text, /Shared constraints only/u);
  assert.deepEqual(compiled.manifest.priorFolioIds, []);
});

test("the checked-in shared brief contains no root or child trajectory", async () => {
  const brief = await readFile("content/reader-first/authoring-brief.md", "utf8");
  const shared = brief.slice(0, brief.search(/^## /mu));
  assert.doesNotMatch(shared, /\b(?:Jay|Tan|Eniola|Lagos)\b|root run|child proof/iu);
});

test("the editorial run cannot skip ahead even though child prompt history stays isolated", () => {
  assert.throws(
    () => compileEditorialRequest({ accepted: [payment], fixture, folioId: "map-folio-01", source }),
    /global sequence/u,
  );
});

test("an illustrated accepted folio without its accepted plate cannot enter history", () => {
  const withoutPlate = { ...payment, plate: undefined };
  assert.throws(
    () => compileEditorialRequest({ accepted: [withoutPlate], fixture, folioId: "root-folio-02", source }),
    /accepted plate/u,
  );
});

test("the direct Fable request counts the exact input envelope before one 32768-token generation", () => {
  const compiled = compileEditorialRequest({ accepted: [], fixture, folioId: "root-folio-01", source });
  const schema = { additionalProperties: false, properties: {}, required: [], type: "object" };
  const requests = buildAnthropicRequests({
    compiled,
    schema,
    systemPrompt: "Write this folio. Use no tools.",
  });
  assert.equal(requests.countRequest.model, "claude-fable-5");
  assert.equal(requests.countRequest.output_config.effort, "xhigh");
  assert.deepEqual(requests.countRequest.output_config.format, { schema, type: "json_schema" });
  assert.ok(!("max_tokens" in requests.countRequest));
  assert.deepEqual(requests.generationRequest, { ...requests.countRequest, max_tokens: 32_768 });
  assert.ok(!("tools" in requests.generationRequest));
  assert.ok(!("thinking" in requests.generationRequest));
  assert.ok(!("fallbacks" in requests.generationRequest));
  assert.equal(requests.operationManifest.maxOutputTokens, 32_768);
  assert.equal(requests.operationManifest.messageTimeoutMs, 1_800_000);
  assert.equal(requests.operationManifest.wireBodyEncoding, "canonical-json-v1");
  assert.equal(requests.operationManifest.contentManifestSha256, compiled.manifest.manifestSha256);
  assert.match(requests.operationManifest.operationManifestSha256, /^[a-f0-9]{64}$/u);
  assert.match(requests.operationManifest.systemSha256, /^[a-f0-9]{64}$/u);
  assert.match(requests.operationManifest.schemaSha256, /^[a-f0-9]{64}$/u);
  assert.match(requests.operationManifest.generationRequestSha256, /^[a-f0-9]{64}$/u);
});

test("the operation digest binds system, schema, budget, and exact multimodal input", () => {
  const compiled = compileEditorialRequest({ accepted: [payment, gift], fixture, folioId: "root-folio-03", source });
  const base = {
    compiled,
    schema: { additionalProperties: false, properties: {}, type: "object" },
    systemPrompt: "System A",
  };
  const first = buildAnthropicRequests(base);
  const mutations = [
    buildAnthropicRequests({ ...base, systemPrompt: "System B" }),
    buildAnthropicRequests({ ...base, schema: { additionalProperties: false, properties: { x: { type: "string" } }, type: "object" } }),
    buildAnthropicRequests({ ...base, perOperationBudgetUsd: 2.01 }),
    buildAnthropicRequests({ ...base, compiled: compileEditorialRequest({ accepted: [{ ...payment, plate: { ...payment.plate, bytes: Buffer.from("different-image") } }, gift], fixture, folioId: "root-folio-03", source }) }),
  ];
  for (const mutation of mutations) {
    assert.notEqual(mutation.operationManifest.operationManifestSha256, first.operationManifest.operationManifestSha256);
  }
});

test("provider admission enforces the complete 400k equation and records the count request", () => {
  assert.equal(validateContextAdmission(363_136).equationTotal, 400_000);
  assert.throws(() => validateContextAdmission(363_137), /400000/u);
  const operationManifest = buildAnthropicRequests({
    compiled: compileEditorialRequest({ accepted: [], fixture, folioId: "root-folio-01", source }),
    schema: { additionalProperties: false, properties: {}, type: "object" },
    systemPrompt: "System",
    perOperationBudgetUsd: 10,
  }).operationManifest;
  const admission = admitTokenCount({
    completedAt: "2026-07-19T12:00:00.000Z",
    countResponse: { input_tokens: 363_136 },
    countRequestId: "req_count_123",
    countResponseSha256: "8".repeat(64),
    operationManifest,
  });
  assert.equal(admission.admitted, true);
  assert.equal(admission.inputTokens, 363_136);
  assert.equal(admission.countRequestId, "req_count_123");
  assert.equal(admission.countResponseSha256, "8".repeat(64));
  assert.match(admission.admissionSha256, /^[a-f0-9]{64}$/u);
  assert.throws(() => admitTokenCount({
    completedAt: "2026-07-19T12:00:00.000Z",
    countResponse: { input_tokens: 100 },
    countRequestId: "",
    countResponseSha256: "8".repeat(64),
    operationManifest,
  }), /request id/u);
});

test("postflight accepts one Fable message and rejects model, stop, or output drift", () => {
  const response = {
    content: [{ type: "text", text: JSON.stringify({ proseParagraphs: ["One.", "Two."], imageDirection: null }) }],
    id: "msg_123",
    model: "claude-fable-5",
    role: "assistant",
    stop_reason: "end_turn",
    type: "message",
    usage: { input_tokens: 150, output_tokens: 80 },
  };
  const accepted = extractSuccessfulMessage({ providerRequestId: "req_message_123", response });
  assert.equal(accepted.observedInputTokens, 150);
  assert.deepEqual(accepted.output.proseParagraphs, ["One.", "Two."]);
  assert.equal(accepted.evidence.model, "claude-fable-5");
  assert.throws(
    () => extractSuccessfulMessage({ providerRequestId: "req_message_123", response: { ...response, model: "claude-opus-5" } }),
    /Fable/u,
  );
  assert.throws(
    () => extractSuccessfulMessage({ providerRequestId: "req_message_123", response: { ...response, usage: { input_tokens: 363_137, output_tokens: 1 } } }),
    /363136/u,
  );
  for (const stopReason of ["max_tokens", "refusal", "tool_use", "pause_turn", "stop_sequence", null]) {
    assert.throws(
      () => extractSuccessfulMessage({ providerRequestId: "req_message_123", response: { ...response, stop_reason: stopReason } }),
      /stop reason/u,
    );
  }
  assert.throws(
    () => extractSuccessfulMessage({ providerRequestId: "req_message_123", response: { ...response, content: [...response.content, ...response.content] } }),
    /one text/u,
  );
});

test("the provider sequence persists official admission before claiming one inference dispatch", async () => {
  const requests = buildAnthropicRequests({
    compiled: compileEditorialRequest({ accepted: [], fixture, folioId: "root-folio-01", source }),
    schema: { additionalProperties: false, properties: {}, type: "object" },
    systemPrompt: "System",
  });
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push(["fetch", url, JSON.parse(init.body)]);
    if (url.endsWith("/count_tokens")) {
      return new Response(JSON.stringify({ input_tokens: 1_000 }), { headers: { "request-id": "req_count" }, status: 200 });
    }
    return new Response(JSON.stringify({
      content: [{ type: "text", text: JSON.stringify({ proseParagraphs: ["One.", "Two."], imageDirection: null }) }],
      id: "msg_123",
      model: "claude-fable-5",
      role: "assistant",
      stop_reason: "end_turn",
      type: "message",
      usage: { input_tokens: 1_000, output_tokens: 80 },
    }), { headers: { "request-id": "req_message" }, status: 200 });
  };
  const result = await executeAnthropicOperation({
    apiKey: "test-key",
    claimDispatch: async () => { calls.push(["claim"]); },
    fetchImpl,
    now: () => "2026-07-19T12:00:00.000Z",
    operationManifest: requests.operationManifest,
    persistAdmission: async () => { calls.push(["persist-admission"]); },
    receiveResponse: async (response) => Buffer.from(await response.arrayBuffer()),
    requests,
  });
  assert.deepEqual(calls.map((entry) => entry[0]), ["fetch", "persist-admission", "claim", "fetch"]);
  assert.equal(calls.filter((entry) => entry[0] === "fetch").length, 2);
  assert.deepEqual(calls[0][2], requests.countRequest);
  assert.deepEqual(calls[3][2], requests.generationRequest);
  assert.equal(result.candidate.evidence.providerRequestId, "req_message");

  let generationCalls = 0;
  await assert.rejects(() => executeAnthropicOperation({
    apiKey: "test-key",
    claimDispatch: async () => { throw new Error("must not claim"); },
    fetchImpl: async () => {
      generationCalls += 1;
      return new Response(JSON.stringify({ input_tokens: 363_137 }), { headers: { "request-id": "req_count" }, status: 200 });
    },
    now: () => "2026-07-19T12:00:00.000Z",
    operationManifest: requests.operationManifest,
    persistAdmission: async () => { throw new Error("must not persist"); },
    receiveResponse: async (response) => Buffer.from(await response.arrayBuffer()),
    requests,
  }), /400000/u);
  assert.equal(generationCalls, 1);

  let persistenceFailureCalls = 0;
  await assert.rejects(() => executeAnthropicOperation({
    apiKey: "test-key",
    claimDispatch: async () => { throw new Error("must not claim"); },
    fetchImpl: async () => {
      persistenceFailureCalls += 1;
      return new Response(JSON.stringify({ input_tokens: 1_000 }), { headers: { "request-id": "req_count" }, status: 200 });
    },
    now: () => "2026-07-19T12:00:00.000Z",
    operationManifest: requests.operationManifest,
    persistAdmission: async () => { throw new Error("admission disk failed"); },
    receiveResponse: async (response) => Buffer.from(await response.arrayBuffer()),
    requests,
  }), /admission disk failed/u);
  assert.equal(persistenceFailureCalls, 1);

  let claimFailureCalls = 0;
  await assert.rejects(() => executeAnthropicOperation({
    apiKey: "test-key",
    claimDispatch: async () => { throw new Error("claim fsync failed"); },
    fetchImpl: async () => {
      claimFailureCalls += 1;
      return new Response(JSON.stringify({ input_tokens: 1_000 }), {
        headers: { "request-id": "req_count" },
        status: 200,
      });
    },
    now: () => "2026-07-19T12:00:00.000Z",
    operationManifest: requests.operationManifest,
    persistAdmission: async () => {},
    receiveResponse: async (response) => Buffer.from(await response.arrayBuffer()),
    requests,
  }), /claim fsync failed/u);
  assert.equal(claimFailureCalls, 1);
});

test("one fixed archive claim prevents a second paid operation for the same folio", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "shape-of-time-claim-"));
  const firstOperation = path.join(archiveRoot, "fable", "first");
  const secondOperation = path.join(archiveRoot, "fable", "second");
  await mkdir(firstOperation, { recursive: true });
  await mkdir(secondOperation, { recursive: true });
  const admission = { admissionSha256: "a".repeat(64) };
  await claimFolioDispatch({
    admission,
    archiveRoot,
    folioId: "root-folio-01",
    operationDirectory: firstOperation,
    operationManifestSha256: "b".repeat(64),
    sequence: 1,
    startedAt: "2026-07-19T12:00:00.000Z",
  });
  await assert.rejects(() => claimFolioDispatch({
    admission,
    archiveRoot,
    folioId: "root-folio-01",
    operationDirectory: secondOperation,
    operationManifestSha256: "c".repeat(64),
    sequence: 1,
    startedAt: "2026-07-19T12:01:00.000Z",
  }), /EEXIST|exist/iu);
});

test("pre-dispatch evidence is flushed before a paid request can begin", async () => {
  const harness = await readFile("scripts/reader-first-fable.mjs", "utf8");
  const start = harness.indexOf("async function writePrivate");
  const end = harness.indexOf("export async function claimFolioDispatch", start);
  assert.ok(start >= 0 && end > start, "durable private writer boundary is missing");
  const writer = harness.slice(start, end);
  assert.match(writer, /handle\.sync\(\)/u);
  assert.match(writer, /directoryHandle\.sync\(\)/u);

  const directoryStart = harness.indexOf("async function createDurableDirectory");
  const directoryEnd = harness.indexOf("export async function claimFolioDispatch", directoryStart);
  assert.ok(directoryStart >= 0 && directoryEnd > directoryStart, "durable claim directory boundary is missing");
  const directoryWriter = harness.slice(directoryStart, directoryEnd);
  assert.match(directoryWriter, /parentHandle\.sync\(\)/u);
});

test("the checked-in raw provider schema contains no SDK-only constraints", async () => {
  const schema = await readFile("content/reader-first/fable-output.schema.json", "utf8");
  assert.doesNotMatch(schema, /"(?:minLength|maxLength|minItems|maxItems|minimum|maximum)"/u);
});

test("incomplete candidate provenance cannot enter accepted history", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "shape-of-time-progress-"));
  const operation = path.join(archiveRoot, "fable", "01-root-folio-01-operation");
  const acceptedAssets = path.join(archiveRoot, "accepted-assets");
  await mkdir(operation, { recursive: true });
  await mkdir(acceptedAssets, { recursive: true });
  const candidate = {
    bookId: "shape-of-time",
    folioId: "root-folio-01",
    operationManifestSha256: "a".repeat(64),
    output: { proseParagraphs: ["Candidate paragraph one.", "Candidate paragraph two."], imageDirection: payment.imageDirection },
    providerMessageId: "msg_123",
    providerResponseSha256: "b".repeat(64),
    version: 2,
  };
  const candidateBytes = Buffer.from(`${JSON.stringify(candidate, null, 2)}\n`);
  const candidatePath = path.join(operation, "candidate.json");
  await writeFile(candidatePath, candidateBytes);
  const png = Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.from("accepted-payment")]);
  const assetPath = path.join(acceptedAssets, `${sha256(png)}.png`);
  await writeFile(assetPath, png);
  const receiptPath = path.join(operation, "image-provider-receipt.json");
  const receiptBytes = Buffer.from("{\"requestId\":\"req_image\"}\n");
  await writeFile(receiptPath, receiptBytes);
  const plateAcceptance = {
    assetPath,
    assetSha256: sha256(png),
    folioId: "root-folio-01",
    mediaType: "image/png",
    plateId: "plate-root-payment",
    providerOutputSha256: sha256(png),
    providerReceiptPath: receiptPath,
    providerReceiptSha256: sha256(receiptBytes),
    version: 1,
  };
  const plateAcceptanceBytes = Buffer.from(`${JSON.stringify(plateAcceptance, null, 2)}\n`);
  const plateAcceptancePath = path.join(operation, "plate-acceptance.json");
  await writeFile(plateAcceptancePath, plateAcceptanceBytes);
  const progress = {
    accepted: [{
      candidatePath,
      candidateSha256: sha256(candidateBytes),
      plateAcceptancePath,
      plateAcceptanceSha256: sha256(plateAcceptanceBytes),
    }],
    version: 2,
  };
  const progressPath = path.join(archiveRoot, "progress.json");
  await writeFile(progressPath, `${JSON.stringify(progress, null, 2)}\n`);
  await assert.rejects(
    () => loadAcceptedProgress({ archiveRoot, fixture, progressPath }),
    /candidate evidence chain is incomplete/u,
  );
});

test("a fabricated image receipt and header-only PNG cannot enter Fable history", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "shape-of-time-fabricated-plate-"));
  const paragraph = Array.from({ length: 60 }, (_, index) => `word${index + 1}`).join(" ");
  const output = {
    proseParagraphs: [paragraph, paragraph],
    imageDirection: payment.imageDirection,
  };
  const evidence = await writeCompleteCandidateEvidence({
    archiveRoot,
    fixture,
    folioId: "root-folio-01",
    output,
  });

  const png = Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), Buffer.from("accepted-payment")]);
  const reviewRoot = path.join(archiveRoot, "images", "review", "plate-root-payment");
  const acceptedRoot = path.join(archiveRoot, "images", "accepted", "plate-root-payment");
  await Promise.all([
    mkdir(reviewRoot, { recursive: true }),
    mkdir(acceptedRoot, { recursive: true }),
  ]);
  const assetPath = path.join(reviewRoot, "plate-root-payment.png");
  await writeFile(assetPath, png);
  const receiptPath = path.join(reviewRoot, "provider-receipt.json");
  const receiptBytes = Buffer.from("{\"requestId\":\"req_image\"}\n");
  await writeFile(receiptPath, receiptBytes);
  const plateAcceptance = {
    assetPath,
    assetSha256: sha256(png),
    bookId: "shape-of-time",
    candidateSha256: evidence.candidateSha256,
    fableImageDirectionSha256: sha256(canonicalJson(output.imageDirection)),
    folioId: "root-folio-01",
    mediaType: "image/png",
    plateId: "plate-root-payment",
    providerOutputSha256: sha256(png),
    providerReceiptPath: receiptPath,
    providerReceiptSha256: sha256(receiptBytes),
    version: 2,
  };
  const plateAcceptanceBytes = Buffer.from(`${canonicalJson(plateAcceptance)}\n`);
  const plateAcceptancePath = path.join(acceptedRoot, "acceptance.json");
  await writeFile(plateAcceptancePath, plateAcceptanceBytes);
  const progressPath = path.join(archiveRoot, "progress.json");
  await assert.rejects(
    () => appendAcceptedProgress({
      archiveRoot,
      entry: {
        candidatePath: evidence.candidatePath,
        candidateSha256: evidence.candidateSha256,
        plateAcceptancePath,
        plateAcceptanceSha256: sha256(plateAcceptanceBytes),
      },
      fixture,
      progressPath,
    }),
    /provider receipt contains unexpected or missing fields/u,
  );
});

test("concurrent replay of one complete text-led acceptance appends exactly once", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "shape-of-time-idempotent-progress-"));
  const textOnlyFixture = {
    version: 1,
    books: [{
      id: "shape-of-time",
      title: "Shape of Time",
      folios: [{ id: "root-folio-02", ordinal: 2, title: "The gift", blocks: [] }],
    }],
  };
  const paragraph = Array.from({ length: 60 }, (_, index) => `plain${index + 1}`).join(" ");
  const output = { proseParagraphs: [paragraph, paragraph], imageDirection: null };
  const evidence = await writeCompleteCandidateEvidence({
    archiveRoot,
    fixture: textOnlyFixture,
    folioId: "root-folio-02",
    output,
  });
  const progressPath = path.join(archiveRoot, "progress.json");
  const arguments_ = {
    archiveRoot,
    entry: {
      candidatePath: evidence.candidatePath,
      candidateSha256: evidence.candidateSha256,
    },
    fixture: textOnlyFixture,
    progressPath,
  };
  const results = await Promise.all([
    appendAcceptedProgress(arguments_),
    appendAcceptedProgress(arguments_),
  ]);
  assert.deepEqual(results.map((result) => result.accepted.length), [1, 1]);
  const accepted = await loadAcceptedProgress({
    archiveRoot,
    fixture: textOnlyFixture,
    progressPath,
  });
  assert.deepEqual(accepted[0].proseParagraphs, output.proseParagraphs);
  assert.equal(accepted.length, 1);
  await assert.rejects(() => readFile(`${progressPath}.lock`), /ENOENT/u);
});

test("a self-consistent candidate generated from the wrong prior history cannot be appended", async () => {
  const archiveRoot = await mkdtemp(path.join(os.tmpdir(), "shape-of-time-history-binding-"));
  const firstFolio = { id: "root-folio-02", ordinal: 2, title: "The gift", blocks: [] };
  const secondFolio = { id: "root-folio-04", ordinal: 4, title: "Late fee", blocks: [] };
  const twoFolioFixture = {
    version: 1,
    books: [{ id: "shape-of-time", title: "Shape of Time", folios: [firstFolio, secondFolio] }],
  };
  const secondOnlyFixture = {
    version: 1,
    books: [{ id: "shape-of-time", title: "Shape of Time", folios: [secondFolio] }],
  };
  const paragraph = Array.from({ length: 60 }, (_, index) => `clear${index + 1}`).join(" ");
  const output = { proseParagraphs: [paragraph, paragraph], imageDirection: null };
  const first = await writeCompleteCandidateEvidence({
    archiveRoot,
    fixture: twoFolioFixture,
    folioId: firstFolio.id,
    output,
  });
  const progressPath = path.join(archiveRoot, "progress.json");
  await appendAcceptedProgress({
    archiveRoot,
    entry: { candidatePath: first.candidatePath, candidateSha256: first.candidateSha256 },
    fixture: twoFolioFixture,
    progressPath,
  });
  const wrongSecond = await writeCompleteCandidateEvidence({
    archiveRoot,
    fixture: secondOnlyFixture,
    folioId: secondFolio.id,
    output,
  });
  await assert.rejects(
    () => appendAcceptedProgress({
      archiveRoot,
      entry: {
        candidatePath: wrongSecond.candidatePath,
        candidateSha256: wrongSecond.candidateSha256,
      },
      fixture: twoFolioFixture,
      progressPath,
    }),
    /candidate accepted-history evidence drifted/u,
  );
});
