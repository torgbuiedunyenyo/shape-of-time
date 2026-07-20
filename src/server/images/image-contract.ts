import { canonicalJson, digestJson, sha256 } from "../domain/digests.js";

export const GPT_IMAGE_SNAPSHOT = "gpt-image-2-2026-04-21" as const;
export const GPT_IMAGE_CONTRACT_VERSION = "shape-of-time.gpt-image-2.v1" as const;

export type PrototypeImageSize = "1024x1024" | "1024x1536" | "1536x1024";
export type ImageQuality = "low" | "medium" | "high";
export type ImageRequestPurpose = "contract-test" | "narrative";

export type ImageReferenceProvenance =
  | {
      evidenceId: string;
      kind: "exposed-folio-image";
      scope: "book-local";
    }
  | {
      evidenceId: string;
      kind: "human-approved-anchor";
      scope: "book-local" | "recurring-identity" | "shared";
    }
  | {
      evidenceId: string;
      kind: "human-approved-medium";
      scope: "shared-medium-only";
    }
  | {
      evidenceId: string;
      kind: "synthetic-contract-fixture";
      scope: "contract-only";
    };

export interface ImageReference {
  assetId: string;
  byteLength: number;
  bytes: Uint8Array;
  description: string;
  digest: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  provenance: ImageReferenceProvenance;
  role: string;
}

export interface ImageAnchorRequirement {
  assetId: string;
  digest: string;
  role: string;
}

export interface RecordedImageAnchorRequirement extends ImageAnchorRequirement {
  requirementDigest: string;
}

interface ImageRequestBase {
  idempotencyKey: string;
  purpose?: ImageRequestPurpose;
  prompt: string;
  promptVersion: string;
  quality: ImageQuality;
  size: PrototypeImageSize;
}

export interface GenerateImageRequest extends ImageRequestBase {
  kind: "generate";
  references?: never;
}

export interface EditImageRequest extends ImageRequestBase {
  kind: "edit";
  references: readonly ImageReference[];
  requiredAnchors: readonly ImageAnchorRequirement[];
}

export type ImageRequest = EditImageRequest | GenerateImageRequest;

export interface OrderedImageReference {
  assetId: string;
  byteLength: number;
  description: string;
  digest: string;
  evidenceDigest: string;
  mediaType: ImageReference["mediaType"];
  position: number;
  provenance: ImageReferenceProvenance;
  role: string;
}

export interface ImageRequestManifest {
  background: "opaque";
  contractVersion: typeof GPT_IMAGE_CONTRACT_VERSION;
  endpoint: "/v1/images/edits" | "/v1/images/generations";
  exactPrompt: string;
  idempotencyKey: string;
  idempotencyScope: "application-only-no-provider-replay";
  moderation: "auto";
  orderedReferences: OrderedImageReference[];
  outputFormat: "png";
  promptDigest: string;
  promptVersion: string;
  purpose: ImageRequestPurpose;
  quality: ImageQuality;
  requiredAnchors: RecordedImageAnchorRequirement[];
  requestedModelSnapshot: typeof GPT_IMAGE_SNAPSHOT;
  servedModelEvidence: "unavailable-from-image-api";
  size: PrototypeImageSize;
}

export interface CompiledImageRequest {
  exactPrompt: string;
  manifest: ImageRequestManifest;
  manifestDigest: string;
  references: readonly ImageReference[];
}

const supportedSizes = new Set<PrototypeImageSize>(["1024x1024", "1024x1536", "1536x1024"]);
const supportedQualities = new Set<ImageQuality>(["low", "medium", "high"]);

