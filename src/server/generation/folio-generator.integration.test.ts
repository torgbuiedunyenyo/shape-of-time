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
import { LibraryRepository, type BookRecord } from "../repositories/library-repository.js";
import type { FableRequestBody } from "../text/fable-contract.js";
import {
  folioGenerationKey,
  generateNextFolio,
  type FolioGenerationDependencies,
  type NarrativeImagePort,
} from "./folio-generator.js";

let container: StartedPostgreSqlContainer;
let database: Kysely<Database>;
let repository: LibraryRepository;
let assetRoot: string;
let assetStore: FilesystemAssetStore;

const WORLD = "Shape of Time world. One person exists once; every time keeps living.";
const RULES = "Temporal movement is physical travel along mapped currents.";
const PROSE_BODY = Array.from({ length: 140 }, (_, index) => `word${index}`).join(" ");

function imageDirection(label: string) {
  return {
    concreteScene: `${label}: a concrete scene with the people and material evidence in view.`,
    factLeftToImage: `${label}: the physical relationship the prose deliberately leaves visible.`,
    mustRemain: [`${label}: preserve established people and place.`],
    narrativeJob: `${label}: establish a new fact through the plate.`,
    purposefulChanges: [`${label}: show the situation after this folio's change.`],
    unresolvedFacts: [`${label}: do not invent anything the story leaves open.`],
  };
}

function requestText(body: FableRequestBody | undefined): string {
  return (body?.messages[0]?.content ?? [])
    .flatMap((block) => block.type === "text" ? [block.text] : [])
    .join("");
}

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18.4-alpine")
    .withDatabase("shape_of_time")
    .withUsername("shape_of_time")
    .withPassword("shape_of_time")
    .start();
  database = createDatabase(container.getConnectionUri());
  await migrateToLatest(database);
  repository = new LibraryRepository(database);
  assetRoot = await mkdtemp(path.join(tmpdir(), "shape-of-time-d3-assets-"));
  assetStore = new FilesystemAssetStore(assetRoot);
}, 120_000);

afterAll(async () => {
  await destroyDatabase(database);
  await container.stop();
  await rm(assetRoot, { force: true, recursive: true });
});

function countingProsePort(options: {
  failIndeterminateOnCall?: number;
  failOnCall?: number;
  label: string;
  textLed?: boolean;
}) {
  const requests: FableRequestBody[] = [];
  return {
    requests,
    count: (body: FableRequestBody) => {
      void body;
      return Promise.resolve({ input_tokens: 2_000 });
    },
    send: (body: FableRequestBody) => {
      requests.push(body);
      const call = requests.length;
      if (options.failIndeterminateOnCall === call) {
        return Promise.reject(new Error("connection ended after dispatch"));
      }
      if (options.failOnCall === call) {
        return Promise.resolve({
          content: [{ text: "half a folio", type: "text" }],
          id: `msg_${options.label}_${call}`,
          model: "claude-fable-5",
          stop_reason: "max_tokens",
          usage: { input_tokens: 2_000, output_tokens: 100 },
        });
      }
      return Promise.resolve({
        content: [
          {
            text: JSON.stringify({
              imageDirection: options.textLed ? null : imageDirection(`${options.label}-${call}`),
              proseParagraphs: [`${options.label} call ${call}. ${PROSE_BODY}`],
            }),
            type: "text",
          },
        ],
        id: `msg_${options.label}_${call}`,
        model: "claude-fable-5",
        stop_reason: "end_turn",
        usage: { input_tokens: 2_000, output_tokens: 320 },
      });
    },
  };
}

function countingImagePort(): NarrativeImagePort & { calls: number[] } {
  const calls: number[] = [];
  return {
    calls,
    generate: (input) => {
      calls.push(input.folioOrdinal);
      return Promise.resolve({
        altText: `Folio ${input.folioOrdinal} scene`,
        bytes: new TextEncoder().encode(`png-bytes-${input.contextDigest}-${input.folioOrdinal}`),
        mediaType: "image/png",
      });
    },
  };
}

function dependencies(
  prosePort: ReturnType<typeof countingProsePort>,
  imagePort: NarrativeImagePort,
): FolioGenerationDependencies {
  return { assetStore, imagePort, prosePort, repository, sources: { temporalRules: RULES, world: WORLD } };
}

async function createTestBook(title: string, statement: string): Promise<BookRecord> {
  return repository.createBook({
    firstMovement: { brief: "From the failed payment to Jay's calm yes.", id: "movement-01" },
    origin: { statement },
    title,
  });
}

