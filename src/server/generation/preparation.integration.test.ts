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
import {
  measurePreparationEconomy,
  prepareOnExposure,
  prepareSuggestedAperture,
} from "./preparation.js";

let container: StartedPostgreSqlContainer;
let database: Kysely<Database>;
let repository: LibraryRepository;
let assetRoot: string;
let assetStore: FilesystemAssetStore;

const WORLD = "Shape of Time world. One person exists once; every time keeps living.";
const RULES = "Temporal movement is physical travel along mapped currents.";
const PROSE_BODY = Array.from({ length: 140 }, (_, index) => `prepword${index}`).join(" ");

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18.4-alpine")
    .withDatabase("shape_of_time")
    .withUsername("shape_of_time")
    .withPassword("shape_of_time")
    .start();
  database = createDatabase(container.getConnectionUri());
  await migrateToLatest(database);
  repository = new LibraryRepository(database);
  assetRoot = await mkdtemp(path.join(tmpdir(), "shape-of-time-d5-assets-"));
  assetStore = new FilesystemAssetStore(assetRoot);
}, 120_000);

afterAll(async () => {
  await destroyDatabase(database);
  await container.stop();
  await rm(assetRoot, { force: true, recursive: true });
});

function countingProsePort(options: { failOrdinals?: number[] } = {}) {
  const requests: FableRequestBody[] = [];
  let calls = 0;
  return {
    requests,
    count: (body: FableRequestBody) => {
      void body;
      return Promise.resolve({ input_tokens: 2_000 });
    },
    send: (body: FableRequestBody) => {
      requests.push(body);
      calls += 1;
      const text = body.messages[0]?.content[0]?.text ?? "";
      const wanted = /This is folio (\d+)/.exec(text);
      const ordinal = wanted === null ? 0 : Number(wanted[1]);
      if ((options.failOrdinals ?? []).includes(ordinal)) {
        return Promise.resolve({
          content: [{ text: "half", type: "text" }],
          id: `msg_prep_${calls}`,
          model: "claude-fable-5",
          stop_reason: "max_tokens",
          usage: { input_tokens: 2_000, output_tokens: 10 },
        });
      }
      return Promise.resolve({
        content: [
          { text: `<folio_prose>Prepared ordinal ${ordinal}. ${PROSE_BODY}</folio_prose>`, type: "text" },
        ],
        id: `msg_prep_${calls}`,
        model: "claude-fable-5",
        stop_reason: "end_turn",
        usage: { input_tokens: 2_000, output_tokens: 300 },
      });
    },
  };
}

const imagePort: NarrativeImagePort = {
  generate: (input) =>
    Promise.resolve({
      altText: `Folio ${input.folioOrdinal} scene`,
      bytes: new TextEncoder().encode(`png-${input.contextDigest}-${input.folioOrdinal}`),
      mediaType: "image/png",
    }),
};

async function makeBook(title: string) {
  return repository.createBook({
    firstMovement: { brief: "From the failed payment to Jay's calm yes.", id: "movement-01" },
    origin: { statement: "This is the root book of the library." },
    title,
  });
}

function deps(prosePort: ReturnType<typeof countingProsePort>) {
  return { assetStore, imagePort, prosePort, repository, sources: { temporalRules: RULES, world: WORLD } };
}

