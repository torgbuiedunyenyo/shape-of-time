import { describe, expect, it } from "vitest";

import { assertFolioTransition, canTransitionFolio } from "./folio-state.js";

describe("folio publication state", () => {
  it("permits only the forward publication path and pre-exposure failure", () => {
    expect(canTransitionFolio("reserved", "generating")).toBe(true);
    expect(canTransitionFolio("generating", "ready")).toBe(true);
    expect(canTransitionFolio("ready", "exposed")).toBe(true);
    expect(canTransitionFolio("reserved", "failed")).toBe(true);
    expect(canTransitionFolio("generating", "failed")).toBe(true);
    expect(canTransitionFolio("ready", "failed")).toBe(true);
    expect(canTransitionFolio("failed", "reserved")).toBe(true);
  });

  it("rejects skips, retries in place, and every mutation after exposure", () => {
    for (const [from, to] of [
      ["reserved", "ready"],
      ["reserved", "exposed"],
      ["generating", "reserved"],
      ["ready", "generating"],
      ["exposed", "failed"],
      ["exposed", "exposed"],
      ["failed", "generating"],
    ] as const) {
      expect(canTransitionFolio(from, to)).toBe(false);
      expect(() => assertFolioTransition(from, to)).toThrow(
        `illegal folio transition: ${from} -> ${to}`,
      );
    }
  });
});
