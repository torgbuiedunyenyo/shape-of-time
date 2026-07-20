import {
  getFolio,
  getNextFolio,
  getPreviousFolio,
  type ReaderAperture,
  type ReaderBlock,
  type ReaderFixture,
} from "../content/reader-slice.js";

export const READER_STORAGE_KEY = "shape-of-time.reader.v1";

export interface ReaderPlace {
  bookId: string;
  folioId: string;
  anchorBlockId: string | null;
}

export interface ReturnPoint {
  source: ReaderPlace;
  apertureId: string;
  blockId: string;
  endBlockId?: string;
  startOffset: number;
  endOffset: number;
  quote: string;
}

export interface ApertureJourney {
  destinationBookId: string;
  returnPoint: ReturnPoint;
  returnDepth: number;
}

export interface PageTurnHistory {
  previousPlace?: ReaderPlace;
  journey?: ApertureJourney;
  canHistoryReturn?: boolean;
}

export type PageTurnDecision =
  | { kind: "history"; delta: -1 }
  | {
      kind: "push";
      place: ReaderPlace;
      journey: ApertureJourney | null;
      history: PageTurnHistory;
    };

export interface ReaderRecord {
  version: 1;
  discoveredBookIds: string[];
  bookmarks: ReaderPlace[];
  resume: ReaderPlace | null;
  activeReturn: ApertureJourney | null;
}

export interface StableSelectionEndpoint {
  blockId: string;
  offset: number;
}

export interface StableSelection {
  start: StableSelectionEndpoint;
  end: StableSelectionEndpoint;
  quote: string;
}

