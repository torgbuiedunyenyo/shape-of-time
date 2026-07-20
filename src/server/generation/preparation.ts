import type { LibraryRepository } from "../repositories/library-repository.js";
import { FableContractError } from "../text/fable-contract.js";
import {
  generateNextFolio,
  type FolioGenerationDependencies,
} from "./folio-generator.js";

/**
 * D5: prepare likely pages and apertures during reading time (PLAN §D5). Preparation shares the
 * D3 idempotency namespace — a prepared folio IS the folio the reader's turn asks for, so a
 * normal prepared turn is a cache hit and duplicate spend is structurally impossible. This module
 * is invoked only from explicit exposure/visibility events; a GET route or browser-only lock must
 * never reach it (the route layer enforces POST-only, and nothing here creates a route).
 */
export interface PreparationBudget {
  /** D5 deliberately permits only the immediately next folio. */
  horizon: 1;
}

export interface PreparationOutcome {
  failed: { code: string; message: string; ordinal: number }[];
  prepared: { ordinal: number; spent: boolean }[];
}

export async function prepareOnExposure(
  dependencies: FolioGenerationDependencies,
  input: {
    bookId: string;
    budget: PreparationBudget;
    exposedOrdinal: number;
    movementId: string;
    workerId: string;
  },
): Promise<PreparationOutcome> {
  const { budget } = input;
  if (budget.horizon !== 1) {
    throw new Error("preparation horizon is fixed at exactly one next folio");
  }

  const outcome: PreparationOutcome = { failed: [], prepared: [] };
  const ordinal = input.exposedOrdinal + 1;
  try {
    const { spent } = await generateNextFolio(dependencies, {
      bookId: input.bookId,
      movementId: input.movementId,
      ordinal,
      workerId: input.workerId,
    });
    outcome.prepared.push({ ordinal, spent });
  } catch (error) {
    outcome.failed.push({
      code: error instanceof FableContractError ? error.code : "generation_failed",
      message: error instanceof Error ? error.message : String(error),
      ordinal,
    });
  }
  outcome.failed.sort((left, right) => left.ordinal - right.ordinal);
  outcome.prepared.sort((left, right) => left.ordinal - right.ordinal);
  return outcome;
}

export interface PreparationEconomy {
  exposed: number;
  latenciesMs: number[];
  preparedUnread: number;
  readyOrExposed: number;
}

/**
 * Hit/waste measurement straight from the ledger — no derived counters. `preparedUnread` is the
 * current waste candidate set: folios bought and not yet reached. Dwell is a reader-side signal
 * and is measured in the reader integration, not here.
 */
export async function measurePreparationEconomy(
  repository: LibraryRepository,
  bookId: string,
): Promise<PreparationEconomy> {
  const folios = await repository.listFolios(bookId);
  const exposed = folios.filter((folio) => folio.state === "exposed");
  const ready = folios.filter((folio) => folio.state === "ready");
  const latenciesMs: number[] = [];
  for (const folio of [...exposed, ...ready]) {
    const evidence = await repository.getAttemptEvidence(folio.id);
    if (evidence.latencyMs !== null) latenciesMs.push(Number(evidence.latencyMs));
  }
  return {
    exposed: exposed.length,
    latenciesMs,
    preparedUnread: ready.length,
    readyOrExposed: exposed.length + ready.length,
  };
}
