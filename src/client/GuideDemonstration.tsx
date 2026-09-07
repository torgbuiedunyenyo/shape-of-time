import { useState } from "react";

/** A visual rehearsal using this page's prose/image. It never selects a source or makes a request. */
export function GuideDemonstration({ kind }: { kind: "text" | "image" }) {
  const [replay, setReplay] = useState(0);
  const [sample] = useState(() => {
    const paragraph = document.querySelector(".book p[data-block]")?.textContent ?? "";
    const image = document.querySelector<HTMLImageElement>(".book .image-button img");
    return { words: paragraph.trim().split(/\s+/).slice(0, 22), src: image?.src, alt: image?.alt };
  });
  return <div className="guide-demonstration">
    <div key={replay} className={`guide-rehearsal guide-rehearsal-${kind}`} role="img"
      aria-label={kind === "text" ? "Demonstration: drag over a few words to highlight them, then choose Open as a book." : "Demonstration: choose a detail, then drag from one corner to another to draw a selection box on the illustration."}>
      {kind === "text" ? <>
        <p className="guide-sample" aria-hidden="true">{sample.words.map((word, i) => <span key={i}
          className={i >= 3 && i < 10 ? "guide-selected-word" : undefined}
          style={{ animationDelay: `${0.5 + (i - 3) * 0.18}s` }}>{word}{" "}</span>)}…</p>
        <span className="guide-preview-action" aria-hidden="true">Open as a book ↗</span>
      </> : <>
        <span className="guide-detail-label" aria-hidden="true">Choose a detail</span>
        <div className="guide-image-frame" aria-hidden="true">
          <img src={sample.src} alt={sample.alt ?? ""} />
          <div className="region-outline guide-drawn-region" />
          <svg className="guide-drag-pointer" width="24" height="28" viewBox="0 0 24 28"><path d="M2 2v21l6-6 4 9 4-2-4-9h9z" fill="#fffdf4" stroke="#26332b" strokeWidth="1.5" /></svg>
        </div>
        <span className="guide-preview-action" aria-hidden="true">Open this detail as a book ↗</span>
      </>}
    </div>
    <button className="guide-replay" onClick={() => setReplay(replay + 1)}>Replay demonstration ↻</button>
  </div>;
}
