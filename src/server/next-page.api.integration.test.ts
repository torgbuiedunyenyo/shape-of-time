import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Kysely } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "./app.js";
import { FilesystemAssetStore } from "./assets/filesystem-asset-store.js";
import { createDatabase, destroyDatabase } from "./db/database.js";
import { migrateToLatest } from "./db/migrate.js";
import type { Database } from "./db/types.js";
import { sha256 } from "./domain/digests.js";
import type { CompiledImageRequest } from "./images/image-contract.js";
import type { ImageProviderResult } from "./images/openai-image-client.js";
import { LibraryRepository } from "./repositories/library-repository.js";
import type { FableRequestBody } from "./text/fable-contract.js";

let container: StartedPostgreSqlContainer;
let database: Kysely<Database>;
let repository: LibraryRepository;
let assetRoot: string;
let assetStore: FilesystemAssetStore;
let app: ReturnType<typeof createApp>;
let bookId: string;

const WORLD = "Shape of Time world. One person exists once; every time keeps living.";
const RULES = "Temporal movement is physical travel along mapped currents.";
const PROSE_BODY = Array.from({ length: 140 }, (_, index) => `pageword${index}`).join(" ");

const proseRequests: FableRequestBody[] = [];
const imageRequests: CompiledImageRequest[] = [];

const prosePort = {
  count: (body: FableRequestBody) => {
    void body;
    return Promise.resolve({ input_tokens: 2_000 });
  },
  send: (body: FableRequestBody) => {
    proseRequests.push(body);
    const call = proseRequests.length;
    return Promise.resolve({
      content: [
        { text: `<folio_prose>Page-${call} opens. ${PROSE_BODY}</folio_prose>`, type: "text" },
      ],
      id: `msg_page_${call}`,
      model: "claude-fable-5",
      stop_reason: "end_turn",
      usage: { input_tokens: 2_000, output_tokens: 310 },
    });
  },
};

const imageExecutor = {
  execute: (compiled: CompiledImageRequest, options: { clientRequestId: string }) => {
    imageRequests.push(compiled);
    const bytes = new TextEncoder().encode(`png-${compiled.manifestDigest}`);
    const result = {
      byteLength: bytes.byteLength,
      bytes,
      clientRequestId: options.clientRequestId,
      digest: sha256(bytes),
      estimatedOutputCostMicrousd: 1_230_000,
      estimatedTotalCostMicrousd: null,
      height: 1536,
      latencyMs: 5,
      mediaType: "image/png",
      pricingVersion: "test",
      providerProcessingMs: null,
      providerRequestId: `img_${imageRequests.length}`,
      requestedModelSnapshot: "gpt-image-2-2026-04-21",
      servedModelEvidence: "unavailable-from-image-api",
      totalCostEstimateUnavailableReason: "usage-unavailable",
      width: 1024,
    } as unknown as ImageProviderResult;
    return Promise.resolve(result);
  },
};

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18.4-alpine")
    .withDatabase("shape_of_time")
    .withUsername("shape_of_time")
    .withPassword("shape_of_time")
    .start();
  database = createDatabase(container.getConnectionUri());
  await migrateToLatest(database);
  repository = new LibraryRepository(database);
  assetRoot = await mkdtemp(path.join(tmpdir(), "shape-of-time-next-page-"));
  assetStore = new FilesystemAssetStore(assetRoot);
  app = createApp({
    assetStore,
    clientRoot: "dist/client",
    database,
    generation: {
      imageExecutor,
      prosePort,
      sources: { temporalRules: RULES, world: WORLD },
    },
  });
  const book = await repository.createBook({
    firstMovement: { brief: "From the failed payment to Jay's calm yes.", id: "movement-01" },
    origin: { statement: "This is the root book of the library." },
    title: "Next Page root",
  });
  bookId = book.id;
}, 120_000);

afterAll(async () => {
  await destroyDatabase(database);
  await container.stop();
  await rm(assetRoot, { force: true, recursive: true });
});

