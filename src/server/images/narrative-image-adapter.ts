import { randomUUID } from "node:crypto";

import type { AssetStore } from "../assets/asset-store.js";
import { canonicalJson, sha256 } from "../domain/digests.js";
import type { NarrativeImagePort } from "../generation/folio-generator.js";
import type { FableImageDirection } from "../text/folio-output.js";
import {
  compileImageRequest,
  type ImageReference,
  type ImageRequest,
} from "./image-contract.js";
import type { ImageProviderExecutor } from "./durable-image-dispatch.js";

/**
 * The live-path narrative image adapter: GPT Image 2 receives Fable's written scene as its
 * direction, plus this book's eligible prior narrative images as book-local references (an edit
 * request when priors exist, a generation otherwise). Reference bytes are re-verified against
 * the ledger digest before they are sent; the result's bytes are verified against its own
 * digest before they are accepted. Everything else — pinned snapshot, endpoint, manifest — is
 * the existing B1 contract, unchanged.
 */
export const NARRATIVE_IMAGE_PROMPT_VERSION = "narrative-image/1";

export class NarrativeImageAdapter implements NarrativeImagePort {
  readonly #assetStore: AssetStore;
  readonly #executor: ImageProviderExecutor;

  constructor(options: { assetStore: AssetStore; executor: ImageProviderExecutor }) {
    this.#assetStore = options.assetStore;
    this.#executor = options.executor;
  }

  async generate(input: {
    contextDigest: string;
    folioOrdinal: number;
    imageDirection: FableImageDirection;
    priorImages: readonly {
      altText: string;
      assetId: string;
      digest: string;
      mediaType: string;
      objectKey: string;
    }[];
  }): Promise<{ altText: string; bytes: Uint8Array; mediaType: string }> {
    // The most recent five eligible book-local images are the ordered reference pack. One prior
    // image is already useful continuity evidence and the pinned B1 contract supports one to five.
    const eligible = input.priorImages.slice(-5);
    const references: ImageReference[] = [];
    for (const [index, prior] of eligible.entries()) {
      const bytes = await this.#assetStore.get(prior.objectKey);
      if (sha256(bytes) !== prior.digest) {
        throw new Error(`prior narrative image ${prior.assetId} failed digest verification`);
      }
      if (
        prior.mediaType !== "image/png" &&
        prior.mediaType !== "image/jpeg" &&
        prior.mediaType !== "image/webp"
      ) {
        throw new Error(`prior narrative image ${prior.assetId} has unsupported media type`);
      }
      references.push({
        assetId: prior.assetId,
        byteLength: bytes.byteLength,
        bytes,
        description: prior.altText,
        digest: prior.digest,
        mediaType: prior.mediaType,
        provenance: {
          evidenceId: prior.assetId,
          kind: "exposed-folio-image",
          scope: "book-local",
        },
        role: `prior-folio-image-${index + 1}`,
      });
    }

    const prompt = [
      "FABLE IMAGE DIRECTION — CANONICAL JSON, UNCHANGED",
      canonicalJson(input.imageDirection),
      "",
      "APPLICATION SCOPE AND TECHNICAL GUIDANCE",
      "Produce one opaque portrait plate for an adult illustrated novel or artist's folio.",
      "The Fable direction above is narrative authority. Do not rewrite, summarize, or add story facts to it.",
      "Use one composed observational scene, varied ink, restrained transparent color, tactile paper, natural perspective, and concrete faces and hands.",
      "Include no caption, logo, speech balloon, panel border, or readable text.",
      "Avoid portals, glowing time effects, cosmic effects, generic science-fiction shorthand, and duplicate people.",
      references.length === 0
        ? "Establish this book's visual world without borrowing people, place, objects, palette, or composition from another book."
        : "Use the ordered prior images only for book-local continuity. Preserve recurring identities and material world while following Fable's purposeful changes; do not recreate an earlier composition.",
    ].join("\n");

    const request: ImageRequest =
      references.length === 0
        ? {
            idempotencyKey: `narrative-image:${input.contextDigest}`,
            kind: "generate",
            prompt,
            promptVersion: NARRATIVE_IMAGE_PROMPT_VERSION,
            purpose: "narrative",
            quality: "medium",
            size: "1024x1536",
          }
        : {
            idempotencyKey: `narrative-image:${input.contextDigest}`,
            kind: "edit",
            prompt,
            promptVersion: NARRATIVE_IMAGE_PROMPT_VERSION,
            purpose: "narrative",
            quality: "medium",
            references,
            requiredAnchors: references.map((reference) => ({
              assetId: reference.assetId,
              digest: reference.digest,
              role: reference.role,
            })),
            size: "1024x1536",
          };
    const compiled = compileImageRequest(request);
    const result = await this.#executor.execute(compiled, { clientRequestId: randomUUID() });
    if (sha256(result.bytes) !== result.digest || result.bytes.byteLength === 0) {
      throw new Error("narrative image result failed digest verification");
    }
    return {
      altText: input.imageDirection.concreteScene.slice(0, 280),
      bytes: result.bytes,
      mediaType: result.mediaType,
    };
  }
}