export function compileImageRequest(input: ImageRequest): CompiledImageRequest {
  assertNonempty(input.idempotencyKey, "image idempotency key");
  assertNonempty(input.promptVersion, "image prompt version");
  assertNonempty(input.prompt, "image prompt");
  if (input.prompt.length > 32_000) throw new Error("image prompt exceeds 32,000 characters");
  if (!supportedSizes.has(input.size)) throw new Error(`unsupported prototype image size: ${input.size}`);

  const purpose = input.purpose ?? "narrative";
  const sourceReferences = input.kind === "edit" ? input.references : [];
  if (input.kind === "edit" && (sourceReferences.length < 1 || sourceReferences.length > 5)) {
    throw new Error("image edits require one to five ordered references");
  }

  const references = sourceReferences.map((reference): ImageReference => ({
    assetId: reference.assetId,
    byteLength: reference.byteLength,
    bytes: new Uint8Array(reference.bytes),
    description: reference.description,
    digest: reference.digest,
    mediaType: reference.mediaType,
    provenance: structuredClone(reference.provenance),
    role: reference.role,
  }));

  const seenAssetIds = new Set<string>();
  const seenDigests = new Set<string>();
  const orderedReferences = references.map((reference, index): OrderedImageReference => {
    assertNonempty(reference.assetId, "reference asset ID");
    assertNonempty(reference.role, "reference role");
    assertNonempty(reference.description, "reference description");
    validateReferenceProvenance(reference.provenance, purpose, reference.assetId);
    if (seenAssetIds.has(reference.assetId)) throw new Error(`duplicate reference asset: ${reference.assetId}`);
    seenAssetIds.add(reference.assetId);
    if (reference.byteLength !== reference.bytes.byteLength) {
      throw new Error(`reference byte length does not match bytes: ${reference.assetId}`);
    }
    if (sha256(reference.bytes) !== reference.digest) {
      throw new Error(`reference digest does not match bytes: ${reference.assetId}`);
    }
    if (seenDigests.has(reference.digest)) {
      throw new Error(`duplicate reference content is not an independent ordered input: ${reference.assetId}`);
    }
    seenDigests.add(reference.digest);
    const evidence = {
      assetId: reference.assetId,
      byteLength: reference.byteLength,
      description: reference.description,
      digest: reference.digest,
      mediaType: reference.mediaType,
      position: index + 1,
      provenance: reference.provenance,
      role: reference.role,
    };
    return { ...evidence, evidenceDigest: digestJson(evidence) };
  });

  const requirements = input.kind === "edit" ? input.requiredAnchors : [];
  if (input.kind === "edit" && requirements.length === 0) {
    throw new Error("image edits require at least one explicit required anchor");
  }
  const seenRequiredAssetIds = new Set<string>();
  const requiredAnchors = requirements.map((requirement): RecordedImageAnchorRequirement => {
    assertNonempty(requirement.assetId, "required anchor asset ID");
    assertNonempty(requirement.role, "required anchor role");
    if (!/^[a-f0-9]{64}$/.test(requirement.digest)) {
      throw new Error(`required anchor digest is invalid: ${requirement.assetId}`);
    }
    if (seenRequiredAssetIds.has(requirement.assetId)) {
      throw new Error(`duplicate required anchor: ${requirement.assetId}`);
    }
    seenRequiredAssetIds.add(requirement.assetId);
    const match = references.find(
      (reference) =>
        reference.assetId === requirement.assetId &&
        reference.digest === requirement.digest &&
        reference.role === requirement.role,
    );
    if (match === undefined) throw new Error(`required anchor is missing or substituted: ${requirement.assetId}`);
    return { ...requirement, requirementDigest: digestJson(requirement) };
  });

  const exactPrompt = appendReferenceGuide(input.prompt, orderedReferences);
  if (exactPrompt.length > 32_000) throw new Error("complete image prompt exceeds 32,000 characters");
  const manifest: ImageRequestManifest = {
    background: "opaque",
    contractVersion: GPT_IMAGE_CONTRACT_VERSION,
    endpoint: input.kind === "edit" ? "/v1/images/edits" : "/v1/images/generations",
    exactPrompt,
    idempotencyKey: input.idempotencyKey,
    idempotencyScope: "application-only-no-provider-replay",
    moderation: "auto",
    orderedReferences,
    outputFormat: "png",
    promptDigest: sha256(exactPrompt),
    promptVersion: input.promptVersion,
    purpose,
    quality: input.quality,
    requiredAnchors,
    requestedModelSnapshot: GPT_IMAGE_SNAPSHOT,
    servedModelEvidence: "unavailable-from-image-api",
    size: input.size,
  };
  const compiled = { exactPrompt, manifest, manifestDigest: digestJson(manifest), references };
  validateCompiledImageRequest(compiled);
  return compiled;
}

export function snapshotCompiledImageRequest(compiled: CompiledImageRequest): CompiledImageRequest {
  const snapshot: CompiledImageRequest = {
    exactPrompt: compiled.exactPrompt,
    manifest: structuredClone(compiled.manifest),
    manifestDigest: compiled.manifestDigest,
    references: compiled.references.map((reference) => ({
      ...reference,
      bytes: new Uint8Array(reference.bytes),
      provenance: structuredClone(reference.provenance),
    })),
  };
  validateCompiledImageRequest(snapshot);
  return snapshot;
}

