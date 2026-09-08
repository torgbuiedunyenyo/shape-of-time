import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import type { Intent } from "../shared/types.js";
import { enterRequested, loadReading, type ReadingRequest } from "./visits.js";
import { RequestWait } from "./RequestWait.js";

export function outstandingOpenings(requests: Record<string, ReadingRequest>) {
  return Object.values(requests).filter(r => r.source && !r.openedVisitId).reverse();
}

/** Only this browser's saved requests, never the edition's global queue. */
export function OpeningTray() {
  const [records, setRecords] = useState(() => outstandingOpenings(loadReading().requests));
  const [intents, setIntents] = useState<Record<string, Intent>>({});
  const [disconnected, setDisconnected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const refresh = () => {
      const next = outstandingOpenings(loadReading().requests);
      setRecords(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    window.addEventListener("reading-changed", refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener("reading-changed", refresh); window.removeEventListener("storage", refresh); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    let loading = false;
    const poll = async () => {
      if (loading) return;
      loading = true;
      await Promise.allSettled(records.map(async record => {
        try {
          const response = await fetch("/api/intents/" + encodeURIComponent(record.intentId), { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) });
          if (!response.ok) throw new Error("Unavailable");
          const intent = await response.json() as Intent;
          if (!controller.signal.aborted) {
            setIntents(previous => ({ ...previous, [record.intentId]: intent }));
            setDisconnected(previous => ({ ...previous, [record.intentId]: false }));
          }
        } catch {
          if (!controller.signal.aborted) setDisconnected(previous => ({ ...previous, [record.intentId]: true }));
        }
      }));
      loading = false;
    };
    void poll();
    const timer = setInterval(() => void poll(), 5000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [records]);
  const visible = records.filter(r => intents[r.intentId]?.status !== "cancelled");
  if (!visible.length) return null;
  const ready = visible.find(r => intents[r.intentId]?.result_work_id);
  const title = ready ? `${intents[ready.intentId].result_title ?? "Your book"} is ready` : visible.length === 1 ? "Your opening" : `${visible.length} openings`;
  return <aside className="opening-tray" aria-label="Your openings">
    <button className="opening-tray-toggle" aria-expanded={expanded} aria-controls="opening-tray-list" onClick={() => setExpanded(!expanded)}>
      <span role="status">{title}{!ready && visible.length === 1 && <RequestWait compact intent={intents[visible[0].intentId]} disconnected={disconnected[visible[0].intentId]} />}</span><span aria-hidden="true">{expanded ? "−" : ready ? "↗" : "+"}</span>
    </button>
    {expanded && <div id="opening-tray-list" className="opening-tray-list">
      {visible.map(record => {
        const intent = intents[record.intentId];
        return <section key={record.intentId}>
          <h2>{intent?.result_title ?? record.label ?? "An opening"}</h2>
          {!intent?.result_work_id && record.source?.quote && <blockquote>{record.source.quote}</blockquote>}
          <RequestWait intent={intent} disconnected={disconnected[record.intentId]} />
          {intent?.result_work_id && <button className="primary" onClick={() => {
            const visit = enterRequested(intent.id, intent.result_work_id!, record.visitId, record.source);
            setExpanded(false);
            navigate("/read/" + visit);
          }}>Open the book ↗</button>}
        </section>;
      })}
    </div>}
  </aside>;
}
