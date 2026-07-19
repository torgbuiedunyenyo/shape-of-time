import { describe, expect, it } from "vitest";

import {
  MAP_BOOK_ID,
  ROOT_BOOK_ID,
  getBook,
  getFolio,
  getNextFolio,
  getPreviousFolio,
  readerSlice,
} from "./reader-slice.js";

function wordCount(text: string) {
  return text.trim().split(/\s+/u).filter(Boolean).length;
}

describe("reader-first content slice", () => {
  it("contains exactly one eight-folio root and one independent two-folio child", () => {
    expect(readerSlice.version).toBe(1);
    expect(readerSlice.books.map((book) => book.id)).toEqual([ROOT_BOOK_ID, MAP_BOOK_ID]);

    const root = getBook(ROOT_BOOK_ID);
    const child = getBook(MAP_BOOK_ID);
    expect(root.folios).toHaveLength(8);
    expect(child.folios).toHaveLength(2);
    expect(root.folios.map((folio) => folio.ordinal)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(child.folios.map((folio) => folio.ordinal)).toEqual([1, 2]);
    expect(child.origin?.sourceBookId).toBe(ROOT_BOOK_ID);
    expect(child.origin?.quote).toBe("The maps were always becoming wrong");
  });

  it("keeps every folio readable, stable, and inside the intended pagewise range", () => {
    const ids = new Set<string>();

    for (const book of readerSlice.books) {
      expect(book.title.trim()).not.toBe("");
      expect(ids.has(book.id)).toBe(false);
      ids.add(book.id);

      for (const folio of book.folios) {
        expect(ids.has(folio.id)).toBe(false);
        ids.add(folio.id);
        expect(folio.blocks.length).toBeGreaterThanOrEqual(2);

        const prose = folio.blocks.map((block) => block.text).join(" ");
        expect(wordCount(prose), `${book.title} / ${folio.title}`).toBeGreaterThanOrEqual(120);
        expect(wordCount(prose), `${book.title} / ${folio.title}`).toBeLessThanOrEqual(250);

        for (const block of folio.blocks) {
          expect(ids.has(block.id)).toBe(false);
          ids.add(block.id);
          expect(block.text.trim()).not.toBe("");
        }
      }
    }
  });

  it("contains exactly four meaningful narrative plates with fixed identities", () => {
    const plates = readerSlice.books.flatMap((book) =>
      book.folios.flatMap((folio) => (folio.plate === undefined ? [] : [folio.plate])),
    );

    expect(plates.map((plate) => plate.id)).toEqual([
      "plate-root-payment",
      "plate-root-band",
      "plate-root-map",
      "plate-map-terminal-wall",
    ]);
    for (const plate of plates) {
      expect(plate.src).toMatch(/^\//u);
      expect(plate.alt.trim().length).toBeGreaterThan(24);
      expect(plate.narrativeJob.trim()).not.toBe("");
      expect(plate.proseWithholds.trim()).not.toBe("");
    }
  });

  it("opens one exact UTF-16 aperture into a real destination", () => {
    const apertures = readerSlice.books.flatMap((book) =>
      book.folios.flatMap((folio) => folio.apertures),
    );
    expect(apertures).toHaveLength(1);

    const aperture = apertures[0];
    expect(aperture).toBeDefined();
    if (aperture === undefined) return;

    const source = getFolio(ROOT_BOOK_ID, "root-folio-07");
    const block = source.blocks.find((candidate) => candidate.id === aperture.blockId);
    expect(block).toBeDefined();
    expect(block?.text.slice(aperture.startOffset, aperture.endOffset)).toBe(aperture.quote);
    expect(aperture.quote).toBe("The maps were always becoming wrong");
    expect(getFolio(aperture.targetBookId, aperture.targetFolioId).ordinal).toBe(1);
  });

  it("turns only to contiguous folios and marks both movement rests as continuable", () => {
    expect(getPreviousFolio(ROOT_BOOK_ID, "root-folio-01")).toBeNull();
    expect(getNextFolio(ROOT_BOOK_ID, "root-folio-01")?.id).toBe("root-folio-02");
    expect(getPreviousFolio(ROOT_BOOK_ID, "root-folio-02")?.id).toBe("root-folio-01");
    expect(getNextFolio(ROOT_BOOK_ID, "root-folio-08")).toBeNull();
    expect(getNextFolio(MAP_BOOK_ID, "map-folio-02")).toBeNull();

    for (const terminal of [
      getFolio(ROOT_BOOK_ID, "root-folio-08"),
      getFolio(MAP_BOOK_ID, "map-folio-02"),
    ]) {
      expect(terminal.movementRest?.label).not.toMatch(/the end/iu);
      expect(terminal.movementRest?.continuation.trim()).not.toBe("");
    }
  });
});