export function emptyReaderRecord(): ReaderRecord {
  return {
    version: 1,
    discoveredBookIds: [],
    bookmarks: [],
    resume: null,
    activeReturn: null,
  };
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isPlace(value: unknown): value is ReaderPlace {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ReaderPlace>;
  return (
    typeof candidate.bookId === "string" &&
    typeof candidate.folioId === "string" &&
    (candidate.anchorBlockId === null || typeof candidate.anchorBlockId === "string")
  );
}

function isJourney(value: unknown): value is ApertureJourney {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ApertureJourney>;
  const point = candidate.returnPoint as Partial<ReturnPoint> | undefined;
  return (
    Number.isInteger(candidate.returnDepth) &&
    (candidate.returnDepth ?? 0) >= 1 &&
    typeof candidate.destinationBookId === "string" &&
    point !== undefined &&
    isPlace(point.source) &&
    typeof point.apertureId === "string" &&
    typeof point.blockId === "string" &&
    (point.endBlockId === undefined || typeof point.endBlockId === "string") &&
    Number.isInteger(point.startOffset) &&
    Number.isInteger(point.endOffset) &&
    typeof point.quote === "string"
  );
}

export function decodeReaderRecord(serialized: string | null): ReaderRecord {
  if (serialized === null) return emptyReaderRecord();
  try {
    const value: unknown = JSON.parse(serialized);
    if (typeof value !== "object" || value === null) return emptyReaderRecord();
    const candidate = value as Partial<ReaderRecord>;
    if (
      candidate.version !== 1 ||
      !isStringArray(candidate.discoveredBookIds) ||
      !Array.isArray(candidate.bookmarks) ||
      !candidate.bookmarks.every(isPlace) ||
      !(candidate.resume === null || isPlace(candidate.resume)) ||
      !(candidate.activeReturn === null || isJourney(candidate.activeReturn))
    ) {
      return emptyReaderRecord();
    }
    return candidate as ReaderRecord;
  } catch {
    return emptyReaderRecord();
  }
}

export function enterAperture(source: ReaderPlace, aperture: ReaderAperture) {
  const returnPoint: ReturnPoint = {
    source,
    apertureId: aperture.id,
    blockId: aperture.blockId,
    endBlockId: aperture.blockId,
    startOffset: aperture.startOffset,
    endOffset: aperture.endOffset,
    quote: aperture.quote,
  };
  return {
    place: {
      bookId: aperture.targetBookId,
      folioId: aperture.targetFolioId,
      anchorBlockId: null,
    } satisfies ReaderPlace,
    journey: {
      destinationBookId: aperture.targetBookId,
      returnPoint,
      returnDepth: 1,
    } satisfies ApertureJourney,
  };
}

function placesNameSameLocation(left: ReaderPlace | undefined, right: ReaderPlace) {
  return left?.bookId === right.bookId && left.folioId === right.folioId;
}

export function planPageTurn(
  fixture: ReaderFixture,
  current: ReaderPlace,
  direction: "next" | "previous",
  activeJourney: ApertureJourney | null,
  history: PageTurnHistory = {},
): PageTurnDecision | null {
  const book = fixture.books.find((candidate) => candidate.id === current.bookId);
  if (book === undefined) return null;
  const currentIndex = book.folios.findIndex((folio) => folio.id === current.folioId);
  if (currentIndex < 0) return null;
  const target = direction === "next" ? book.folios[currentIndex + 1] : book.folios[currentIndex - 1];
  if (target === undefined) return null;

  const place = { bookId: book.id, folioId: target.id, anchorBlockId: null } satisfies ReaderPlace;
  if (placesNameSameLocation(history.previousPlace, place)) {
    return { kind: "history", delta: -1 };
  }

  const journey =
    activeJourney === null
      ? null
      : { ...activeJourney, returnDepth: activeJourney.returnDepth + 1 };

  return {
    kind: "push",
    place,
    journey,
    history: {
      previousPlace: current,
      ...(journey === null
        ? {}
        : { journey, canHistoryReturn: history.canHistoryReturn === true }),
    },
  };
}

export function returnToPassage(journey: ApertureJourney | null, historyAvailable: boolean) {
  if (journey === null) return null;
  if (historyAvailable) {
    return {
      kind: "history" as const,
      delta: -journey.returnDepth,
      returnPoint: journey.returnPoint,
    };
  }
  return {
    kind: "replace" as const,
    place: journey.returnPoint.source,
    returnPoint: journey.returnPoint,
  };
}

export function serializeSelection(
  blocks: ReaderBlock[],
  endpoints: { start: StableSelectionEndpoint; end: StableSelectionEndpoint },
): StableSelection | null {
  const startIndex = blocks.findIndex((block) => block.id === endpoints.start.blockId);
  const endIndex = blocks.findIndex((block) => block.id === endpoints.end.blockId);
  if (startIndex < 0 || endIndex < startIndex) return null;
  const startBlock = blocks[startIndex];
  const endBlock = blocks[endIndex];
  if (startBlock === undefined || endBlock === undefined) return null;
  if (
    endpoints.start.offset < 0 ||
    endpoints.start.offset > startBlock.text.length ||
    endpoints.end.offset < 0 ||
    endpoints.end.offset > endBlock.text.length
  ) {
    return null;
  }
  if (startIndex === endIndex && endpoints.end.offset <= endpoints.start.offset) return null;

  const parts = blocks.slice(startIndex, endIndex + 1).map((block, relativeIndex, selectedBlocks) => {
    const start = relativeIndex === 0 ? endpoints.start.offset : 0;
    const end = relativeIndex === selectedBlocks.length - 1 ? endpoints.end.offset : block.text.length;
    return block.text.slice(start, end);
  });
  const quote = parts.join("\n\n");
  return quote.trim().length === 0 ? null : { ...endpoints, quote };
}

export function isKnownPlace(place: ReaderPlace): boolean {
  try {
    getFolio(place.bookId, place.folioId);
    return true;
  } catch {
    return false;
  }
}

export function adjacentPlace(place: ReaderPlace, direction: "next" | "previous"): ReaderPlace | null {
  const target =
    direction === "next"
      ? getNextFolio(place.bookId, place.folioId)
      : getPreviousFolio(place.bookId, place.folioId);
  return target === null ? null : { bookId: place.bookId, folioId: target.id, anchorBlockId: null };
}
