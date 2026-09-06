import type { Anchor } from "../shared/types.js";

export async function explorationKey(
  visitId: string,
  source: Anchor,
  angle: string,
) {
  const bytes = new TextEncoder().encode(
    JSON.stringify({ visitId, source, angle }),
  );
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return (
    "explore:" +
    Array.from(new Uint8Array(digest), (b) =>
      b.toString(16).padStart(2, "0"),
    ).join("")
  );
}
