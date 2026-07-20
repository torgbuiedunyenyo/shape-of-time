import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { inflateSync } from "node:zlib";

const C0_ARCHIVE_ID = "shape-of-time-c0-reader-first-2026-07";
const C0_IMAGE_MAX_ESTIMATE_MICROUSD = 100_000;
const C0_IMAGE_SPEND_CAP_USD = 0.1;
const CONTRACT_VERSION = "shape-of-time.gpt-image-2.v1";
const GPT_IMAGE_SNAPSHOT = "gpt-image-2-2026-04-21";
const PROMPT_VERSION = "reader-first-narrative-plate-v1";
const PROVIDER_RECEIPT_SCHEMA = "shape-of-time.reader-first-plate-provider-receipt.v2";
const TREATMENT_B_DIGEST = "85e55625e3a8bcf3e31c3546689287dc306736bf8deef59172ae8511c6dd2b06";

const COMMON_APPLICATION_GUIDANCE = [
  "Produce one opaque portrait plate for an adult illustrated novel or artist's folio.",
  "The Fable direction above is narrative authority. Do not rewrite, summarize, or add story facts to it.",
  "Use a single composed scene rather than panels. Include no caption, logo, speech balloon, or readable text.",
  "Avoid portals, glowing time effects, cosmic effects, generic science-fiction shorthand, and duplicate people.",
].join("\n");

const MEDIUM_ONLY_GUIDANCE =
  "Image 1 governs only the approved Treatment B medium. Do not transfer its people, place, objects, palette, or composition into the new plate.";

const CONTRACTS = {
  "plate-root-payment": {
    applicationGuidance: [
      MEDIUM_ONLY_GUIDANCE,
      "Keep every unresolved Fable fact unresolved; in particular, do not import the reference scene's ferry terminal or ticket.",
      COMMON_APPLICATION_GUIDANCE,
    ].join("\n"),
    bookId: "shape-of-time",
    folioId: "root-folio-01",
    idempotencyKey: "c0-reader-first-plate-root-payment-credential-repair-v2",
    referenceRules: [{
      assetId: "treatment-b-medium",
      digest: TREATMENT_B_DIGEST,
      kind: "human-approved-medium",
      role: "shared-medium-only",
      scope: "shared-medium-only",
    }],
  },
  "plate-root-band": {
    applicationGuidance: [
      "Image 1 governs Jay and Tan's established root-book identities and the exposed book-local visual world. Preserve those continuities while following Fable's purposeful changes.",
      COMMON_APPLICATION_GUIDANCE,
    ].join("\n"),
    bookId: "shape-of-time",
    folioId: "root-folio-03",
    idempotencyKey: "c0-reader-first-plate-root-band-v1",
    referenceRules: [{
      assetId: "plate-root-payment",
      kind: "exposed-folio-image",
      role: "root-payment-identity-and-world",
      scope: "book-local",
      sourcePlateId: "plate-root-payment",
    }],
  },
  "plate-root-map": {
    applicationGuidance: [
      "Images 1 and 2 govern Jay and Tan's identities and exposed root-book visual continuity across two views. Follow Fable's new scene, narrative job, and purposeful changes rather than recreating either composition.",
      COMMON_APPLICATION_GUIDANCE,
    ].join("\n"),
    bookId: "shape-of-time",
    folioId: "root-folio-07",
    idempotencyKey: "c0-reader-first-plate-root-map-v1",
    referenceRules: [
      {
        assetId: "plate-root-payment",
        kind: "exposed-folio-image",
        role: "root-payment-identity-and-world",
        scope: "book-local",
        sourcePlateId: "plate-root-payment",
      },
      {
        assetId: "plate-root-band",
        kind: "exposed-folio-image",
        role: "root-band-identity-and-world",
        scope: "book-local",
        sourcePlateId: "plate-root-band",
      },
    ],
  },
  "plate-map-terminal-wall": {
    applicationGuidance: [
      MEDIUM_ONLY_GUIDANCE,
      "Image 2 governs only the narrow parent-inheritance idea of mapped evidence crossing from private control into public use.",
      "Do not transfer Jay, Tan, Oakland, the root palette, or either reference composition into Lagos. Center Eniola and the local terminal described by Fable.",
      COMMON_APPLICATION_GUIDANCE,
    ].join("\n"),
    bookId: "map-on-the-wall",
    folioId: "map-folio-02",
    idempotencyKey: "c0-reader-first-plate-map-terminal-wall-v1",
    referenceRules: [
      {
        assetId: "treatment-b-medium",
        digest: TREATMENT_B_DIGEST,
        kind: "human-approved-medium",
        role: "shared-medium-only",
        scope: "shared-medium-only",
      },
      {
        assetId: "plate-root-map",
        kind: "exposed-folio-image",
        role: "parent-map-evidence-idea-only",
        scope: "book-local",
        sourcePlateId: "plate-root-map",
      },
    ],
  },
};

