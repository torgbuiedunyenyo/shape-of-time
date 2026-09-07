import { providerClient } from "./transport.js";
import type {
  Response as AstraResponse,
  ResponseInputItem,
  Tool,
  ResponseUsage,
} from "openai/resources/responses/responses";
import { config } from "../config.js";
import { db, json } from "../db/index.js";
import { hydrateImages, storeImages } from "./protocol.js";
import {
  reserve,
  dispatched,
  preserveRaw,
  finish,
  uncertain,
  parsedReceipt,
  Paused,
} from "./operations.js";
export const { client: openai } = providerClient({
  apiKey: process.env.OPENAI_API_KEY ?? "unconfigured",
});
export function textCost(usage: ResponseUsage) {
  const long = usage.input_tokens > 272000,
    rate = long ? 20 : 10,
    cache = long ? 2 : 1,
    write = long ? 25 : 12.5,
    out = long ? 75 : 50;
  const cached = usage.input_tokens_details?.cached_tokens ?? 0,
    writes = usage.input_tokens_details?.cache_write_tokens ?? 0;
  return (
    ((usage.input_tokens - cached - writes) * rate +
      cached * cache +
      writes * write +
      usage.output_tokens * out) /
    1e6
  );
}
export async function astra(
  editionId: string,
  sessionId: string,
  key: string,
  input: ResponseInputItem[],
  tools: Tool[],
) {
  let dispatchBody: Parameters<typeof openai.responses.create>[0] | undefined;
  let op = await db
    .selectFrom("operations")
    .selectAll()
    .where("key", "=", key)
    .executeTakeFirst();
  if (!op) {
    const storedInput = await storeImages(input);
    const liveInput = await hydrateImages(storedInput);
    const count = await openai.responses.inputTokens.count({
      model: config.textModel,
      input: liveInput,
      tools,
      reasoning: { effort: config.effort },
      tool_choice: "auto",
    });
    const maxOutput = 32768;
    if (count.input_tokens > 880000)
      throw new Paused(
        "The active context needs renewal. Full originals remain in the archive.",
      );
    const body = {
      model: config.textModel,
      reasoning: { effort: config.effort },
      input: storedInput,
      tools,
      tool_choice: "auto" as const,
      service_tier: "default" as const,
      // Let the agent request related tools together. The runner records and executes each in order.
      parallel_tool_calls: true,
      background: true,
      store: true,
      max_output_tokens: maxOutput,
      truncation: "disabled" as const,
    };
    dispatchBody = { ...body, input: liveInput };
    const reserveUsd =
      (count.input_tokens * (count.input_tokens > 272000 ? 25 : 12.5) +
        maxOutput * (count.input_tokens > 272000 ? 75 : 50)) /
      1e6;
    op = await reserve(
      editionId,
      sessionId,
      key,
      "astra",
      {
        body,
        input_tokens: count.input_tokens,
        price_record: "2026-09-06-standard",
      },
      reserveUsd,
    );
  }
  if (["unknown", "failed"].includes(op.status))
    throw new Paused(op.error ?? "This provider request needs reconciliation.");
  let response = parsedReceipt(op.response) as unknown as AstraResponse | null;
  if (op.status === "complete") return response!;
  if (op.status === "reserved") {
    const body =
      dispatchBody ??
      (await hydrateImages(
        op.request.body as Parameters<typeof openai.responses.create>[0],
      ));
    await dispatched(op.id);
    try {
      response = (await preserveRaw(
        op.id,
        await openai.responses.create(body).asResponse(),
      )) as unknown as AstraResponse;
    } catch (e) {
      return uncertain(op.id, e);
    }
  } else if (!response && !op.provider_id)
    throw new Paused(
      "A dispatched request has no saved provider ID. Reconcile it before retrying.",
    );
  const providerId = response?.id ?? op.provider_id;
  if (!providerId)
    throw new Paused(
      "The saved provider response has no ID. Inspect the preserved receipt.",
    );
  await db
    .updateTable("operations")
    .set({ provider_id: providerId, status: "polling" })
    .where("id", "=", op.id)
    .execute();
  while (
    !response ||
    ["queued", "in_progress"].includes(response.status ?? "")
  ) {
    await new Promise((r) => setTimeout(r, 2500));
    const raw = await openai.responses.retrieve(providerId).asResponse();
    response = (await preserveRaw(op.id, raw)) as unknown as AstraResponse;
  }
  await finish(
    op.id,
    response as unknown as Record<string, unknown>,
    response.usage ? textCost(response.usage) : null,
  );
  if (response.status !== "completed")
    throw new Paused(
      `Astra ended with ${response.status}. Returned work and usage are preserved for inspection.`,
    );
  if (!response.model.startsWith(config.textModel))
    throw new Paused(`Unexpected text model: ${response.model}`);
  if (response.reasoning?.effort !== config.effort)
    throw new Paused("Provider did not confirm xhigh reasoning.");
  return response;
}
// Complete items (including phase and encrypted reasoning) are replayed; output_text is never the checkpoint.
export async function appendItems(
  sessionId: string,
  items: ResponseInputItem[],
  advance = false,
) {
  return db.transaction().execute(async (tx) => {
    const session = await tx
      .selectFrom("sessions")
      .selectAll()
      .where("id", "=", sessionId)
      .forUpdate()
      .executeTakeFirstOrThrow();
    return tx
      .updateTable("sessions")
      .set({
        input: json(await storeImages([...session.input, ...items])),
        step: session.step + (advance ? 1 : 0),
      })
      .where("id", "=", sessionId)
      .returningAll()
      .executeTakeFirstOrThrow();
  });
}
