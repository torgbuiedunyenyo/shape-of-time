import type { Anchor } from "../shared/types.js";
export type Visit = {
  id: string;
  workId: string;
  parentId: string | null;
  entry?: Anchor;
  place?: Anchor;
  pixelOffset?: number;
};
type Reading = {
  visits: Record<string, Visit>;
  current: string | null;
  fontSize: number;
  bookmarks: Record<string, Anchor>;
  requests: Record<
    string,
    {
      intentId: string;
      visitId: string | null;
      source?: Anchor;
      label?: string;
      openedVisitId?: string;
    }
  >;
};
const empty = (): Reading => ({
  visits: {},
  current: null,
  fontSize: 21,
  bookmarks: {},
  requests: {},
});
export function loadReading(): Reading {
  try {
    return {
      ...empty(),
      ...JSON.parse(localStorage.getItem("shape-of-time-reading-v1") ?? "{}"),
    };
  } catch {
    return empty();
  }
}
export function saveReading(state: Reading) {
  localStorage.setItem("shape-of-time-reading-v1", JSON.stringify(state));
}
export function enter(workId: string, parentId: string | null, entry?: Anchor) {
  const state = loadReading(),
    id = crypto.randomUUID();
  state.visits[id] = { id, workId, parentId, entry };
  state.current = id;
  saveReading(state);
  return id;
}
export function updateVisit(id: string, patch: Partial<Visit>) {
  const state = loadReading();
  if (state.visits[id]) state.visits[id] = { ...state.visits[id], ...patch };
  saveReading(state);
}

/** The child's source is immutable even if someone has since read elsewhere in its parent. */
export function sourceReturn(entry?: Anchor) {
  if (!entry) return undefined;
  const place = { ...entry };
  if (place.region)
    place.imageFraction = place.region.y + place.region.height / 2;
  return { place, pixelOffset: 0 };
}

export function enterRequested(
  intentId: string,
  workId: string,
  parentId: string | null,
  source?: Anchor,
) {
  const state = loadReading();
  const saved = Object.entries(state.requests).find(
    ([, r]) => r.intentId === intentId,
  );
  if (saved?.[1].openedVisitId && state.visits[saved[1].openedVisitId])
    return saved[1].openedVisitId;
  const id = enter(workId, parentId, source);
  if (saved) {
    const next = loadReading();
    next.requests[saved[0]].openedVisitId = id;
    saveReading(next);
  }
  return id;
}
