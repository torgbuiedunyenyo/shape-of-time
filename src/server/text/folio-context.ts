import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { digestJson } from "../domain/digests.js";
import { compileFableRequest, type CompiledFableRequest } from "./fable-contract.js";

/**
 * D1: the deterministic full-history compiler (PLAN §D1; SPEC "Hard context boundary"). One pure
 * substitution of the checked-in template — long documents first, the writing request last, every
 * source exactly once, prior folios in exposure order. There is deliberately no rolling summary,
 * recent-N window, character estimate, or truncation path in this module: an inadmissible request
 * is refused upstream by the D0 equation, never shrunk here.
 */
export const FOLIO_PROMPT_VERSION = "write-folio/1";

const TEMPLATE_URL = new URL("../../../prompts/fable/write-folio.md", import.meta.url);
const PLACEHOLDERS = [
  "WORLD_DOCUMENT",
  "BOOK_ORIGIN",
  "CURRENT_MOVEMENT_BRIEF",
  "STORY_SO_FAR",
  "TEMPORAL_RULES",
  "CURRENT_FOLIO_BRIEF",
] as const;

export interface PriorFolio {
  readonly images: readonly { readonly altText: string; readonly digest: string }[];
  readonly ordinal: number;
  readonly prose: string;
}

export interface FolioContextInput {
  readonly bookOrigin: string;
  readonly currentFolioBrief: string;
  readonly movementBrief: string;
  readonly priorFolios: readonly PriorFolio[];
  readonly temporalRules: string;
  readonly world: string;
}

export interface CompiledFolioContext {
  readonly contextDigest: string;
  readonly contextManifest: {
    readonly order: readonly (typeof PLACEHOLDERS)[number][];
    readonly promptVersion: typeof FOLIO_PROMPT_VERSION;
    readonly sourceDigests: Readonly<Record<string, string>>;
  };
  readonly request: CompiledFableRequest;
}

const textDigest = (value: string): string => createHash("sha256").update(value, "utf8").digest("hex");

function requireText(value: string, label: string): string {
  if (value.trim().length === 0) throw new Error(`${label} is required and must not be empty`);
  return value;
}

function refuseExcludedSources(label: string, value: string): void {
  const lowered = value.toLowerCase();
  // The baseline may never carry Undertow, the visual bible, or the optional craft examples
  // (SPEC "Canon"; A0). Checking the caller's inputs keeps the exclusion in the normal path.
  if (lowered.includes("undertow")) {
    throw new Error(`${label} contains Undertow material, which is excluded from the prose baseline`);
  }
  if (lowered.includes("visual bible") || lowered.includes("visual-bible")) {
    throw new Error(`${label} contains visual bible material, which is never a prose prompt input`);
  }
  if (lowered.includes("craft example") || lowered.includes("craft-examples")) {
    throw new Error(`${label} contains the optional craft examples, which are outside the baseline`);
  }
}

function renderStorySoFar(priorFolios: readonly PriorFolio[]): string {
  if (priorFolios.length === 0) return "This is the book's first folio. Nothing is exposed yet.";
  let previousOrdinal = 0;
  const sections: string[] = [];
  for (const folio of priorFolios) {
    if (!Number.isInteger(folio.ordinal) || folio.ordinal <= previousOrdinal) {
      throw new Error(
        "prior folios must arrive in exposure order with strictly increasing ordinals",
      );
    }
    previousOrdinal = folio.ordinal;
    const images = folio.images
      .map((image) => `[Narrative image: ${image.altText} (sha256:${image.digest})]`)
      .join("\n");
    sections.push(
      `## Folio ${folio.ordinal}\n\n${requireText(folio.prose, `folio ${folio.ordinal} prose`)}${
        images.length === 0 ? "" : `\n\n${images}`
      }`,
    );
  }
  return sections.join("\n\n");
}

export function compileFolioContext(input: FolioContextInput): CompiledFolioContext {
  const template = readFileSync(TEMPLATE_URL, "utf8");
  const world = requireText(input.world, "world document");
  const bookOrigin = requireText(input.bookOrigin, "book origin");
  const movementBrief = requireText(input.movementBrief, "movement brief");
  const temporalRules = requireText(input.temporalRules, "temporal rules");
  const currentFolioBrief = requireText(input.currentFolioBrief, "current folio brief");
  const storySoFar = renderStorySoFar(input.priorFolios);

  const sources: Record<(typeof PLACEHOLDERS)[number], string> = {
    BOOK_ORIGIN: bookOrigin,
    CURRENT_FOLIO_BRIEF: currentFolioBrief,
    CURRENT_MOVEMENT_BRIEF: movementBrief,
    STORY_SO_FAR: storySoFar,
    TEMPORAL_RULES: temporalRules,
    WORLD_DOCUMENT: world,
  };
  for (const [label, value] of Object.entries(sources)) refuseExcludedSources(label, value);

  let rendered = template;
  for (const placeholder of PLACEHOLDERS) {
    const marker = `{{${placeholder}}}`;
    const occurrences = template.split(marker).length - 1;
    if (occurrences !== 1) {
      throw new Error(`template must contain ${marker} exactly once; found ${occurrences}`);
    }
    rendered = rendered.replace(marker, sources[placeholder]);
  }
  const unresolved = rendered.match(/\{\{[A-Z_]+\}\}/);
  if (unresolved !== null) {
    throw new Error(`template placeholder ${unresolved[0]} was not resolved`);
  }

  const request = compileFableRequest({
    promptVersion: FOLIO_PROMPT_VERSION,
    system:
      "You are the writer behind the Shape of Time library. Read the complete document set and " +
      "follow the writing request at its end exactly.",
    userBlocks: [{ text: rendered, type: "text" }],
  });
  const sourceDigests: Record<string, string> = { template: textDigest(template) };
  for (const placeholder of PLACEHOLDERS) sourceDigests[placeholder] = textDigest(sources[placeholder]);
  const contextManifest = {
    order: PLACEHOLDERS,
    promptVersion: FOLIO_PROMPT_VERSION,
    sourceDigests,
  } as const;
  return {
    contextDigest: digestJson({ manifest: contextManifest, renderedDigest: textDigest(rendered) }),
    contextManifest,
    request,
  };
}
