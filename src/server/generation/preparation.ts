import type { FolioRecord, LibraryRepository } from "../repositories/library-repository.js";
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
  /** How many folios past the exposed one to prepare (next, second-next → 2). */
  horizon: number;
  maxConcurrentPreparations: number;
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
  if (!Number.isInteger(budget.horizon) || budget.horizon < 0) {
    throw new Error("preparation horizon must be a non-negative integer");
  }
  if (!Number.isInteger(budget.maxConcurrentPreparations) || budget.maxConcurrentPreparations < 1) {
    throw new Error("preparation concurrency budget must be a positive integer");
  }
  const candidates: number[] = [];
  for (let step = 1; step <= budget.horizon; step += 1) {
    candidates.push(input.exposedOrdinal + step);
  }

  const outcome: PreparationOutcome = { failed: [], prepared: [] };
  for (let index = 0; index < candidates.length; index += budget.maxConcurrentPreparations) {
    const batch = candidates.slice(index, index + budget.maxConcurrentPreparations);
    await Promise.all(
      batch.map(async (ordinal) => {
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
      }),
    );
  }
  outcome.failed.sort((left, right) => left.ordinal - right.ordinal);
  outcome.prepared.sort((left, right) => left.ordinal - right.ordinal);
  return outcome;
}

/**
 * A suggested aperture became visible (visibility/hover/touch reprioritization): prepare the
 * target book's first folio so opening the door is a cache hit. Idempotent through the same
 * generation namespace.
 */
export async function prepareSuggestedAperture(
  dependencies: FolioGenerationDependencies,
  input: { targetBookId: string; workerId: string },
): Promise<{ folio: FolioRecord; spent: boolean }> {
  const book = await dependencies.repository.getBook(input.targetBookId);
  const firstMovement = book.movementBriefs[0];
  if (firstMovement === undefined) {
    throw new Error(`aperture target book ${input.targetBookId} has no first movement to prepare`);
  }
  return generateNextFolio(dependencies, {
    bookId: book.id,
    movementId: firstMovement.id,
    ordinal: 1,
    workerId: input.workerId,
  });
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
