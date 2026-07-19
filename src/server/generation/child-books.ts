import type { JsonValue } from "../db/types.js";
import { digestJson } from "../domain/digests.js";
import type { BookRecord, FolioRecord, LibraryRepository } from "../repositories/library-repository.js";
import {
  acceptPlannedMovement,
  compileMovementPlanningRequest,
  parseMovementBrief,
} from "../text/movement-planner.js";
import { executeFableAttempt, type FableProviderPort } from "../text/fable-contract.js";
import { generateNextFolio, type FolioGenerationDependencies } from "./folio-generator.js";

/**
 * D6: dynamic highlight and explicit title creation (PLAN §D6). A child book is founded only by
 * an explicit, confirmed reader action; its identity is its exact founding span or title intent,
 * so the same gesture never duplicates a child; its origin persists the source span and the full
 * navigation ancestry, so it remains returnable through nested books and reload from the ledger
 * alone. Selection and title creation are distinct paths and never converge. The reader-side
 * halves (source reader stays mounted, book-native creation state, no global spinner) bind the
 * reader slice, not this module.
 */
export interface ChildFoundingEnvironment {
  plannerPort: FableProviderPort;
  repository: LibraryRepository;
  sources: { temporalRules: string; world: string };
}

function requireConfirmation(confirmed: boolean): void {
  if (confirmed !== true) {
    throw new Error(
      "founding a book spends money and requires the reader's explicit confirmation; " +
        "nothing is created from an unconfirmed gesture",
    );
  }
}

async function planFirstMovement(
  environment: ChildFoundingEnvironment,
  bookOriginStatement: string,
): Promise<{ brief: string; id: string }> {
  const planning = compileMovementPlanningRequest({
    bookOrigin: bookOriginStatement,
    completedMovements: [],
    exposedTail: "",
    phase: "child_first",
    temporalRules: environment.sources.temporalRules,
    world: environment.sources.world,
  });
  const evidence = await executeFableAttempt(planning.request, environment.plannerPort);
  return acceptPlannedMovement({
    brief: parseMovementBrief(evidence.prose),
    completedMovements: [],
    newMovementId: "movement-01",
    phase: "child_first",
  });
}

function ancestryOf(book: BookRecord): string[] {
  const recorded = book.origin["ancestry"];
  const parents = Array.isArray(recorded)
    ? recorded.filter((entry): entry is string => typeof entry === "string")
    : [];
  return [...parents, book.id];
}

export async function foundChildFromSelection(
  environment: ChildFoundingEnvironment,
  input: {
    confirmed: boolean;
    endOffset: number;
    selectedText: string;
    sourceFolioId: string;
    startOffset: number;
  },
): Promise<{ book: BookRecord; created: boolean }> {
  requireConfirmation(input.confirmed);
  const { repository } = environment;
  const folio = await repository.getFolio(input.sourceFolioId);
  const prose = folio.prose ?? "";
  if (
    input.selectedText.trim().length === 0 ||
    prose.slice(input.startOffset, input.endOffset) !== input.selectedText
  ) {
    throw new Error("selection offsets do not reproduce the source text; the gesture is refused");
  }
  const sourceBook = await repository.getBook(folio.bookId);
  const idempotencyKey = `child:selection:${input.sourceFolioId}:${input.startOffset}:${input.endOffset}`;

  const existing = await repository.findBookByIdempotencyKey(idempotencyKey);
  if (existing !== null) return { book: existing, created: false };

  const statement =
    `Founded from the passage: '${input.selectedText}' — highlighted in '${sourceBook.title}'. ` +
    "This child book treats that passage as its founding premise and defines its own viewpoint, " +
    "place and time, dramatic question, intended change, and boundary; the parent's plot is " +
    "reference, not template.";
  const firstMovement = await planFirstMovement(environment, statement);
  const origin: { [key: string]: JsonValue } = {
    ancestry: ancestryOf(sourceBook),
    endOffset: input.endOffset,
    foundingPassage: input.selectedText,
    kind: "selection",
    sourceBookId: sourceBook.id,
    sourceFolioId: input.sourceFolioId,
    startOffset: input.startOffset,
    statement,
    visualProfile: null,
    visualProfileReason: "book-local visual profile awaits the approved visual bible (B2)",
  };
  const truncated =
    input.selectedText.length > 60 ? `${input.selectedText.slice(0, 57)}...` : input.selectedText;
  const reserved = await repository.reserveBook({
    firstMovement,
    idempotencyKey,
    origin,
    title: `From "${truncated}"`,
  });
  await repository.recordSelectionAperture({
    endOffset: input.endOffset,
    folioId: input.sourceFolioId,
    sourceText: input.selectedText,
    startOffset: input.startOffset,
    targetBookId: reserved.book.id,
  });
  return reserved;
}

export async function foundChildFromTitle(
  environment: ChildFoundingEnvironment,
  input: { confirmed: boolean; titleIntent: string },
): Promise<{ book: BookRecord; created: boolean }> {
  requireConfirmation(input.confirmed);
  const titleIntent = input.titleIntent.trim();
  if (titleIntent.length === 0) throw new Error("a title request needs a title");
  const idempotencyKey = `child:title:${digestJson({ titleIntent })}`;
  const existing = await environment.repository.findBookByIdempotencyKey(idempotencyKey);
  if (existing !== null) return { book: existing, created: false };

  const statement =
    `Founded by an explicit title request: '${titleIntent}'. This book defines its own ` +
    "viewpoint, place and time, dramatic question, intended change, and boundary from that " +
    "title intent; the root story is reference, not template.";
  const firstMovement = await planFirstMovement(environment, statement);
  return environment.repository.reserveBook({
    firstMovement,
    idempotencyKey,
    origin: {
      ancestry: [],
      kind: "title",
      statement,
      titleIntent,
      visualProfile: null,
      visualProfileReason: "book-local visual profile awaits the approved visual bible (B2)",
    },
    title: titleIntent,
  });
}

/**
 * Entry is atomic: the reader enters only when the first folio is ready, and entry is the
 * exposure. A failed first folio propagates as a named failure — never a fake page.
 */
export async function enterChildBook(
  dependencies: FolioGenerationDependencies,
  input: { bookId: string; workerId: string },
): Promise<{ folio: FolioRecord }> {
  const book = await dependencies.repository.getBook(input.bookId);
  const firstMovement = book.movementBriefs[0];
  if (firstMovement === undefined) {
    throw new Error(`book ${input.bookId} has no first movement; it cannot be entered`);
  }
  const { folio } = await generateNextFolio(dependencies, {
    bookId: book.id,
    movementId: firstMovement.id,
    ordinal: 1,
    workerId: input.workerId,
  });
  if (folio.state === "exposed") return { folio };
  if (folio.state !== "ready") {
    throw new Error(`the first folio is ${folio.state}, not ready; entry refuses to fake a page`);
  }
  return { folio: await dependencies.repository.exposeFolio(folio.id) };
}
