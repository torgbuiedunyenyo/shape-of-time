import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  READER_STORAGE_KEY,
  decodeReaderRecord,
  emptyReaderRecord,
  type ApertureJourney,
  type ReaderPlace,
  type ReaderRecord,
} from "./reader-state.js";

interface ReaderStoreValue {
  record: ReaderRecord;
  discoverBook: (bookId: string) => void;
  setActiveReturn: (journey: ApertureJourney | null) => void;
  setResume: (place: ReaderPlace) => void;
  toggleBookmark: (place: ReaderPlace) => void;
}

const ReaderStoreContext = createContext<ReaderStoreValue | null>(null);

function readInitialRecord() {
  if (typeof window === "undefined") return emptyReaderRecord();
  return decodeReaderRecord(window.localStorage.getItem(READER_STORAGE_KEY));
}

function persist(record: ReaderRecord) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(READER_STORAGE_KEY, JSON.stringify(record));
  }
  return record;
}

function samePlace(left: ReaderPlace | null, right: ReaderPlace | null) {
  return (
    left?.bookId === right?.bookId &&
    left?.folioId === right?.folioId &&
    left?.anchorBlockId === right?.anchorBlockId
  );
}

export function ReaderStoreProvider({ children }: { children: ReactNode }) {
  const [record, setRecord] = useState<ReaderRecord>(readInitialRecord);

  const discoverBook = useCallback((bookId: string) => {
    setRecord((current) =>
      current.discoveredBookIds.includes(bookId)
        ? current
        : persist({ ...current, discoveredBookIds: [...current.discoveredBookIds, bookId] }),
    );
  }, []);

  const setResume = useCallback((place: ReaderPlace) => {
    setRecord((current) =>
      samePlace(current.resume, place) ? current : persist({ ...current, resume: place }),
    );
  }, []);

  const setActiveReturn = useCallback((journey: ApertureJourney | null) => {
    setRecord((current) => {
      if (JSON.stringify(current.activeReturn) === JSON.stringify(journey)) return current;
      return persist({ ...current, activeReturn: journey });
    });
  }, []);

  const toggleBookmark = useCallback((place: ReaderPlace) => {
    setRecord((current) => {
      const index = current.bookmarks.findIndex((bookmark) => samePlace(bookmark, place));
      if (index >= 0) {
        return persist({
          ...current,
          bookmarks: current.bookmarks.filter((_, bookmarkIndex) => bookmarkIndex !== index),
        });
      }
      return persist({ ...current, bookmarks: [...current.bookmarks, place] });
    });
  }, []);

  const value = useMemo(
    () => ({ record, discoverBook, setActiveReturn, setResume, toggleBookmark }),
    [discoverBook, record, setActiveReturn, setResume, toggleBookmark],
  );

  return <ReaderStoreContext.Provider value={value}>{children}</ReaderStoreContext.Provider>;
}

export function useReaderStore() {
  const store = useContext(ReaderStoreContext);
  if (store === null) throw new Error("useReaderStore must be used inside ReaderStoreProvider");
  return store;
}

export function placesMatch(left: ReaderPlace | null, right: ReaderPlace | null) {
  return samePlace(left, right);
}
