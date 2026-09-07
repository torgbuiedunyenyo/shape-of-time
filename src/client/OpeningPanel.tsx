import type { Anchor, Intent } from "../shared/types.js";
import { openingStatus } from "./requests.js";

export function OpeningPanel({ source, intent, onClose, onRequest, onEnter, error }: {
  source: Anchor;
  intent?: Intent;
  onClose: () => void;
  onRequest: () => void;
  onEnter: (intent: Intent) => void;
  error?: string;
}) {
  return <aside className="exploration" aria-label="Open as a book">
    <button className="close" aria-label="Close exploration" onClick={onClose}>×</button>
    <p className="eyebrow">An opening</p>
    {source.quote && <blockquote>{source.quote}</blockquote>}
    {intent?.kind === "explore" && intent.result_work_id ? (
      <button className="primary" onClick={() => onEnter(intent)}>Enter the book ↗</button>
    ) : intent?.kind === "explore" && ["queued", "running", "paused", "failed"].includes(intent.status) ? (
      <button className="primary" onClick={onClose}>Keep reading</button>
    ) : (
      <button className="primary" onClick={onRequest}>Open as a book ↗</button>
    )}
    {intent?.kind === "explore" && <p role="status" className="small">
      {openingStatus(intent)}
    </p>}
    {error && <p role="alert">{error}</p>}
  </aside>;
}