const RECEIPT_KEYS = [
  "applicationGuidanceSha256", "bookId", "byteLength", "candidateSha256", "clientRequestId",
  "dispatchDigest", "estimatedOutputCostMicrousd", "estimatedTotalCostMicrousd",
  "fableImageDirection", "fableImageDirectionSha256", "fixtureDigest", "folioId", "height",
  "imageRecoveryProof", "latencyMs", "manifest", "manifestSha256", "operationDigest",
  "outputMediaType", "outputSha256", "plateId", "preparedDigest", "pricingVersion",
  "providerProcessingMs", "providerRequestId", "providerReceiptSha256", "replayRecoveryProof",
  "requestedModelSnapshot", "resultDigest", "schema", "servedModelEvidence", "usage", "width",
  "totalCostEstimateUnavailableReason",
];

const MANIFEST_KEYS = [
  "background", "contractVersion", "endpoint", "exactPrompt", "idempotencyKey",
  "idempotencyScope", "moderation", "orderedReferences", "outputFormat", "promptDigest",
  "promptVersion", "purpose", "quality", "requiredAnchors", "requestedModelSnapshot",
  "servedModelEvidence", "size",
];

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function canonicalJson(value) {
  if (Array.isArray(value)) return "[" + value.map(canonicalJson).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.keys(value).sort().map((key) =>
      JSON.stringify(key) + ":" + canonicalJson(value[key])).join(",") + "}";
  }
  return JSON.stringify(value);
}

const digestJson = (value) => sha256(canonicalJson(value));

export function readerFirstPlateContract(plateId) {
  const contract = CONTRACTS[plateId];
  if (contract === undefined) throw new Error("unknown reader-first plate contract: " + plateId);
  return structuredClone(contract);
}

export function readerFirstPlatePrompt(plateId, imageDirection) {
  const contract = readerFirstPlateContract(plateId);
  const canonicalDirection = canonicalJson(imageDirection);
  const exactSourcePrompt = [
    "FABLE IMAGE DIRECTION — CANONICAL JSON, UNCHANGED",
    canonicalDirection,
    "",
    "APPLICATION SCOPE AND TECHNICAL GUIDANCE",
    contract.applicationGuidance,
  ].join("\n");
  return {
    applicationGuidance: contract.applicationGuidance,
    applicationGuidanceSha256: sha256(contract.applicationGuidance),
    canonicalDirection,
    exactSourcePrompt,
    fableImageDirectionSha256: sha256(canonicalDirection),
  };
}

