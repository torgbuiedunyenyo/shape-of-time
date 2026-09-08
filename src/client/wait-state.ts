import type { Intent } from "../shared/types.js";
import type { ReadingWait } from "../reading-wait.js";
import { continuationStatus, openingStatus } from "./requests.js";

export function waitState(intent: Intent | undefined, timing?: ReadingWait, now = Date.now(), disconnected = false) {
  // A readable opening wins even if later creative work pauses or status polling fails.
  if (intent?.kind !== "continue" && intent?.result_work_id)
    return { active: false, state: "ready", text: "The opening is ready to read.", estimate: "" };
  if (disconnected) return { active: false, state: "disconnected", text: "Reconnecting. Your request is saved.", estimate: "" };
  if (!intent) return { active: false, state: "checking", text: "Checking the opening…", estimate: "" };
  const text = intent.kind === "continue" ? continuationStatus(intent) : openingStatus(intent);
  if (!["queued", "running"].includes(intent.status) || intent.queue?.blocked)
    return { active: false, state: "paused", text, estimate: "" };
  const lower = timing?.lowerMinutes ?? 6, upper = timing?.upperMinutes ?? 12;
  if (intent.status === "queued") return {
    active: false, state: "queued", text: intent.queue?.ahead
      ? `${intent.kind === "continue" ? "The next passage" : "Your opening"} is waiting its turn. You can keep reading.`
      : "Waiting to begin. You can keep reading.",
    estimate: `Allow about ${lower}–${upper} minutes once it begins.`,
  };
  const elapsed = timing ? Math.max(0, (now - Date.parse(timing.requestedAt)) / 60_000) : 0;
  if (elapsed > upper) return {
    active: true, state: "delayed", text: "Taking longer than usual.",
    estimate: intent.kind === "continue" ? "The next passage is still being prepared. Your place is saved." : "Your opening is still being prepared. You can keep reading.",
  };
  return { active: true, state: "running", text: intent.kind === "continue" ? "The next passage is taking shape." : "The first passage is taking shape.",
    estimate: `Usually about ${lower}–${upper} minutes from your request. You can keep reading.` };
}
