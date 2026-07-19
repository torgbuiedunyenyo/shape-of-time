import "./styles.css";

export function App() {
  return (
    <main className="reader-shell">
      <header className="reader-bar">
        <span className="library-mark" aria-hidden="true">
          S/T
        </span>
        <p>Shape of Time</p>
        <button type="button" disabled aria-label="Open library">
          Library
        </button>
      </header>
      <article className="folio" aria-labelledby="reader-title">
        <p className="kicker">An illustrated hyperbook</p>
        <h1 id="reader-title">The reader is taking shape.</h1>
        <p>
          Soon, each turn will reveal a short passage and the image that belongs beside it. A phrase
          may open another book without closing this one.
        </p>
        <div className="folio-rule" aria-hidden="true" />
        <p className="folio-note">Shape of Time · folio zero</p>
      </article>
    </main>
  );
}
