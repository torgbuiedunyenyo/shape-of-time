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
import { canonicalJson, sha256 } from "./domain/digests.js";
import type { CompiledImageRequest } from "./images/image-contract.js";
import type { ImageProviderResult } from "./images/openai-image-client.js";
import type { FableRequestBody } from "./text/fable-contract.js";

let container: StartedPostgreSqlContainer;
let database: Kysely<Database>;
let assetRoot: string;
let assetStore: FilesystemAssetStore;
let app: ReturnType<typeof createApp>;

const WORLD = "Shape of Time world. One person exists once; every time keeps living.";
const RULES = "Temporal movement is physical travel along mapped currents.";
const PROSE_BODY = Array.from({ length: 140 }, (_, index) => `pageword${index}`).join(" ");
const proseRequests: FableRequestBody[] = [];
const plannerRequests: FableRequestBody[] = [];
const imageRequests: CompiledImageRequest[] = [];

function direction(call: number) {
  return {
    concreteScene: `Direction ${call}: Jay and Tan handle the concrete work of the crossing.`,
    factLeftToImage: `Direction ${call}: the material arrangement and unequal controls.`,
    mustRemain: [`Direction ${call}: preserve Jay, Tan, and their established visual world.`],
    narrativeJob: `Direction ${call}: reveal how the institution structures the journey.`,
    purposefulChanges: [`Direction ${call}: show the decision becoming physical work.`],
    unresolvedFacts: [`Direction ${call}: do not invent a universal future style.`],
  };
}

const prosePort = {
  count: () => Promise.resolve({ input_tokens: 20_000 }),
  send: (body: FableRequestBody) => {
    if (body.output_config.format === undefined) {
      plannerRequests.push(body);
      return Promise.resolve({
        content: [{
          text: "<movement_brief>A working route is tested by people whose needs conflict, and the movement rests when one public decision changes who can travel.</movement_brief>",
          type: "text",
        }],
        id: `msg_plan_${plannerRequests.length}`,
        model: "claude-fable-5",
        stop_reason: "end_turn",
        usage: { input_tokens: 20_000, output_tokens: 80 },
      });
    }
    proseRequests.push(body);
    const call = proseRequests.length;
    const textLed = JSON.stringify(body.output_config.format.schema).includes(
      '"imageDirection":{"type":"null"',
    );
    return Promise.resolve({
      content: [{
        text: JSON.stringify({
          imageDirection: textLed ? null : direction(call),
          proseParagraphs: [`Page-${call} opens. ${PROSE_BODY}`],
        }),
        type: "text",
      }],
      id: `msg_page_${call}`,
      model: "claude-fable-5",
      stop_reason: "end_turn",
      usage: { input_tokens: 20_000, output_tokens: 310 },
    });
  },
};

const imageExecutor = {
  execute: (compiled: CompiledImageRequest, options: { clientRequestId: string }) => {
    imageRequests.push(compiled);
    const bytes = new TextEncoder().encode(`png-${compiled.manifestDigest}`);
    return Promise.resolve({
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
    } as unknown as ImageProviderResult);
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
}, 120_000);

afterAll(async () => {
  await destroyDatabase(database);
  await container.stop();
  await rm(assetRoot, { force: true, recursive: true });
});

async function nextStatus(): Promise<{ ordinal: number; state: string }> {
  const response = await app.request("/api/reader/books/shape-of-time/next");
  return response.json() as Promise<{ ordinal: number; state: string }>;
}

async function waitUntilReady(expectedOrdinal: number): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    const status = await nextStatus();
    if (status.state === "ready" && status.ordinal === expectedOrdinal) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`folio ${expectedOrdinal} did not become ready`);
}

