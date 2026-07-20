import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link, Navigate, useLocation, useNavigate, useParams } from "react-router";

import { CreationDialog } from "./CreationDialog.js";
import { SelectionToolbar } from "./SelectionToolbar.js";
import {
  getFolio,
  readerSlice,
  type ReaderAperture,
  type ReaderBlock,
  type ReaderBook,
  type ReaderFolio,
  type ReaderFixture,
} from "./content/reader-slice.js";
import {
  createSelectionBook,
  fetchReaderBook,
  mergeReaderBook,
  openGeneratedFolio,
  readNextFolioStatus,
  requestNextFolio,
  type ReaderGenerationStatus,
} from "./content/reader-api.js";
import {
  serializeSelection,
  type ApertureJourney,
  type ReaderPlace,
  type StableSelection,
} from "./reader/reader-state.js";
import { placesMatch, useReaderStore } from "./reader/reader-store.js";
import { useReaderNavigation } from "./reader/use-reader-navigation.js";

function boundaryOffset(block: HTMLElement, node: Node, offset: number) {
  const range = document.createRange();
  range.selectNodeContents(block);
  try {
    range.setEnd(node, offset);
  } catch {
    return null;
  }
  return range.toString().length;
}

function selectedPassage(container: HTMLElement, blocks: ReaderBlock[]): StableSelection | null {
  const selection = window.getSelection();
  if (selection === null || selection.rangeCount === 0 || selection.isCollapsed) return null;
  const range = selection.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;

  const startElement =
    range.startContainer instanceof Element ? range.startContainer : range.startContainer.parentElement;
  const endElement =
    range.endContainer instanceof Element ? range.endContainer : range.endContainer.parentElement;
  const startBlock = startElement?.closest<HTMLElement>("[data-block-id]");
  const endBlock = endElement?.closest<HTMLElement>("[data-block-id]");
  if (startBlock === null || startBlock === undefined || endBlock === null || endBlock === undefined) {
    return null;
  }
  if (!container.contains(startBlock) || !container.contains(endBlock)) return null;

  const startOffset = boundaryOffset(startBlock, range.startContainer, range.startOffset);
  const endOffset = boundaryOffset(endBlock, range.endContainer, range.endOffset);
  const startId = startBlock.dataset.blockId;
  const endId = endBlock.dataset.blockId;
  if (startOffset === null || endOffset === null || startId === undefined || endId === undefined) {
    return null;
  }
  return serializeSelection(blocks, {
    start: { blockId: startId, offset: startOffset },
    end: { blockId: endId, offset: endOffset },
  });
}

function ApertureBlock({
  aperture,
  block,
  onOpen,
}: {
  aperture: ReaderAperture;
  block: ReaderBlock;
  onOpen: (aperture: ReaderAperture) => void;
}) {
  const trailingText = block.text.slice(aperture.endOffset);
  const adjacentPunctuation = trailingText.match(/^[,.;:!?]+/u)?.[0] ?? "";

  return (
    <p data-block-id={block.id} tabIndex={-1}>
      {block.text.slice(0, aperture.startOffset)}
      <button
        aria-label={`Open ${aperture.quote}`}
        className="aperture"
        data-aperture-id={aperture.id}
        id={`aperture-${aperture.id}`}
        onClick={() => onOpen(aperture)}
        type="button"
      >
        {aperture.quote}
        {adjacentPunctuation === "" ? null : <span aria-hidden="true">{adjacentPunctuation}</span>}
      </button>
      {trailingText.slice(adjacentPunctuation.length)}
    </p>
  );
}

function plainTextTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return true;
  return !target.closest(
    "a, button, input, textarea, select, summary, [role='dialog'], [contenteditable='true']",
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement &&
    target.closest("a, button, input, textarea, select, summary, [contenteditable='true']") !== null;
}

function decodedHashAnchor(hash: string) {
  try {
    return decodeURIComponent(hash.replace(/^#/u, ""));
  } catch {
    return "";
  }
}

function nearestReadingBlockId() {
  const candidates = [...document.querySelectorAll<HTMLElement>("[data-reader-prose] [data-block-id]")];
  if (candidates.length === 0) return null;
  const readingLine = window.innerHeight * 0.38;
  const nearest = candidates.reduce((best, candidate) => {
    const bestDistance = Math.abs(best.getBoundingClientRect().top - readingLine);
    const candidateDistance = Math.abs(candidate.getBoundingClientRect().top - readingLine);
    return candidateDistance < bestDistance ? candidate : best;
  });
  return nearest.dataset.blockId ?? null;
}

function textPointAtOffset(container: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();
  while (node !== null) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) return { node, offset: remaining };
    remaining -= length;
    node = walker.nextNode();
  }
  return null;
}

