import type { AssetStore } from "../assets/asset-store.js";
import type { JsonValue } from "../db/types.js";
import { digestJson, sha256 } from "../domain/digests.js";
import type { FolioRecord, LibraryRepository } from "../repositories/library-repository.js";
import { compileFolioContext, type PriorFolio } from "../text/folio-context.js";
import { parseFolioOutput, type FableImageDirection } from "../text/folio-output.js";
import {
  executeFableAttempt,
  FableContractError,
  type FableProviderPort,
} from "../text/fable-contract.js";

/**
 * D3: pagewise generation (PLAN §D3). One prose call and one image call per folio, never a
 * movement-sized prose unit. The idempotency key names the thing it deduplicates — this book,
 * this movement, this ordinal — so duplicate requests spend once; leases make a crash resumable;
 * ready is one atomic transition carrying prose and the required image together. The prior-folio
 * history is loaded from THIS book's exposed folios only, which is what keeps siblings isolated
 * on the normal path.
 */
export interface EligiblePriorImage {
  altText: string;
  assetId: string;
  digest: string;
  mediaType: string;
  objectKey: string;
}

export interface NarrativeImagePort {
  generate(input: {
    contextDigest: string;
    folioOrdinal: number;
    imageDirection: FableImageDirection;
    priorImages: readonly EligiblePriorImage[];
  }): Promise<{ altText: string; bytes: Uint8Array; mediaType: string }>;
}

export interface FolioGenerationDependencies {
  assetStore: AssetStore;
  imagePort: NarrativeImagePort;
  prosePort: FableProviderPort;
  repository: LibraryRepository;
  sources: { temporalRules: string; world: string };
}

export interface GenerateFolioInput {
  bookId: string;
  leaseMilliseconds?: number;
  movementId: string;
  ordinal: number;
  workerId: string;
}

export function folioGenerationKey(input: {
  bookId: string;
  movementId: string;
  ordinal: number;
}): string {
  return `generate:${input.bookId}:${input.movementId}:${input.ordinal}`;
}