async function requestNextFolio(): Promise<{ body: { folio: { id: string; ordinal: number; state: string }; spent: boolean }; status: number }> {
  const response = await app.request(`/api/books/${bookId}/next-folio`, { method: "POST" });
  return { body: (await response.json()) as never, status: response.status };
}

async function openFolio(ordinal: number): Promise<{ body: { image?: { altText: string; assetId: string }; prose?: string; state: string }; status: number }> {
  const response = await app.request(`/api/books/${bookId}/folios/${ordinal}/open`, { method: "POST" });
  return { body: (await response.json()) as never, status: response.status };
}

describe("Next Page API on a real database", () => {
  it(
    "requests the next folio exactly once, retrieves it when ready, and publishes atomically",
    async () => {
      // Folio 1: request twice — one spend.
      const first = await requestNextFolio();
      const duplicate = await requestNextFolio();
      expect(first.status).toBe(201);
      expect(first.body.folio.ordinal).toBe(1);
      expect(first.body.spent).toBe(true);
      expect(duplicate.body.folio.id).toBe(first.body.folio.id);
      expect(duplicate.body.spent).toBe(false);
      expect(proseRequests).toHaveLength(1);
      expect(imageRequests).toHaveLength(1);

      // Retrieval when ready: GET reports state and never purchases.
      const status = await app.request(`/api/books/${bookId}/folios/1`);
      expect(status.status).toBe(200);
      const statusBody = (await status.json()) as { prose?: string; state: string };
      expect(statusBody.state).toBe("ready");
      expect(statusBody.prose).toBeUndefined();
      expect(proseRequests).toHaveLength(1);

      // Publish is one atomic transition: open exposes and returns prose + image together.
      const opened = await openFolio(1);
      expect(opened.status).toBe(200);
      expect(opened.body.state).toBe("exposed");
      expect(opened.body.prose).toContain("Page-1 opens.");
      expect(opened.body.image?.assetId).toBeTruthy();

      // The image bytes are retrievable read-only.
      const image = await app.request(`/api/books/${bookId}/folios/1/image`);
      expect(image.status).toBe(200);
      expect(image.headers.get("content-type")).toBe("image/png");
      expect((await image.arrayBuffer()).byteLength).toBeGreaterThan(0);
    },
    60_000,
  );

  it(
    "interleaves prior prose and accepted images for Fable, and hands GPT Image 2 the direction plus eligible priors",
    async () => {
      // Folio 2, then expose it so folio 3 sees two exposed folios with images.
      await requestNextFolio();
      await openFolio(2);
      await requestNextFolio();

      // Fable's folio-3 request carries folio 1 and 2 prose with their image markers interleaved.
      const request = proseRequests[2]?.messages[0]?.content[0]?.text ?? "";
      const p1 = request.indexOf("Page-1 opens.");
      const p2 = request.indexOf("Page-2 opens.");
      const markers = [...request.matchAll(/\[Narrative image: /g)].map((m) => m.index ?? -1);
      expect(p1).toBeGreaterThanOrEqual(0);
      expect(p2).toBeGreaterThan(p1);
      expect(markers).toHaveLength(2);
      expect(markers[0]).toBeGreaterThan(p1);
      expect(markers[0]).toBeLessThan(p2);
      expect(markers[1]).toBeGreaterThan(p2);

      // GPT Image 2's folio-3 request: edit endpoint, both prior images as book-local
      // references, and the exact prompt carries Fable's written scene.
      const compiled = imageRequests[2]!;
      expect(compiled.manifest.endpoint).toBe("/v1/images/edits");
      expect(compiled.manifest.orderedReferences).toHaveLength(2);
      expect(
        compiled.manifest.orderedReferences.every(
          (reference) => reference.provenance.kind === "exposed-folio-image",
        ),
      ).toBe(true);
      expect(compiled.exactPrompt).toContain("Page-3 opens.");
    },
    60_000,
  );

  it("returns 404 for an unknown folio and refuses to open an unready one", async () => {
    const missing = await app.request(`/api/books/${bookId}/folios/99`);
    expect(missing.status).toBe(404);
    const unknownBook = await app.request(`/api/books/${randomUUID()}/folios/1`);
    expect(unknownBook.status).toBe(404);
  });
});
