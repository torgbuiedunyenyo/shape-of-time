import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Logger } from "pino";

import type { AssetStore } from "./assets/asset-store.js";
import type { JsonValue } from "./db/types.js";
import { digestJson, sha256 } from "./domain/digests.js";
import {
  enterChildBook,
  foundChildFromSelection,
  foundChildFromTitle,
} from "./generation/child-books.js";
import {
  generateNextFolio,
  type FolioGenerationDependencies,
} from "./generation/folio-generator.js";
import type { ImageProviderExecutor } from "./images/durable-image-dispatch.js";
import { NarrativeImageAdapter } from "./images/narrative-image-adapter.js";
import type {
  BookRecord,
  FolioRecord,
  LibraryRepository,
} from "./repositories/library-repository.js";
import type { FableProviderPort } from "./text/fable-contract.js";
import { executeFableAttempt } from "./text/fable-contract.js";
import {
  acceptPlannedMovement,
  compileMovementPlanningRequest,
  parseMovementBrief,
  type BookPhase,
} from "./text/movement-planner.js";

const STATIC_BOOK_IDS = new Set(["shape-of-time", "map-on-the-wall"]);
const DYNAMIC_MOVEMENT_LENGTH = 8;

const PLATE_SOURCES: Readonly<Record<string, string>> = {
  "map-terminal-wall":
    "assets/reader-first/8c5e8e19bf3a1786ed7b5cce480cb0744c6dc01496d9692d16282d7cb6611b79.webp",
  "root-band":
    "assets/reader-first/44a0ae4b9184ce76b41d1962e34db11cbab193d2f9b5ce6ad1297eb51461c9db.webp",
  "root-map":
    "assets/reader-first/09cffab12053f5fc91e2d4e8b61f216e7751e59465c90b1a1a6942f06c2cdf73.webp",
  "root-payment":
    "assets/reader-first/6f56ea3feafa7b2fca6b8c1266aebb9cccd700530f364f2aae7034d996c0d34f.webp",
};

const ROOT_MOVEMENT_ONE =
  "Jay and Tan move from the failed phone payment through courtship, an honest rupture, practical " +
  "questions about temporal travel, and Jay's informed yes. The movement rests on that decision.";
const ROOT_MOVEMENT_TWO =
  "Several days after Jay says yes, the company's requirements arrive. Jay carries his decision " +
  "through screening, sponsorship, documents, departure, the physical crossing, arrival, and his " +
  "first night at Tan's home coordinate. The movement turns personal dependence into institutional " +
  "fact and rests before the later disappearance movement begins.";
const MAP_MOVEMENT_ONE =
  "Eniola follows witnessed corrections rather than the expiring licensed chart, completes the " +
  "crossing, loses her ferry credential, and makes the conflicting evidence public on the terminal wall.";
const MAP_MOVEMENT_TWO =
  "With the public routes multiplying and disagreeing, Eniola and the crews must build a practical " +
  "way to test corrections without returning ownership to the company. The movement ends when one " +
  "route earns trust through shared use rather than authority alone.";

interface FixtureBlock {
  id: string;
  text: string;
}

interface FixtureFolio {
  apertures: unknown[];
  blocks: FixtureBlock[];
  id: string;
  layout: string;
  movementRest?: unknown;
  ordinal: number;
  plate?: {
    alt: string;
    assetKey: string;
    id: string;
    narrativeJob: string;
    proseWithholds: string;
  };
  title: string;
}

interface FixtureBook {
  description: string;
  folios: FixtureFolio[];
  id: string;
  subtitle: string;
  title: string;
}

interface ReaderFixture {
  books: FixtureBook[];
  version: number;
}

export interface ReaderApiBlock {
  id: string;
  text: string;
}

export interface ReaderApiFolio {
  apertures: unknown[];
  blocks: ReaderApiBlock[];
  id: string;
  layout: "image-led" | "plate" | "split" | "text";
  movementRest?: unknown;
  ordinal: number;
  plate?: {
    alt: string;
    assetKey: string;
    id: string;
    narrativeJob: string;
    proseWithholds: string;
    src: string;
  };
  title: string;
}

