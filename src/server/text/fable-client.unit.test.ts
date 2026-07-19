import { describe, expect, it, vi } from "vitest";

import { AnthropicFableClient, FableProviderHttpError } from "./fable-client.js";
import { compileFableRequest } from "./fable-contract.js";

const request = compileFableRequest({
  promptVersion: "d0-client-test-v1",
  system: "You are writing one folio.",
  userBlocks: [{ text: "Write folio one.", type: "text" }],
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });
}

describe("D0 Anthropic client", () => {
  it("counts through the official endpoint with exact headers and no redirects", async () => {
    const fetchStub = vi.fn(async () => jsonResponse(200, { input_tokens: 4321 }));
    const client = new AnthropicFableClient({ apiKey: "test-key", fetch: fetchStub });

    await expect(client.count(request.body)).resolves.toEqual({ input_tokens: 4321 });

    expect(fetchStub).toHaveBeenCalledTimes(1);
    const [url, init] = fetchStub.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages/count_tokens");
    expect(init.redirect).toBe("error");
    const headers = init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("test-key");
    expect(headers["anthropic-version"]).toBeDefined();
    // The count body is the exact request body minus max_tokens-independent fields the count
    // endpoint does not accept; the model, system, and messages must be byte-identical.
    const sent = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(sent.model).toBe(request.body.model);
    expect(sent.system).toBe(request.body.system);
    expect(sent.messages).toEqual(request.body.messages);
  });

  it("sends the exact compiled body to /v1/messages and returns the raw response", async () => {
    const raw = {
      content: [{ text: "prose", type: "text" }],
      id: "msg_1",
      model: "claude-fable-5",
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    };
    const fetchStub = vi.fn(async () => jsonResponse(200, raw));
    const client = new AnthropicFableClient({ apiKey: "test-key", fetch: fetchStub });

    await expect(client.send(request.body)).resolves.toEqual(raw);
    const [url, init] = fetchStub.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(JSON.parse(String(init.body))).toEqual(JSON.parse(JSON.stringify(request.body)));
  });

  it("raises a typed error on non-200 and never retries on its own", async () => {
    const fetchStub = vi.fn(async () => jsonResponse(429, { error: { message: "rate limited" } }));
    const client = new AnthropicFableClient({ apiKey: "test-key", fetch: fetchStub });

    await expect(client.send(request.body)).rejects.toBeInstanceOf(FableProviderHttpError);
    await expect(
      client.send(request.body).catch((error: FableProviderHttpError) => error.httpStatus),
    ).resolves.toBe(429);
    // One call per invocation: the client performs no automatic transport retry.
    expect(fetchStub).toHaveBeenCalledTimes(2);
  });

  it("refuses to construct without a key and never puts the key in a URL", async () => {
    expect(() => new AnthropicFableClient({ apiKey: " ", fetch: vi.fn() })).toThrow(/api key/i);
    const fetchStub = vi.fn(async () => jsonResponse(200, { input_tokens: 1 }));
    const client = new AnthropicFableClient({ apiKey: "secret-key", fetch: fetchStub });
    await client.count(request.body);
    const [url] = fetchStub.mock.calls[0] as unknown as [string];
    expect(url).not.toContain("secret-key");
  });
});
