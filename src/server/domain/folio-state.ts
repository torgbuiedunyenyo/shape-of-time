export const FOLIO_STATES = ["reserved", "generating", "ready", "exposed", "failed"] as const;

export type FolioState = (typeof FOLIO_STATES)[number];

const transitions: Readonly<Record<FolioState, ReadonlySet<FolioState>>> = {
  reserved: new Set(["generating", "failed"]),
  generating: new Set(["ready", "failed"]),
  ready: new Set(["exposed", "failed"]),
  exposed: new Set(),
  failed: new Set(["reserved"]),
};

export function canTransitionFolio(from: FolioState, to: FolioState): boolean {
  return transitions[from].has(to);
}

export function assertFolioTransition(from: FolioState, to: FolioState): void {
  if (!canTransitionFolio(from, to)) {
    throw new Error(`illegal folio transition: ${from} -> ${to}`);
  }
}