export async function verifyReaderFirstPlateEvidence(input) {
  requireDigest(input.candidateSha256, "Fable candidate");
  const contract = readerFirstPlateContract(input.plateId);
  const candidate = requireRecord(input.candidate, "Fable candidate");
  const output = requireRecord(candidate.output, "Fable candidate output");
  const evidence = requireRecord(candidate.evidence, "Fable candidate evidence");
  if (candidate.version !== 2 || candidate.bookId !== contract.bookId
    || candidate.folioId !== contract.folioId || evidence.model !== "claude-fable-5"
    || evidence.effort !== "xhigh" || evidence.stopReason !== "end_turn") {
    throw new Error("plate evidence belongs to the wrong Fable candidate or model contract");
  }
  const direction = requireRecord(output.imageDirection, "Fable image direction");
  validateDirection(direction);
  const prompt = readerFirstPlatePrompt(input.plateId, direction);

  const authoringRoot = await realpath(input.authoringRoot);
  const expectedReviewRoot = path.join(authoringRoot, "images", "review", input.plateId);
  const [imagePath, providerReceiptPath] = await Promise.all([
    realpath(input.imagePath),
    realpath(input.providerReceiptPath),
  ]);
  if (imagePath !== path.join(expectedReviewRoot, `${input.plateId}.png`)
    || providerReceiptPath !== path.join(expectedReviewRoot, "provider-receipt.json")) {
    throw new Error("reader-first plate evidence is outside its fixed review namespace");
  }

  const receiptText = Buffer.from(input.providerReceiptBytes).toString("utf8");
  let receipt;
  try {
    receipt = JSON.parse(receiptText);
  } catch (cause) {
    throw new Error("reader-first plate provider receipt is not valid JSON", { cause });
  }
  exactKeys(receipt, RECEIPT_KEYS, "reader-first plate provider receipt");
  if (receiptText !== canonicalJson(receipt) + "\n") {
    throw new Error("reader-first plate provider receipt is not canonically encoded");
  }
  const receiptCore = { ...receipt };
  delete receiptCore.providerReceiptSha256;
  if (receipt.schema !== PROVIDER_RECEIPT_SCHEMA
    || receipt.providerReceiptSha256 !== digestJson(receiptCore)
    || receipt.bookId !== contract.bookId || receipt.folioId !== contract.folioId
    || receipt.plateId !== input.plateId || receipt.candidateSha256 !== input.candidateSha256
    || canonicalJson(receipt.fableImageDirection) !== canonicalJson(direction)
    || receipt.fableImageDirectionSha256 !== prompt.fableImageDirectionSha256
    || receipt.applicationGuidanceSha256 !== prompt.applicationGuidanceSha256) {
    throw new Error("reader-first plate receipt is not bound to its exact Fable candidate");
  }

  validateManifest(receipt.manifest, contract, prompt.exactSourcePrompt);
  validateTrustedPlateEvidence(
    receipt.manifest.orderedReferences,
    contract.referenceRules,
    input.trustedPlateEvidence ?? [],
  );
  if (receipt.manifestSha256 !== digestJson(receipt.manifest)) {
    throw new Error("reader-first plate manifest digest does not match its receipt");
  }
  const dryRunBase = {
    applicationGuidanceSha256: prompt.applicationGuidanceSha256,
    bookId: contract.bookId,
    candidateSha256: input.candidateSha256,
    fableImageDirectionSha256: prompt.fableImageDirectionSha256,
    folioId: contract.folioId,
    manifest: receipt.manifest,
    manifestSha256: receipt.manifestSha256,
    maximumPlannedEstimateMicrousd: C0_IMAGE_MAX_ESTIMATE_MICROUSD,
    plannedProviderOperations: 1,
    plateId: input.plateId,
    schema: "shape-of-time.reader-first-plate-dry-run.v1",
    spendAuthorizationBoundUsd: C0_IMAGE_SPEND_CAP_USD,
  };
  if (receipt.operationDigest !== digestJson(dryRunBase)) {
    throw new Error("reader-first plate receipt is not bound to its reviewed dry run");
  }

  const imageBytes = Buffer.from(input.imageBytes);
  if (receipt.outputMediaType !== "image/png" || receipt.outputSha256 !== sha256(imageBytes)
    || receipt.byteLength !== imageBytes.byteLength || receipt.width !== 1024 || receipt.height !== 1536
    || receipt.requestedModelSnapshot !== GPT_IMAGE_SNAPSHOT
    || receipt.servedModelEvidence !== "unavailable-from-image-api"
    || receipt.totalCostEstimateUnavailableReason !== null
    || !Number.isSafeInteger(receipt.estimatedTotalCostMicrousd)
    || receipt.estimatedTotalCostMicrousd < 0
    || receipt.estimatedTotalCostMicrousd > C0_IMAGE_MAX_ESTIMATE_MICROUSD) {
    throw new Error("reader-first plate output or spend evidence is invalid");
  }
  validateOpaquePng(imageBytes, 1024, 1536);

  const recoveryRoot = path.join(authoringRoot, "images", "recovery");
  const imageProofBytes = await verifyRecoveryProof(
    recoveryRoot,
    receipt.imageRecoveryProof,
    "image/png",
  );
  if (!imageProofBytes.equals(imageBytes)) {
    throw new Error("accepted plate differs from its durable recovered image");
  }
  const replayBytes = await verifyRecoveryProof(
    recoveryRoot,
    receipt.replayRecoveryProof,
    "application/vnd.shape-of-time.image-replay+json",
  );
  validateReplayFixture(replayBytes, receipt);
  for (const [value, label] of [
    [receipt.dispatchDigest, "dispatch"],
    [receipt.fixtureDigest, "fixture"],
    [receipt.manifestSha256, "manifest"],
    [receipt.operationDigest, "operation"],
    [receipt.outputSha256, "output"],
    [receipt.preparedDigest, "prepared"],
    [receipt.providerReceiptSha256, "provider receipt"],
    [receipt.resultDigest, "result"],
  ]) requireDigest(value, label);
}

