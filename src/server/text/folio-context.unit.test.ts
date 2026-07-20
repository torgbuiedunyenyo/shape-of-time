import { describe, expect, it } from "vitest";

import { sha256 } from "../domain/digests.js";
import { compileFolioContext, type FolioContextInput } from "./folio-context.js";

const WORLD_SENTINEL = "The city had already moved when the survey team arrived.";
const IMAGE_BYTES = new TextEncoder().encode("accepted narrative image bytes");

function input(overrides: Partial<FolioContextInput> = {}): FolioContextInput {
  return {
    bookOrigin: "Root book. Founded as the anchor Shape of Time volume.",
    currentFolioBrief: "Folio 03 — The gift. Tan returns and pays; the first Clef was a gift.",
    movementBrief: "Root movement one: from the failed payment to Jay's calm yes.",
    priorFolios: [
      {
        images: [{
          altText: "A worn counter at evening rush.",
          assetId: "plate-payment",
          bytes: IMAGE_BYTES,
          digest: sha256(IMAGE_BYTES),
          mediaType: "image/webp",
        }],
        ordinal: 1,
        prose: "Jay served the regulars first because they knew to have their money ready.",
      },
      {
        images: [],
        ordinal: 2,
        prose: "Tan waited for the screen to answer a gesture it could not feel.",
      },
    ],
    temporalRules: "Temporal movement is physical travel along mapped currents.",
    world: `Shape of Time world.\n${WORLD_SENTINEL}\nOne person exists once; every time keeps living.`,
    ...overrides,
  };
}

describe("D1 deterministic folio context", () => {
  it("renders every source exactly once, in template order, with the request last", () => {
    const compiled = compileFolioContext(input());
    const blocks = compiled.request.body.messages[0]?.content ?? [];
    const text = blocks.flatMap((block) => block.type === "text" ? [block.text] : []).join("");

    // Exactly once: the world sentinel appears a single time in the rendered request.
    expect(text.split(WORLD_SENTINEL).length - 1).toBe(1);
    // No placeholder survives rendering.
    expect(text).not.toMatch(/\{\{[A-Z_]+\}\}/);
    // Order: world before origin, origin before movement, movement before story, story before
    // temporal rules, rules before the current folio, folio before the writing request.
    const positions = [
      WORLD_SENTINEL,
      "Root book. Founded",
      "Root movement one",
      "Jay served the regulars",
      "Temporal movement is physical travel",
      "Folio 03 — The gift",
      "<writing_request>",
    ].map((marker) => text.indexOf(marker));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    // Prior folios arrive in exposure order with their images inline.
    expect(text.indexOf("Jay served the regulars")).toBeLessThan(
      text.indexOf("Tan waited for the screen"),
    );
    expect(text).toContain("A worn counter at evening rush.");
    expect(blocks.map(({ type }) => type)).toEqual(["text", "image", "text"]);
    const image = blocks[1];
    expect(image?.type).toBe("image");
    if (image?.type === "image") {
      expect(Buffer.from(image.source.data, "base64")).toEqual(Buffer.from(IMAGE_BYTES));
    }
    expect(compiled.request.body.output_config.format?.type).toBe("json_schema");
  });

  it("is deterministic: identical inputs give identical context digests", () => {
    expect(compileFolioContext(input()).contextDigest).toBe(compileFolioContext(input()).contextDigest);
  });

  it("changes the digest when any single source changes", () => {
    const base = compileFolioContext(input()).contextDigest;
    expect(compileFolioContext(input({ world: `changed\n${WORLD_SENTINEL}` })).contextDigest).not.toBe(base);
    expect(
      compileFolioContext(input({ movementBrief: "A different movement." })).contextDigest,
    ).not.toBe(base);
    const folios = input().priorFolios;
    expect(
      compileFolioContext(input({ priorFolios: [folios[0]!] })).contextDigest,
    ).not.toBe(base);
    const changedBytes = new TextEncoder().encode("different accepted image bytes");
    expect(
      compileFolioContext(input({
        priorFolios: [{
          ...folios[0]!,
          images: [{ ...folios[0]!.images[0]!, bytes: changedBytes, digest: sha256(changedBytes) }],
        }, folios[1]!],
      })).contextDigest,
    ).not.toBe(base);
  });

  it("refuses out-of-order or duplicate prior folio ordinals — no silent reordering", () => {
    const folios = input().priorFolios;
    expect(() =>
      compileFolioContext(input({ priorFolios: [folios[1]!, folios[0]!] })),
    ).toThrow(/exposure order/i);
    expect(() =>
      compileFolioContext(input({ priorFolios: [folios[0]!, folios[0]!] })),
    ).toThrow(/exposure order/i);
  });

  it("refuses excluded sources: Undertow, the visual bible, and craft examples", () => {
    expect(() =>
      compileFolioContext(input({ world: `${WORLD_SENTINEL}\n# Undertow — sequel seed` })),
    ).toThrow(/undertow/i);
    expect(() =>
      compileFolioContext(
        input({ movementBrief: "Use the visual bible palette for this scene." }),
      ),
    ).toThrow(/visual bible/i);
  });

  it("refuses an empty world or missing brief instead of rendering a hollow request", () => {
    expect(() => compileFolioContext(input({ world: " " }))).toThrow(/world/i);
    expect(() => compileFolioContext(input({ currentFolioBrief: "" }))).toThrow(/folio brief/i);
  });
});
