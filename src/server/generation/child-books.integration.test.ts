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
  enterChildBook,
  foundChildFromSelection,
  foundChildFromTitle,
} from "./child-books.js";

let container: StartedPostgreSqlContainer;
let database: Kysely<Database>;
let repository: LibraryRepository;
let assetRoot: string;
let assetStore: FilesystemAssetStore;

const WORLD = "Shape of Time world. One person exists once; every time keeps living.";
const RULES = "Temporal movement is physical travel along mapped currents.";
const PROSE_BODY = Array.from({ length: 140 }, (_, index) => `childword${index}`).join(" ");
const ROOT_BRIEF = "From the failed payment to Jay's calm yes.";

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18.4-alpine")
    .withDatabase("shape_of_time")
    .withUsername("shape_of_time")
    .withPassword("shape_of_time")
    .start();
  database = createDatabase(container.getConnectionUri());
  await migrateToLatest(database);
  repository = new LibraryRepository(database);
  assetRoot = await mkdtemp(path.join(tmpdir(), "shape-of-time-d6-assets-"));
  assetStore = new FilesystemAssetStore(assetRoot);
}, 120_000);

afterAll(async () => {
  await destroyDatabase(database);
  await container.stop();
  await rm(assetRoot, { force: true, recursive: true });
});

function prosePort(label: string) {
  const requests: FableRequestBody[] = [];
  return {
    requests,
    count: (body: FableRequestBody) => {
      void body;
      return Promise.resolve({ input_tokens: 2_000 });
    },
    send: (body: FableRequestBody) => {
      requests.push(body);
      return Promise.resolve({
        content: [
          {
            text: `<folio_prose>${label} call ${requests.length}. ${PROSE_BODY}</folio_prose>`,
            type: "text",
          },
        ],
        id: `msg_${label}_${requests.length}`,
        model: "claude-fable-5",
        stop_reason: "end_turn",
        usage: { input_tokens: 2_000, output_tokens: 300 },
      });
    },
  };
}

