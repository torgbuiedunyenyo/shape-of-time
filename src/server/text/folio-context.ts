import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { digestJson, sha256 } from "../domain/digests.js";
import {
  compileFableRequest,
  type CompiledFableRequest,
  type FableContentBlock,
  type FableImageMediaType,
} from "./fable-contract.js";
import { folioOutputSchema } from "./folio-output.js";

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
  readonly images: readonly {
    readonly altText: string;
    readonly assetId: string;
    readonly bytes: Uint8Array;
    readonly digest: string;
    readonly mediaType: FableImageMediaType;
  }[];
  readonly ordinal: number;
  readonly prose: string;
}

export interface FolioContextInput {
  readonly bookOrigin: string;
  readonly currentFolioBrief: string;
  readonly imagePolicy?: "text-led" | "writer-decides";
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

function xmlEscape(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function imageBlock(image: PriorFolio["images"][number]): FableContentBlock {
  if (image.altText.trim().length === 0 || image.assetId.trim().length === 0) {
    throw new Error("prior narrative image requires an asset ID and alt text");
  }
  if (image.bytes.byteLength === 0 || sha256(image.bytes) !== image.digest) {
    throw new Error(`prior narrative image ${image.assetId} failed digest verification`);
  }
  return {
    source: {
      data: Buffer.from(image.bytes).toString("base64"),
      media_type: image.mediaType,
      type: "base64",
    },
    type: "image",
  };
}

function renderHistoryBlocks(priorFolios: readonly PriorFolio[]): {
  blocks: FableContentBlock[];
  historyDigest: string;
} {
  let previousOrdinal = 0;
  const blocks: FableContentBlock[] = [];
  const manifest: unknown[] = [];
  let pending = "";
  if (priorFolios.length === 0) {
    pending = "This is the book's first folio. Nothing is exposed yet.";
  }
  for (const folio of priorFolios) {
    if (!Number.isInteger(folio.ordinal) || folio.ordinal <= previousOrdinal) {
      throw new Error(
        "prior folios must arrive in exposure order with strictly increasing ordinals",
      );
    }
    previousOrdinal = folio.ordinal;
    const prose = requireText(folio.prose, `folio ${folio.ordinal} prose`);
    pending +=
      `\n<exposed_folio ordinal="${folio.ordinal}">\n<folio_prose>\n` +
      `${xmlEscape(prose)}\n</folio_prose>`;
    const imageManifest: unknown[] = [];
    for (const image of folio.images) {
      pending +=
        `\n<narrative_image asset_id="${xmlEscape(image.assetId)}">\n` +
        `<image_description>${xmlEscape(image.altText)}</image_description>\n` +
        "The following accepted image belongs here in story order.\n";
      blocks.push({ text: pending, type: "text" });
      blocks.push(imageBlock(image));
      pending = "\n</narrative_image>";
      imageManifest.push({
        altTextDigest: textDigest(image.altText),
        assetId: image.assetId,
        digest: image.digest,
        mediaType: image.mediaType,
      });
    }
    pending += "\n</exposed_folio>\n";
    manifest.push({ images: imageManifest, ordinal: folio.ordinal, proseDigest: textDigest(prose) });
  }
  if (pending.length > 0) blocks.push({ text: pending, type: "text" });
  return { blocks, historyDigest: digestJson(manifest) };
}

export function compileFolioContext(input: FolioContextInput): CompiledFolioContext {
  const template = readFileSync(TEMPLATE_URL, "utf8");
  const world = requireText(input.world, "world document");
  const bookOrigin = requireText(input.bookOrigin, "book origin");
  const movementBrief = requireText(input.movementBrief, "movement brief");
  const temporalRules = requireText(input.temporalRules, "temporal rules");
  const currentFolioBrief = requireText(input.currentFolioBrief, "current folio brief");
  const history = renderHistoryBlocks(input.priorFolios);

  const sources: Record<(typeof PLACEHOLDERS)[number], string> = {
    BOOK_ORIGIN: bookOrigin,
    CURRENT_FOLIO_BRIEF: currentFolioBrief,
    CURRENT_MOVEMENT_BRIEF: movementBrief,
    STORY_SO_FAR: history.historyDigest,
    TEMPORAL_RULES: temporalRules,
    WORLD_DOCUMENT: world,
  };
  for (const [label, value] of Object.entries(sources)) refuseExcludedSources(label, value);

  let rendered = template;
  for (const placeholder of PLACEHOLDERS.filter((entry) => entry !== "STORY_SO_FAR")) {
    const marker = `{{${placeholder}}}`;
    const occurrences = template.split(marker).length - 1;
    if (occurrences !== 1) {
      throw new Error(`template must contain ${marker} exactly once; found ${occurrences}`);
    }
    rendered = rendered.replace(marker, sources[placeholder]);
  }
  const historyMarker = "{{STORY_SO_FAR}}";
  const historyParts = rendered.split(historyMarker);
  if (historyParts.length !== 2) {
    throw new Error(`template must contain ${historyMarker} exactly once; found ${historyParts.length - 1}`);
  }
  const unresolved = `${historyParts[0]}${historyParts[1]}`.match(/\{\{[A-Z_]+\}\}/);
  if (unresolved !== null) {
    throw new Error(`template placeholder ${unresolved[0]} was not resolved`);
  }

  const userBlocks: FableContentBlock[] = [];
  const historyBlocks = history.blocks.map((block) => structuredClone(block));
  if (historyBlocks.length === 0 || historyBlocks[0]?.type !== "text") {
    throw new Error("compiled history must begin with text");
  }
  historyBlocks[0] = {
    text: historyParts[0] + historyBlocks[0].text,
    type: "text",
  };
  const last = historyBlocks.at(-1);
  if (last?.type !== "text") throw new Error("compiled history must end with text");
  historyBlocks[historyBlocks.length - 1] = {
    text: last.text + historyParts[1],
    type: "text",
  };
  userBlocks.push(...historyBlocks);

  const request = compileFableRequest({
    outputSchema: folioOutputSchema(input.imagePolicy ?? "writer-decides"),
    promptVersion: FOLIO_PROMPT_VERSION,
    system:
      "You are the writer behind the Shape of Time library. Read the complete document set and " +
      "follow the writing request at its end exactly.",
    userBlocks,
  });
  const sourceDigests: Record<string, string> = { template: textDigest(template) };
  for (const placeholder of PLACEHOLDERS) {
    sourceDigests[placeholder] =
      placeholder === "STORY_SO_FAR" ? history.historyDigest : textDigest(sources[placeholder]);
  }
  const contextManifest = {
    order: PLACEHOLDERS,
    promptVersion: FOLIO_PROMPT_VERSION,
    sourceDigests,
  } as const;
  return {
    contextDigest: digestJson({ manifest: contextManifest, requestDigest: request.manifestDigest }),
    contextManifest,
    request,
  };
}
