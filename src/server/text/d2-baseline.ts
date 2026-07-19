import { readFileSync } from "node:fs";
import path from "node:path";

import { canonicalJson, digestJson, sha256 } from "../domain/digests.js";
import { compileFolioContext, type PriorFolio } from "./folio-context.js";
import {
  executeFableAttempt,
  FableContractError,
  type FableProviderPort,
} from "./fable-contract.js";

/**
 * D2: the lightly steered prose baseline (PLAN §D2). One uninterrupted consecutive run of 8–14
 * folios through the first root movement — no line splicing, no retry, no fallback. Every attempt
 * is archived before it is sent and every outcome is archived after, so the blind human read sees
 * exactly what the writer saw and produced. The run's verdict belongs to human readers; nothing in
 * this module scores prose.
 */
export const D2_LIVE_SPEND_CAP_USD = 25.0;
export const MIN_BASELINE_FOLIOS = 8;
export const MAX_BASELINE_FOLIOS = 14;
export const MIN_FOLIO_WORDS = 120;
export const MAX_FOLIO_WORDS = 250;

/** Lineage facts only — the root book's origin is a premise statement, not canon prose. */
export const ROOT_BOOK_ORIGIN =
  "This is the root book of the Shape of Time library. It has no parent book and no founding " +
  "passage: it is founded directly on the shared world document and follows the canonical Jay " +
  "and Tan story through finite movements. The current movement is its first.";

export interface BaselineSources {
  readonly bookOrigin: string;
  readonly movementBrief: string;
  readonly temporalRules: string;
  readonly world: string;
}

export function loadBaselineSources(projectRoot: string): BaselineSources {
  const read = (relative: string): string =>
    readFileSync(path.join(projectRoot, relative), "utf8");
  return {
    bookOrigin: ROOT_BOOK_ORIGIN,
    movementBrief: read("content/shape-of-time/root-movement-01.md"),
    temporalRules: read("prompts/fable/temporal-rules.md"),
    world: read("content/shape-of-time/world.md"),
  };
}

export function baselineFolioBrief(ordinal: number): string {
  if (ordinal === 1) {
    return (
      "This is the book's opening folio (folio 1). Begin inside a scene, in the Oakland shop, " +
      "with the movement already in motion. Orient the reader through what Jay perceives and does."
    );
  }
  return (
    `This is folio ${ordinal} of an uninterrupted baseline run through the current movement. ` +
    "Continue directly from the story so far and advance the movement by one clear change in " +
    "situation, want, or understanding. Do not summarize, restart, or conclude the whole movement."
  );
}

export function parseFolioProse(raw: string): string {
  const matches = [...raw.matchAll(/<folio_prose>([\s\S]*?)<\/folio_prose>/g)];
  if (matches.length === 0) {
    throw new Error("the reply contains no folio_prose element");
  }
  if (matches.length > 1) {
    throw new Error(`the reply must contain exactly one folio_prose element; found ${matches.length}`);
  }
  const outside = raw.replace(matches[0]![0], "");
  if (outside.trim().length > 0) {
    throw new Error("the reply carries content outside the folio_prose element");
  }
  const prose = matches[0]![1]!.trim();
  if (prose.length === 0) throw new Error("the folio_prose element is empty");
  return prose;
}

export function countWords(prose: string): number {
  return prose.split(/\s+/).filter((word) => word.length > 0).length;
}

export interface BaselineArchiveWrite {
  (name: string, bytes: Uint8Array): Promise<void>;
}

export interface BaselineFolioRecord {
  readonly contextDigest: string;
  readonly countedInputTokens: number;
  readonly latencyMs: number;
  readonly ordinal: number;
  readonly prose: string;
  readonly proseDigest: string;
  readonly providerResponseId: string;
  readonly usage: { readonly input_tokens: number; readonly output_tokens: number };
  readonly wordCount: number;
  readonly wordCountInRange: boolean;
}

export interface BaselineRunResult {
  readonly costBasis: string;
  readonly costUsd: null;
  readonly failure?: { readonly code: string; readonly message: string; readonly ordinal: number };
  readonly folios: readonly BaselineFolioRecord[];
  readonly outcome: "completed" | "failed";
  readonly totals: {
    readonly countedInputTokens: number;
    readonly inputTokens: number;
    readonly outputTokens: number;
  };
}

const COST_BASIS =
  "exact provider usage tokens are archived per folio; no claude-fable-5 price table is pinned " +
  "in this repo, so dollar cost is read from the provider bill rather than invented here";