function plannerPort(brief: string) {
  const requests: FableRequestBody[] = [];
  return {
    requests,
    count: (body: FableRequestBody) => {
      void body;
      return Promise.resolve({ input_tokens: 3_000 });
    },
    send: (body: FableRequestBody) => {
      requests.push(body);
      return Promise.resolve({
        content: [{ text: `<movement_brief>${brief}</movement_brief>`, type: "text" }],
        id: `msg_plan_${requests.length}`,
        model: "claude-fable-5",
        stop_reason: "end_turn",
        usage: { input_tokens: 3_000, output_tokens: 120 },
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

function deps(port: ReturnType<typeof prosePort>) {
  return { assetStore, imagePort, prosePort: port, repository, sources: { temporalRules: RULES, world: WORLD } };
}

async function exposedRootFolio(title: string) {
  const root = await repository.createBook({
    firstMovement: { brief: ROOT_BRIEF, id: "movement-01" },
    origin: { ancestry: [], statement: "This is the root book of the library." },
    title,
  });
  const port = prosePort(`root-${title.replaceAll(/\s+/g, "-")}`);
  const generated = await generateNextFolio(deps(port), {
    bookId: root.id,
    movementId: "movement-01",
    ordinal: 1,
    workerId: "reader",
  });
  const folio = await repository.exposeFolio(generated.folio.id);
  return { folio, root };
}

describe("D6 dynamic highlight and explicit title creation", () => {
  it(
    "founds a child from an exact selection: source span, ancestry, independent premise, atomic entry",
    async () => {
      const { folio, root } = await exposedRootFolio("Selection source");
      const prose = folio.prose ?? "";
      const selectedText = prose.slice(10, 42);
      const planner = plannerPort(
        "The coin's journey backward through the till, from minting to Jay's drawer.",
      );

      const founded = await foundChildFromSelection(
        { plannerPort: planner, repository, sources: { temporalRules: RULES, world: WORLD } },
        {
          confirmed: true,
          endOffset: 42,
          selectedText,
          sourceFolioId: folio.id,
          startOffset: 10,
        },
      );

      // The founding span and navigation ancestry are persisted exactly.
      const child = await repository.getBook(founded.book.id);
      expect(child.origin["foundingPassage"]).toBe(selectedText);
      expect(child.origin["sourceFolioId"]).toBe(folio.id);
      expect(child.origin["ancestry"]).toEqual([root.id]);
      expect(child.origin["kind"]).toBe("selection");
      // The planner ran exactly once, in the child_first phase, and its brief is the book's first
      // movement — an independent premise, not the root brief.
      expect(planner.requests).toHaveLength(1);
      expect(planner.requests[0]?.messages[0]?.content[0]?.text ?? "").toContain(
        "founding premise",
      );
      expect(child.movementBriefs[0]?.brief).toContain("coin's journey backward");
      expect(child.movementBriefs[0]?.brief).not.toBe(ROOT_BRIEF);
      // A selection aperture row binds the child to its exact source text.
      const apertures = await repository.listSelectionApertures(folio.id);
      expect(apertures).toHaveLength(1);
      expect(apertures[0]?.targetBookId).toBe(child.id);
      expect(apertures[0]?.sourceText).toBe(selectedText);

      // Entry happens only when the first folio is atomically ready, and the child's request
      // grows from its own premise (never the parent's pages: no root-plot recasting).
      const childPort = prosePort("child-entry");
      const entered = await enterChildBook(deps(childPort), {
        bookId: child.id,
        workerId: "reader",
      });
      expect(entered.folio.state).toBe("exposed");
      expect(entered.folio.ordinal).toBe(1);
      const request = childPort.requests[0]?.messages[0]?.content[0]?.text ?? "";
      expect(request).toContain(selectedText);
      expect(request).toContain("coin's journey backward");
      expect(request).not.toContain(ROOT_BRIEF);
    },
    60_000,
  );

  it(
    "never duplicates a child: the same confirmed selection founds one book and plans once",
    async () => {
      const { folio } = await exposedRootFolio("Selection dup");
      const prose = folio.prose ?? "";
      const planner = plannerPort("One coin, one drawer, one afternoon.");
      const input = {
        confirmed: true as const,
        endOffset: 30,
        selectedText: prose.slice(5, 30),
        sourceFolioId: folio.id,
        startOffset: 5,
      };
      const environment = { plannerPort: planner, repository, sources: { temporalRules: RULES, world: WORLD } };

      const first = await foundChildFromSelection(environment, input);
      const second = await foundChildFromSelection(environment, input);
      expect(second.book.id).toBe(first.book.id);
      expect(second.created).toBe(false);
      expect(planner.requests).toHaveLength(1);
      const apertures = await repository.listSelectionApertures(folio.id);
      expect(apertures).toHaveLength(1);
    },
    60_000,
  );

  it(
    "refuses a selection that does not reproduce the source text, and refuses unconfirmed creation",
    async () => {
      const { folio } = await exposedRootFolio("Selection refusals");
      const planner = plannerPort("Never used.");
      const environment = { plannerPort: planner, repository, sources: { temporalRules: RULES, world: WORLD } };

      await expect(
        foundChildFromSelection(environment, {
          confirmed: true,
          endOffset: 30,
          selectedText: "text that is not at those offsets",
          sourceFolioId: folio.id,
          startOffset: 5,
        }),
      ).rejects.toThrow(/source text|offsets/i);

      await expect(
        foundChildFromSelection(environment, {
          confirmed: false,
          endOffset: 30,
          selectedText: (folio.prose ?? "").slice(5, 30),
          sourceFolioId: folio.id,
          startOffset: 5,
        }),
      ).rejects.toThrow(/confirm/i);
      expect(planner.requests).toHaveLength(0);
    },
    60_000,
  );

  it(
    "keeps title creation a distinct, idempotent path with its own origin",
    async () => {
      const planner = plannerPort("A survey of the mapped currents, told by the surveyors.");
      const environment = { plannerPort: planner, repository, sources: { temporalRules: RULES, world: WORLD } };

      const first = await foundChildFromTitle(environment, {
        confirmed: true,
        titleIntent: "The Current Atlas",
      });
      const second = await foundChildFromTitle(environment, {
        confirmed: true,
        titleIntent: "The Current Atlas",
      });
      expect(second.book.id).toBe(first.book.id);
      expect(planner.requests).toHaveLength(1);
      const book = await repository.getBook(first.book.id);
      expect(book.origin["kind"]).toBe("title");
      expect(book.origin["titleIntent"]).toBe("The Current Atlas");
      expect(book.origin["foundingPassage"]).toBeUndefined();
      expect(book.title).toBe("The Current Atlas");

      await expect(
        foundChildFromTitle(environment, { confirmed: false, titleIntent: "Another Book" }),
      ).rejects.toThrow(/confirm/i);
    },
    60_000,
  );
});
