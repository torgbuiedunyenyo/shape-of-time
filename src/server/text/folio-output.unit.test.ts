import { describe, expect, it } from "vitest";

import { folioOutputSchema, parseFolioOutput } from "./folio-output.js";

function collectKeywords(schema: unknown, found: Set<string>): Set<string> {
  if (Array.isArray(schema)) {
    for (const entry of schema) collectKeywords(entry, found);
    return found;
  }
  if (schema === null || typeof schema !== "object") return found;
  for (const [key, value] of Object.entries(schema)) {
    found.add(key);
    collectKeywords(value, found);
  }
  return found;
}

describe("folio output schema provider compatibility", () => {
  // Measured 2026-07-19 against /v1/messages/count_tokens: a schema carrying maxItems is refused
  // with HTTP 400 "For 'array' type, property 'maxItems' is not supported"
  // (req_011CdCjDczes2ZpAB9eQidso). Every folio count would fail before spend, so the schema may
  // never carry it; minItems and minLength were accepted by the same probe and may stay.
  it("carries no maxItems anywhere in either image policy", () => {
    for (const policy of ["writer-decides", "text-led"] as const) {
      const keywords = collectKeywords(folioOutputSchema(policy), new Set<string>());
      expect([...keywords]).not.toContain("maxItems");
    }
  });

  it("still enforces the paragraph ceiling at parse time, where the schema cannot", () => {
    const paragraphs = Array.from({ length: 4 }, (_, index) =>
      `Paragraph ${index + 1}. ${Array.from({ length: 40 }, (_, word) => `word${word}`).join(" ")}.`,
    );
    expect(() =>
      parseFolioOutput(JSON.stringify({ imageDirection: null, proseParagraphs: paragraphs })),
    ).toThrow(/one to three/i);
  });
});