type GenerationUiState =
  | { phase: "idle" }
  | { ordinal: number; phase: "preparing" | "ready" }
  | { message: string; ordinal: number; phase: "error"; retryable: boolean };

function ReaderFolioScreen({
  book,
  catalog,
  folio,
  generation,
  onContinue,
  onPrepare,
}: {
  book: ReaderBook;
  catalog: ReaderFixture;
  folio: ReaderFolio;
  generation: GenerationUiState;
  onContinue: (journey: ReturnType<typeof useReaderNavigation>["activeJourney"]) => void;
  onPrepare: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const hashAnchor = decodedHashAnchor(location.hash);
  const requestedAnchor = folio.blocks.some((block) => block.id === hashAnchor)
    ? hashAnchor
    : (folio.blocks[0]?.id ?? null);
  const [anchorBlockId, setAnchorBlockId] = useState<string | null>(requestedAnchor);
  const current = useMemo<ReaderPlace>(
    () => ({ bookId: book.id, folioId: folio.id, anchorBlockId }),
    [anchorBlockId, book.id, folio.id],
  );
  const { discoverBook, record, setActiveReturn, setResume, toggleBookmark } = useReaderStore();
  const navigation = useReaderNavigation(current, catalog);
  const proseRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const selectionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const pointerStart = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const leavingReader = useRef(false);
  const [selection, setSelection] = useState<StableSelection | null>(null);
  const [creationSelection, setCreationSelection] = useState<StableSelection | null>(null);
  const bookmarked = record.bookmarks.some((bookmark) => placesMatch(bookmark, current));

  useEffect(() => {
    setResume(current);
  }, [current, setResume]);

  useEffect(() => {
    setAnchorBlockId(requestedAnchor);
  }, [folio.id, requestedAnchor]);

  useEffect(() => {
    const updateAnchor = () => {
      if (leavingReader.current) return;
      setAnchorBlockId(nearestReadingBlockId());
    };
    window.addEventListener("scroll", updateAnchor, { passive: true });
    updateAnchor();
    return () => {
      window.removeEventListener("scroll", updateAnchor);
    };
  }, [folio.id]);

  useEffect(() => {
    if (navigation.nextPlace === null) onPrepare();
  }, [navigation.nextPlace, onPrepare]);

  useEffect(() => {
    leavingReader.current = false;
    window.getSelection()?.removeAllRanges();
    setSelection(null);
    setCreationSelection(null);
  }, [folio.id]);

  useEffect(() => {
    const returnPoint = navigation.restoreReturnPoint;
    if (returnPoint === undefined || returnPoint.source.bookId !== book.id || returnPoint.source.folioId !== folio.id) {
      if (hashAnchor !== "" && folio.blocks.some((block) => block.id === hashAnchor)) {
        window.requestAnimationFrame(() => {
          const target = document.querySelector<HTMLElement>(`[data-block-id="${hashAnchor}"]`);
          target?.focus({ preventScroll: true });
          target?.scrollIntoView({ block: "center", behavior: "auto" });
        });
        return;
      }
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    setActiveReturn(null);
    window.requestAnimationFrame(() => {
      const aperture = document.querySelector<HTMLElement>(`[data-aperture-id="${returnPoint.apertureId}"]`);
      if (aperture !== null) {
        aperture.focus({ preventScroll: true });
        aperture.scrollIntoView({ block: "center", behavior: "auto" });
        return;
      }
      const startBlock = document.querySelector<HTMLElement>(`[data-block-id="${returnPoint.blockId}"]`);
      const endBlock = document.querySelector<HTMLElement>(
        `[data-block-id="${returnPoint.endBlockId ?? returnPoint.blockId}"]`,
      );
      if (startBlock === null || endBlock === null) return;
      const start = textPointAtOffset(startBlock, returnPoint.startOffset);
      const end = textPointAtOffset(endBlock, returnPoint.endOffset);
      if (start !== null && end !== null) {
        const range = document.createRange();
        range.setStart(start.node, start.offset);
        range.setEnd(end.node, end.offset);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      startBlock.focus({ preventScroll: true });
      startBlock.scrollIntoView({ block: "center", behavior: "auto" });
    });
  }, [book.id, folio.blocks, folio.id, hashAnchor, navigation.restoreReturnPoint, setActiveReturn]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!plainTextTarget(event.target) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      if (event.key === "ArrowRight" && navigation.nextPlace !== null) {
        event.preventDefault();
        navigation.goNext();
      } else if (event.key === "ArrowRight" && navigation.nextPlace === null) {
        event.preventDefault();
        onContinue(navigation.activeJourney);
      }
      if (event.key === "ArrowLeft" && navigation.previousPlace !== null) {
        event.preventDefault();
        navigation.goPrevious();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigation, onContinue]);

  const captureSelection = useCallback(() => {
    window.requestAnimationFrame(() => {
      const container = proseRef.current;
      if (container === null) return;
      setSelection(selectedPassage(container, folio.blocks));
    });
  }, [folio.blocks]);

  useEffect(() => {
    document.addEventListener("selectionchange", captureSelection);
    return () => document.removeEventListener("selectionchange", captureSelection);
  }, [captureSelection]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.pointerType === "mouse" || isInteractiveTarget(event.target)) return;
    pointerStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
  };

  const onPointerCancel = () => {
    pointerStart.current = null;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (start === null || start.pointerId !== event.pointerId || window.getSelection()?.isCollapsed === false) {
      return;
    }
    const horizontal = event.clientX - start.x;
    const vertical = event.clientY - start.y;
    if (Math.abs(horizontal) < 56 || Math.abs(horizontal) < Math.abs(vertical) * 1.35) return;
    if (horizontal < 0) {
      if (navigation.nextPlace === null) onContinue(navigation.activeJourney);
      else navigation.goNext();
    }
    else navigation.goPrevious();
  };

  const closeCreation = () => {
    setCreationSelection(null);
    window.requestAnimationFrame(() => selectionTriggerRef.current?.focus());
  };

  const rememberBeforeLibrary = () => {
    leavingReader.current = true;
    setResume({
      bookId: book.id,
      folioId: folio.id,
      anchorBlockId: nearestReadingBlockId() ?? anchorBlockId,
    });
  };

  return (
    <main className="reader-screen">
      <header className="reader-header">
        <Link aria-label="Library home" className="reader-monogram" onClick={rememberBeforeLibrary} to="/library">
          S/T
        </Link>
        <div className="reader-book-position">
          <span>{book.title}</span>
          <span aria-hidden="true">·</span>
          <span>
            {folio.ordinal} / {book.folios.length}
          </span>
        </div>
        <div className="reader-header-actions">
          <button
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this folio"}
            aria-pressed={bookmarked}
            className="header-action"
            onClick={() => toggleBookmark(current)}
            type="button"
          >
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </button>
          <Link className="header-action" onClick={rememberBeforeLibrary} to="/library">
            Library
          </Link>
        </div>
      </header>

      {navigation.activeJourney === null ? null : (
        <button className="return-ribbon" onClick={navigation.backToPassage} type="button">
          <span aria-hidden="true">←</span> Back to passage
        </button>
      )}

      <article
        className={`reading-folio folio-layout-${folio.layout}`}
        data-folio-id={folio.id}
        onPointerCancel={onPointerCancel}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <header className="folio-heading">
          <p className="eyebrow">
            {book.subtitle} · folio {String(folio.ordinal).padStart(2, "0")}
          </p>
          <h1 ref={headingRef} tabIndex={-1}>
            {folio.title}
          </h1>
        </header>

        {folio.plate === undefined ? null : (
          <figure className="narrative-plate">
            <img alt={folio.plate.alt} src={folio.plate.src} />
            <figcaption aria-hidden="true">{folio.title}</figcaption>
          </figure>
        )}

        <div
          className="folio-prose"
          data-reader-prose
          onKeyUp={captureSelection}
          onMouseUp={captureSelection}
          onTouchEnd={captureSelection}
          ref={proseRef}
        >
          {folio.blocks.map((block) => {
            const aperture = folio.apertures.find((candidate) => candidate.blockId === block.id);
            return (
              <Fragment key={block.id}>
                {aperture === undefined ? (
                  <p data-block-id={block.id} tabIndex={-1}>{block.text}</p>
                ) : (
                  <ApertureBlock
                    aperture={aperture}
                    block={block}
                    onOpen={(selectedAperture) => {
                      void navigation.openAperture(selectedAperture);
                    }}
                  />
                )}
              </Fragment>
            );
          })}
        </div>

        {folio.movementRest === undefined ? null : (
          <aside className="movement-rest">
            <p className="eyebrow">A resting point</p>
            <h2>{folio.movementRest.label}</h2>
            <p>{folio.movementRest.continuation}</p>
            <Link className="secondary-action" onClick={rememberBeforeLibrary} to="/library">
              Return to Library
            </Link>
          </aside>
        )}
      </article>

      <nav aria-label="Folio navigation" className="page-turns">
        {navigation.previousPlace === null ? <span /> : (
          <button onClick={navigation.goPrevious} type="button">
            <span aria-hidden="true">←</span>
            <span>Previous folio</span>
          </button>
        )}
        <span className="page-progress" aria-hidden="true">
          <i style={{ width: `${(folio.ordinal / book.folios.length) * 100}%` }} />
        </span>
        {navigation.nextPlace === null ? (
          <button
            disabled={generation.phase === "preparing"}
            onClick={() => onContinue(navigation.activeJourney)}
            type="button"
          >
            <span>
              {generation.phase === "preparing" ? "Preparing next folio…" : "Next folio"}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <button onClick={navigation.goNext} type="button">
            <span>Next folio</span>
            <span aria-hidden="true">→</span>
          </button>
        )}
      </nav>

      {generation.phase === "preparing" ? (
        <p aria-live="polite" className="generation-note">
          Folio {generation.ordinal} is being composed. This page remains yours while it is prepared.
        </p>
      ) : generation.phase === "error" ? (
        <p aria-live="polite" className="generation-note generation-note-error">
          {generation.message}
        </p>
      ) : null}

      {selection === null ? null : (
        <SelectionToolbar
          onDismiss={() => {
            window.getSelection()?.removeAllRanges();
            setSelection(null);
          }}
          onOpen={() => {
            selectionTriggerRef.current = document.activeElement as HTMLButtonElement | null;
            setCreationSelection(selection);
          }}
          selection={selection}
        />
      )}

      {creationSelection === null ? null : (
        <CreationDialog
          kind="selection"
          onClose={closeCreation}
          onConfirm={async () => {
            const child = await createSelectionBook(book.id, folio.id, creationSelection);
            const first = child.folios[0];
            if (first === undefined) throw new Error("The new book has no opening folio.");
            const returnPoint = {
              apertureId: `selection-${folio.id}-${creationSelection.start.blockId}-${creationSelection.start.offset}`,
              blockId: creationSelection.start.blockId,
              endBlockId: creationSelection.end.blockId,
              endOffset: creationSelection.end.offset,
              quote: creationSelection.quote,
              source: current,
              startOffset: creationSelection.start.offset,
            };
            const journey: ApertureJourney = {
              destinationBookId: child.id,
              returnDepth: 1,
              returnPoint,
            };
            await Promise.resolve(navigate(
              `/books/${encodeURIComponent(book.id)}/folios/${encodeURIComponent(folio.id)}`,
              { replace: true, state: { restoreReturnPoint: returnPoint } },
            ));
            discoverBook(child.id);
            setActiveReturn(journey);
            await Promise.resolve(navigate(
              `/books/${encodeURIComponent(child.id)}/folios/${encodeURIComponent(first.id)}`,
              { state: { canHistoryReturn: true, journey, previousPlace: current } },
            ));
          }}
          source={creationSelection.quote}
        />
      )}
    </main>
  );
}

export function ReaderScreen() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const bookId = params.bookId ?? "";
  const folioId = params.folioId ?? "";
  const [catalog, setCatalog] = useState<ReaderFixture>(readerSlice);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [generation, setGeneration] = useState<GenerationUiState>({ phase: "idle" });
  const requestEpoch = useRef(0);

  useEffect(() => {
    const epoch = ++requestEpoch.current;
    setGeneration({ phase: "idle" });
    let staticKnown = true;
    try {
      getFolio(bookId, folioId);
    } catch {
      staticKnown = false;
      setLoadingRemote(true);
    }
    void fetchReaderBook(bookId)
      .then((book) => {
        if (epoch !== requestEpoch.current || book === null) return;
        setCatalog((current) => mergeReaderBook(current, book));
      })
      .finally(() => {
        if (epoch === requestEpoch.current && !staticKnown) setLoadingRemote(false);
      });
  }, [bookId, folioId]);

  const applyStatus = useCallback((status: ReaderGenerationStatus) => {
    if (status.state === "error") {
      setGeneration({
        message: status.error.message,
        ordinal: status.ordinal,
        phase: "error",
        retryable: status.error.retryable,
      });
    } else {
      setGeneration({ ordinal: status.ordinal, phase: status.state });
    }
  }, []);

  const openAndNavigate = useCallback(async (
    ordinal: number,
    activeJourney: ReturnType<typeof useReaderNavigation>["activeJourney"],
  ) => {
    const opened = await openGeneratedFolio(bookId, ordinal);
    setCatalog((current) => mergeReaderBook(current, opened.book));
    const journey = activeJourney === null
      ? null
      : { ...activeJourney, returnDepth: activeJourney.returnDepth + 1 };
    await Promise.resolve(navigate(
      `/books/${encodeURIComponent(bookId)}/folios/${encodeURIComponent(opened.currentFolioId)}`,
      {
        state: {
          ...(typeof location.state === "object" && location.state !== null ? location.state : {}),
          previousPlace: { bookId, folioId, anchorBlockId: null },
          ...(journey === null ? {} : { journey }),
        },
      },
    ));
  }, [bookId, folioId, location.state, navigate]);

  const poll = useCallback(async (
    ordinal: number,
    enterWhenReady: boolean,
    activeJourney: ReturnType<typeof useReaderNavigation>["activeJourney"],
  ) => {
    const epoch = requestEpoch.current;
    while (epoch === requestEpoch.current) {
      await new Promise((resolve) => window.setTimeout(resolve, 2_000));
      if (epoch !== requestEpoch.current) return;
      const status = await readNextFolioStatus(bookId);
      applyStatus(status);
      if (status.state === "error") return;
      if (status.state !== "ready") continue;
      if (!enterWhenReady) return;
      await openAndNavigate(ordinal, activeJourney);
      return;
    }
  }, [applyStatus, bookId, openAndNavigate]);

  const prepare = useCallback(() => {
    if (generation.phase !== "idle") return;
    void requestNextFolio(bookId)
      .then((status) => {
        applyStatus(status);
        if (status.state === "preparing") void poll(status.ordinal, false, null);
      })
      .catch((error: unknown) => {
        setGeneration({
          message: error instanceof Error ? error.message : String(error),
          ordinal: 0,
          phase: "error",
          retryable: true,
        });
      });
  }, [applyStatus, bookId, generation.phase, poll]);

  const continueBook = useCallback((
    activeJourney: ReturnType<typeof useReaderNavigation>["activeJourney"],
  ) => {
    const run = async () => {
      let status: ReaderGenerationStatus;
      if (generation.phase === "ready") {
        status = { ordinal: generation.ordinal, state: "ready" };
      } else {
        status = await requestNextFolio(bookId);
        applyStatus(status);
      }
      if (status.state === "error") return;
      if (status.state === "preparing") {
        await poll(status.ordinal, true, activeJourney);
        return;
      }
      await openAndNavigate(status.ordinal, activeJourney);
    };
    void run().catch((error: unknown) => {
      setGeneration({
        message: error instanceof Error ? error.message : String(error),
        ordinal: generation.phase === "idle" || generation.phase === "error" ? 0 : generation.ordinal,
        phase: "error",
        retryable: true,
      });
    });
  }, [applyStatus, bookId, generation, openAndNavigate, poll]);

  const book = catalog.books.find((candidate) => candidate.id === bookId);
  const folio = book?.folios.find((candidate) => candidate.id === folioId);
  if (book !== undefined && folio !== undefined) {
    return (
      <ReaderFolioScreen
        book={book}
        catalog={catalog}
        folio={folio}
        generation={generation}
        onContinue={continueBook}
        onPrepare={prepare}
      />
    );
  }
  if (loadingRemote) {
    return <main className="reader-screen"><p className="generation-note">Opening this folio…</p></main>;
  }
  return <Navigate replace to="/library" />;
}
