import { digestJson } from "../domain/digests.js";

/**
 * D0: the strict Fable writing contract (SPEC "Generation and continuity"; EVALS §9).
 * One writer, exactly counted, no fallback. Every failure here is closed: nothing is published
 * and nothing else is tried. The hard equation is the whole boundary — no character estimate,
 * cache-adjusted count, truncation, or attachment dropping may stand in for the official count.
 */
export const FABLE_MODEL = "claude-fable-5" as const;
export const FABLE_EFFORT = "xhigh" as const;
export const ABSOLUTE_CONTEXT_CEILING = 400_000;
export const MAX_OUTPUT_TOKENS = 32_768;
export const SAFETY_MARGIN = 4_096;
export const MAX_COUNTED_INPUT = ABSOLUTE_CONTEXT_CEILING - MAX_OUTPUT_TOKENS - SAFETY_MARGIN;
export const FABLE_CONTRACT_VERSION = "shape-of-time.fable-writer.v2" as const;

export type FableContractFailureCode =
  | "count_failed"
  | "empty_output"
  | "over_context_ceiling"
  | "refused"
  | "served_model_mismatch"
  | "truncated"
  | "unsupported_stop";

export class FableContractError extends Error {
  readonly code: FableContractFailureCode;

  constructor(options: { cause?: unknown; code: FableContractFailureCode; message: string }) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "FableContractError";
    this.code = options.code;
  }
}

export interface FableTextBlock {
  readonly text: string;
  readonly type: "text";
}

export type FableImageMediaType = "image/gif" | "image/jpeg" | "image/png" | "image/webp";

export interface FableImageBlock {
  readonly source: {
    readonly data: string;
    readonly media_type: FableImageMediaType;
    readonly type: "base64";
  };
  readonly type: "image";
}

export type FableContentBlock = FableImageBlock | FableTextBlock;

export interface FableRequestInput {
  readonly outputSchema?: Readonly<Record<string, unknown>>;
  readonly promptVersion: string;
  readonly system: string;
  readonly userBlocks: readonly FableContentBlock[];
}

/** The exact wire body. Stateless by construction: no memory, container, or thinking budget. */
export interface FableRequestBody {
  readonly max_tokens: typeof MAX_OUTPUT_TOKENS;
  readonly messages: readonly { readonly content: readonly FableContentBlock[]; readonly role: "user" }[];
  readonly model: typeof FABLE_MODEL;
  readonly output_config: {
    readonly effort: typeof FABLE_EFFORT;
    readonly format?: {
      readonly schema: Readonly<Record<string, unknown>>;
      readonly type: "json_schema";
    };
  };
  readonly system: string;
}

export interface CompiledFableRequest {
  readonly body: FableRequestBody;
  readonly manifest: {
    readonly contractVersion: typeof FABLE_CONTRACT_VERSION;
    readonly effort: typeof FABLE_EFFORT;
    readonly maxOutputTokens: typeof MAX_OUTPUT_TOKENS;
    readonly model: typeof FABLE_MODEL;
    readonly promptVersion: string;
  };
  readonly manifestDigest: string;
}

export interface FableProviderPort {
  count(body: FableRequestBody): Promise<{ input_tokens: number }>;
  send(body: FableRequestBody): Promise<unknown>;
}

export interface FableAttemptEvidence {
  readonly countedInputTokens: number;
  readonly manifestDigest: string;
  readonly prose: string;
  readonly providerResponseId: string;
  readonly servedModel: typeof FABLE_MODEL;
  readonly usage: { readonly input_tokens: number; readonly output_tokens: number };
}

