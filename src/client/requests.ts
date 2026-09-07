import type { Anchor, Intent } from "../shared/types.js";

export function openingStatus(intent?: Pick<Intent, "status" | "result_work_id" | "error">) {
  if (!intent) return "Checking the opening…";
  if (intent.result_work_id) return "The opening is ready to read. More can unfold while you read.";
  if (intent.error) return intent.error;
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