function validateManifest(manifest, contract, exactSourcePrompt) {
  exactKeys(manifest, MANIFEST_KEYS, "reader-first plate image manifest");
  if (manifest.background !== "opaque" || manifest.contractVersion !== CONTRACT_VERSION
    || manifest.endpoint !== "/v1/images/edits" || manifest.idempotencyKey !== contract.idempotencyKey
    || manifest.idempotencyScope !== "application-only-no-provider-replay"
    || manifest.moderation !== "auto" || manifest.outputFormat !== "png"
    || manifest.promptVersion !== PROMPT_VERSION || manifest.purpose !== "narrative"
    || manifest.quality !== "medium" || manifest.requestedModelSnapshot !== GPT_IMAGE_SNAPSHOT
    || manifest.servedModelEvidence !== "unavailable-from-image-api" || manifest.size !== "1024x1536") {
    throw new Error("reader-first plate image manifest violates the fixed request contract");
  }
  if (!Array.isArray(manifest.orderedReferences)
    || manifest.orderedReferences.length !== contract.referenceRules.length
    || !Array.isArray(manifest.requiredAnchors)
    || manifest.requiredAnchors.length !== contract.referenceRules.length) {
    throw new Error("reader-first plate image manifest has the wrong ordered references");
  }
  const references = manifest.orderedReferences;
  const seen = new Set();
  references.forEach((reference, index) => {
    const rule = contract.referenceRules[index];
    exactKeys(reference, [
      "assetId", "byteLength", "description", "digest", "evidenceDigest", "mediaType",
      "position", "provenance", "role",
    ], "reader-first plate ordered reference");
    exactKeys(reference.provenance, ["evidenceId", "kind", "scope"], "reference provenance");
    if (reference.position !== index + 1 || reference.assetId !== rule.assetId
      || reference.role !== rule.role
      || reference.provenance.kind !== rule.kind || reference.provenance.scope !== rule.scope
      || typeof reference.description !== "string" || reference.description.trim() === ""
      || !Number.isSafeInteger(reference.byteLength) || reference.byteLength <= 0
      || !/^image\/(?:png|jpeg|webp)$/u.test(reference.mediaType)
      || seen.has(reference.digest)) {
      throw new Error("reader-first plate ordered reference scope or evidence is invalid");
    }
    requireDigest(reference.digest, "ordered reference");
    const referenceCore = { ...reference };
    delete referenceCore.evidenceDigest;
    if (reference.evidenceDigest !== digestJson(referenceCore)) {
      throw new Error("reader-first plate ordered reference digest is invalid");
    }
    if (rule.digest !== undefined && reference.digest !== rule.digest) {
      throw new Error("reader-first plate substituted the approved Treatment B medium");
    }
    if (rule.kind === "exposed-folio-image") {
      requireDigest(reference.provenance.evidenceId, "exposed reference acceptance");
    }
    seen.add(reference.digest);
    const requirement = manifest.requiredAnchors[index];
    exactKeys(requirement, ["assetId", "digest", "requirementDigest", "role"], "required reference");
    const requirementCore = {
      assetId: requirement.assetId,
      digest: requirement.digest,
      role: requirement.role,
    };
    if (requirement.assetId !== reference.assetId || requirement.digest !== reference.digest
      || requirement.role !== reference.role
      || requirement.requirementDigest !== digestJson(requirementCore)) {
      throw new Error("reader-first plate required reference was substituted");
    }
  });
  const guide = references.map(({ description, position, role }) =>
    `Image ${position} — ${role}: ${description}`).join("\n");
  const exactPrompt = `${exactSourcePrompt}\n\nReference images, in this exact order:\n${guide}`;
  if (manifest.exactPrompt !== exactPrompt || manifest.promptDigest !== sha256(exactPrompt)) {
    throw new Error("reader-first plate exact prompt drifted from its Fable direction or application scope");
  }
}

