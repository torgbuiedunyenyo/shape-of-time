import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { expect, test } from "vitest";
import { providerClient } from "../src/server/providers/transport.js";

test("provider transport receives delayed headers and body, and never retries a timed-out purchase", async () => {
  let calls = 0;
  const server = createServer(async (_req, res) => {
    calls++;
    await delay(150);
    res.writeHead(200, { "content-type": "application/json" });
    res.write('{"id":"transport-receipt",');
    await delay(150);
    res.end('"output":[]}');
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test listener");
  const baseURL = `http://127.0.0.1:${address.port}`;
  const normal = providerClient({ apiKey: "local-transport-test", baseURL, timeout: 2000 });
  const short = providerClient({ apiKey: "local-transport-test", baseURL, timeout: 60 });
  try {
    const response = await normal.client.responses.compact({ model: "transport-only", input: [] });
    expect(response.id).toBe("transport-receipt");
    await expect(short.client.responses.compact({ model: "transport-only", input: [] })).rejects.toThrow(/timed out/i);
    await delay(400);
    expect(calls).toBe(2);
  } finally {
    await normal.dispatcher.close();
    await short.dispatcher.close();
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  }
});