export function validateCompiledImageRequest(compiled: CompiledImageRequest): void {
  if (
    compiled === null ||
    typeof compiled !== "object" ||
    typeof compiled.exactPrompt !== "string" ||
    compiled.manifest === null ||
    typeof compiled.manifest !== "object" ||
    typeof compiled.manifestDigest !== "string" ||
    !Array.isArray(compiled.references)
  ) {
    throw new Error("compiled image request has an invalid shape");
  }
  const manifest = compiled.manifest;
  assertExactKeys(
    manifest,
    [
      "background",
      "contractVersion",
      "endpoint",
      "exactPrompt",
      "idempotencyKey",
      "idempotencyScope",
      "moderation",
      "orderedReferences",
      "outputFormat",
      "promptDigest",
      "promptVersion",
      "purpose",
      "quality",
      "requiredAnchors",
      "requestedModelSnapshot",
      "servedModelEvidence",
      "size",
    ],
    "compiled image request manifest",
  );
  if (
    manifest.background !== "opaque" ||
    manifest.contractVersion !== GPT_IMAGE_CONTRACT_VERSION ||
    (manifest.endpoint !== "/v1/images/generations" && manifest.endpoint !== "/v1/images/edits") ||
    typeof manifest.exactPrompt !== "string" ||
    typeof manifest.idempotencyKey !== "string" ||
    manifest.idempotencyKey.trim().length === 0 ||
    manifest.idempotencyScope !== "application-only-no-provider-replay" ||
    manifest.moderation !== "auto" ||
    !Array.isArray(manifest.orderedReferences) ||
    manifest.outputFormat !== "png" ||
    typeof manifest.promptDigest !== "string" ||
    typeof manifest.promptVersion !== "string" ||
    manifest.promptVersion.trim().length === 0 ||
    !supportedQualities.has(manifest.quality) ||
    !Array.isArray(manifest.requiredAnchors) ||
    manifest.requestedModelSnapshot !== GPT_IMAGE_SNAPSHOT ||
    manifest.servedModelEvidence !== "unavailable-from-image-api" ||
    manifest.exactPrompt !== compiled.exactPrompt ||
    compiled.exactPrompt.length > 32_000 ||
    manifest.promptDigest !== sha256(compiled.exactPrompt) ||
    compiled.manifestDigest !== digestJson(manifest) ||
    !supportedSizes.has(manifest.size) ||
    (manifest.purpose !== "narrative" && manifest.purpose !== "contract-test")
  ) {
    throw new Error("compiled image request manifest is invalid");
  }
  const sourcePrompt = recoverSourcePrompt(compiled.exactPrompt, manifest.orderedReferences);
  if (sourcePrompt.trim().length === 0 || sourcePrompt.length > 32_000) {
    throw new Error("compiled image request prompt is invalid");
  }
  const expectedEndpoint = compiled.references.length === 0 ? "/v1/images/generations" : "/v1/images/edits";
  if (
    manifest.endpoint !== expectedEndpoint ||
    manifest.orderedReferences.length !== compiled.references.length ||
    (expectedEndpoint === "/v1/images/generations" && manifest.requiredAnchors.length !== 0) ||
    (expectedEndpoint === "/v1/images/edits" &&
      (compiled.references.length < 1 || compiled.references.length > 5 || manifest.requiredAnchors.length === 0))
  ) {
    throw new Error("compiled image request references do not match its endpoint or manifest");
  }
  const seenAssetIds = new Set<string>();
  const seenDigests = new Set<string>();
  compiled.references.forEach((reference, index) => {
    const recorded = manifest.orderedReferences[index];
    if (recorded === undefined) throw new Error("compiled image request reference is missing from its manifest");
    assertExactKeys(
      reference,
      ["assetId", "byteLength", "bytes", "description", "digest", "mediaType", "provenance", "role"],
      "compiled image reference",
    );
    assertExactKeys(
      recorded,
      [
        "assetId",
        "byteLength",
        "description",
        "digest",
        "evidenceDigest",
        "mediaType",
        "position",
        "provenance",
        "role",
      ],
      "compiled image reference manifest evidence",
    );
    if (
      typeof reference.assetId !== "string" ||
      reference.assetId.trim().length === 0 ||
      typeof reference.description !== "string" ||
      reference.description.trim().length === 0 ||
      typeof reference.role !== "string" ||
      reference.role.trim().length === 0 ||
      !Number.isSafeInteger(reference.byteLength) ||
      reference.byteLength <= 0 ||
      !(reference.bytes instanceof Uint8Array) ||
      !/^[a-f0-9]{64}$/.test(reference.digest) ||
      !["image/jpeg", "image/png", "image/webp"].includes(reference.mediaType) ||
      seenAssetIds.has(reference.assetId)
    ) {
      throw new Error(`compiled image reference evidence is invalid: ${reference.assetId}`);
    }
    seenAssetIds.add(reference.assetId);
    assertExactKeys(reference.provenance, ["evidenceId", "kind", "scope"], "image reference provenance");
    validateReferenceProvenance(reference.provenance, manifest.purpose, reference.assetId);
    const evidence = {
      assetId: reference.assetId,
      byteLength: reference.byteLength,
      description: reference.description,
      digest: reference.digest,
      mediaType: reference.mediaType,
      position: index + 1,
      provenance: reference.provenance,
      role: reference.role,
    };
    if (
      reference.byteLength !== reference.bytes.byteLength ||
      sha256(reference.bytes) !== reference.digest ||
      canonicalReference(recorded) !== canonicalReference(evidence) ||
      recorded.evidenceDigest !== digestJson(evidence) ||
      seenDigests.has(reference.digest)
    ) {
      throw new Error(`compiled image reference evidence is invalid: ${reference.assetId}`);
    }
    seenDigests.add(reference.digest);
  });
  const seenRequiredAssetIds = new Set<string>();
  for (const requirement of manifest.requiredAnchors) {
    assertExactKeys(
      requirement,
      ["assetId", "digest", "requirementDigest", "role"],
      "compiled image required anchor",
    );
    if (
      typeof requirement.assetId !== "string" ||
      requirement.assetId.trim().length === 0 ||
      typeof requirement.role !== "string" ||
      requirement.role.trim().length === 0 ||
      !/^[a-f0-9]{64}$/.test(requirement.digest) ||
      seenRequiredAssetIds.has(requirement.assetId) ||
      requirement.requirementDigest !==
        digestJson({ assetId: requirement.assetId, digest: requirement.digest, role: requirement.role }) ||
      !manifest.orderedReferences.some(
        (reference) =>
          reference.assetId === requirement.assetId &&
          reference.digest === requirement.digest &&
          reference.role === requirement.role,
      )
    ) {
      throw new Error(`compiled image required anchor is invalid: ${requirement.assetId}`);
    }
    seenRequiredAssetIds.add(requirement.assetId);
  }
}

