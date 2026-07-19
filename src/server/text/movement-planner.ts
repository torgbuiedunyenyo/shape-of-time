import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import type { MovementBrief } from "../db/types.js";
import { digestJson } from "../domain/digests.js";
import { compileFableRequest, type CompiledFableRequest } from "./fable-contract.js";

/**
 * D3: movement planning at a movement boundary (PLAN §D3). One bounded planning call produces a
 * short natural-prose brief; anchor/prepared plans stay human-authored and never pass through
 * here. The structural rules — no replay of a completed movement, no Undertow by default, the
 * root plot as reference rather than template for children — are enforced in code, before and
 * after the call; prose quality stays a human judgment.
 */
export const MOVEMENT_PROMPT_VERSION = "plan-movement/1";

export type BookPhase = "child_first" | "child_later" | "root_post_arc" | "root_pre_arc";

const PHASE_INSTRUCTIONS: Readonly<Record<BookPhase, string>> = {
  child_first:
    "This is a child book planning its first movement. Treat the book origin's founding passage " +
    "or title intent as the founding premise, not an instruction to continue the parent scene. " +
    "Define this book's own viewpoint, place and time, dramatic question, intended change, and " +
    "boundary. The root story in the world document is reference, not a plot template.",
  child_later:
    "This is a child book planning a later movement. Grow only from this book's own exposed " +
    "history and its own earlier decisions. Do not borrow events from any other book's pages, " +
    "and do not recast this book as the root story.",
  root_post_arc:
    "The root story's arc has resolved. Begin from the changed situation of its true ending and " +
    "create a new dramatic engine for this movement; do not undo or reopen the resolved ending, " +
    "and do not import sequel material.",
  root_pre_arc:
    "The root story's arc has not yet resolved. Advance the next unresolved movement of the " +
    "source story in the world document — continue it, do not skip ahead, and do not resolve " +
    "more than this one movement.",
};

export interface MovementPlanningInput {
  readonly bookOrigin: string;
  readonly completedMovements: readonly MovementBrief[];
  readonly exposedTail: string;
  readonly phase: BookPhase;
  readonly temporalRules: string;
  readonly world: string;
}

export interface CompiledMovementPlanning {
  readonly phase: BookPhase;
  readonly planningDigest: string;
  readonly request: CompiledFableRequest;
}

const TEMPLATE_URL = new URL("../../../prompts/fable/plan-movement.md", import.meta.url);
const PLACEHOLDERS = [
  "WORLD_DOCUMENT",
  "BOOK_ORIGIN",
  "COMPLETED_MOVEMENTS",
  "EXPOSED_TAIL",
  "TEMPORAL_RULES",
  "PHASE_INSTRUCTION",
] as const;

const textDigest = (value: string): string =>
  createHash("sha256").update(value, "utf8").digest("hex");

function refusePlanningExclusions(label: string, value: string): void {
  const lowered = value.toLowerCase();
  // Undertow never enters planning by default (root_post_arc explicitly, every phase in
  // practice); a deliberate future import is an owner decision made outside this module.
  if (lowered.includes("undertow")) {
    throw new Error(`${label} contains Undertow material, which planning never imports by default`);
  }
  if (lowered.includes("visual bible") || lowered.includes("visual-bible")) {
    throw new Error(`${label} contains visual bible material, which is never a planning input`);
  }
}

export function compileMovementPlanningRequest(
  input: MovementPlanningInput,
): CompiledMovementPlanning {
  const template = readFileSync(TEMPLATE_URL, "utf8");
  const completed = input.completedMovements
    .map((movement) => `- ${movement.id}: ${movement.brief}`)
    .join("\n");
  const sources: Record<(typeof PLACEHOLDERS)[number], string> = {
    BOOK_ORIGIN: input.bookOrigin,
    COMPLETED_MOVEMENTS:
      completed.length === 0 ? "This book has no completed movements yet." : completed,
    EXPOSED_TAIL:
      input.exposedTail.trim().length === 0
        ? "Nothing is exposed yet; this movement opens the book."
        : input.exposedTail,
    PHASE_INSTRUCTION: PHASE_INSTRUCTIONS[input.phase],
    TEMPORAL_RULES: input.temporalRules,
    WORLD_DOCUMENT: input.world,
  };
  for (const [label, value] of Object.entries(sources)) {
    if (label !== "PHASE_INSTRUCTION") refusePlanningExclusions(label, value);
    if (value.trim().length === 0) throw new Error(`planning source ${label} must not be empty`);
  }

  let rendered = template;
  for (const placeholder of PLACEHOLDERS) {
    const marker = `{{${placeholder}}}`;
    const occurrences = template.split(marker).length - 1;
    if (occurrences !== 1) {
      throw new Error(`planning template must contain ${marker} exactly once; found ${occurrences}`);
    }
    rendered = rendered.replace(marker, sources[placeholder]);
  }
  const unresolved = rendered.match(/\{\{[A-Z_]+\}\}/);
  if (unresolved !== null) {
    throw new Error(`planning template placeholder ${unresolved[0]} was not resolved`);
  }

  const request = compileFableRequest({
    promptVersion: MOVEMENT_PROMPT_VERSION,
    system:
      "You are the writer behind the Shape of Time library, planning the next finite movement " +
      "of one book. Read the complete document set and follow the planning request exactly.",
    userBlocks: [{ text: rendered, type: "text" }],
  });
  return {
    phase: input.phase,
    planningDigest: digestJson({
      phase: input.phase,
      promptVersion: MOVEMENT_PROMPT_VERSION,
      renderedDigest: textDigest(rendered),
    }),
    request,
  };
}

export function parseMovementBrief(raw: string): string {
  const matches = [...raw.matchAll(/<movement_brief>([\s\S]*?)<\/movement_brief>/g)];
  if (matches.length === 0) throw new Error("the reply contains no movement_brief element");
  if (matches.length > 1) {
    throw new Error(
      `the reply must contain exactly one movement_brief element; found ${matches.length}`,
    );
  }
  if (raw.replace(matches[0]![0], "").trim().length > 0) {
    throw new Error("the reply carries content outside the movement_brief element");
  }
  const brief = matches[0]![1]!.trim();
  if (brief.length === 0) throw new Error("the movement_brief element is empty");
  return brief;
}

export function acceptPlannedMovement(input: {
  brief: string;
  completedMovements: readonly MovementBrief[];
  newMovementId: string;
  phase: BookPhase;
}): MovementBrief {
  const id = input.newMovementId.trim();
  if (id.length === 0) throw new Error("planned movement id cannot be empty");
  if (input.completedMovements.some((movement) => movement.id === id)) {
    throw new Error(`movement ${id} already exists in this book; a movement is never replayed`);
  }
  const brief = input.brief.trim();
  if (brief.length === 0) throw new Error("planned movement brief cannot be empty");
  refusePlanningExclusions("planned movement brief", brief);
  return { brief, id };
}
