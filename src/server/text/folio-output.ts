export interface FableImageDirection {
  concreteScene: string;
  factLeftToImage: string;
  mustRemain: string[];
  narrativeJob: string;
  purposefulChanges: string[];
  unresolvedFacts: string[];
}

export interface FableFolioOutput {
  imageDirection: FableImageDirection | null;
  proseParagraphs: string[];
}

export const FOLIO_OUTPUT_SCHEMA = {
  additionalProperties: false,
  properties: {
    imageDirection: {
      anyOf: [
        { type: "null" },
        {
          additionalProperties: false,
          properties: {
            concreteScene: { minLength: 1, type: "string" },
            factLeftToImage: { minLength: 1, type: "string" },
            mustRemain: { items: { minLength: 1, type: "string" }, type: "array" },
            narrativeJob: { minLength: 1, type: "string" },
            purposefulChanges: { items: { minLength: 1, type: "string" }, type: "array" },
            unresolvedFacts: { items: { minLength: 1, type: "string" }, type: "array" },
          },
          required: [
            "narrativeJob",
            "concreteScene",
            "factLeftToImage",
            "mustRemain",
            "purposefulChanges",
            "unresolvedFacts",
          ],
          type: "object",
        },
      ],
    },
    proseParagraphs: {
      items: { minLength: 1, type: "string" },
      maxItems: 3,
      minItems: 1,
      type: "array",
    },
  },
  required: ["proseParagraphs", "imageDirection"],
  type: "object",
} as const;

export function folioOutputSchema(imagePolicy: "text-led" | "writer-decides"):
Readonly<Record<string, unknown>> {
  if (imagePolicy === "writer-decides") return structuredClone(FOLIO_OUTPUT_SCHEMA);
  const schema = structuredClone(FOLIO_OUTPUT_SCHEMA) as unknown as {
    properties: { imageDirection: unknown };
  };
  schema.properties.imageDirection = { type: "null" };
  return schema as unknown as Readonly<Record<string, unknown>>;
}

function requireExactKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${label} must contain exactly ${expected.join(", ")}`);
  }
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function stringArray(value: unknown, label: string): string[] {
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string" || entry.trim().length === 0)
  ) {
    throw new Error(`${label} must be an array of non-empty strings`);
  }
  return [...value] as string[];
}

export function parseFolioOutput(raw: string): FableFolioOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new Error("Fable folio output is not valid JSON", { cause });
  }
  const output = record(parsed, "Fable folio output");
  requireExactKeys(output, ["proseParagraphs", "imageDirection"], "Fable folio output");
  const proseParagraphs = stringArray(output["proseParagraphs"], "Fable proseParagraphs");
  if (proseParagraphs.length < 1 || proseParagraphs.length > 3) {
    throw new Error("Fable proseParagraphs must contain one to three paragraphs");
  }
  const wordCount = proseParagraphs
    .join(" ")
    .split(/\s+/u)
    .filter(Boolean).length;
  if (wordCount < 120 || wordCount > 265) {
    throw new Error(`Fable folio prose must contain 120 to 265 words; received ${wordCount}`);
  }
  if (output["imageDirection"] === null) return { imageDirection: null, proseParagraphs };

  const direction = record(output["imageDirection"], "Fable imageDirection");
  const directionKeys = [
    "narrativeJob",
    "concreteScene",
    "factLeftToImage",
    "mustRemain",
    "purposefulChanges",
    "unresolvedFacts",
  ] as const;
  requireExactKeys(direction, directionKeys, "Fable imageDirection");
  for (const key of ["narrativeJob", "concreteScene", "factLeftToImage"] as const) {
    if (typeof direction[key] !== "string" || direction[key].trim().length === 0) {
      throw new Error(`Fable imageDirection.${key} must be non-empty`);
    }
  }
  return {
    imageDirection: {
      concreteScene: direction["concreteScene"] as string,
      factLeftToImage: direction["factLeftToImage"] as string,
      mustRemain: stringArray(direction["mustRemain"], "Fable imageDirection.mustRemain"),
      narrativeJob: direction["narrativeJob"] as string,
      purposefulChanges: stringArray(
        direction["purposefulChanges"],
        "Fable imageDirection.purposefulChanges",
      ),
      unresolvedFacts: stringArray(
        direction["unresolvedFacts"],
        "Fable imageDirection.unresolvedFacts",
      ),
    },
    proseParagraphs,
  };
}