function validateTrustedPlateEvidence(references, rules, trustedPlateEvidence) {
  if (!Array.isArray(trustedPlateEvidence)) {
    throw new Error("trusted prior plate evidence must be an array");
  }
  for (const [index, rule] of rules.entries()) {
    if (rule.kind !== "exposed-folio-image") continue;
    const matches = trustedPlateEvidence.filter((entry) => entry?.plateId === rule.sourcePlateId);
    if (matches.length !== 1) {
      throw new Error(`reader-first plate requires one verified ${rule.sourcePlateId} reference`);
    }
    const trusted = matches[0];
    exactKeys(
      trusted,
      ["acceptanceSha256", "plateId", "providerOutputSha256"],
      "trusted prior plate evidence",
    );
    requireDigest(trusted.acceptanceSha256, "trusted prior plate acceptance");
    requireDigest(trusted.providerOutputSha256, "trusted prior plate output");
    const reference = references[index];
    if (reference.assetId !== trusted.plateId
      || reference.digest !== trusted.providerOutputSha256
      || reference.provenance.evidenceId !== trusted.acceptanceSha256) {
      throw new Error(`reader-first plate substituted verified ${rule.sourcePlateId} evidence`);
    }
  }
}

async function verifyRecoveryProof(recoveryRoot, proof, expectedMediaType) {
  const canonicalRoot = await realpath(recoveryRoot);
  const identityBytes = await readFile(path.join(canonicalRoot, "archive.json"));
  const expectedIdentity = {
    archiveId: C0_ARCHIVE_ID,
    schema: "shape-of-time.asset-recovery-archive.v1",
  };
  if (identityBytes.toString("utf8") !== canonicalJson(expectedIdentity) + "\n") {
    throw new Error("C0 image recovery archive identity is invalid");
  }
  exactKeys(proof, [
    "archiveId", "byteLength", "digest", "key", "mediaType", "receiptDigest", "schema",
  ], "C0 recovery proof");
  requireDigest(proof.digest, "C0 recovery object");
  requireDigest(proof.receiptDigest, "C0 recovery receipt");
  if (proof.archiveId !== C0_ARCHIVE_ID || proof.schema !== "shape-of-time.asset-recovery.v1"
    || proof.key !== `sha256/${proof.digest.slice(0, 2)}/${proof.digest}`
    || proof.mediaType !== expectedMediaType || !Number.isSafeInteger(proof.byteLength)
    || proof.byteLength <= 0) {
    throw new Error("C0 recovery proof metadata is invalid");
  }
  const receiptPath = path.join(canonicalRoot, "receipts", `${proof.key}.json`);
  const objectPath = path.join(canonicalRoot, "objects", proof.key);
  const [receiptBytes, objectBytes] = await Promise.all([readFile(receiptPath), readFile(objectPath)]);
  const receipt = JSON.parse(receiptBytes.toString("utf8"));
  exactKeys(receipt, ["archiveId", "byteLength", "digest", "key", "mediaType", "schema"], "recovery receipt");
  if (receiptBytes.toString("utf8") !== canonicalJson(receipt) + "\n"
    || digestJson(receipt) !== proof.receiptDigest
    || canonicalJson(receipt) !== canonicalJson({
      archiveId: proof.archiveId,
      byteLength: proof.byteLength,
      digest: proof.digest,
      key: proof.key,
      mediaType: proof.mediaType,
      schema: proof.schema,
    }) || sha256(objectBytes) !== proof.digest || objectBytes.byteLength !== proof.byteLength) {
    throw new Error("C0 recovery object or receipt does not match its proof");
  }
  return objectBytes;
}

