import OpenAI from "openai";
import { Agent, fetch } from "undici";

// Native context renewal and images can wait longer than Node's default five-minute
// header deadline. Keep the transport and SDK on one finite deadline, without retries.
export function providerClient(options: {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}) {
  const timeout = options.timeout ?? 20 * 60 * 1000;
  const dispatcher = new Agent({ headersTimeout: timeout, bodyTimeout: timeout });
  const client = new OpenAI({
    ...options,
    timeout,
    maxRetries: 0,
    // The SDK sends a URL and RequestInit. Undici's Node Request type includes
    // stream methods absent from TypeScript's DOM declarations.
    fetch: fetch as unknown as typeof globalThis.fetch,
    fetchOptions: { dispatcher },
  });
  return { client, dispatcher };
}
