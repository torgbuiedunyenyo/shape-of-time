import fixture from "../../../content/reader-first/slice.json" with { type: "json" };

export const ROOT_BOOK_ID = "shape-of-time";
export const MAP_BOOK_ID = "map-on-the-wall";

export type FolioLayout = "text" | "split" | "image-led" | "plate";

export interface ReaderBlock {
  id: string;
  text: string;
}

export interface ReaderAperture {
  id: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  quote: string;
  targetBookId: string;
  targetFolioId: string;
}

export interface ReaderPlate {
  id: string;
  assetKey: string;
  src: string;
  alt: string;
  narrativeJob: string;
  proseWithholds: string;
}

export interface MovementRest {
  label: string;
  continuation: string;
}

export interface ReaderFolio {
  id: string;
  ordinal: number;
  title: string;
  layout: FolioLayout;
  blocks: ReaderBlock[];
  plate?: ReaderPlate;
  apertures: ReaderAperture[];
  movementRest?: MovementRest;
}

export interface ReaderBookOrigin {
  sourceBookId: string;
  sourceFolioId: string;
  apertureId: string;
  quote: string;
}

export interface ReaderBook {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  origin?: ReaderBookOrigin;
  folios: ReaderFolio[];
}

export interface ReaderFixture {
  version: 1;
  books: ReaderBook[];
}

type SourceFolio = Omit<ReaderFolio, "plate"> & {
  plate?: Omit<ReaderPlate, "src">;
};

type SourceBook = Omit<ReaderBook, "folios"> & {
  folios: SourceFolio[];
};

interface SourceFixture {
  version: 1;
  books: SourceBook[];
}

const plateSources: Record<string, string> = {
  "root-payment": "/assets/reader-first/root-payment.webp",
  "root-band": "/assets/reader-first/root-band.webp",
  "root-map": "/assets/reader-first/root-map.webp",
  "map-terminal-wall": "/assets/reader-first/map-terminal-wall.webp",
};

function hydrateFixture(source: SourceFixture): ReaderFixture {
  return {
    version: 1,
    books: source.books.map((book) => {
      const { folios, ...bookFields } = book;
      return {
        ...bookFields,
        folios: folios.map((folio) => {
          const { plate, ...folioFields } = folio;
          return {
            ...folioFields,
            ...(plate === undefined
              ? {}
              : { plate: { ...plate, src: plateSources[plate.assetKey] ?? "" } }),
          };
        }),
      };
    }),
  };
}

export const readerSlice = hydrateFixture(fixture as unknown as SourceFixture);

export function getBook(bookId: string): ReaderBook {
  const book = readerSlice.books.find((candidate) => candidate.id === bookId);
  if (book === undefined) throw new Error(`Unknown reader book: ${bookId}`);
  return book;
}

export function getFolio(bookId: string, folioId: string): ReaderFolio {
  const folio = getBook(bookId).folios.find((candidate) => candidate.id === folioId);
  if (folio === undefined) throw new Error(`Unknown reader folio: ${bookId}/${folioId}`);
  return folio;
}

export function getNextFolio(bookId: string, folioId: string): ReaderFolio | null {
  const book = getBook(bookId);
  const index = book.folios.findIndex((folio) => folio.id === folioId);
  if (index < 0) throw new Error(`Unknown reader folio: ${bookId}/${folioId}`);
  return book.folios[index + 1] ?? null;
}

export function getPreviousFolio(bookId: string, folioId: string): ReaderFolio | null {
  const book = getBook(bookId);
  const index = book.folios.findIndex((folio) => folio.id === folioId);
  if (index < 0) throw new Error(`Unknown reader folio: ${bookId}/${folioId}`);
  return index > 0 ? (book.folios[index - 1] ?? null) : null;
}
