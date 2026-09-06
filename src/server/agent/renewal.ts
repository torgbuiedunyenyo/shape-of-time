import { toResponseInputItems } from "openai/lib/responses/ResponseInputItems";
import type {
  CompactedResponse,
  ResponseInputItem,
  Tool,
} from "openai/resources/responses/responses";
import { db, json } from "../db/index.js";
import { config } from "../config.js";
import { openai, textCost } from "../providers/astra.js";
import { hydrateImages, storeImages } from "../providers/protocol.js";
import {
  reserve,
  dispatched,
  preserveRaw,
  parsedReceipt,
  finish,
  uncertain,
  Paused,
} from "../providers/operations.js";
export function pendingCalls(input: ResponseInputItem[]) {
  const answered = new Set(
    input
      .filter((i) => i.type === "function_call_output")
      .map((i) => i.call_id),
  );
  return input.some(
    (i) => i.type === "function_call" && !answered.has(i.call_id),
  );
}
/** Renew between reader requests, under the existing author lock. A saved receipt always wins. */
export async function renewBeforeRequest(
  sessionId: string,
  intentId: string,
  tools: Tool[],
) {
  const requestKey = `before-reader:${intentId}`;
  const prior = await db
    .selectFrom("operations")
    .select("id")
    .where("key", "=", `${sessionId}:renew:${requestKey}`)
    .executeTakeFirst();
  if (prior) return renewSession(sessionId, requestKey);
  const session = await db
    .selectFrom("sessions")
    .select("input")
    .where("id", "=", sessionId)
    .executeTakeFirstOrThrow();
  const count = await openai.responses.inputTokens.count({
    model: config.textModel,
    input: await hydrateImages(session.input),
    tools,
    reasoning: { effort: config.effort },
    tool_choice: "auto",
  });
  if (count.input_tokens > config.contextRenewalTokens)
    return renewSession(sessionId, requestKey);
}
export async function renewSession(sessionId: string, requestKey: string) {
  const session = await db
    .selectFrom("sessions")
    .selectAll()
    .where("id", "=", sessionId)
    .executeTakeFirstOrThrow();
  if (pendingCalls(session.input))
    throw new Paused(
      "Finish the current tool exchange before renewing context.",
    );
  const key = `${sessionId}:renew:${requestKey}`;
  let op = await db
    .selectFrom("operations")
    .selectAll()
    .where("key", "=", key)
    .executeTakeFirst();
  if (!op) {
    const count = await openai.responses.inputTokens.count({
      model: config.textModel,
      input: await hydrateImages(session.input),
    });
    const long = count.input_tokens > 272000;
    // The standalone compactor exposes no output cap or reasoning-effort setting. Reserve the
    // model's full output capacity; this utility never generates published prose or criticism.
    const reserveUsd =
      (count.input_tokens * (long ? 25 : 12.5) + 128000 * (long ? 75 : 50)) /
      1e6;
    op = await reserve(
      session.edition_id,
      sessionId,
      key,
      "compaction",
      {
        model: config.textModel,
        input: await storeImages(session.input),
        step: session.step,
        price_record: "2026-09-06-standard",
      },
      reserveUsd,
    );
  }
  if (["failed", "unknown"].includes(op.status))
    throw new Paused(
      op.error ?? "Reconcile the previous renewal before another attempt.",
    );
  let response = parsedReceipt(
    op.response,
  ) as unknown as CompactedResponse | null;
  if (op.status === "reserved") {
    const liveInput = await hydrateImages(
      op.request.input as ResponseInputItem[],
    );
    await dispatched(op.id);
    try {
      response = (await preserveRaw(
        op.id,
        await openai.responses
          .compact({
            model: config.textModel,
            input: liveInput,
            service_tier: "default",
          })
          .asResponse(),
      )) as unknown as CompactedResponse;
    } catch (e) {
      return uncertain(op.id, e);
    }
  } else if (!response)
    throw new Paused(
      "A context renewal has an uncertain outcome; its full original input remains saved.",
    );
  if (!response?.output?.some((i) => i.type === "compaction"))
    throw new Paused(
      "The renewal receipt is saved but has no compaction item.",
    );
  if (op.status !== "complete")
    await finish(
      op.id,
      response as unknown as Record<string, unknown>,
      response.usage ? textCost(response.usage) : null,
    );
  const compactId = response.output.find((i) => i.type === "compaction")!.id;
  const canonical = toResponseInputItems(response.output);
  // Keep the whole canonical returned window. Reattach the original, unabridged artistic
  // orientation as a new developer message so it remains directly available after renewal.
  const orientation = (op.request.input as ResponseInputItem[]).find(
    (i) => "role" in i && i.role === "developer",
  );
  const next = await storeImages(
    orientation ? [...canonical, orientation] : canonical,
  );
  await db.transaction().execute(async (tx) => {
    const current = await tx
      .selectFrom("sessions")
      .selectAll()
      .where("id", "=", sessionId)
      .forUpdate()
      .executeTakeFirstOrThrow();
    if (
      current.input.some((i) => i.type === "compaction" && i.id === compactId)
    )
      return;
    if (current.step !== op.request.step)
      throw new Paused(
        "The session advanced during renewal. The returned window is saved and has not overwritten newer work.",
      );
    await tx
      .updateTable("sessions")
      .set({ input: json(next), step: current.step + 1 })
      .where("id", "=", sessionId)
      .execute();
  });
  return {
    operation_id: op.id,
    session_id: sessionId,
    compaction_id: compactId,
    input_items: session.input.length,
    retained_items: next.length,
    usage: response.usage,
  };
}