export async function generateNextFolio(
  dependencies: FolioGenerationDependencies,
  input: GenerateFolioInput,
): Promise<{ folio: FolioRecord; spent: boolean }> {
  const { assetStore, imagePort, prosePort, repository, sources } = dependencies;
  const idempotencyKey = folioGenerationKey(input);

  const reservation = await repository.reserveFolio({
    bookId: input.bookId,
    idempotencyKey,
    movementId: input.movementId,
    ordinal: input.ordinal,
  });
  let folio = reservation.folio;
  if (folio.state === "ready" || folio.state === "exposed") {
    return { folio, spent: false };
  }
  if (folio.state === "failed") {
    // Retry is only reachable from a recorded named failure, and it mints a successor attempt.
    const retried = await repository.retryFailedFolio({
      folioId: folio.id,
      idempotencyKey: `${idempotencyKey}:retry-of:${folio.generationAttemptId}`,
    });
    folio = retried.folio;
  }

  const leaseToken = await repository.claimFolioGeneration({
    attemptId: folio.generationAttemptId,
    leaseMilliseconds: input.leaseMilliseconds ?? 10 * 60 * 1000,
    workerId: input.workerId,
  });
  if (leaseToken === null) {
    // Another live worker holds the lease; this caller must not spend.
    return { folio: await repository.getFolio(folio.id), spent: false };
  }

  try {
    const book = await repository.getBook(input.bookId);
    const originStatement = book.origin["statement"];
    if (typeof originStatement !== "string" || originStatement.trim().length === 0) {
      throw new Error("book origin must carry a written statement of its founding premise");
    }
    const movement = book.movementBriefs.find(({ id }) => id === input.movementId);
    if (movement === undefined) {
      throw new Error(`movement ${input.movementId} does not exist in book ${input.bookId}`);
    }
    const exposed = await repository.listExposedFolios(input.bookId);
    // Prior prose and each folio's accepted narrative image travel together as actual multimodal
    // blocks. The same verified images form the application-selected reference candidates for a
    // new plate; captions or digests never stand in for pixels in Fable's history.
    const eligiblePriorImages: EligiblePriorImage[] = [];
    const priorFolios: PriorFolio[] = [];
    for (const prior of exposed) {
      const images: PriorFolio["images"][number][] = [];
      const assetId = prior.layout?.["imageAssetId"];
      const altText = prior.layout?.["imageAltText"];
      if (typeof assetId === "string" && typeof altText === "string") {
        const asset = await repository.getAsset(assetId);
        const bytes = await assetStore.get(asset.objectKey);
        if (sha256(bytes) !== asset.digest) {
          throw new Error(`prior narrative image ${asset.id} failed digest verification`);
        }
        if (!["image/gif", "image/jpeg", "image/png", "image/webp"].includes(asset.mediaType)) {
          throw new Error(`prior narrative image ${asset.id} has unsupported media type`);
        }
        images.push({
          altText,
          assetId: asset.id,
          bytes,
          digest: asset.digest,
          mediaType: asset.mediaType as "image/gif" | "image/jpeg" | "image/png" | "image/webp",
        });
        eligiblePriorImages.push({
          altText,
          assetId,
          digest: asset.digest,
          mediaType: asset.mediaType,
          objectKey: asset.objectKey,
        });
      }
      priorFolios.push({ images, ordinal: prior.ordinal, prose: prior.prose ?? "" });
    }

    const compiled = compileFolioContext({
      bookOrigin: originStatement,
      currentFolioBrief:
        `This is folio ${input.ordinal} of movement ${movement.id}. Continue directly from the ` +
        "story so far and advance the current movement brief by one clear change in situation, " +
        "want, or understanding.",
      movementBrief: movement.brief,
      priorFolios,
      temporalRules: sources.temporalRules,
      world: sources.world,
    });

    const startedAt = Date.now();
    const evidence = await executeFableAttempt(compiled.request, prosePort);
    const output = parseFolioOutput(evidence.prose);
    const prose = output.proseParagraphs.join("\n\n");
    let image: { altText: string; bytes: Uint8Array; mediaType: string } | null = null;
    let asset: Awaited<ReturnType<LibraryRepository["storeAsset"]>> | null = null;
    if (output.imageDirection !== null) {
      image = await imagePort.generate({
        contextDigest: compiled.contextDigest,
        folioOrdinal: input.ordinal,
        imageDirection: output.imageDirection,
        priorImages: eligiblePriorImages,
      });
      if (image.bytes.byteLength === 0) throw new Error("narrative image has no bytes");
      if (image.altText.trim().length === 0) throw new Error("narrative image needs alt text");
      asset = await repository.storeAsset(assetStore, {
        bytes: image.bytes,
        mediaType: image.mediaType,
      });
    }

    const ready = await repository.markFolioReady({
      apertures: [],
      evidence: {
        latencyMs: Date.now() - startedAt,
        providerRequestId: evidence.providerResponseId,
        result: {
          contextDigest: compiled.contextDigest,
          countedInputTokens: evidence.countedInputTokens,
          imageAltText: image?.altText ?? null,
          imageAssetId: asset?.id ?? null,
          imageDigest: image === null ? null : sha256(image.bytes),
          imageDirection:
            output.imageDirection === null
              ? null
              : (structuredClone(output.imageDirection) as unknown as JsonValue),
          imageDirectionDigest:
            output.imageDirection === null ? null : digestJson(output.imageDirection),
          manifestDigest: evidence.manifestDigest,
          movementId: movement.id,
          priorFolios: exposed.map((prior) => ({
            folioId: prior.id,
            ordinal: prior.ordinal,
            proseDigest: sha256(prior.prose ?? ""),
          })),
          promptVersion: compiled.contextManifest.promptVersion,
          proseDigest: sha256(prose),
          sourceDigests: { ...compiled.contextManifest.sourceDigests },
        },
        usage: { ...evidence.usage },
      },
      folioId: folio.id,
      layout:
        image === null || asset === null
          ? { kind: "text-led", ordinal: input.ordinal }
          : {
              imageAltText: image.altText,
              imageAssetId: asset.id,
              kind: "plate",
              ordinal: input.ordinal,
            },
      leaseToken,
      prose,
      requiredAssetIds: asset === null ? [] : [asset.id],
    });
    return { folio: ready, spent: true };
  } catch (error) {
    const failure: { [key: string]: JsonValue } = {
      code: error instanceof FableContractError ? error.code : "generation_failed",
      message: error instanceof Error ? error.message : String(error),
    };
    try {
      await repository.failFolio({ failure, folioId: folio.id, leaseToken });
    } catch {
      // The named failure above is the truth of this attempt; a bookkeeping error (for example a
      // lease lost to a crash-resumed successor) must not replace it.
    }
    throw error;
  }
}
