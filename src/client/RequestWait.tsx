import { useEffect, useState } from "react";
import type { Intent } from "../shared/types.js";
import type { ReadingWait } from "../reading-wait.js";
import { waitState } from "./wait-state.js";

export function RequestWait({ intent, disconnected = false, compact = false }: { intent?: Intent; disconnected?: boolean; compact?: boolean }) {
  const [timing, setTiming] = useState<{ id: string; value: ReadingWait }>();
  const [now, setNow] = useState(Date.now);
  const needed = intent && ["queued", "running"].includes(intent.status) && !(intent.kind !== "continue" && intent.result_work_id);
  useEffect(() => {
    if (!intent?.id || !needed) return;
    const controller = new AbortController();
    const id = intent.id;
    void fetch("/api/reading-wait/" + encodeURIComponent(id), { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]) })
      .then(async r => {
        if (r.ok) {
          const value = await r.json() as ReadingWait;
          if (!controller.signal.aborted) setTiming({ id, value });
        }
      }).catch(() => { /* Timing is optional; request status remains authoritative. */ });
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [intent?.id, needed]);
  const currentTiming = timing?.id === intent?.id ? timing?.value : undefined;
  const state = waitState(intent, currentTiming, now, disconnected);
  if (compact) return <span className="wait-summary" data-state={state.state}>
    {state.state === "running" ? `Usually about ${currentTiming?.lowerMinutes ?? 6}–${currentTiming?.upperMinutes ?? 12} min`
      : state.state === "queued" ? "Waiting to begin"
      : state.state === "delayed" ? "Taking longer than usual"
      : state.state === "disconnected" ? "Reconnecting"
      : state.state === "paused" ? "Paused"
      : "Checking…"}
  </span>;
  return <div className="request-wait" data-state={state.state} role="status" aria-live="polite">
    <p>{state.text}</p>
    {state.estimate && <p className="wait-estimate">{state.estimate}</p>}
    {state.active && <span className="wait-line" aria-hidden="true" />}
  </div>;
}