describe("D5 preparation during reading time", () => {
  it(
    "on exposure durably prepares next and second-next, and the reader's turn is a cache hit",
    async () => {
      const book = await makeBook("Prep root");
      const port = countingProsePort();
      const first = await generateNextFolio(deps(port), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "reader",
      });
      await repository.exposeFolio(first.folio.id);

      const prepared = await prepareOnExposure(deps(port), {
        bookId: book.id,
        budget: { horizon: 2, maxConcurrentPreparations: 2 },
        exposedOrdinal: 1,
        movementId: "movement-01",
        workerId: "prep-worker",
      });
      expect(prepared.prepared.map((entry) => entry.ordinal).sort()).toEqual([2, 3]);

      // The reader turns the page: same idempotency namespace, so the turn buys nothing.
      const callsBeforeTurn = port.requests.length;
      const turn = await generateNextFolio(deps(port), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 2,
        workerId: "reader",
      });
      expect(turn.spent).toBe(false);
      expect(turn.folio.state).toBe("ready");
      expect(port.requests.length).toBe(callsBeforeTurn);
    },
    60_000,
  );

  it(
    "makes duplicate spend impossible under concurrent exposure events",
    async () => {
      const book = await makeBook("Prep concurrent");
      const port = countingProsePort();
      const first = await generateNextFolio(deps(port), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "reader",
      });
      await repository.exposeFolio(first.folio.id);
      const callsBefore = port.requests.length;

      const input = {
        bookId: book.id,
        budget: { horizon: 2, maxConcurrentPreparations: 2 },
        exposedOrdinal: 1,
        movementId: "movement-01",
      };
      const [a, b] = await Promise.all([
        prepareOnExposure(deps(port), { ...input, workerId: "prep-a" }),
        prepareOnExposure(deps(port), { ...input, workerId: "prep-b" }),
      ]);
      // Two ordinals were needed; exactly two generations happened across both preparers.
      expect(port.requests.length - callsBefore).toBe(2);
      const spentOrdinals = [...a.prepared, ...b.prepared]
        .filter((entry) => entry.spent)
        .map((entry) => entry.ordinal)
        .sort();
      expect(spentOrdinals).toEqual([2, 3]);
    },
    60_000,
  );

  it(
    "leaves navigation honest when preparation fails: the folio is failed, not fake-ready, and retry works",
    async () => {
      const book = await makeBook("Prep failure");
      const port = countingProsePort({ failOrdinals: [2] });
      const first = await generateNextFolio(deps(port), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "reader",
      });
      await repository.exposeFolio(first.folio.id);

      const prepared = await prepareOnExposure(deps(port), {
        bookId: book.id,
        budget: { horizon: 2, maxConcurrentPreparations: 2 },
        exposedOrdinal: 1,
        movementId: "movement-01",
        workerId: "prep-worker",
      });
      const failed = prepared.failed.find((entry) => entry.ordinal === 2);
      expect(failed?.code).toBe("truncated");
      // The ledger says failed — nothing pretends the page exists.
      const reservation = await repository.reserveFolio({
        bookId: book.id,
        idempotencyKey: `generate:${book.id}:movement-01:2`,
        movementId: "movement-01",
        ordinal: 2,
      });
      expect(reservation.folio.state).toBe("failed");
      // An explicit later attempt retries from the named failure and succeeds.
      const retryPort = countingProsePort();
      const retried = await generateNextFolio(deps(retryPort), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 2,
        workerId: "reader",
      });
      expect(retried.folio.state).toBe("ready");
    },
    60_000,
  );

  it(
    "prepares a visible suggested aperture's target book to its first ready folio, idempotently",
    async () => {
      const child = await repository.createBook({
        firstMovement: { brief: "A book about the till drawer's travels.", id: "movement-01" },
        origin: { statement: "Founded from the passage: 'the till drawer full of unfamiliar coin'." },
        title: "The Till Drawer",
      });
      const port = countingProsePort();

      const result = await prepareSuggestedAperture(deps(port), {
        targetBookId: child.id,
        workerId: "prep-worker",
      });
      expect(result.folio.state).toBe("ready");
      expect(result.folio.bookId).toBe(child.id);
      // The child's request grew from its own founding premise, not any parent page.
      const childRequest = port.requests.at(-1)?.messages[0]?.content[0]?.text ?? "";
      expect(childRequest).toContain("till drawer full of unfamiliar coin");

      // A second visibility event buys nothing.
      const callsBefore = port.requests.length;
      const again = await prepareSuggestedAperture(deps(port), {
        targetBookId: child.id,
        workerId: "prep-worker",
      });
      expect(again.spent).toBe(false);
      expect(port.requests.length).toBe(callsBefore);
    },
    60_000,
  );

  it(
    "measures prepared-hit rate and waste from the ledger alone",
    async () => {
      const book = await makeBook("Prep economy");
      const port = countingProsePort();
      const first = await generateNextFolio(deps(port), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "reader",
      });
      await repository.exposeFolio(first.folio.id);
      await prepareOnExposure(deps(port), {
        bookId: book.id,
        budget: { horizon: 2, maxConcurrentPreparations: 2 },
        exposedOrdinal: 1,
        movementId: "movement-01",
        workerId: "prep-worker",
      });
      // The reader reaches folio 2 (hit) and never reaches folio 3 (waste, so far).
      const turn = await generateNextFolio(deps(port), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 2,
        workerId: "reader",
      });
      await repository.exposeFolio(turn.folio.id);

      const economy = await measurePreparationEconomy(repository, book.id);
      expect(economy.readyOrExposed).toBeGreaterThanOrEqual(3);
      expect(economy.exposed).toBe(2);
      expect(economy.preparedUnread).toBe(1);
      expect(economy.latenciesMs.every((value) => value >= 0)).toBe(true);
    },
    60_000,
  );
});
