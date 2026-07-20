import type { Hono } from "hono";

import type { AssetStore } from "./assets/asset-store.js";
import {
  ReaderLibraryService,
  type ReaderLibraryGeneration,
} from "./reader-library.js";
import type { LibraryRepository } from "./repositories/library-repository.js";

export type NextPageGeneration = ReaderLibraryGeneration;

export function registerNextPageRoutes(
  app: Hono,
  options: {
    assetStore: AssetStore;
    clientRoot: string;
    generation: NextPageGeneration;
    repository: LibraryRepository;
  },
): ReaderLibraryService {
  const service = new ReaderLibraryService(options);

  app.get("/api/reader/library", async (context) =>
    context.json({ books: await service.listBooks() }),
  );

  app.get("/api/reader/books/:bookId", async (context) => {
    const book = await service.getBook(context.req.param("bookId"));
    return book === null ? context.json({ error: "book not found" }, 404) : context.json({ book });
  });

  app.post("/api/reader/books", async (context) => {
    try {
      const body = await context.req.json<{ title?: unknown }>();
      if (typeof body.title !== "string") {
        return context.json({ error: "a title is required" }, 400);
      }
      const status = await service.requestTitleChild(body.title);
      return context.json(status, status.state === "ready" ? 200 : status.state === "error" ? 409 : 202);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : String(error) }, 400);
    }
  });

  app.post("/api/reader/books/:bookId/folios/:folioId/children", async (context) => {
    try {
      const body = await context.req.json<{
        endBlockId?: unknown;
        endOffset?: unknown;
        quote?: unknown;
        startBlockId?: unknown;
        startOffset?: unknown;
      }>();
      if (
        typeof body.startBlockId !== "string" ||
        typeof body.endBlockId !== "string" ||
        !Number.isInteger(body.startOffset) ||
        !Number.isInteger(body.endOffset) ||
        typeof body.quote !== "string"
      ) {
        return context.json({ error: "a stable text selection is required" }, 400);
      }
      const status = await service.requestSelectionChild(
        context.req.param("bookId"),
        context.req.param("folioId"),
        {
          endBlockId: body.endBlockId,
          endOffset: body.endOffset as number,
          quote: body.quote,
          startBlockId: body.startBlockId,
          startOffset: body.startOffset as number,
        },
      );
      return context.json(status, status.state === "ready" ? 200 : status.state === "error" ? 409 : 202);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : String(error) }, 400);
    }
  });

  app.get("/api/reader/creations/:creationId", (context) => {
    const status = service.readCreationStatus(context.req.param("creationId"));
    return context.json(status, status.state === "ready" ? 200 : status.state === "error" ? 409 : 200);
  });

  app.post("/api/reader/books/:bookId/next", async (context) => {
    try {
      const status = await service.requestNext(context.req.param("bookId"));
      return context.json(status, status.state === "ready" ? 200 : status.state === "error" ? 409 : 202);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : String(error) }, 404);
    }
  });

  app.get("/api/reader/books/:bookId/next", async (context) => {
    try {
      const status = await service.readNextStatus(context.req.param("bookId"));
      return context.json(status, status.state === "error" ? 409 : 200);
    } catch (error) {
      return context.json({ error: error instanceof Error ? error.message : String(error) }, 404);
    }
  });

  app.post("/api/reader/books/:bookId/folios/:ordinal/open", async (context) => {
    const ordinal = Number(context.req.param("ordinal"));
    if (!Number.isInteger(ordinal) || ordinal < 1) {
      return context.json({ error: "invalid folio ordinal" }, 400);
    }
    try {
      return context.json(await service.openFolio(context.req.param("bookId"), ordinal));
    } catch (error) {
      return context.json(
        { error: error instanceof Error ? error.message : String(error) },
        409,
      );
    }
  });

  app.get("/api/reader/assets/:assetId", async (context) => {
    try {
      const asset = await service.readAsset(context.req.param("assetId"));
      return new Response(new Uint8Array(asset.bytes), {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "Content-Type": asset.mediaType,
        },
      });
    } catch {
      return context.json({ error: "asset not found" }, 404);
    }
  });

  return service;
}