describe("D3 pagewise generation on a real database", () => {
  it(
    "reserves exactly one folio, obtains prose and the required image, and exposes them in one atomic ready transition",
    async () => {
      const book = await createTestBook("Root D3", "This is the root book of the library.");
      const prosePort = countingProsePort({ label: "atomic" });
      const imagePort = countingImagePort();

      const { folio, spent } = await generateNextFolio(dependencies(prosePort, imagePort), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "worker-a",
      });

      expect(spent).toBe(true);
      expect(folio.state).toBe("ready");
      expect(folio.prose).toContain("atomic call 1.");
      expect(folio.requiredAssetIds).toHaveLength(1);
      expect(folio.layout?.["imageAssetId"]).toBe(folio.requiredAssetIds[0]);
      const evidence = await repository.getAttemptEvidence(folio.id);
      expect(evidence.providerRequestId).toBe("msg_atomic_1");
      expect(evidence.usage?.["output_tokens"]).toBe(320);
      expect(Number(evidence.latencyMs)).toBeGreaterThanOrEqual(0);

      const exposed = await repository.exposeFolio(folio.id);
      expect(exposed.state).toBe("exposed");
      expect(exposed.prose).toBe(folio.prose);
    },
    60_000,
  );

  it(
    "treats a Fable text-led result as a complete folio without buying a decorative image",
    async () => {
      const book = await createTestBook("Text-led D3", "This is the root book of the library.");
      const prosePort = countingProsePort({ label: "text-led", textLed: true });
      const imagePort = countingImagePort();
      const { folio } = await generateNextFolio(dependencies(prosePort, imagePort), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "worker-a",
      });

      expect(folio.state).toBe("ready");
      expect(folio.requiredAssetIds).toEqual([]);
      expect(folio.layout?.["kind"]).toBe("text-led");
      expect(imagePort.calls).toEqual([]);
    },
    60_000,
  );

  it(
    "spends once for duplicate requests: the same book/movement/ordinal never buys twice",
    async () => {
      const book = await createTestBook("Root dup", "This is the root book of the library.");
      const prosePort = countingProsePort({ label: "dup" });
      const imagePort = countingImagePort();
      const deps = dependencies(prosePort, imagePort);
      const request = { bookId: book.id, movementId: "movement-01", ordinal: 1, workerId: "worker-a" };

      const first = await generateNextFolio(deps, request);
      const second = await generateNextFolio(deps, { ...request, workerId: "worker-b" });

      expect(first.spent).toBe(true);
      expect(second.spent).toBe(false);
      expect(second.folio.id).toBe(first.folio.id);
      expect(prosePort.requests).toHaveLength(1);
      expect(imagePort.calls).toHaveLength(1);
      expect(
        folioGenerationKey({ bookId: book.id, movementId: "movement-01", ordinal: 1 }),
      ).toContain(book.id);
    },
    60_000,
  );

  it(
    "resumes safely after a crash: an expired lease is reclaimed and the folio completes",
    async () => {
      const book = await createTestBook("Root crash", "This is the root book of the library.");
      const key = folioGenerationKey({ bookId: book.id, movementId: "movement-01", ordinal: 1 });
      const reservation = await repository.reserveFolio({
        bookId: book.id,
        idempotencyKey: key,
        movementId: "movement-01",
        ordinal: 1,
      });
      // A worker claims and then crashes: the lease exists, expires, and nothing else happens.
      const dead = await repository.claimFolioGeneration({
        attemptId: reservation.folio.generationAttemptId,
        leaseMilliseconds: 1,
        workerId: "worker-dead",
      });
      expect(dead).not.toBeNull();
      await new Promise((resolve) => setTimeout(resolve, 50));

      const prosePort = countingProsePort({ label: "resume" });
      const { folio, spent } = await generateNextFolio(dependencies(prosePort, countingImagePort()), {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "worker-b",
      });
      expect(spent).toBe(true);
      expect(folio.state).toBe("ready");
    },
    60_000,
  );

  it(
    "records a named failure, retries only from that failure, and the successor attempt succeeds",
    async () => {
      const book = await createTestBook("Root retry", "This is the root book of the library.");
      const prosePort = countingProsePort({ failOnCall: 1, label: "retry" });
      const deps = dependencies(prosePort, countingImagePort());
      const request = { bookId: book.id, movementId: "movement-01", ordinal: 1, workerId: "worker-a" };

      await expect(generateNextFolio(deps, request)).rejects.toThrow(/max_tokens|truncated/i);
      const failed = await repository.getFolio(
        (await repository.reserveFolio({ ...request, idempotencyKey: folioGenerationKey(request) })).folio.id,
      );
      expect(failed.state).toBe("failed");

      const retried = await generateNextFolio(deps, request);
      expect(retried.spent).toBe(true);
      expect(retried.folio.state).toBe("ready");
      expect(retried.folio.prose).toContain("retry call 2.");
      // A new attempt was minted for the retry; the folio still occupies the same ordinal once.
      expect(retried.folio.generationAttemptId).not.toBe(failed.generationAttemptId);
    },
    60_000,
  );

  it(
    "records the provider's cause detail when the official count fails",
    async () => {
      const book = await createTestBook("Root count-fail", "This is the root book of the library.");
      const prosePort = countingProsePort({ label: "count-fail" });
      const failingCount = {
        ...prosePort,
        count: () =>
          Promise.reject(
            new Error("Anthropic /v1/messages/count_tokens answered 400: maxItems is not supported"),
          ),
      };
      const deps = dependencies(failingCount, countingImagePort());
      const request = { bookId: book.id, movementId: "movement-01", ordinal: 1, workerId: "worker-a" };

      await expect(generateNextFolio(deps, request)).rejects.toMatchObject({ code: "count_failed" });
      const folio = (
        await repository.reserveFolio({ ...request, idempotencyKey: folioGenerationKey(request) })
      ).folio;
      const failure = await repository.getAttemptFailure(folio.id);
      expect(failure?.["code"]).toBe("count_failed");
      // The contract error's message is deliberately generic; the ledger must keep the cause,
      // or a production count failure is undiagnosable from the database.
      expect(String(failure?.["detail"])).toContain("answered 400");
    },
    60_000,
  );

  it(
    "never resends an indeterminate Fable dispatch",
    async () => {
      const book = await createTestBook("Root ambiguous", "This is the root book of the library.");
      const prosePort = countingProsePort({ failIndeterminateOnCall: 1, label: "ambiguous" });
      const deps = dependencies(prosePort, countingImagePort());
      const request = {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "worker-a",
      };

      await expect(generateNextFolio(deps, request)).rejects.toMatchObject({
        code: "dispatch_indeterminate",
      });
      const second = await generateNextFolio(deps, request);
      expect(second.spent).toBe(false);
      expect(second.folio.state).toBe("failed");
      expect(prosePort.requests).toHaveLength(1);
    },
    60_000,
  );

  it(
    "keeps siblings isolated: a child book's request never carries another child's prose",
    async () => {
      const parent = await createTestBook("Parent", "This is the root book of the library.");
      void parent;
      const childA = await createTestBook(
        "Child A",
        "Founded from the passage: 'the till drawer full of unfamiliar coin'.",
      );
      const childB = await createTestBook(
        "Child B",
        "Founded from the passage: 'the ferry lights crossing the estuary'.",
      );

      // Child B has exposed history containing a distinctive sentinel.
      const portB = countingProsePort({ label: "SIBLING-B-SENTINEL" });
      const generatedB = await generateNextFolio(dependencies(portB, countingImagePort()), {
        bookId: childB.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "worker-b",
      });
      await repository.exposeFolio(generatedB.folio.id);

      const portA = countingProsePort({ label: "child-a" });
      const generatedA = await generateNextFolio(dependencies(portA, countingImagePort()), {
        bookId: childA.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "worker-a",
      });
      expect(generatedA.folio.state).toBe("ready");
      const childRequest = requestText(portA.requests[0]);
      expect(childRequest).toContain("the till drawer full of unfamiliar coin");
      expect(childRequest).not.toContain("SIBLING-B-SENTINEL");
      expect(childRequest).not.toContain("the ferry lights crossing the estuary");
    },
    60_000,
  );

  it(
    "carries a book across a movement boundary without replaying exposed folios",
    async () => {
      const book = await createTestBook("Root boundary", "This is the root book of the library.");
      const prosePort = countingProsePort({ label: "boundary" });
      const deps = dependencies(prosePort, countingImagePort());
      const first = await generateNextFolio(deps, {
        bookId: book.id,
        movementId: "movement-01",
        ordinal: 1,
        workerId: "worker-a",
      });
      await repository.exposeFolio(first.folio.id);

      await repository.appendMovementBrief(book.id, {
        brief: "The journey to Tan's time, from departure to first arrival.",
        id: "movement-02",
      });
      const second = await generateNextFolio(deps, {
        bookId: book.id,
        movementId: "movement-02",
        ordinal: 2,
        workerId: "worker-a",
      });
      expect(second.folio.state).toBe("ready");
      const secondRequest = requestText(prosePort.requests[1]);
      // The new movement's request sees the exposed folio once as history and the new brief once.
      expect(secondRequest.split("boundary call 1.").length - 1).toBe(1);
      expect(secondRequest).toContain("The journey to Tan's time");
      // Replaying the completed movement id is refused at the ledger.
      await expect(
        repository.appendMovementBrief(book.id, { brief: "again", id: "movement-01" }),
      ).rejects.toThrow(/already exists/i);
    },
    60_000,
  );
});
