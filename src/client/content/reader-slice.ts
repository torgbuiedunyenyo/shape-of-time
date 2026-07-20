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
  "root-payment":
    "/assets/reader-first/6f56ea3feafa7b2fca6b8c1266aebb9cccd700530f364f2aae7034d996c0d34f.webp",
  "root-band":
    "/assets/reader-first/44a0ae4b9184ce76b41d1962e34db11cbab193d2f9b5ce6ad1297eb51461c9db.webp",
  "root-map":
    "/assets/reader-first/09cffab12053f5fc91e2d4e8b61f216e7751e59465c90b1a1a6942f06c2cdf73.webp",
  "map-terminal-wall":
    "/assets/reader-first/8c5e8e19bf3a1786ed7b5cce480cb0744c6dc01496d9692d16282d7cb6611b79.webp",
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
