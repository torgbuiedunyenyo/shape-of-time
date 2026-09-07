import type { Anchor, Intent } from "../shared/types.js";

// A paused request can recover without a new purchase; keep observing its saved identity.
export const requestNeedsPolling = (status: string) => !["done", "cancelled"].includes(status);

export function continuationStatus(intent: Pick<Intent, "status" | "queue">) {
  if (["paused", "failed"].includes(intent.status) || intent.queue?.blocked)
    return "New writing has paused and needs attention. Your continuation is saved; the published story remains available.";
  if (intent.status === "queued") return intent.queue?.ahead
    ? `${intent.queue.ahead === 1 ? "One reading request is" : `${intent.queue.ahead} reading requests are`} ahead of your continuation. Your place is saved.`
    : "Your continuation is waiting to begin. Your place is saved.";
  if (intent.status === "running") return "The next passage is taking shape. It will appear here when ready; your place is saved.";
  return "This continuation is no longer active. Your place is saved.";
}

export function openingStatus(intent?: Pick<Intent, "status" | "result_work_id" | "error" | "queue">) {
  if (!intent) return "Checking the opening…";
  if (intent.result_work_id) return "The opening is ready to read.";
  if (["paused", "failed"].includes(intent.status)) return "This opening has paused and needs attention. Your request is saved; you can keep reading elsewhere.";
  if (intent.queue?.blocked) return "New writing is paused while a problem is resolved. Your opening is saved in the queue; you can keep reading elsewhere.";
  if (intent.status === "queued" && intent.queue?.ahead) return `${intent.queue.ahead === 1 ? "One reading request is" : `${intent.queue.ahead} reading requests are`} ahead of this opening. You can keep reading and find it again under Your openings in Contents. Entry appears when its first passage is ready.`;
  if (intent.status === "queued") return "Waiting to begin. You can keep reading; entry will appear as soon as the first passage is ready.";
  if (intent.status === "running") return "The first passage is taking shape. You can enter as soon as it is ready.";
  return "The opening is not yet ready to read. Your request is saved.";
}

export async function explorationKey(
  visitId: string,
  source: Anchor,
) {
  const bytes = new TextEncoder().encode(
    // Preserve the identity of existing direction-free requests across this interface update.
    JSON.stringify({ visitId, source, angle: "" }),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return (
    "explore:" +
    Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("")
  );
}
