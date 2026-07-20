import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { CreationDialog } from "./CreationDialog.js";
import { createTitleBook, fetchReaderLibrary, mergeReaderBook } from "./content/reader-api.js";
import { ROOT_BOOK_ID, readerSlice, type ReaderFixture } from "./content/reader-slice.js";
import type { ReaderPlace } from "./reader/reader-state.js";
import { useReaderStore } from "./reader/reader-store.js";

function readerPath(place: ReaderPlace) {
  const anchor = place.anchorBlockId === null ? "" : `#${encodeURIComponent(place.anchorBlockId)}`;
  return `/books/${encodeURIComponent(place.bookId)}/folios/${encodeURIComponent(place.folioId)}${anchor}`;
}

export function LibraryScreen() {
  const navigate = useNavigate();
  const { discoverBook, record } = useReaderStore();
  const [catalog, setCatalog] = useState<ReaderFixture>(readerSlice);
  const [query, setQuery] = useState("");
  const [dialogTitle, setDialogTitle] = useState<string | null>(null);
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const availableBooks = useMemo(
    () =>
      catalog.books.filter(
        (book) => book.id === ROOT_BOOK_ID || record.discoveredBookIds.includes(book.id),
      ),
    [catalog.books, record.discoveredBookIds],
  );
  const visibleBooks = availableBooks.filter((book) =>
    book.title.toLocaleLowerCase().includes(normalizedQuery),
  );
  const hasExactTitle = availableBooks.some(
    (book) => book.title.toLocaleLowerCase() === normalizedQuery,
  );
  const resumeBook = catalog.books.find((book) => book.id === record.resume?.bookId);
  const resumeFolio = resumeBook?.folios.find((folio) => folio.id === record.resume?.folioId) ?? null;
  const resume = resumeFolio === null ? null : record.resume;

  useEffect(() => {
    void fetchReaderLibrary()
      .then((books) => {
        setCatalog((current) => books.reduce(mergeReaderBook, current));
      })
      .catch(() => undefined);
  }, []);

  const closeDialog = () => {
    setDialogTitle(null);
    window.requestAnimationFrame(() => createButtonRef.current?.focus());
  };

  return (
    <main className="library-screen">
      <section className="library-intro">
        <p className="eyebrow">An illustrated hyperbook</p>
        <h1>Your library</h1>
        <p>
          Begin with one book. Other books appear only after you have opened them from a passage.
        </p>
      </section>

      {resume !== null && resumeFolio !== null ? (
        <button
          className="resume-strip"
          onClick={() => {
            void navigate(readerPath(resume));
          }}
          type="button"
        >
          <span>Continue reading</span>
          <strong>Resume {resumeFolio.title}</strong>
          <span aria-hidden="true">→</span>
        </button>
      ) : null}

      <section aria-labelledby="shelf-heading" className="shelf-section">
        <div className="shelf-heading-row">
          <div>
            <p className="eyebrow">Shelf</p>
            <h2 id="shelf-heading">Books you have found</h2>
          </div>
          <label className="library-search">
            <span>Filter books</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title"
              type="search"
              value={query}
            />
          </label>
        </div>

        <div className="book-shelf">
          {visibleBooks.map((book) => (
            <article
              className={`book-cover ${book.id === ROOT_BOOK_ID ? "book-cover-root" : "book-cover-child"}`}
              key={book.id}
            >
              <div className="cover-rule" aria-hidden="true" />
              <p>{book.subtitle}</p>
              <h3>{book.title}</h3>
              <p className="cover-description">{book.description}</p>
              <button
                aria-label={`Open ${book.title}`}
                className="cover-open"
                onClick={() => {
                  void navigate(readerPath({
                    bookId: book.id,
                    folioId: book.folios[0]?.id ?? "",
                    anchorBlockId: null,
                  }));
                }}
                type="button"
              >
                Open <span aria-hidden="true">→</span>
              </button>
            </article>
          ))}
        </div>

        {normalizedQuery !== "" && visibleBooks.length === 0 ? (
          <div className="empty-shelf">
            <p>No discovered book has that title.</p>
            {!hasExactTitle ? (
              <button
                className="secondary-action"
                onClick={() => setDialogTitle(query.trim())}
                ref={createButtonRef}
                type="button"
              >
                Create a book called {query.trim()}
              </button>
            ) : null}
          </div>
        ) : null}
      </section>

      <footer className="library-footer">
        <span>S/T</span>
        <p>Every direction can continue. Each stretch of reading goes somewhere.</p>
      </footer>

      {dialogTitle === null ? null : (
        <CreationDialog
          kind="title"
          onClose={closeDialog}
          onConfirm={async () => {
            const book = await createTitleBook(dialogTitle);
            const first = book.folios[0];
            if (first === undefined) throw new Error("The new book has no opening folio.");
            setCatalog((current) => mergeReaderBook(current, book));
            discoverBook(book.id);
            await Promise.resolve(navigate(readerPath({
              anchorBlockId: null,
              bookId: book.id,
              folioId: first.id,
            })));
          }}
          source={dialogTitle}
        />
      )}
    </main>
  );
}