function validateReplayFixture(bytes, receipt) {
  const text = bytes.toString("utf8");
  let fixture;
  try {
    fixture = JSON.parse(text);
  } catch (cause) {
    throw new Error("C0 image replay is not valid JSON", { cause });
  }
  exactKeys(fixture, [
    "fixtureDigest", "manifest", "manifestDigest", "result", "resultDigest", "schema",
  ], "C0 image replay");
  const base = {
    manifest: fixture.manifest,
    manifestDigest: fixture.manifestDigest,
    result: fixture.result,
    resultDigest: fixture.resultDigest,
    schema: fixture.schema,
  };
  if (text !== canonicalJson(fixture) + "\n" || fixture.schema !== "shape-of-time.gpt-image-2-replay.v2"
    || canonicalJson(fixture.manifest) !== canonicalJson(receipt.manifest)
    || fixture.manifestDigest !== receipt.manifestSha256
    || fixture.resultDigest !== receipt.resultDigest || fixture.fixtureDigest !== receipt.fixtureDigest
    || fixture.resultDigest !== digestJson(fixture.result) || fixture.fixtureDigest !== digestJson(base)) {
    throw new Error("C0 image replay is not bound to its request and result");
  }
  const result = requireRecord(fixture.result, "C0 replay result");
  const expectedResult = {
    byteLength: receipt.byteLength,
    clientRequestId: receipt.clientRequestId,
    digest: receipt.outputSha256,
    estimatedOutputCostMicrousd: receipt.estimatedOutputCostMicrousd,
    estimatedTotalCostMicrousd: receipt.estimatedTotalCostMicrousd,
    height: receipt.height,
    latencyMs: receipt.latencyMs,
    mediaType: receipt.outputMediaType,
    pricingVersion: receipt.pricingVersion,
    providerProcessingMs: receipt.providerProcessingMs,
    providerRequestId: receipt.providerRequestId,
    requestedModelSnapshot: receipt.requestedModelSnapshot,
    servedModelEvidence: receipt.servedModelEvidence,
    totalCostEstimateUnavailableReason: receipt.totalCostEstimateUnavailableReason,
    usage: receipt.usage,
    width: receipt.width,
  };
  if (canonicalJson(result) !== canonicalJson(expectedResult)) {
    throw new Error("C0 image replay result disagrees with its provider receipt");
  }
}