function validateReferenceProvenance(
  provenance: ImageReferenceProvenance,
  purpose: ImageRequestPurpose,
  assetId: string,
): void {
  if (provenance === null || typeof provenance !== "object") {
    throw new Error(`reference approval provenance is missing: ${assetId}`);
  }
  assertNonempty(provenance.evidenceId, "reference provenance evidence ID");
  const valid =
    (provenance.kind === "human-approved-anchor" &&
      ["book-local", "recurring-identity", "shared"].includes(provenance.scope)) ||
    (provenance.kind === "human-approved-medium" && provenance.scope === "shared-medium-only") ||
    (provenance.kind === "exposed-folio-image" && provenance.scope === "book-local") ||
    (purpose === "contract-test" &&
      provenance.kind === "synthetic-contract-fixture" &&
      provenance.scope === "contract-only");
  if (!valid) throw new Error(`reference is not approved, exposed, or an eligible contract fixture: ${assetId}`);
}

function canonicalReference(reference: Omit<OrderedImageReference, "evidenceDigest"> | OrderedImageReference): string {
  const base = { ...reference } as Partial<OrderedImageReference>;
  delete base.evidenceDigest;
  return canonicalJson(base);
}

function appendReferenceGuide(prompt: string, references: OrderedImageReference[]): string {
  if (references.length === 0) return prompt;
  return `${prompt}${referenceGuide(references)}`;
}

function recoverSourcePrompt(exactPrompt: string, references: OrderedImageReference[]): string {
  if (references.length === 0) return exactPrompt;
  const guide = referenceGuide(references);
  if (!exactPrompt.endsWith(guide)) throw new Error("compiled image request reference guide is invalid");
  return exactPrompt.slice(0, -guide.length);
}

function referenceGuide(references: OrderedImageReference[]): string {
  const guide = references.map(
    ({ description, position, role }) => `Image ${position} — ${role}: ${description}`,
  );
  return `\n\nReference images, in this exact order:\n${guide.join("\n")}`;
}

function assertExactKeys(value: object, allowed: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...allowed].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} contains unexpected or missing fields`);
  }
}

function assertNonempty(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} cannot be empty`);
}