export function compileFableRequest(input: FableRequestInput): CompiledFableRequest {
  if (input.promptVersion.trim().length === 0) throw new Error("Fable prompt version is required");
  if (input.system.trim().length === 0) throw new Error("Fable system text is required");
  if (input.userBlocks.length === 0) throw new Error("Fable request requires at least one block");
  for (const [index, block] of input.userBlocks.entries()) {
    if (block.type === "text") {
      if (block.text.length === 0) throw new Error(`Fable text block ${index} is empty`);
      continue;
    }
    if (
      block.source.type !== "base64" ||
      block.source.data.length === 0 ||
      !/^image\/(?:gif|jpeg|png|webp)$/u.test(block.source.media_type)
    ) {
      throw new Error(`Fable image block ${index} is invalid`);
    }
    const bytes = Buffer.from(block.source.data, "base64");
    if (bytes.byteLength === 0 || bytes.toString("base64") !== block.source.data) {
      throw new Error(`Fable image block ${index} is not canonical base64`);
    }
  }
  if (
    input.outputSchema !== undefined &&
    (input.outputSchema === null || Array.isArray(input.outputSchema))
  ) {
    throw new Error("Fable output schema must be an object");
  }
  const outputConfig =
    input.outputSchema === undefined
      ? { effort: FABLE_EFFORT }
      : {
          effort: FABLE_EFFORT,
          format: { schema: structuredClone(input.outputSchema), type: "json_schema" as const },
        };
  const body: FableRequestBody = {
    max_tokens: MAX_OUTPUT_TOKENS,
    messages: [{ content: input.userBlocks, role: "user" }],
    model: FABLE_MODEL,
    output_config: outputConfig,
    system: input.system,
  };
  const manifest = {
    contractVersion: FABLE_CONTRACT_VERSION,
    effort: FABLE_EFFORT,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    model: FABLE_MODEL,
    promptVersion: input.promptVersion,
  } as const;
  // The digest binds manifest AND exact body: any change to either names a different request.
  return { body, manifest, manifestDigest: digestJson({ body, manifest }) };
}

export async function executeFableAttempt(
  compiledRequest: CompiledFableRequest,
  port: FableProviderPort,
): Promise<FableAttemptEvidence> {
  let counted: { input_tokens: number };
  try {
    counted = await port.count(compiledRequest.body);
  } catch (cause) {
    throw new FableContractError({
      cause,
      code: "count_failed",
      message: "official token count failed; counting failure blocks generation",
    });
  }
  if (!Number.isSafeInteger(counted.input_tokens) || counted.input_tokens < 0) {
    throw new FableContractError({
      code: "count_failed",
      message: "official token count returned a non-integer input size",
    });
  }
  if (counted.input_tokens > MAX_COUNTED_INPUT) {
    throw new FableContractError({
      code: "over_context_ceiling",
      message:
        `counted input ${counted.input_tokens} exceeds MAX_COUNTED_INPUT ${MAX_COUNTED_INPUT}; ` +
        "the request is refused before spend",
    });
  }

  const raw = (await port.send(compiledRequest.body)) as {
    content?: readonly { text?: string; type?: string }[];
    id?: string;
    model?: string;
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };

  if (raw.model !== FABLE_MODEL) {
    throw new FableContractError({
      code: "served_model_mismatch",
      message: `served model ${String(raw.model)} is not exactly ${FABLE_MODEL}; no fallback exists`,
    });
  }
  if (raw.stop_reason === "max_tokens") {
    throw new FableContractError({
      code: "truncated",
      message: "the writer stopped at max_tokens; a truncated folio is a failed attempt",
    });
  }
  if (raw.stop_reason === "refusal") {
    throw new FableContractError({ code: "refused", message: "the writer refused the request" });
  }
  if (raw.stop_reason !== "end_turn") {
    throw new FableContractError({
      code: "unsupported_stop",
      message: `unsupported stop reason ${String(raw.stop_reason)}`,
    });
  }
  const prose = (raw.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("");
  if (prose.trim().length === 0) {
    throw new FableContractError({ code: "empty_output", message: "the writer returned no prose" });
  }
  const usage = raw.usage;
  if (
    usage === undefined ||
    !Number.isSafeInteger(usage.input_tokens) ||
    !Number.isSafeInteger(usage.output_tokens)
  ) {
    throw new FableContractError({
      code: "empty_output",
      message: "the writer returned no verifiable usage evidence",
    });
  }
  if (typeof raw.id !== "string" || raw.id.length === 0) {
    throw new FableContractError({
      code: "empty_output",
      message: "the writer returned no response id",
    });
  }
  return {
    countedInputTokens: counted.input_tokens,
    manifestDigest: compiledRequest.manifestDigest,
    prose,
    providerResponseId: raw.id,
    servedModel: FABLE_MODEL,
    usage: { input_tokens: usage.input_tokens as number, output_tokens: usage.output_tokens as number },
  };
}