function validateDirection(direction) {
  exactKeys(direction, [
    "concreteScene", "factLeftToImage", "mustRemain", "narrativeJob", "purposefulChanges",
    "unresolvedFacts",
  ], "Fable image direction");
  for (const key of ["concreteScene", "factLeftToImage", "narrativeJob"]) {
    if (typeof direction[key] !== "string" || direction[key].trim() === "") {
      throw new Error("Fable image direction " + key + " is empty");
    }
  }
  for (const key of ["mustRemain", "purposefulChanges", "unresolvedFacts"]) {
    if (!Array.isArray(direction[key])
      || direction[key].some((value) => typeof value !== "string" || value.trim() === "")) {
      throw new Error("Fable image direction " + key + " is invalid");
    }
  }
}

function validateOpaquePng(bytes, expectedWidth, expectedHeight) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.byteLength < 57 || !signature.every((value, index) => bytes[index] === value)) {
    throw new Error("accepted plate is not a structurally valid PNG");
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
  const compressedParts = [];
  while (offset < bytes.byteLength) {
    if (bytes.byteLength - offset < 12) throw new Error("accepted PNG has a truncated chunk");
    const length = view.getUint32(offset);
    if (length > bytes.byteLength - offset - 12) throw new Error("accepted PNG chunk exceeds the file");
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const typeBytes = bytes.subarray(typeStart, dataStart);
    const type = Buffer.from(typeBytes).toString("ascii");
    if (!/^[A-Za-z]{4}$/u.test(type) || (typeBytes[2] & 0x20) !== 0
      || crc32(bytes.subarray(typeStart, dataEnd)) !== view.getUint32(dataEnd)) {
      throw new Error("accepted PNG has an invalid chunk type or checksum");
    }
    if (!sawHeader && type !== "IHDR") throw new Error("accepted PNG does not begin with IHDR");
    if (type === "IHDR") {
      if (sawHeader || length !== 13) throw new Error("accepted PNG IHDR is invalid");
      sawHeader = true;
      width = view.getUint32(dataStart);
      height = view.getUint32(dataStart + 4);
      bitDepth = bytes[dataStart + 8];
      colorType = bytes[dataStart + 9];
      if (width !== expectedWidth || height !== expectedHeight
        || bytes[dataStart + 10] !== 0 || bytes[dataStart + 11] !== 0
        || bytes[dataStart + 12] !== 0 || !validPngColorMode(colorType, bitDepth)) {
        throw new Error("accepted PNG dimensions or header do not match the plate contract");
      }
    } else if (type === "PLTE") {
      paletteEntries = length / 3;
      if (sawPalette || sawImageData || colorType === 0 || colorType === 4 || length === 0
        || length % 3 !== 0 || length > 768 || (colorType === 3 && paletteEntries > 2 ** bitDepth)) {
        throw new Error("accepted PNG palette is invalid");
      }
      sawPalette = true;
    } else if (type === "tRNS") {
      throw new Error("accepted PNG transparency contradicts the opaque contract");
    } else if (type === "IDAT") {
      if (imageDataEnded || length === 0) throw new Error("accepted PNG image data is invalid");
      sawImageData = true;
      compressedParts.push(Buffer.from(bytes.subarray(dataStart, dataEnd)));
    } else {
      if (sawImageData) imageDataEnded = true;
      if (type === "IEND") {
        if (length !== 0 || !sawImageData || dataEnd + 4 !== bytes.byteLength) {
          throw new Error("accepted PNG IEND or trailing bytes are invalid");
        }
        sawEnd = true;
      } else if ((type.charCodeAt(0) & 0x20) === 0) {
        throw new Error("accepted PNG contains an unsupported critical chunk");
      }
    }
    offset = dataEnd + 4;
    if (sawEnd) break;
  }
  if (!sawHeader || !sawImageData || !sawEnd || (colorType === 3 && !sawPalette)) {
    throw new Error("accepted PNG is missing required image structure");
  }
  validatePngPixels(Buffer.concat(compressedParts), {
    bitDepth, colorType, height, paletteEntries, width,
  });
}

