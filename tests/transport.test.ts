import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { expect, test } from "vitest";
import { toFile } from "openai";
import { providerClient } from "../src/server/providers/transport.js";

test("reference image edit uploads the exact file and prompt as multipart data", async () => {
  let calls = 0;
  let uploaded: FormData | undefined;
  const server = createServer(async (req, res) => {
    calls++;
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    uploaded = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": req.headers["content-type"]! },
    }).formData();
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ created: 1, data: [{ b64_json: "receipt" }] }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("No test listener");
  const provider = providerClient({ apiKey: "local-transport-test", baseURL: `http://127.0.0.1:${address.port}`, timeout: 2000 });
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  try {
    const response = await provider.client.images.edit({
      model: "transport-only", prompt: "Retain this reference", image: [await toFile(bytes, "reference.png", { type: "image/png" })],
    });
    expect(response.data?.[0]?.b64_json).toBe("receipt");
    expect(calls).toBe(1);
    expect(uploaded?.get("prompt")).toBe("Retain this reference");
    const file = uploaded?.get("image[]") as File;
    expect(file.name).toBe("reference.png");
    expect(file.type).toBe("image/png");
    expect(Buffer.from(await file.arrayBuffer())).toEqual(bytes);
  } finally {
    await provider.dispatcher.close();
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  }
});

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
