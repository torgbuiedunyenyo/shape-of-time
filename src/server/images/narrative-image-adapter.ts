import { randomUUID } from "node:crypto";

import type { AssetStore } from "../assets/asset-store.js";
import { sha256 } from "../domain/digests.js";
import type { NarrativeImagePort } from "../generation/folio-generator.js";
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
    priorImages: readonly {
      altText: string;
      assetId: string;
      digest: string;
      mediaType: string;
      objectKey: string;
    }[];
    prose: string;
  }): Promise<{ altText: string; bytes: Uint8Array; mediaType: string }> {
    // The pinned contract admits edits only with two to five ordered references and explicit
    // required anchors. With fewer than two eligible priors the honest request is a generation:
    // the contract is not widened to fake continuity it cannot bind. The most recent five
    // eligible priors are the reference pack, and each doubles as its own required anchor.
    const eligible = input.priorImages.slice(-5);
    const references: ImageReference[] = [];
    for (const [index, prior] of (eligible.length >= 2 ? eligible : []).entries()) {
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

    const prompt =
      `Narrative illustration for folio ${input.folioOrdinal} of a Shape of Time volume. ` +
      "Depict the scene the writer set down, faithful to its concrete details, cast, light, " +
      "and mood. No text, lettering, panels, or borders in the image.\n\n" +
      `${input.prose}\n\n` +
      (references.length === 0
        ? "This is the book's first narrative image; establish its visual world."
        : "Maintain strict visual continuity with the prior narrative images supplied as references: the same medium, palette discipline, recurring people, and places.");

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
    const firstSentence = input.prose.split(/(?<=[.!?])\s/)[0] ?? input.prose;
    return {
      altText: `Narrative image, folio ${input.folioOrdinal}: ${firstSentence.slice(0, 140)}`,
      bytes: result.bytes,
      mediaType: result.mediaType,
    };
  }
}