function validatePngPixels(compressed, image) {
  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 })[image.colorType];
  const rowBytes = Math.ceil((image.width * channels * image.bitDepth) / 8);
  const expectedBytes = image.height * (rowBytes + 1);
  let decoded;
  let consumed;
  try {
    const inflated = inflateSync(compressed, { info: true, maxOutputLength: expectedBytes });
    decoded = Buffer.from(inflated.buffer);
    consumed = inflated.engine.bytesWritten;
  } catch (cause) {
    throw new Error("accepted PNG pixel data cannot be decoded", { cause });
  }
  if (consumed !== compressed.byteLength || decoded.byteLength !== expectedBytes) {
    throw new Error("accepted PNG decoded data length is invalid");
  }
  const bytesPerPixel = Math.max(1, Math.ceil((channels * image.bitDepth) / 8));
  let previous = Buffer.alloc(rowBytes);
  for (let row = 0; row < image.height; row += 1) {
    const rowOffset = row * (rowBytes + 1);
    const filter = decoded[rowOffset];
    if (filter > 4) throw new Error("accepted PNG row filter is invalid");
    const current = Buffer.allocUnsafe(rowBytes);
    for (let column = 0; column < rowBytes; column += 1) {
      const encoded = decoded[rowOffset + 1 + column];
      const left = column >= bytesPerPixel ? current[column - bytesPerPixel] : 0;
      const above = previous[column];
      const aboveLeft = column >= bytesPerPixel ? previous[column - bytesPerPixel] : 0;
      const predictor = filter === 0 ? 0 : filter === 1 ? left : filter === 2 ? above
        : filter === 3 ? Math.floor((left + above) / 2) : paeth(left, above, aboveLeft);
      current[column] = (encoded + predictor) & 0xff;
    }
    if (image.colorType === 3) {
      const mask = (1 << image.bitDepth) - 1;
      for (let pixel = 0; pixel < image.width; pixel += 1) {
        const bitOffset = pixel * image.bitDepth;
        const sample = (current[Math.floor(bitOffset / 8)]
          >> (8 - image.bitDepth - (bitOffset % 8))) & mask;
        if (sample >= image.paletteEntries) throw new Error("accepted PNG palette sample is invalid");
      }
    }
    if (image.colorType === 4 || image.colorType === 6) {
      const bytesPerSample = image.bitDepth / 8;
      const pixelBytes = channels * bytesPerSample;
      const alphaOffset = (channels - 1) * bytesPerSample;
      for (let pixel = 0; pixel < image.width; pixel += 1) {
        for (let byte = 0; byte < bytesPerSample; byte += 1) {
          if (current[pixel * pixelBytes + alphaOffset + byte] !== 0xff) {
            throw new Error("accepted PNG contains non-opaque pixels");
          }
        }
      }
    }
    previous = current;
  }
}

function validPngColorMode(colorType, bitDepth) {
  const validDepths = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16],
  };
  return validDepths[colorType]?.includes(bitDepth) === true;
}

function paeth(left, above, aboveLeft) {
  const estimate = left + above - aboveLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const aboveLeftDistance = Math.abs(estimate - aboveLeft);
  if (leftDistance <= aboveDistance && leftDistance <= aboveLeftDistance) return left;
  return aboveDistance <= aboveLeftDistance ? above : aboveLeft;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function exactKeys(value, expected, label) {
  const record = requireRecord(value, label);
  const actual = Object.keys(record).sort();
  const sortedExpected = [...expected].sort();
  if (actual.length !== sortedExpected.length
    || actual.some((key, index) => key !== sortedExpected[index])) {
    throw new Error(label + " contains unexpected or missing fields");
  }
}

function requireRecord(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(label + " must be an object");
  }
  return value;
}

function requireDigest(value, label) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/u.test(value)) {
    throw new Error(label + " must be a SHA-256 digest");
  }
}