function encode(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${canonicalJson(value)}\n`);
}

export async function runBaseline(options: {
  archive: BaselineArchiveWrite;
  clock?: () => number;
  folioCount: number;
  port: FableProviderPort;
  sources: BaselineSources;
}): Promise<BaselineRunResult> {
  const { archive, folioCount, port, sources } = options;
  const clock = options.clock ?? (() => Date.now());
  if (
    !Number.isInteger(folioCount) ||
    folioCount < MIN_BASELINE_FOLIOS ||
    folioCount > MAX_BASELINE_FOLIOS
  ) {
    throw new Error(
      `baseline folio count must be an integer between ${MIN_BASELINE_FOLIOS} and ` +
        `${MAX_BASELINE_FOLIOS}; received ${folioCount}`,
    );
  }

  const priorFolios: PriorFolio[] = [];
  const folios: BaselineFolioRecord[] = [];
  let failure: BaselineRunResult["failure"];

  for (let ordinal = 1; ordinal <= folioCount; ordinal += 1) {
    const name = `folio-${String(ordinal).padStart(2, "0")}`;
    const compiled = compileFolioContext({
      bookOrigin: sources.bookOrigin,
      currentFolioBrief: baselineFolioBrief(ordinal),
      movementBrief: sources.movementBrief,
      priorFolios,
      temporalRules: sources.temporalRules,
      world: sources.world,
    });
    // The exact request is durable before any spend, matching the B1 dispatch-before-send rule.
    await archive(
      `${name}.request.json`,
      encode({
        body: compiled.request.body,
        contextDigest: compiled.contextDigest,
        contextManifest: compiled.contextManifest,
        manifestDigest: compiled.request.manifestDigest,
        ordinal,
      }),
    );

    const startedAt = clock();
    let record: BaselineFolioRecord;
    try {
      const evidence = await executeFableAttempt(compiled.request, port);
      const prose = parseFolioProseOrFail(evidence.prose);
      const wordCount = countWords(prose);
      record = {
        contextDigest: compiled.contextDigest,
        countedInputTokens: evidence.countedInputTokens,
        latencyMs: clock() - startedAt,
        ordinal,
        prose,
        proseDigest: sha256(prose),
        providerResponseId: evidence.providerResponseId,
        usage: evidence.usage,
        wordCount,
        wordCountInRange: wordCount >= MIN_FOLIO_WORDS && wordCount <= MAX_FOLIO_WORDS,
      };
    } catch (error) {
      const code = error instanceof FableContractError ? error.code : "malformed_output";
      const message = error instanceof Error ? error.message : String(error);
      failure = { code, message, ordinal };
      await archive(`${name}.failure.json`, encode({ code, message, ordinal }));
      break;
    }
    await archive(`${name}.result.json`, encode(record));
    folios.push(record);
    priorFolios.push({ images: [], ordinal, prose: record.prose });
  }

  const totals = folios.reduce(
    (sum, folio) => ({
      countedInputTokens: sum.countedInputTokens + folio.countedInputTokens,
      inputTokens: sum.inputTokens + folio.usage.input_tokens,
      outputTokens: sum.outputTokens + folio.usage.output_tokens,
    }),
    { countedInputTokens: 0, inputTokens: 0, outputTokens: 0 },
  );
  const result: BaselineRunResult = {
    costBasis: COST_BASIS,
    costUsd: null,
    ...(failure === undefined ? {} : { failure }),
    folios,
    outcome: failure === undefined ? "completed" : "failed",
    totals,
  };
  await archive(
    "run.json",
    encode({ ...result, resultDigest: digestJson({ folios: folios.map((f) => f.proseDigest) }) }),
  );
  return result;
}

function parseFolioProseOrFail(raw: string): string {
  return parseFolioProse(raw);
}

export interface D2Arguments {
  archiveRoot?: string;
  confirmSpendCap?: number;
  dryRun: boolean;
  folioCount?: number;
}

export function readD2Arguments(values: string[]): D2Arguments {
  if (values[0] === "--") values = values.slice(1);
  const parsed: D2Arguments = { dryRun: false };
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (key === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    const value = values[index + 1];
    if (value === undefined) throw new Error(`missing value for ${key}`);
    if (key === "--confirm-spend-cap") parsed.confirmSpendCap = Number(value);
    else if (key === "--folios") parsed.folioCount = Number(value);
    else if (key === "--archive-root") parsed.archiveRoot = value;
    else throw new Error(`unknown D2 baseline argument: ${key}`);
    index += 1;
  }
  if (parsed.dryRun) return parsed;
  if (parsed.confirmSpendCap !== D2_LIVE_SPEND_CAP_USD) {
    throw new Error(
      `the D2 baseline requires its literal written spend cap: --confirm-spend-cap ` +
        `${D2_LIVE_SPEND_CAP_USD.toFixed(2)}`,
    );
  }
  if (
    parsed.folioCount === undefined ||
    !Number.isInteger(parsed.folioCount) ||
    parsed.folioCount < MIN_BASELINE_FOLIOS ||
    parsed.folioCount > MAX_BASELINE_FOLIOS
  ) {
    throw new Error(`--folios must be an integer between ${MIN_BASELINE_FOLIOS} and ${MAX_BASELINE_FOLIOS}`);
  }
  if (parsed.archiveRoot === undefined || !path.isAbsolute(parsed.archiveRoot)) {
    throw new Error("--archive-root must be an absolute path outside the worktree");
  }
  return parsed;
}
