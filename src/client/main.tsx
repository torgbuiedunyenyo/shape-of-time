import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Link,
  useNavigate,
  useParams,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import type {
  Anchor,
  Block,
  Book,
  Inline,
  Intent,
  Work,
} from "../shared/types.js";
import {
  enter,
  selectReadingEdition,
  bookmarkedVisit,
  latestVisitRequests,
  enterRequested,
  loadReading,
  saveReading,
  sourceReturn,
  updateVisit,
} from "./visits.js";
import "./style.css";
import { ReadingGuide } from "./ReadingGuide.js";
import { hasSeenReadingGuide } from "./tour-state.js";
import { ImageDetail } from "./ImageDetail.js";
import { OpeningPanel } from "./OpeningPanel.js";
import { capturePlace, restorePlace } from "./position.js";
import { explorationKey, openingStatus } from "./requests.js";
async function api<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(
    "/api/" + path,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : undefined,
  );
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? "This could not be loaded.");
  return data;
}
function InlineText({ nodes }: { nodes: Inline[] }) {
  return (
    <>
      {nodes.map((n, i) => {
        const text = n.children ? <InlineText nodes={n.children} /> : n.text;
        return n.kind === "em" ? (
          <em key={i}>{text}</em>
        ) : n.kind === "strong" ? (
          <strong key={i}>{text}</strong>
        ) : n.kind === "code" ? (
          <code key={i}>{text}</code>
        ) : n.kind === "break" ? (
          <React.Fragment key={i}>
            <br />
            {"\n"}
          </React.Fragment>
        ) : (
          <React.Fragment key={i}>{text}</React.Fragment>
        );
      })}
    </>
  );
}
function Discoveries() {
  const [records] = useState(() =>
    Object.values(loadReading().requests)
      .filter((r) => r.source || r.label)
      .reverse(),
  );
  const [intents, setIntents] = useState<Record<string, Intent>>({});
  const snapshots = useRef<Record<string, Intent>>({});
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    const poll = async () => {
      await Promise.allSettled(
        records
          .filter((r) => {
            const current = snapshots.current[r.intentId];
            return (
              !current || !["done", "failed", "paused"].includes(current.status)
            );
          })
          .map(async (r) => {
            const intent = await api<Intent>("intents/" + r.intentId);
            if (active) {
              snapshots.current[r.intentId] = intent;
              setIntents({ ...snapshots.current });
            }
          }),
      );
    };
    void poll();
    const timer = setInterval(() => void poll(), 5000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [records]);
  if (!records.length) return null;
  return (
    <section className="saved-openings">
      <h2>Your openings</h2>
      {records.map((record) => {
        const intent = intents[record.intentId];
        return (
          <div className="saved-opening" key={record.intentId}>
            {intent?.result_work_id ? (
              <button
                onClick={() =>
                  navigate(
                    "/read/" +
                      enterRequested(
                        intent.id,
                        intent.result_work_id!,
                        record.visitId,
                        record.source,
                      ),
                  )
                }
              >
                {intent.result_title ?? record.label ?? "Open the book"}{" "}
                <span>{record.openedVisitId ? "Resume →" : "↗"}</span>
              </button>
            ) : (
              <p>{record.label ?? "An opening"}</p>
            )}
            {record.source?.quote && (
              <blockquote>{record.source.quote}</blockquote>
            )}
            {!intent?.result_work_id && (
              <p className="small">
                {openingStatus(intent)}
              </p>
            )}
            <Link
              className="small"
              to={
                record.visitId
                  ? "/read/" + record.visitId
                  : "/waiting/" + record.intentId
              }
              onClick={() => {
                if (record.visitId && record.source) {
                  const origin = sourceReturn(record.source);
                  if (origin) updateVisit(record.visitId, origin);
                }
              }}
            >
              {record.visitId ? "Return to the source" : "View this opening"}
            </Link>
          </div>
        );
      })}
    </section>
  );
}
function Shelf() {
  const [library, setLibrary] = useState<{
    edition: { root_work_id: string | null };
    works: Work[];
    generationEnabled: boolean;
  }>();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    api<typeof library>("library?q=" + encodeURIComponent(query))
      .then(setLibrary)
      .catch((e) => setError(e.message));
  }, [query]);
  const open = (id: string) => navigate("/read/" + enter(id, null));
  const begin = async () => {
    try {
      const intent = await api<Intent>("intents", {
        kind: "begin",
        workId: null,
        key: "begin:shape-of-time",
      });
      const reading = loadReading();
      reading.requests[intent.id] = {
        intentId: intent.id,
        visitId: null,
        label: "The Shape of Time",
      };
      saveReading(reading);
      navigate("/waiting/" + intent.id);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return (
    <main className="shelf">
      <div className="eyebrow">A library unfolding</div>
      <h1>
        The Shape
        <br />
        of Time
      </h1>
      <p className="invitation">
        A story contains a world.
        <br />A world contains other stories.
      </p>
      {error && <p role="alert">{error}</p>}
      {library?.edition.root_work_id ? (
        <button
          className="primary"
          onClick={() => open(library.edition.root_work_id!)}
        >
          Enter the book <span>↗</span>
        </button>
      ) : (
        <button
          className="primary"
          disabled={!library?.generationEnabled}
          onClick={begin}
        >
          {library?.generationEnabled
            ? "Begin the book"
            : "The library is being prepared"}
        </button>
      )}
      {loadReading().current && (
        <Link className="resume" to={"/read/" + loadReading().current}>
          Resume your reading →
        </Link>
      )}
      {!!library?.works.length && (
        <section className="catalogue">
          <label htmlFor="search">On the shelves</label>
          <input
            id="search"
            placeholder="Find a book"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {library.works.map((w) => (
            <button key={w.id} onClick={() => open(w.id)}>
              {w.title}
              <span>↗</span>
            </button>
          ))}
        </section>
      )}
      {!!Object.keys(loadReading().bookmarks).length && (
        <section className="saved-places">
          <h2>Your saved places</h2>
          {Object.entries(loadReading().bookmarks).map(([workId, place]) => (
            <button
              key={workId}
              onClick={() => {
                const state = loadReading();
                const saved = bookmarkedVisit(workId, place, state.visits);
                state.visits[saved.id] = saved;
                state.current = saved.id;
                saveReading(state);
                navigate("/read/" + saved.id);
              }}
            >
              {library?.works.find((w) => w.id === workId)?.title ??
                "Return to a saved passage"}{" "}
              →
            </button>
          ))}
        </section>
      )}
      <Discoveries />
      <p className="small">
        Follow a passage or an image into another book.
        <br />
        Your place is kept for your return.
      </p>
    </main>
  );
}
function Waiting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [intent, setIntent] = useState<Intent>();
  const [error, setError] = useState("");
  useEffect(() => {
    const poll = () =>
      api<Intent>("intents/" + id)
        .then(setIntent)
        .catch((e) => setError(e.message));
    void poll();
    const timer = setInterval(poll, 3000);
    return () => clearInterval(timer);
  }, [id]);
  return (
    <main className="waiting">
      <Link to="/">← The library</Link>
      <h1>
        {intent?.result_work_id
          ? (intent.result_title ?? "Your book is ready.")
          : "A book is opening."}
      </h1>
      <p>
        {openingStatus(intent)}
      </p>
      {error && <p role="alert">{error}</p>}
      {intent?.result_work_id && (
        <button
          className="primary"
          onClick={() =>
            navigate(
              "/read/" +
                enterRequested(intent.id, intent.result_work_id!, null),
            )
          }
        >
          Open the book →
        </button>
      )}
    </main>
  );
}
function Reader() {
  const { id } = useParams();
  const visit = loadReading().visits[id ?? ""];
  const [book, setBook] = useState<Book>();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Anchor>();
  const [intent, setIntent] = useState<Intent>();
  const [font, setFont] = useState(loadReading().fontSize);
  const [continuation, setContinuation] = useState<Intent>();
  const [enlarged, setEnlarged] = useState<string>();
  const [bookmarked, setBookmarked] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const guiding = useRef(false);
  guiding.current = guideOpen;
  const navigate = useNavigate();
  const restored = useRef(false);
  const resizing = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const currentVisit = useRef(id);
  currentVisit.current = id;
  useEffect(() => {
    restored.current = false;
    setBook(undefined);
    setSelected(undefined);
    setIntent(undefined);
    setContinuation(undefined);
    setBookmarked(false);
    setError("");
    if (!visit) return;
    let active = true;
    const state = loadReading();
    state.current = visit.id;
    saveReading(state);
    const requests = latestVisitRequests(state.requests, visit.id);
    const savedRequest = requests.opening;
    if (savedRequest) {
      if (savedRequest.source && !savedRequest.openedVisitId)
        setSelected(savedRequest.source);
      api<Intent>("intents/" + savedRequest.intentId)
        .then((next) => {
          if (active) setIntent(next);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    }
    if (requests.continuation)
      api<Intent>("intents/" + requests.continuation.intentId)
        .then((next) => {
          if (active) setContinuation(next);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    api<Book>("works/" + visit.workId)
      .then((next) => {
        if (active) setBook(next);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id, visit?.workId]);
  useLayoutEffect(() => {
    if (!book || restored.current) return;
    const place = visit?.place;
    if (place) {
      if (root.current)
        restorePlace(root.current, {
          place,
          pixelOffset: visit.pixelOffset ?? 0,
        });
    } else window.scrollTo(0, 0);
    restored.current = true;
  }, [book, visit]);
  useEffect(() => {
    if (book?.publications.length && !hasSeenReadingGuide()) setGuideOpen(true);
  }, [book?.work.id, book?.publications.length]);
  useEffect(() => {
    if (!visit || !book) return;
    const save = () => {
      if (guiding.current) return;
      const position = root.current ? capturePlace(root.current) : undefined;
      if (position) updateVisit(visit.id, position);
    };
    let timer: ReturnType<typeof setTimeout>;
    const onscroll = () => {
      if (resizing.current || guiding.current) return;
      clearTimeout(timer);
      timer = setTimeout(save, 100);
    };
    window.addEventListener("scroll", onscroll);
    window.addEventListener("pagehide", save);
    let frame: number;
    const onresize = () => {
      if (guiding.current) return;
      clearTimeout(timer);
      resizing.current = true;
      cancelAnimationFrame(frame);
      const saved = loadReading().visits[visit.id];
      frame = requestAnimationFrame(() => {
        if (root.current && saved?.place)
          restorePlace(root.current, {
            place: saved.place,
            pixelOffset: saved.pixelOffset ?? 0,
          });
        resizing.current = false;
      });
    };
    window.addEventListener("resize", onresize);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onresize);
      window.removeEventListener("pagehide", save);
      window.removeEventListener("scroll", onscroll);
    };
  }, [visit?.id, book]);
  useEffect(() => {
    const pending = [intent, continuation].filter(
      (request): request is Intent =>
        Boolean(request && !["done", "failed", "paused"].includes(request.status)),
    );
    if (!pending.length) return;
    let active = true;
    const t = setInterval(
      () => {
        for (const request of pending)
          void api<Intent>("intents/" + request.id)
            .then(async (next) => {
              if (!active) return;
              let updated: Book | undefined;
              if (
                next.kind === "continue" &&
                (next.status === "done" ||
                  (next.latest_publication_id &&
                    next.latest_publication_id !== book?.publications.at(-1)?.id))
              )
                updated = await api<Book>("works/" + visit!.workId);
              if (!active) return;
              if (updated) setBook(updated);
              if (next.kind === "continue") setContinuation(next);
              else setIntent(next);
            })
            .catch((e) => {
              if (active) setError(e.message);
            });
      },
      3000,
    );
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [
    intent?.id,
    intent?.status,
    continuation?.id,
    continuation?.status,
    visit?.workId,
    book?.publications.at(-1)?.id,
  ]);
  useEffect(() => {
    if (!visit || !book) return;
    let active = true;
    const signal = async () => {
      if (document.visibilityState !== "visible" || !root.current || guiding.current) return;
      const position = capturePlace(root.current);
      if (!position) return;
      try {
        const changes = await api<{
          publications: string[];
          openings: string[];
        }>("works/" + visit.workId + "/reading", position.place);
        if (
          changes.publications.join() !==
            book.publications.map((p) => p.id).join() ||
          changes.openings.join() !== book.openings.map((o) => o.id).join()
        ) {
          const updated = await api<Book>("works/" + visit.workId);
          if (active) setBook(updated);
        }
      } catch {
        /* A background reading signal does not interrupt the saved book. */
      }
    };
    const first = setTimeout(() => void signal(), 20000);
    const timer = setInterval(() => void signal(), 30000);
    return () => {
      active = false;
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [visit?.id, book]);
  const select = () => {
    const s = window.getSelection();
    if (!s?.rangeCount || s.isCollapsed) return;
    const r = s.getRangeAt(0);
    const start = (
      r.startContainer.nodeType === 1
        ? (r.startContainer as Element)
        : r.startContainer.parentElement
    )?.closest<HTMLElement>("[data-block]");
    const end = (
      r.endContainer.nodeType === 1
        ? (r.endContainer as Element)
        : r.endContainer.parentElement
    )?.closest<HTMLElement>("[data-block]");
    if (!start || !end || start.dataset.publication !== end.dataset.publication)
      return;
    if (start.tagName === "FIGURE" || end.tagName === "FIGURE") return;
    const offset = (element: HTMLElement, node: Node, n: number) => {
      const before = document.createRange();
      before.selectNodeContents(element);
      before.setEnd(node, n);
      return before.toString().length;
    };
    const a = offset(start, r.startContainer, r.startOffset),
      b = offset(end, r.endContainer, r.endOffset);
    const publication = book!.publications.find(
      (p) => p.id === start.dataset.publication,
    )!;
    const first = publication.blocks.findIndex((x) => x.id === start.id),
      last = publication.blocks.findIndex((x) => x.id === end.id);
    const quote = publication.blocks
      .slice(first, last + 1)
      .map((x, i, arr) =>
        x.text.slice(i === 0 ? a : 0, i === arr.length - 1 ? b : undefined),
      )
      .join("\n\n");
    setSelected({
      publicationId: publication.id,
      blockId: start.id,
      offset: a,
      endBlockId: end.id,
      endOffset: b,
      quote,
    });
    setIntent(undefined);
  };
  const request = async (kind: "continue" | "explore") => {
    try {
      setError("");
      if (kind === "continue") {
        const current = await api<Book>("works/" + visit.workId);
        if (current.publications.at(-1)?.id !== book?.publications.at(-1)?.id) {
          if (currentVisit.current === id) {
            setBook(current);
            setContinuation(undefined);
          }
          return;
        }
      }
      const source = kind === "explore" ? selected : undefined;
      const key =
        kind === "continue"
          ? `continue:${visit.workId}:${book?.publications.at(-1)?.id ?? "start"}`
          : await explorationKey(visit.id, source!);
      const result = await api<Intent>("intents", {
        kind,
        workId: visit.workId,
        key,
        source,
        ...(kind === "continue"
          ? { afterPublicationId: book?.publications.at(-1)?.id }
          : {}),
      });
      if (currentVisit.current === id) {
        if (kind === "continue") setContinuation(result);
        else setIntent(result);
      }
      const state = loadReading();
      state.requests[key] = { intentId: result.id, visitId: visit.id, source };
      saveReading(state);
    } catch (e) {
      if (currentVisit.current === id) setError((e as Error).message);
    }
  };
  const changeFont = (next: number) => {
    const saved = root.current ? capturePlace(root.current) : undefined;
    setFont(next);
    const state = loadReading();
    state.fontSize = next;
    saveReading(state);
    requestAnimationFrame(() => {
      if (root.current && saved) restorePlace(root.current, saved);
    });
  };
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (guiding.current || (e.target as HTMLElement).matches("input,textarea,button")) return;
      if (e.key === "ArrowRight") {
        window.scrollBy({ top: window.innerHeight - 150, behavior: "smooth" });
      }
      if (e.key === "ArrowLeft") {
        window.scrollBy({ top: -window.innerHeight + 150, behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  if (!visit)
    return (
      <main className="waiting">
        <h1>This reading place is unavailable.</h1>
        <Link to="/">Return to the library</Link>
      </main>
    );
  const render = (b: Block, pub: string) => {
    const props = { id: b.id, "data-block": true, "data-publication": pub };
    const text = (
      <InlineText nodes={b.inline ?? [{ kind: "text", text: b.text }]} />
    );
    switch (b.kind) {
      case "figure":
        return (
          <figure {...props} key={b.id}>
            <button
              className="image-button"
              aria-label={"Look closer: " + b.text}
              onClick={() => setEnlarged(b.assetId)}
            >
              <img
                src={"/api/assets/" + b.assetId}
                alt={b.text}
                width={b.width}
                height={b.height}
              />
            </button>
            {b.caption && <figcaption>{b.caption}</figcaption>}
            <button
              className="image-explore"
              onClick={() => {
                setSelected({
                  publicationId: pub,
                  blockId: b.id,
                  assetId: b.assetId,
                });
                setIntent(undefined);
              }}
            >
              Open this image as a book ↗
            </button>
          </figure>
        );
      case "heading": {
        const Heading = `h${b.level ?? 2}` as
          "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
        return (
          <Heading {...props} key={b.id}>
            {text}
          </Heading>
        );
      }
      case "quote":
        return (
          <blockquote {...props} key={b.id}>
            {text}
          </blockquote>
        );
      case "list":
        return b.ordered ? (
          <ol {...props} key={b.id}>
            {b.items?.map((n, i) => (
              <React.Fragment key={i}>
                {i > 0 ? "\n" : null}
                <li>
                  <InlineText nodes={n} />
                </li>
              </React.Fragment>
            ))}
          </ol>
        ) : (
          <ul {...props} key={b.id}>
            {b.items?.map((n, i) => (
              <React.Fragment key={i}>
                {i > 0 ? "\n" : null}
                <li>
                  <InlineText nodes={n} />
                </li>
              </React.Fragment>
            ))}
          </ul>
        );
      case "break":
        return <hr {...props} key={b.id} />;
      case "code":
        return (
          <pre {...props} key={b.id}>
            {b.text}
          </pre>
        );
      default:
        return (
          <p {...props} key={b.id}>
            {text}
          </p>
        );
    }
  };
  return (
    <>
      <header className="reader-bar">
        <div className="reader-navigation">
          {visit.parentId && (
            <button
              className="return"
              aria-label="Return to where you came from"
              onClick={() => {
                const position = root.current
                  ? capturePlace(root.current)
                  : undefined;
                if (position) updateVisit(visit.id, position);
                const origin = sourceReturn(visit.entry);
                if (origin) updateVisit(visit.parentId!, origin);
                navigate("/read/" + visit.parentId);
              }}
            >
              ↶ <span>Return</span>
            </button>
          )}
          <Link to="/" aria-label="The library">
            ⌂ <span>The library</span>
          </Link>
        </div>
        <span className="running-title">{book?.work.title}</span>
        <div className="type-controls">
          <button
            aria-label="Save this reading place"
            onClick={() => {
              const position = root.current
                ? capturePlace(root.current)
                : undefined;
              if (position) {
                const state = loadReading();
                state.bookmarks[visit.workId] = {
                  ...position.place,
                  visitId: visit.id,
                };
                saveReading(state);
                setBookmarked(true);
              }
            }}
          >
            {bookmarked ? "Saved" : "Save place"}
          </button>
          <button
            aria-label="Smaller text"
            disabled={font <= 17}
            onClick={() => changeFont(font - 2)}
          >
            A−
          </button>
          <button
            aria-label="Larger text"
            disabled={font >= 31}
            onClick={() => changeFont(font + 2)}
          >
            A+
          </button>
        </div>
      </header>
      <main
        ref={root}
        className="book"
        style={{ fontSize: font }}
        onPointerDown={() => {
          const position = root.current
            ? capturePlace(root.current)
            : undefined;
          if (position) updateVisit(visit.id, position);
        }}
        onMouseUp={(event) => {
          if (!(event.target as Element).closest("button, a")) select();
        }}
        onTouchEnd={(event) => {
          if (!(event.target as Element).closest("button, a"))
            setTimeout(select, 100);
        }}
      >
        <div className="eyebrow">The Shape of Time</div>
        {book?.publications[0]?.blocks[0]?.kind !== "heading" ||
        book.publications[0].blocks[0].text !== book.work.title ? (
          <h1>{book?.work.title ?? "Opening…"}</h1>
        ) : null}
        {book?.publications.map((p) => (
          <section key={p.id}>
            {p.blocks.map((b) => (
              <React.Fragment key={b.id}>
                {render(b, p.id)}
                {book.openings
                  .filter((o) => o.source.blockId === b.id)
                  .map((o) => (
                    <button
                      className="prepared-opening"
                      key={o.id}
                      onClick={() =>
                        navigate(
                          "/read/" +
                            enter(o.target_work_id, visit.id, o.source),
                        )
                      }
                    >
                      {o.label} ↗
                    </button>
                  ))}
              </React.Fragment>
            ))}
          </section>
        ))}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        {book && (
          <footer className="frontier">
            <p>The story continues.</p>
            <button
              className="primary"
              onClick={() => request("continue")}
              disabled={
                continuation &&
                ["queued", "running"].includes(continuation.status)
              }
            >
              Continue reading →
            </button>
            {continuation && continuation.status !== "done" && (
              <p className="small" role="status">
                {["queued", "running"].includes(continuation.status)
                  ? "The next passage is taking shape. Your place is saved."
                  : (continuation.error ?? "The continuation is unavailable. Your place is saved.")}
              </p>
            )}
          </footer>
        )}
      </main>
      <nav className="page-controls" aria-label="Reading pages">
        <button aria-label="Show reading guide" onClick={() => setGuideOpen(true)}>?</button>
        <button
          aria-label="Previous page"
          onClick={() =>
            window.scrollBy({
              top: -window.innerHeight + 150,
              behavior: "smooth",
            })
          }
        >
          ←
        </button>
        <button
          aria-label="Next page"
          onClick={() =>
            window.scrollBy({
              top: window.innerHeight - 150,
              behavior: "smooth",
            })
          }
        >
          →
        </button>
      </nav>
      {guideOpen && book && <ReadingGuide key={visit.id} onClose={() => setGuideOpen(false)} />}
      {selected && (
        <OpeningPanel
          source={selected}
          intent={intent}
          error={error}
          onClose={() => {
            window.getSelection()?.removeAllRanges();
            setSelected(undefined);
          }}
          onRequest={() => void request("explore")}
          onEnter={(ready) => navigate("/read/" + enterRequested(ready.id, ready.result_work_id!, visit.id, selected))}
        />
      )}
      {enlarged && (
        <ImageDetail
          assetId={enlarged}
          onClose={() => setEnlarged(undefined)}
          onExplore={(region) => {
            const publication = book?.publications.find((p) =>
              p.blocks.some((b) => b.assetId === enlarged),
            );
            const block = publication?.blocks.find(
              (b) => b.assetId === enlarged,
            );
            if (publication && block) {
              setSelected({
                publicationId: publication.id,
                blockId: block.id,
                assetId: enlarged,
                ...(region ? { region } : {}),
              });
              setIntent(undefined);
              setEnlarged(undefined);
            }
          }}
        />
      )}
    </>
  );
}
function BookLink() {
  const { workId } = useParams();
  const navigate = useNavigate();
  useEffect(() => {
    if (workId) navigate("/read/" + enter(workId, null), { replace: true });
  }, [workId, navigate]);
  return <main className="waiting">Opening the book…</main>;
}
function readingRouter() {
  return createBrowserRouter([
  { path: "/", element: <Shelf /> },
  { path: "/read/:id", element: <Reader /> },
  { path: "/book/:workId", element: <BookLink /> },
  { path: "/waiting/:id", element: <Waiting /> },
  { path: "*", element: <Shelf /> },
]);
}
const root = createRoot(document.getElementById("root")!);
root.render(<main className="waiting">Opening the book…</main>);
async function startReading() {
  try {
    const library = await api<{ edition: { reading_key: string } }>("library");
    selectReadingEdition(library.edition.reading_key);
    root.render(<RouterProvider router={readingRouter()} />);
  } catch {
    root.render(<main className="waiting"><p>The book could not be opened.</p>
      <button onClick={() => void startReading()}>Try again</button></main>);
  }
}
void startReading();
