import { describe, expect, it } from "vitest";

import { getFolio, readerSlice } from "../content/reader-slice.js";
import {
  decodeReaderRecord,
  emptyReaderRecord,
  enterAperture,
  planPageTurn,
  returnToPassage,
  serializeSelection,
} from "./reader-state.js";

const rootOne = { bookId: "shape-of-time", folioId: "root-folio-01", anchorBlockId: null };
const rootSeven = { bookId: "shape-of-time", folioId: "root-folio-07", anchorBlockId: null };

describe("reader navigation state", () => {
  it("turns one contiguous folio without losing aperture ancestry", () => {
    const rootTurn = planPageTurn(readerSlice, rootOne, "next", null);
    expect(rootTurn?.kind).toBe("push");
    if (rootTurn?.kind !== "push") return;
    expect(rootTurn.place.folioId).toBe("root-folio-02");
    expect(rootTurn.journey).toBeNull();

    const aperture = getFolio("shape-of-time", "root-folio-07").apertures[0];
    expect(aperture).toBeDefined();
    if (aperture === undefined) return;
    const entered = enterAperture(rootSeven, aperture);
    const childTurn = planPageTurn(readerSlice, entered.place, "next", entered.journey, {
      canHistoryReturn: true,
    });
    expect(childTurn?.kind).toBe("push");
    if (childTurn?.kind !== "push") return;
    expect(childTurn.place.folioId).toBe("map-folio-02");
    expect(childTurn.journey?.returnDepth).toBe(2);
    expect(childTurn.journey?.returnPoint.apertureId).toBe(aperture.id);
  });

  it("refuses a turn beyond either prepared movement", () => {
    expect(
      planPageTurn(
        readerSlice,
        { bookId: "shape-of-time", folioId: "root-folio-08", anchorBlockId: null },
        "next",
        null,
      ),
    ).toBeNull();
    expect(
      planPageTurn(
        readerSlice,
        { bookId: "map-on-the-wall", folioId: "map-folio-02", anchorBlockId: null },
        "next",
        null,
      ),
    ).toBeNull();
  });

  it("opens the prepared child with an exact source return", () => {
    const aperture = getFolio("shape-of-time", "root-folio-07").apertures[0];
    expect(aperture).toBeDefined();
    if (aperture === undefined) return;

    const transition = enterAperture(rootSeven, aperture);
    expect(transition.place).toEqual({
      bookId: "map-on-the-wall",
      folioId: "map-folio-01",
      anchorBlockId: null,
    });
    expect(transition.journey.destinationBookId).toBe("map-on-the-wall");
    expect(transition.journey.returnPoint).toMatchObject({
      source: rootSeven,
      apertureId: aperture.id,
      blockId: aperture.blockId,
      startOffset: aperture.startOffset,
      endOffset: aperture.endOffset,
      quote: aperture.quote,
    });
  });

  it("returns by history delta instead of pushing a duplicate", () => {
    const aperture = getFolio("shape-of-time", "root-folio-07").apertures[0];
    expect(aperture).toBeDefined();
    if (aperture === undefined) return;
    const entered = enterAperture(rootSeven, aperture);
    const childTurn = planPageTurn(readerSlice, entered.place, "next", entered.journey, {
      canHistoryReturn: true,
    });
    expect(childTurn?.kind).toBe("push");
    if (childTurn?.kind !== "push") return;

    expect(returnToPassage(childTurn.journey, true)).toEqual({
      kind: "history",
      delta: -2,
      returnPoint: entered.journey.returnPoint,
    });
  });

  it("uses the preceding history entry symmetrically for Previous then Next", () => {
    const rootTwo = { bookId: "shape-of-time", folioId: "root-folio-02", anchorBlockId: null };
    const previous = planPageTurn(readerSlice, rootTwo, "previous", null);
    expect(previous?.kind).toBe("push");
    if (previous?.kind !== "push") return;

    expect(planPageTurn(readerSlice, previous.place, "next", null, previous.history)).toEqual({
      kind: "history",
      delta: -1,
    });
  });

  it("falls back by replacing the current entry after a direct resume", () => {
    const aperture = getFolio("shape-of-time", "root-folio-07").apertures[0];
    expect(aperture).toBeDefined();
    if (aperture === undefined) return;
    const entered = enterAperture(rootSeven, aperture);

    expect(returnToPassage(entered.journey, false)).toEqual({
      kind: "replace",
      place: rootSeven,
      returnPoint: entered.journey.returnPoint,
    });
  });

  it("round-trips the versioned local reader record and rejects corrupt versions", () => {
    const record = {
      ...emptyReaderRecord(),
      discoveredBookIds: ["map-on-the-wall"],
      bookmarks: [rootSeven],
      resume: rootSeven,
    };
    expect(decodeReaderRecord(JSON.stringify(record))).toEqual(record);
    expect(decodeReaderRecord("not json")).toEqual(emptyReaderRecord());
    expect(decodeReaderRecord(JSON.stringify({ ...record, version: 2 }))).toEqual(emptyReaderRecord());
  });

  it("serializes a cross-paragraph selection with stable block offsets", () => {
    const folio = getFolio("shape-of-time", "root-folio-01");
    const first = folio.blocks[0];
    const second = folio.blocks[1];
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    if (first === undefined || second === undefined) return;

    const selection = serializeSelection(folio.blocks, {
      start: { blockId: first.id, offset: 4 },
      end: { blockId: second.id, offset: 12 },
    });
    expect(selection?.start).toEqual({ blockId: first.id, offset: 4 });
    expect(selection?.end).toEqual({ blockId: second.id, offset: 12 });
    expect(selection?.quote).toBe(`${first.text.slice(4)}\n\n${second.text.slice(0, 12)}`);
  });
});
