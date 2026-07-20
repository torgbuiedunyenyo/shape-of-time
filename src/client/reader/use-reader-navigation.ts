import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";

import {
  type ReaderAperture,
  type ReaderFixture,
} from "../content/reader-slice.js";
import {
  enterAperture,
  planPageTurn,
  returnToPassage,
  type PageTurnHistory,
  type ReaderPlace,
  type ReturnPoint,
} from "./reader-state.js";
import { useReaderStore } from "./reader-store.js";

interface ReaderHistoryState extends PageTurnHistory {
  restoreReturnPoint?: ReturnPoint;
}

function readerPath(place: ReaderPlace) {
  return `/books/${encodeURIComponent(place.bookId)}/folios/${encodeURIComponent(place.folioId)}`;
}

function historyState(value: unknown): ReaderHistoryState {
  return typeof value === "object" && value !== null ? (value as ReaderHistoryState) : {};
}

export function useReaderNavigation(current: ReaderPlace, catalog: ReaderFixture) {
  const navigate = useNavigate();
  const location = useLocation();
  const { discoverBook, record, setActiveReturn } = useReaderStore();
  const state = useMemo(() => historyState(location.state), [location.state]);
  const activeJourney =
    state.journey?.destinationBookId === current.bookId
      ? state.journey
      : record.activeReturn?.destinationBookId === current.bookId
        ? record.activeReturn
        : null;

  useEffect(() => {
    if (state.journey?.destinationBookId === current.bookId) {
      setActiveReturn(state.journey);
      return;
    }
    if (record.activeReturn !== null && record.activeReturn.destinationBookId !== current.bookId) {
      setActiveReturn(null);
    }
  }, [current.bookId, record.activeReturn, setActiveReturn, state.journey]);

  const nextPlace = useMemo(() => {
    const book = catalog.books.find((candidate) => candidate.id === current.bookId);
    const index = book?.folios.findIndex((folio) => folio.id === current.folioId) ?? -1;
    const folio = index < 0 ? undefined : book?.folios[index + 1];
    return folio === null
      ? null
      : folio === undefined
        ? null
        : ({ bookId: current.bookId, folioId: folio.id, anchorBlockId: null } satisfies ReaderPlace);
  }, [catalog.books, current.bookId, current.folioId]);

  const previousPlace = useMemo(() => {
    const book = catalog.books.find((candidate) => candidate.id === current.bookId);
    const index = book?.folios.findIndex((folio) => folio.id === current.folioId) ?? -1;
    const folio = index <= 0 ? undefined : book?.folios[index - 1];
    return folio === null
      ? null
      : folio === undefined
        ? null
        : ({ bookId: current.bookId, folioId: folio.id, anchorBlockId: null } satisfies ReaderPlace);
  }, [catalog.books, current.bookId, current.folioId]);

  const goNext = useCallback(() => {
    if (nextPlace === null) return;
    const decision = planPageTurn(catalog, current, "next", activeJourney, state);
    if (decision === null) return;
    if (decision.kind === "history") {
      void navigate(decision.delta);
      return;
    }
    if (decision.journey !== null) setActiveReturn(decision.journey);
    void navigate(readerPath(decision.place), { state: decision.history satisfies ReaderHistoryState });
  }, [activeJourney, catalog, current, navigate, nextPlace, setActiveReturn, state]);

  const goPrevious = useCallback(() => {
    if (previousPlace === null) return;
    const decision = planPageTurn(catalog, current, "previous", activeJourney, state);
    if (decision === null) return;
    if (decision.kind === "history") {
      void navigate(decision.delta);
      return;
    }
    if (decision.journey !== null) setActiveReturn(decision.journey);
    void navigate(readerPath(decision.place), { state: decision.history satisfies ReaderHistoryState });
  }, [activeJourney, catalog, current, navigate, previousPlace, setActiveReturn, state]);

  const openAperture = useCallback(
    async (aperture: ReaderAperture) => {
      const transition = enterAperture(current, aperture);
      const sourceState: ReaderHistoryState = { restoreReturnPoint: transition.journey.returnPoint };
      await Promise.resolve(navigate(readerPath(current), { replace: true, state: sourceState }));
      discoverBook(aperture.targetBookId);
      setActiveReturn(transition.journey);
      await Promise.resolve(
        navigate(readerPath(transition.place), {
          state: {
            previousPlace: current,
            journey: transition.journey,
            canHistoryReturn: true,
          } satisfies ReaderHistoryState,
        }),
      );
    },
    [current, discoverBook, navigate, setActiveReturn],
  );

  const backToPassage = useCallback(() => {
    const decision = returnToPassage(activeJourney, state.canHistoryReturn === true);
    if (decision === null) return;
    if (decision.kind === "history") {
      void navigate(decision.delta);
      return;
    }
    setActiveReturn(null);
    void navigate(readerPath(decision.place), {
      replace: true,
      state: { restoreReturnPoint: decision.returnPoint } satisfies ReaderHistoryState,
    });
  }, [activeJourney, navigate, setActiveReturn, state.canHistoryReturn]);

  return {
    activeJourney,
    backToPassage,
    goNext,
    goPrevious,
    nextPlace,
    openAperture,
    previousPlace,
    restoreReturnPoint: state.restoreReturnPoint,
  };
}