export interface ReaderApiBook {
  description: string;
  folios: ReaderApiFolio[];
  id: string;
  subtitle: string;
  title: string;
}

export type NextFolioStatus =
  | { ordinal: number; state: "preparing" }
  | { ordinal: number; state: "ready" }
  | { error: { code: string; message: string; retryable: boolean }; ordinal: number; state: "error" };

export type CreationStatus =
  | { creationId: string; state: "preparing" }
  | { book: ReaderApiBook; creationId: string; state: "ready" }
  | { creationId: string; error: { message: string }; state: "error" };

export interface SelectionCreationInput {
  endBlockId: string;
  endOffset: number;
  quote: string;
  startBlockId: string;
  startOffset: number;
}

export interface ReaderLibraryGeneration {
  imageExecutor: ImageProviderExecutor;
  prosePort: FableProviderPort;
  sources: { temporalRules: string; world: string };
}

function jsonObject(value: unknown): { [key: string]: JsonValue } {
  return JSON.parse(JSON.stringify(value)) as { [key: string]: JsonValue };
}

function nonemptyString(value: JsonValue | undefined): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export class ReaderLibraryService {
  readonly #assetStore: AssetStore;
  readonly #clientRoot: string;
  readonly #dependencies: FolioGenerationDependencies;
  readonly #generation: ReaderLibraryGeneration;
  readonly #inFlight = new Map<string, Promise<void>>();
  readonly #creationFailures = new Map<string, Error>();
  readonly #creationInFlight = new Map<string, Promise<void>>();
  readonly #creationResults = new Map<string, ReaderApiBook>();
  readonly #planningFailures = new Map<string, Error>();
  readonly #logger: Logger | undefined;
  readonly #repository: LibraryRepository;
  #fixture: ReaderFixture | null = null;
  #seedPromise: Promise<void> | null = null;

  constructor(options: {
    assetStore: AssetStore;
    clientRoot: string;
    generation: ReaderLibraryGeneration;
    logger?: Logger;
    repository: LibraryRepository;
  }) {
    this.#assetStore = options.assetStore;
    this.#clientRoot = path.resolve(options.clientRoot);
    this.#generation = options.generation;
    this.#logger = options.logger;
    this.#repository = options.repository;
    this.#dependencies = {
      assetStore: options.assetStore,
      imagePort: new NarrativeImageAdapter({
        assetStore: options.assetStore,
        executor: options.generation.imageExecutor,
      }),
      prosePort: options.generation.prosePort,
      repository: options.repository,
      sources: options.generation.sources,
    };
  }

  async getBook(readerBookId: string): Promise<ReaderApiBook | null> {
    const book = await this.#findBook(readerBookId);
    return book === null ? null : this.#serializeBook(book);
  }

  async listBooks(): Promise<ReaderApiBook[]> {
    await this.#ensureStaticSeed();
    const books = await this.#repository.listBooks();
    const visible = books.filter((book) => nonemptyString(book.origin["readerBookId"]) !== null ||
      book.origin["kind"] === "selection" || book.origin["kind"] === "title");
    return Promise.all(visible.map((book) => this.#serializeBook(book)));
  }

  async requestNext(readerBookId: string): Promise<NextFolioStatus> {
    const book = await this.#requireBook(readerBookId);
    const status = await this.#nextStatus(book);
    if (status.state === "ready" || status.state === "preparing") {
      if (status.state === "preparing") this.#start(book.id);
      return status;
    }
    if (status.state === "error" && status.error.retryable === false) return status;
    this.#planningFailures.delete(book.id);
    this.#start(book.id);
    return { ordinal: status.ordinal, state: "preparing" };
  }

  async readNextStatus(readerBookId: string): Promise<NextFolioStatus> {
    return this.#nextStatus(await this.#requireBook(readerBookId));
  }

  async openFolio(readerBookId: string, ordinal: number): Promise<{
    book: ReaderApiBook;
    currentFolioId: string;
  }> {
    const book = await this.#requireBook(readerBookId);
    const folios = await this.#repository.listFolios(book.id);
    let folio = folios.find((candidate) => candidate.ordinal === ordinal);
    if (folio === undefined) throw new Error("folio not found");
    if (folio.state === "ready") folio = await this.#repository.exposeFolio(folio.id);
    if (folio.state !== "exposed") throw new Error(`folio is ${folio.state}, not ready to open`);
    const serialized = await this.#serializeBook(book);
    const current = serialized.folios.find((candidate) => candidate.ordinal === ordinal);
    if (current === undefined) throw new Error("exposed folio did not enter the reader book");
    void this.requestNext(readerBookId).catch(() => undefined);
    return { book: serialized, currentFolioId: current.id };
  }

  async readAsset(assetId: string): Promise<{ bytes: Uint8Array; mediaType: string }> {
    const asset = await this.#repository.getAsset(assetId);
    const bytes = await this.#assetStore.get(asset.objectKey);
    if (sha256(bytes) !== asset.digest) throw new Error("asset failed digest verification");
    return { bytes, mediaType: asset.mediaType };
  }

  async requestSelectionChild(
    readerBookId: string,
    publicFolioId: string,
    input: SelectionCreationInput,
  ): Promise<CreationStatus> {
    const sourceBook = await this.#requireBook(readerBookId);
    const sourceFolio = await this.#findPublicFolio(sourceBook, publicFolioId);
    const serialized = this.#serializeFolio(readerBookId, sourceFolio);
    const startIndex = serialized.blocks.findIndex(({ id }) => id === input.startBlockId);
    const endIndex = serialized.blocks.findIndex(({ id }) => id === input.endBlockId);
    if (startIndex < 0 || endIndex < startIndex) throw new Error("selection blocks are invalid");
    const startBlock = serialized.blocks[startIndex]!;
    const endBlock = serialized.blocks[endIndex]!;
    if (
      input.startOffset < 0 || input.startOffset > startBlock.text.length ||
      input.endOffset < 0 || input.endOffset > endBlock.text.length
    ) {
      throw new Error("selection offsets are invalid");
    }
    const quote = serialized.blocks
      .slice(startIndex, endIndex + 1)
      .map((block, index, selected) => block.text.slice(
        index === 0 ? input.startOffset : 0,
        index === selected.length - 1 ? input.endOffset : block.text.length,
      ))
      .join("\n\n");
    if (quote !== input.quote) throw new Error("selection quote does not match its stable span");
    const startOffset = serialized.blocks
      .slice(0, startIndex)
      .reduce((sum, block) => sum + block.text.length + 2, 0) + input.startOffset;
    const endOffset = serialized.blocks
      .slice(0, endIndex)
      .reduce((sum, block) => sum + block.text.length + 2, 0) + input.endOffset;
    const creationId = `selection-${digestJson({
      endOffset,
      sourceFolioId: sourceFolio.id,
      startOffset,
    }).slice(0, 32)}`;
    this.#startCreation(creationId, async () => {
      const founded = await foundChildFromSelection(
        {
          plannerPort: this.#generation.prosePort,
          repository: this.#repository,
          sources: this.#generation.sources,
        },
        {
          confirmed: true,
          endOffset,
          selectedText: quote,
          sourceFolioId: sourceFolio.id,
          startOffset,
        },
      );
      await enterChildBook(this.#dependencies, {
        bookId: founded.book.id,
        workerId: "reader-selection-child",
      });
      const book = await this.#serializeBook(await this.#repository.getBook(founded.book.id));
      this.#creationResults.set(creationId, book);
      void this.requestNext(book.id).catch(() => undefined);
    });
    return this.readCreationStatus(creationId);
  }

  async requestTitleChild(titleIntent: string): Promise<CreationStatus> {
    const title = titleIntent.trim();
    if (title.length === 0) throw new Error("a title request needs a title");
    const creationId = `title-${digestJson({ title }).slice(0, 32)}`;
    this.#startCreation(creationId, async () => {
      const founded = await foundChildFromTitle(
        {
          plannerPort: this.#generation.prosePort,
          repository: this.#repository,
          sources: this.#generation.sources,
        },
        { confirmed: true, titleIntent: title },
      );
      await enterChildBook(this.#dependencies, {
        bookId: founded.book.id,
        workerId: "reader-title-child",
      });
      const book = await this.#serializeBook(await this.#repository.getBook(founded.book.id));
      this.#creationResults.set(creationId, book);
      void this.requestNext(book.id).catch(() => undefined);
    });
    return this.readCreationStatus(creationId);
  }

  readCreationStatus(creationId: string): CreationStatus {
    const book = this.#creationResults.get(creationId);
    if (book !== undefined) return { book, creationId, state: "ready" };
    const error = this.#creationFailures.get(creationId);
    if (error !== undefined) return { creationId, error: { message: error.message }, state: "error" };
    return { creationId, state: "preparing" };
  }

  async #fixtureDocument(): Promise<ReaderFixture> {
    if (this.#fixture !== null) return this.#fixture;
    const bytes = await readFile(path.resolve("content/reader-first/slice.json"), "utf8");
    this.#fixture = JSON.parse(bytes) as ReaderFixture;
    return this.#fixture;
  }

  async #findPublicFolio(book: BookRecord, publicFolioId: string): Promise<FolioRecord> {
    const folios = await this.#repository.listFolios(book.id);
    const match = folios.find((folio) => {
      const recorded = nonemptyString(folio.layout?.["publicFolioId"]);
      return recorded === publicFolioId || `generated-${folio.ordinal}` === publicFolioId;
    });
    if (match === undefined || match.state !== "exposed") throw new Error("source folio not found");
    return match;
  }

  #startCreation(creationId: string, work: () => Promise<void>): void {
    if (this.#creationResults.has(creationId) || this.#creationInFlight.has(creationId)) return;
    this.#creationFailures.delete(creationId);
    const task = work()
      .catch((error: unknown) => {
        this.#logger?.error({ creationId, err: error }, "background book creation failed");
        this.#creationFailures.set(
          creationId,
          error instanceof Error ? error : new Error(String(error)),
        );
      })
      .finally(() => {
        this.#creationInFlight.delete(creationId);
      });
    this.#creationInFlight.set(creationId, task);
  }

  async #requireBook(readerBookId: string): Promise<BookRecord> {
    if (STATIC_BOOK_IDS.has(readerBookId)) await this.#ensureStaticSeed();
    const book = await this.#findBook(readerBookId);
    if (book === null) throw new Error(`book not found: ${readerBookId}`);
    return book;
  }

  async #findBook(readerBookId: string): Promise<BookRecord | null> {
    if (STATIC_BOOK_IDS.has(readerBookId)) {
      return this.#repository.findBookByIdempotencyKey(`reader-seed:${readerBookId}:v1`);
    }
    try {
      return await this.#repository.getBook(readerBookId);
    } catch {
      return null;
    }
  }

  async #ensureStaticSeed(): Promise<void> {
    this.#seedPromise ??= this.#seedStaticLibrary();
    return this.#seedPromise;
  }

  async #seedStaticLibrary(): Promise<void> {
    const fixture = await this.#fixtureDocument();
    const books = new Map<string, BookRecord>();
    for (const source of fixture.books) {
      const isRoot = source.id === "shape-of-time";
      const reserved = await this.#repository.reserveBook({
        firstMovement: {
          brief: isRoot ? ROOT_MOVEMENT_ONE : MAP_MOVEMENT_ONE,
          id: "movement-01",
        },
        idempotencyKey: `reader-seed:${source.id}:v1`,
        origin: jsonObject({
          kind: isRoot ? "root" : "prepared-child",
          readerBookId: source.id,
          statement: isRoot
            ? "This is the root Shape of Time book, founded directly on the shared world and Jay and Tan story."
            : "Founded from the exact parent passage ‘The maps were always becoming wrong’; this is Eniola's independent Lagos book.",
          staticFolioCount: source.folios.length,
          subtitle: source.subtitle,
          description: source.description,
        }),
        title: source.title,
      });
      books.set(source.id, reserved.book);
      if (reserved.book.movementBriefs.length === 1) {
        await this.#repository.appendMovementBrief(reserved.book.id, {
          brief: isRoot ? ROOT_MOVEMENT_TWO : MAP_MOVEMENT_TWO,
          id: "movement-02",
        });
      }
    }

    for (const sourceBook of fixture.books) {
      const book = books.get(sourceBook.id);
      if (book === undefined) throw new Error(`seed book disappeared: ${sourceBook.id}`);
      for (const sourceFolio of sourceBook.folios) {
        const reservation = await this.#repository.reserveFolio({
          bookId: book.id,
          idempotencyKey: `reader-seed:${sourceBook.id}:${sourceFolio.id}:v1`,
          movementId: "movement-01",
          ordinal: sourceFolio.ordinal,
        });
        let folio = reservation.folio;
        if (folio.state === "exposed") continue;
        if (folio.state === "ready") {
          await this.#repository.exposeFolio(folio.id);
          continue;
        }
        if (folio.state !== "reserved") {
          throw new Error(`static seed folio ${sourceFolio.id} is unexpectedly ${folio.state}`);
        }
        const leaseToken = await this.#repository.claimFolioGeneration({
          attemptId: folio.generationAttemptId,
          leaseMilliseconds: 60_000,
          workerId: "reader-static-seed",
        });
        if (leaseToken === null) throw new Error(`could not claim static seed ${sourceFolio.id}`);

        let assetId: string | null = null;
        if (sourceFolio.plate !== undefined) {
          const relative = PLATE_SOURCES[sourceFolio.plate.assetKey];
          if (relative === undefined) throw new Error(`unknown static plate ${sourceFolio.plate.assetKey}`);
          let bytes: Uint8Array;
          try {
            bytes = await readFile(path.join(this.#clientRoot, relative));
          } catch {
            bytes = await readFile(path.resolve("public", relative));
          }
          assetId = (await this.#repository.storeAsset(this.#assetStore, {
            bytes,
            mediaType: "image/webp",
          })).id;
        }
        const layout = jsonObject({
          apertures: sourceFolio.apertures,
          blocks: sourceFolio.blocks,
          imageAltText: sourceFolio.plate?.alt ?? null,
          imageAssetId: assetId,
          layout: sourceFolio.layout,
          movementRest: sourceFolio.movementRest ?? null,
          plate: sourceFolio.plate ?? null,
          publicFolioId: sourceFolio.id,
          title: sourceFolio.title,
        });
        folio = await this.#repository.markFolioReady({
          apertures: [],
          evidence: {
            latencyMs: 0,
            providerRequestId: `static-seed:${sourceFolio.id}`,
            result: { source: "reader-first-fixture" },
            usage: { input_tokens: 0, output_tokens: 0 },
          },
          folioId: folio.id,
          layout,
          leaseToken,
          prose: sourceFolio.blocks.map(({ text }) => text).join("\n\n"),
          requiredAssetIds: assetId === null ? [] : [assetId],
        });
        await this.#repository.exposeFolio(folio.id);
      }
    }
  }

  async #nextStatus(book: BookRecord): Promise<NextFolioStatus> {
    const folios = await this.#repository.listFolios(book.id);
    const last = folios.at(-1);
    const ordinal = last === undefined || last.state === "exposed" ? (last?.ordinal ?? 0) + 1 : last.ordinal;
    if (last?.state === "ready") return { ordinal, state: "ready" };
    if (last?.state === "reserved" || last?.state === "generating" || this.#inFlight.has(book.id)) {
      return { ordinal, state: "preparing" };
    }
    if (last?.state === "failed") {
      const failure = await this.#repository.getAttemptFailure(last.id);
      return {
        error: {
          code: nonemptyString(failure?.["code"]) ?? "generation_failed",
          message: nonemptyString(failure?.["message"]) ?? "The next folio could not be prepared.",
          retryable: failure?.["retryable"] !== false,
        },
        ordinal,
        state: "error",
      };
    }
    const planningFailure = this.#planningFailures.get(book.id);
    if (planningFailure !== undefined) {
      return {
        error: { code: "planning_failed", message: planningFailure.message, retryable: true },
        ordinal,
        state: "error",
      };
    }
    return {
      error: { code: "not_started", message: "The next folio has not been prepared yet.", retryable: true },
      ordinal,
      state: "error",
    };
  }

  #start(bookId: string): void {
    if (this.#inFlight.has(bookId)) return;
    const task = this.#generateNext(bookId)
      .catch((error: unknown) => {
        // While a recorded folio failure exists, this error is invisible to every API response
        // (#nextStatus serves the ledger failure first) — the operator log is its only surface.
        this.#logger?.error({ bookId, err: error }, "background folio generation failed");
        this.#planningFailures.set(bookId, error instanceof Error ? error : new Error(String(error)));
      })
      .finally(() => {
        this.#inFlight.delete(bookId);
      });
    this.#inFlight.set(bookId, task);
  }

  async #generateNext(bookId: string): Promise<void> {
    const book = await this.#repository.getBook(bookId);
    const folios = await this.#repository.listFolios(book.id);
    const last = folios.at(-1);
    if (last?.state === "ready") return;
    const ordinal = last === undefined || last.state === "exposed" ? (last?.ordinal ?? 0) + 1 : last.ordinal;
    const movementId = await this.#movementForNext(book, folios);
    await generateNextFolio(this.#dependencies, {
      bookId: book.id,
      leaseMilliseconds: 45 * 60 * 1_000,
      movementId,
      ordinal,
      workerId: "reader-background-generation",
    });
  }

  async #movementForNext(book: BookRecord, folios: FolioRecord[]): Promise<string> {
    const freshBook = await this.#repository.getBook(book.id);
    const lastFolio = folios.at(-1);
    const lastPlanned = freshBook.movementBriefs.at(-1);
    if (lastPlanned === undefined) throw new Error("book has no movement brief");
    if (lastFolio === undefined || lastPlanned.id !== lastFolio.movementId) return lastPlanned.id;
    const currentCount = folios.filter((folio) => folio.movementId === lastPlanned.id).length;
    if (currentCount < DYNAMIC_MOVEMENT_LENGTH) return lastPlanned.id;

    const originStatement = nonemptyString(freshBook.origin["statement"]);
    if (originStatement === null) throw new Error("book origin has no founding statement");
    const isRoot = freshBook.origin["kind"] === "root";
    const phase: BookPhase = isRoot ? "root_pre_arc" : "child_later";
    const exposedTail = folios
      .filter((folio) => folio.state === "exposed")
      .slice(-2)
      .map((folio) => folio.prose ?? "")
      .join("\n\n");
    const planning = compileMovementPlanningRequest({
      bookOrigin: originStatement,
      completedMovements: freshBook.movementBriefs,
      exposedTail,
      phase,
      temporalRules: this.#generation.sources.temporalRules,
      world: this.#generation.sources.world,
    });
    const evidence = await executeFableAttempt(planning.request, this.#generation.prosePort);
    const id = `movement-${String(freshBook.movementBriefs.length + 1).padStart(2, "0")}`;
    const movement = acceptPlannedMovement({
      brief: parseMovementBrief(evidence.prose),
      completedMovements: freshBook.movementBriefs,
      newMovementId: id,
      phase,
    });
    await this.#repository.appendMovementBrief(freshBook.id, movement);
    return movement.id;
  }

  async #serializeBook(book: BookRecord): Promise<ReaderApiBook> {
    const folios = await this.#repository.listExposedFolios(book.id);
    const readerBookId = nonemptyString(book.origin["readerBookId"]) ?? book.id;
    return {
      description:
        nonemptyString(book.origin["description"]) ??
        "A book opened from another direction in the Shape of Time library.",
      folios: folios.map((folio) => this.#serializeFolio(readerBookId, folio)),
      id: readerBookId,
      subtitle:
        nonemptyString(book.origin["subtitle"]) ??
        (book.origin["kind"] === "title" ? "A requested volume" : "An adjacent volume"),
      title: book.title,
    };
  }

  #serializeFolio(readerBookId: string, folio: FolioRecord): ReaderApiFolio {
    const layout = folio.layout ?? {};
    const recordedBlocks = layout["blocks"];
    const blocks: ReaderApiBlock[] = Array.isArray(recordedBlocks)
      ? recordedBlocks.flatMap((entry) => {
          if (
            entry !== null &&
            typeof entry === "object" &&
            !Array.isArray(entry) &&
            typeof entry["id"] === "string" &&
            typeof entry["text"] === "string"
          ) {
            return [{ id: entry["id"], text: entry["text"] }];
          }
          return [];
        })
      : (folio.prose ?? "")
          .split(/\n\n+/u)
          .filter(Boolean)
          .map((text, index) => ({
            id: `generated-${folio.ordinal}-block-${String(index + 1).padStart(2, "0")}`,
            text,
          }));
    const publicFolioId = nonemptyString(layout["publicFolioId"]) ?? `generated-${folio.ordinal}`;
    const imageAssetId = nonemptyString(layout["imageAssetId"]);
    const imageAltText = nonemptyString(layout["imageAltText"]);
    const staticPlate =
      layout["plate"] !== null && typeof layout["plate"] === "object" && !Array.isArray(layout["plate"])
        ? layout["plate"]
        : null;
    const title =
      nonemptyString(layout["title"]) ??
      (readerBookId === "shape-of-time" && folio.ordinal === 9
        ? "The application"
        : readerBookId === "shape-of-time" && folio.ordinal === 10
          ? "Departure"
          : `Folio ${folio.ordinal}`);
    const sourceLayout = nonemptyString(layout["layout"]);
    const readerLayout =
      sourceLayout === "text" || sourceLayout === "split" || sourceLayout === "image-led" || sourceLayout === "plate"
        ? sourceLayout
        : imageAssetId === null ? "text" : "image-led";
    const result: ReaderApiFolio = {
      apertures: Array.isArray(layout["apertures"]) ? structuredClone(layout["apertures"]) : [],
      blocks,
      id: publicFolioId,
      layout: readerLayout,
      ordinal: folio.ordinal,
      title,
    };
    if (layout["movementRest"] !== null && layout["movementRest"] !== undefined) {
      result.movementRest = structuredClone(layout["movementRest"]);
    }
    if (imageAssetId !== null && imageAltText !== null) {
      result.plate = {
        alt: imageAltText,
        assetKey: imageAssetId,
        id:
          staticPlate !== null && typeof staticPlate["id"] === "string"
            ? staticPlate["id"]
            : `generated-plate-${folio.ordinal}`,
        narrativeJob:
          staticPlate !== null && typeof staticPlate["narrativeJob"] === "string"
            ? staticPlate["narrativeJob"]
            : "The plate carries material narrative evidence left outside the prose.",
        proseWithholds:
          staticPlate !== null && typeof staticPlate["proseWithholds"] === "string"
            ? staticPlate["proseWithholds"]
            : "The visible arrangement and material evidence.",
        src: `/api/reader/assets/${encodeURIComponent(imageAssetId)}`,
      };
    }
    return result;
  }
}
