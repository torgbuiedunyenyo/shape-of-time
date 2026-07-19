import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { Kysely } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { FilesystemAssetStore } from "../assets/filesystem-asset-store.js";
import { createDatabase, destroyDatabase } from "../db/database.js";
import { migrateToLatest } from "../db/migrate.js";
import type { Database } from "../db/types.js";
import { LibraryRepository } from "../repositories/library-repository.js";
import type { FableRequestBody } from "../text/fable-contract.js";
import { generateNextFolio, type NarrativeImagePort } from "./folio-generator.js";
import { reconstructFolioProvenance } from "./provenance.js";

let container: StartedPostgreSqlContainer;
let database: Kysely<Database>;
let repository: LibraryRepository;
let assetRoot: string;
let assetStore: FilesystemAssetStore;

const WORLD = "Shape of Time world. One person exists once; every time keeps living.";
const RULES = "Temporal movement is physical travel along mapped currents.";
const PROSE_BODY = Array.from({ length: 140 }, (_, index) => `provword${index}`).join(" ");

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18.4-alpine")
    .withDatabase("shape_of_time")
    .withUsername("shape_of_time")
    .withPassword("shape_of_time")
    .start();
  database = createDatabase(container.getConnectionUri());
  await migrateToLatest(database);
  repository = new LibraryRepository(database);
  assetRoot = await mkdtemp(path.join(tmpdir(), "shape-of-time-d4-assets-"));
  assetStore = new FilesystemAssetStore(assetRoot);
}, 120_000);

afterAll(async () => {
  await destroyDatabase(database);
  await container.stop();
  await rm(assetRoot, { force: true, recursive: true });
});

function prosePort(label: string) {
  return {
    count: (body: FableRequestBody) => {
      void body;
      return Promise.resolve({ input_tokens: 2_000 });
    },
    send: (body: FableRequestBody) => {
      void body;
      return Promise.resolve({
        content: [{ text: `<folio_prose>${label}. ${PROSE_BODY}</folio_prose>`, type: "text" }],
        id: `msg_${label}`,
        model: "claude-fable-5",
        stop_reason: "end_turn",
        usage: { input_tokens: 2_000, output_tokens: 320 },
      });
    },
  };
}

const imagePort: NarrativeImagePort = {
  generate: (input) =>
    Promise.resolve({
      altText: `Folio ${input.folioOrdinal} scene`,
      bytes: new TextEncoder().encode(`png-${input.contextDigest}`),
      mediaType: "image/png",
    }),
};

describe("D4 dormant provenance seam", () => {
  it(
    "reconstructs the full derivation of a generated folio from primary records only, digests verified",
    async () => {
      const book = await repository.createBook({
        firstMovement: { brief: "From the failed payment to Jay's calm yes.", id: "movement-01" },
        origin: { statement: "This is the root book of the library." },
        title: "Provenance root",
      });
      const first = await generateNextFolio(
        { assetStore, imagePort, prosePort: prosePort("prov-1"), repository, sources: { temporalRules: RULES, world: WORLD } },
        { bookId: book.id, movementId: "movement-01", ordinal: 1, workerId: "worker-a" },
      );
      await repository.exposeFolio(first.folio.id);
      const second = await generateNextFolio(
        { assetStore, imagePort, prosePort: prosePort("prov-2"), repository, sources: { temporalRules: RULES, world: WORLD } },
        { bookId: book.id, movementId: "movement-01", ordinal: 2, workerId: "worker-a" },
      );

      const provenance = await reconstructFolioProvenance(
        { assetStore, repository },
        second.folio.id,
      );

      expect(provenance.verified).toBe(true);
      expect(provenance.folio.proseDigestVerified).toBe(true);
      expect(provenance.image.digestVerified).toBe(true);
      expect(provenance.context.contextDigest).toBeTruthy();
      expect(provenance.context.sourceDigests["WORLD_DOCUMENT"]).toBeTruthy();
      expect(provenance.context.sourceDigests["template"]).toBeTruthy();
      // The prior exposed folio is recorded as an exact span: id + ordinal + prose digest.
      expect(provenance.priorFolios).toHaveLength(1);
      expect(provenance.priorFolios[0]?.folioId).toBe(first.folio.id);
      expect(provenance.priorFolios[0]?.proseDigestVerified).toBe(true);
      // Lineage and usage come from the attempt row, not from any derived artifact.
      expect(provenance.attempt.providerRequestId).toBe("msg_prov-2");
      expect(provenance.attempt.usage["output_tokens"]).toBe(320);
      // Dormant slots are named, not silently absent.
      expect(provenance.dormant.visualProfile).toBeNull();
      expect(provenance.dormant.reason).toMatch(/not yet/i);
    },
    60_000,
  );

  it(
    "refuses to bless prose that has no generation lineage: nothing is silently promoted to canon",
    async () => {
      const book = await repository.createBook({
        firstMovement: { brief: "From the failed payment to Jay's calm yes.", id: "movement-01" },
        origin: { statement: "This is the root book of the library." },
        title: "Provenance orphan",
      });
      // A folio pushed to ready through the raw ledger, with no provenance evidence recorded.
      const { folio } = await repository.reserveFolio({
        bookId: book.id,
        idempotencyKey: `orphan:${book.id}`,
        movementId: "movement-01",
        ordinal: 1,
      });
      const lease = await repository.claimFolioGeneration({
        attemptId: folio.generationAttemptId,
        leaseMilliseconds: 60_000,
        workerId: "worker-raw",
      });
      await repository.markFolioReady({
        apertures: [],
        folioId: folio.id,
        layout: { ordinal: 1 },
        leaseToken: lease!,
        prose: "Prose from nowhere.",
        requiredAssetIds: [],
      });

      await expect(
        reconstructFolioProvenance({ assetStore, repository }, folio.id),
      ).rejects.toThrow(/lineage|provenance/i);
    },
    60_000,
  );
});
