import type { FableProviderPort, FableRequestBody } from "./fable-contract.js";

const ANTHROPIC_ORIGIN = "https://api.anthropic.com";
const ANTHROPIC_VERSION = "2023-06-01";

export class FableProviderHttpError extends Error {
  readonly httpStatus: number;

  constructor(options: { httpStatus: number; message: string }) {
    super(options.message);
    this.name = "FableProviderHttpError";
    this.httpStatus = options.httpStatus;
  }
}

/**
 * The direct Messages API adapter behind the D0 contract. Bearer credentials go only to the exact
 * Anthropic origin with redirect following disabled, and the adapter performs no automatic
 * transport retry: one invocation is one HTTP request, and retry policy belongs to the caller's
 * durable layer where an attempt is a recorded thing (mirrors the B1 image-client discipline).
 */
export class AnthropicFableClient implements FableProviderPort {
  readonly #apiKey: string;
  readonly #fetch: typeof fetch;

  constructor(options: { apiKey: string; fetch?: typeof fetch }) {
    if (options.apiKey.trim().length === 0) throw new Error("Anthropic api key is required");
    this.#apiKey = options.apiKey;
    this.#fetch = options.fetch ?? fetch;
  }

  async count(body: FableRequestBody): Promise<{ input_tokens: number }> {
    // The count endpoint takes the same request minus output sizing; model, system, and messages
    // must be byte-identical to the request that will be sent, or the count proves nothing.
    const countBody = {
      messages: body.messages,
      model: body.model,
      output_config: body.output_config,
      system: body.system,
    };
    const parsed = (await this.#post("/v1/messages/count_tokens", countBody)) as {
      input_tokens?: number;
    };
    if (!Number.isSafeInteger(parsed.input_tokens)) {
      throw new FableProviderHttpError({
        httpStatus: 200,
        message: "count endpoint returned no integer input_tokens",
      });
    }
    return { input_tokens: parsed.input_tokens as number };
  }

  async send(body: FableRequestBody): Promise<unknown> {
    return this.#post("/v1/messages", body);
  }

  async #post(path: string, body: unknown): Promise<unknown> {
    const response = await this.#fetch(`${ANTHROPIC_ORIGIN}${path}`, {
      body: JSON.stringify(body),
      headers: {
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
        "x-api-key": this.#apiKey,
      },
      method: "POST",
      redirect: "error",
    });
    if (response.status !== 200) {
      const detail = await response.text().catch(() => "");
      throw new FableProviderHttpError({
        httpStatus: response.status,
        message: `Anthropic ${path} answered ${response.status}: ${detail.slice(0, 300)}`,
      });
    }
    return response.json();
  }
}
