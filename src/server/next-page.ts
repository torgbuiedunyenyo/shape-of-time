import type { Hono } from "hono";

import type { AssetStore } from "./assets/asset-store.js";
import { sha256 } from "./domain/digests.js";
import {
  generateNextFolio,
  type FolioGenerationDependencies,
} from "./generation/folio-generator.js";
import type { ImageProviderExecutor } from "./images/durable-image-dispatch.js";
import { NarrativeImageAdapter } from "./images/narrative-image-adapter.js";
import type { FolioRecord, LibraryRepository } from "./repositories/library-repository.js";
import { FableContractError, type FableProviderPort } from "./text/fable-contract.js";

/**
 * The minimal live path for Next Page: request the next folio (a POST that spends at most
 * once), watch its state (a GET that can never purchase generation), and open it (the one
 * atomic publish transition, returning prose and image together). Nothing here queues, plans
 * movements, or expands the garden — it composes the existing contract, compiler, generator,
 * and image machinery into three routes and one read-only byte stream.
 */
export interface NextPageGeneration {
  imageExecutor: ImageProviderExecutor;
  prosePort: FableProviderPort;
  sources: { temporalRules: string; world: string };
}

export function registerNextPageRoutes(
  app: Hono,
  options: {
    assetStore: AssetStore;
    generation: NextPageGeneration;
    repository: LibraryRepository;
  },
): void {
  const { assetStore, generation, repository } = options;
  const dependencies: FolioGenerationDependencies = {
    assetStore,
    imagePort: new NarrativeImageAdapter({
      assetStore,
      executor: generation.imageExecutor,
    }),
    prosePort: generation.prosePort,
    repository,
    sources: generation.sources,
  };

  app.post("/api/books/:bookId/next-folio", async (context) => {
    const bookId = context.req.param("bookId");
    let movementId: string;
    let ordinal: number;
    try {
      const book = await repository.getBook(bookId);
      const lastMovement = book.movementBriefs.at(-1);
      if (lastMovement === undefined) {
        return context.json({ error: "book has no movement to continue" }, 409);
      }
      const folios = await repository.listFolios(bookId);
      const last = folios.at(-1);
      // The next page is the in-flight/failed folio if one exists, else the next ordinal.
      ordinal = last === undefined || last.state === "exposed" ? (last?.ordinal ?? 0) + 1 : last.ordinal;
      movementId = last !== undefined && last.state !== "exposed" ? last.movementId : lastMovement.id;
    } catch {
      return context.json({ error: "book not found" }, 404);
    }
    try {
      const { folio, spent } = await generateNextFolio(dependencies, {
        bookId,
        movementId,
        ordinal,
        workerId: "next-page-api",
      });
      return context.json(
        { folio: { id: folio.id, ordinal: folio.ordinal, state: folio.state }, spent },
        201,
      );
    } catch (error) {
      const code = error instanceof FableContractError ? error.code : "generation_failed";
      return context.json(
        { error: { code, message: error instanceof Error ? error.message : String(error) } },
        502,
      );
    }
  });

  app.get("/api/books/:bookId/folios/:ordinal", async (context) => {
    const folio = await findFolio(repository, context.req.param("bookId"), context.req.param("ordinal"));
    if (folio === null) return context.json({ error: "folio not found" }, 404);
    return context.json({
      exposedAt: folio.exposedAt,
      id: folio.id,
      ordinal: folio.ordinal,
      state: folio.state,
    });
  });

  app.post("/api/books/:bookId/folios/:ordinal/open", async (context) => {
    let folio = await findFolio(repository, context.req.param("bookId"), context.req.param("ordinal"));
    if (folio === null) return context.json({ error: "folio not found" }, 404);
    if (folio.state === "ready") folio = await repository.exposeFolio(folio.id);
    if (folio.state !== "exposed") {
      return context.json({ error: `folio is ${folio.state}, not ready to open`, state: folio.state }, 409);
    }
    const assetId = folio.layout?.["imageAssetId"];
    const altText = folio.layout?.["imageAltText"];
    return context.json({
      id: folio.id,
      image:
        typeof assetId === "string" && typeof altText === "string"
          ? { altText, assetId }
          : null,
      ordinal: folio.ordinal,
      prose: folio.prose,
      state: folio.state,
    });
  });

  app.get("/api/books/:bookId/folios/:ordinal/image", async (context) => {
    const folio = await findFolio(repository, context.req.param("bookId"), context.req.param("ordinal"));
    if (folio === null) return context.json({ error: "folio not found" }, 404);
    const assetId = folio.layout?.["imageAssetId"];
    if (typeof assetId !== "string") return context.json({ error: "folio has no image" }, 404);
    const asset = await repository.getAsset(assetId);
    const bytes = await assetStore.get(asset.objectKey);
    if (sha256(bytes) !== asset.digest) {
      return context.json({ error: "image failed digest verification" }, 500);
    }
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": asset.mediaType,
      },
    });
  });
}

async function findFolio(
  repository: LibraryRepository,
  bookId: string,
  rawOrdinal: string,
): Promise<FolioRecord | null> {
  const ordinal = Number(rawOrdinal);
  if (!Number.isInteger(ordinal) || ordinal < 1) return null;
  try {
    const folios = await repository.listFolios(bookId);
    return folios.find((folio) => folio.ordinal === ordinal) ?? null;
  } catch {
    return null;
  }
}
