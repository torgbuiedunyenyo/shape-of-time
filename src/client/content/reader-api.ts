import {
  readerSlice,
  type ReaderBook,
  type ReaderFixture,
} from "./reader-slice.js";
import type { StableSelection } from "../reader/reader-state.js";

export type ReaderGenerationStatus =
  | { ordinal: number; state: "preparing" }
  | { ordinal: number; state: "ready" }
  | {
      error: { code: string; message: string; retryable: boolean };
      ordinal: number;
      state: "error";
    };

export type ReaderCreationStatus =
  | { creationId: string; state: "preparing" }
  | { book: ReaderBook; creationId: string; state: "ready" }
  | { creationId: string; error: { message: string }; state: "error" };

async function json<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: unknown };
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && typeof body.error === "string"
        ? body.error
        : `Reader request failed with ${response.status}`;
    throw new Error(message);
  }
  return body;
}

export function mergeReaderBook(catalog: ReaderFixture, book: ReaderBook): ReaderFixture {
  const existing = catalog.books.find((candidate) => candidate.id === book.id);
  const merged = existing?.origin === undefined ? book : { ...book, origin: existing.origin };
  return {
    ...catalog,
    books: catalog.books.some((candidate) => candidate.id === book.id)
      ? catalog.books.map((candidate) => candidate.id === book.id ? merged : candidate)
      : [...catalog.books, merged],
  };
}

export async function fetchReaderBook(bookId: string): Promise<ReaderBook | null> {
  const response = await fetch(`/api/reader/books/${encodeURIComponent(bookId)}`);
  if (response.status === 404) return null;
  return (await json<{ book: ReaderBook }>(response)).book;
}

export async function fetchReaderLibrary(): Promise<ReaderBook[]> {
  const response = await fetch("/api/reader/library");
  if (response.status === 404) return [];
  return (await json<{ books: ReaderBook[] }>(response)).books;
}

export async function requestNextFolio(bookId: string): Promise<ReaderGenerationStatus> {
  const response = await fetch(`/api/reader/books/${encodeURIComponent(bookId)}/next`, {
    method: "POST",
  });
  const body = await response.json() as ReaderGenerationStatus | { error: string };
  if (response.status === 404 || !("state" in body)) {
    throw new Error("Live folio generation is not available for this book.");
  }
  return body;
}

export async function readNextFolioStatus(bookId: string): Promise<ReaderGenerationStatus> {
  const response = await fetch(`/api/reader/books/${encodeURIComponent(bookId)}/next`);
  const body = await response.json() as ReaderGenerationStatus | { error: string };
  if (response.status === 404 || !("state" in body)) {
    throw new Error("The next folio could not be found.");
  }
  return body;
}

export async function openGeneratedFolio(
  bookId: string,
  ordinal: number,
): Promise<{ book: ReaderBook; currentFolioId: string }> {
  return json(
    await fetch(
      `/api/reader/books/${encodeURIComponent(bookId)}/folios/${ordinal}/open`,
      { method: "POST" },
    ),
  );
}

async function creationResponse(response: Response): Promise<ReaderCreationStatus> {
  const body = await response.json() as ReaderCreationStatus | { error: string };
  if ("state" in body) return body;
  throw new Error(body.error || `Book creation failed with ${response.status}`);
}

async function waitForCreation(status: ReaderCreationStatus): Promise<ReaderBook> {
  let current = status;
  while (current.state === "preparing") {
    await new Promise((resolve) => window.setTimeout(resolve, 2_000));
    current = await creationResponse(
      await fetch(`/api/reader/creations/${encodeURIComponent(current.creationId)}`),
    );
  }
  if (current.state === "error") throw new Error(current.error.message);
  return current.book;
}

export async function createSelectionBook(
  bookId: string,
  folioId: string,
  selection: StableSelection,
): Promise<ReaderBook> {
  const status = await creationResponse(
    await fetch(
      `/api/reader/books/${encodeURIComponent(bookId)}/folios/${encodeURIComponent(folioId)}/children`,
      {
        body: JSON.stringify({
          endBlockId: selection.end.blockId,
          endOffset: selection.end.offset,
          quote: selection.quote,
          startBlockId: selection.start.blockId,
          startOffset: selection.start.offset,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
    ),
  );
  return waitForCreation(status);
}

export async function createTitleBook(title: string): Promise<ReaderBook> {
  const status = await creationResponse(
    await fetch("/api/reader/books", {
      body: JSON.stringify({ title }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    }),
  );
  return waitForCreation(status);
}

export function initialReaderCatalog(): ReaderFixture {
  return readerSlice;
}
