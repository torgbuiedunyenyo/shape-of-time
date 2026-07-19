import type { AssetStore } from "../assets/asset-store.js";
import type { JsonValue } from "../db/types.js";
import type { FolioRecord, LibraryRepository } from "../repositories/library-repository.js";
import { parseFolioProse } from "../text/d2-baseline.js";
import { compileFolioContext, type PriorFolio } from "../text/folio-context.js";
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
export interface NarrativeImagePort {
  generate(input: {
    contextDigest: string;
    folioOrdinal: number;
    prose: string;
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
    const priorFolios: PriorFolio[] = exposed.map((prior) => ({
      images: [],
      ordinal: prior.ordinal,
      prose: prior.prose ?? "",
    }));

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
    const prose = parseFolioProse(evidence.prose);
    const image = await imagePort.generate({
      contextDigest: compiled.contextDigest,
      folioOrdinal: input.ordinal,
      prose,
    });
    if (image.bytes.byteLength === 0) throw new Error("narrative image has no bytes");
    if (image.altText.trim().length === 0) throw new Error("narrative image needs alt text");
    const asset = await repository.storeAsset(assetStore, {
      bytes: image.bytes,
      mediaType: image.mediaType,
    });

    const ready = await repository.markFolioReady({
      apertures: [],
      evidence: {
        latencyMs: Date.now() - startedAt,
        providerRequestId: evidence.providerResponseId,
        result: {
          contextDigest: compiled.contextDigest,
          countedInputTokens: evidence.countedInputTokens,
          imageAssetId: asset.id,
          manifestDigest: evidence.manifestDigest,
        },
        usage: { ...evidence.usage },
      },
      folioId: folio.id,
      layout: { imageAltText: image.altText, imageAssetId: asset.id, ordinal: input.ordinal },
      leaseToken,
      prose,
      requiredAssetIds: [asset.id],
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