describe("reader-facing Next Folio API on a real database", () => {
  it(
    "seeds the accepted history, prepares once, publishes atomically, then prepares only one next folio",
    async () => {
      const first = await app.request("/api/reader/books/shape-of-time/next", { method: "POST" });
      const duplicate = await app.request("/api/reader/books/shape-of-time/next", { method: "POST" });
      expect(first.status).toBe(202);
      expect(duplicate.status).toBe(202);
      await waitUntilReady(9);
      expect(proseRequests).toHaveLength(1);
      expect(imageRequests).toHaveLength(1);

      // Fable sees all eight accepted pages and the three actual prior images in story order.
      const blocks = proseRequests[0]?.messages[0]?.content ?? [];
      expect(blocks.filter(({ type }) => type === "image")).toHaveLength(3);
      const text = blocks.flatMap((block) => block.type === "text" ? [block.text] : []).join("");
      expect(text).toContain("The answers came on paper, one envelope at a time");
      expect(text).toContain("The maps were always becoming wrong");

      // GPT Image receives Fable's exact direction and the three eligible root plates.
      const image = imageRequests[0]!;
      expect(image.manifest.endpoint).toBe("/v1/images/edits");
      expect(image.manifest.orderedReferences).toHaveLength(3);
      expect(image.exactPrompt).toContain(canonicalJson(direction(1)));
      expect(image.exactPrompt).not.toContain("Page-1 opens.");

      const opened = await app.request("/api/reader/books/shape-of-time/folios/9/open", {
        method: "POST",
      });
      expect(opened.status).toBe(200);
      const openedBody = (await opened.json()) as {
        book: { folios: { id: string; ordinal: number; plate?: { src: string } }[] };
        currentFolioId: string;
      };
      expect(openedBody.currentFolioId).toBe("generated-9");
      expect(openedBody.book.folios).toHaveLength(9);
      const ninth = openedBody.book.folios.at(-1)!;
      expect(ninth.ordinal).toBe(9);
      expect(ninth.plate?.src).toMatch(/^\/api\/reader\/assets\//u);
      const asset = await app.request(ninth.plate!.src);
      expect(asset.status).toBe(200);
      expect((await asset.arrayBuffer()).byteLength).toBeGreaterThan(0);

      // Opening folio 9 starts exactly one likely preparation: folio 10, no second-next.
      await waitUntilReady(10);
      expect(proseRequests).toHaveLength(2);
      expect(imageRequests).toHaveLength(2);
    },
    60_000,
  );

  it("keeps unknown books and GET-only reads spend-free", async () => {
    const calls = proseRequests.length;
    expect((await app.request("/api/reader/books/not-a-book")).status).toBe(404);
    expect((await app.request("/api/reader/books/not-a-book/next")).status).toBe(404);
    expect(proseRequests).toHaveLength(calls);
  });

  it(
    "creates title and highlighted books only through explicit POSTs and exposes their first folios",
    async () => {
      const libraryBefore = await app.request("/api/reader/library");
      expect(libraryBefore.status).toBe(200);

      const title = await app.request("/api/reader/books", {
        body: JSON.stringify({ title: "Yesterday's safe route" }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      expect(title.status).toBe(202);
      const titleStarted = await title.json() as { creationId: string };
      let titleReady: { book?: { folios: { plate?: unknown }[]; title: string }; state: string } = {
        state: "preparing",
      };
      const titleDeadline = Date.now() + 10_000;
      while (Date.now() < titleDeadline && titleReady.state === "preparing") {
        await new Promise((resolve) => setTimeout(resolve, 20));
        titleReady = await (await app.request(
          `/api/reader/creations/${encodeURIComponent(titleStarted.creationId)}`,
        )).json() as typeof titleReady;
      }
      expect(titleReady.state).toBe("ready");
      expect(titleReady.book?.title).toBe("Yesterday's safe route");
      expect(titleReady.book?.folios).toHaveLength(1);
      expect(titleReady.book?.folios[0]?.plate).toBeUndefined();

      const root = await (await app.request("/api/reader/books/shape-of-time")).json() as {
        book: { folios: { blocks: { id: string; text: string }[]; id: string }[] };
      };
      const source = root.book.folios[0]!;
      const block = source.blocks[0]!;
      const quote = block.text.slice(0, 28);
      const selection = await app.request(
        `/api/reader/books/shape-of-time/folios/${encodeURIComponent(source.id)}/children`,
        {
          body: JSON.stringify({
            endBlockId: block.id,
            endOffset: 28,
            quote,
            startBlockId: block.id,
            startOffset: 0,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );
      expect(selection.status).toBe(202);
      const selectionStarted = await selection.json() as { creationId: string };
      let selectionReady: { book?: { folios: unknown[]; title: string }; state: string } = {
        state: "preparing",
      };
      const selectionDeadline = Date.now() + 10_000;
      while (Date.now() < selectionDeadline && selectionReady.state === "preparing") {
        await new Promise((resolve) => setTimeout(resolve, 20));
        selectionReady = await (await app.request(
          `/api/reader/creations/${encodeURIComponent(selectionStarted.creationId)}`,
        )).json() as typeof selectionReady;
      }
      expect(selectionReady.state).toBe("ready");
      expect(selectionReady.book?.title).toContain(quote);
      expect(selectionReady.book?.folios).toHaveLength(1);
      expect(plannerRequests.length).toBeGreaterThanOrEqual(2);
    },
    60_000,
  );
});
