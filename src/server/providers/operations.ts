import { randomUUID } from "node:crypto";
import { db, json } from "../db/index.js";
import { config } from "../config.js";
import { putBytes } from "../library/assets.js";
export class Paused extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Paused";
  }
}
export async function budget(editionId: string) {
  const edition = await db
    .selectFrom("editions")
    .select("budget_usd")
    .where("id", "=", editionId)
    .executeTakeFirstOrThrow();
  const ops = await db
    .selectFrom("operations")
    .select(["actual_usd", "reserved_usd", "status"])
    .where("edition_id", "=", editionId)
    .execute();
  const committed = ops.reduce(
    (n, o) => n + (o.actual_usd ?? o.reserved_usd),
    0,
  );
  return {
    allowance: edition.budget_usd,
    committed,
    remaining: Math.max(0, edition.budget_usd - committed),
    unknown: ops.filter((o) => o.status === "unknown").length,
  };
}
export async function reserve(
  editionId: string,
  sessionId: string,
  key: string,
  kind: string,
  request: Record<string, unknown>,
  usd: number,
) {
  return db.transaction().execute(async (tx) => {
    const edition = await tx
      .selectFrom("editions")
      .selectAll()
      .where("id", "=", editionId)
      .forUpdate()
      .executeTakeFirstOrThrow();
    const existing = await tx
      .selectFrom("operations")
      .selectAll()
      .where("key", "=", key)
      .executeTakeFirst();
    if (existing) return existing;
    if (!config.generationEnabled)
      throw new Paused("Generation is paused. Saved work is intact.");
    const ops = await tx
      .selectFrom("operations")
      .select(["actual_usd", "reserved_usd"])
      .where("edition_id", "=", editionId)
      .execute();
    const committed = ops.reduce(
      (n, o) => n + (o.actual_usd ?? o.reserved_usd),
      0,
    );
    if (
      !Number.isFinite(usd) ||
      usd < 0 ||
      committed + usd > edition.budget_usd
    )
      throw new Paused(
        `The shared generation allowance has $${Math.max(0, edition.budget_usd - committed).toFixed(2)} left; this operation reserves $${usd.toFixed(2)}. Saved work is intact.`,
      );
    return tx
      .insertInto("operations")
      .values({
        id: randomUUID(),
        edition_id: editionId,
        session_id: sessionId,
        key,
        kind,
        status: "reserved",
        request: json(request),
        provider_id: null,
        response: null,
        raw_key: null,
        reserved_usd: usd,
        actual_usd: null,
        error: null,
        completed_at: null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  });
}
export async function dispatched(id: string) {
  await db
    .updateTable("operations")
    .set({ status: "dispatched" })
    .where("id", "=", id)
    .execute();
}
export async function preserveRaw(id: string, response: Response) {
  const raw = await response.text();
  // The exact returned text reaches durable Postgres before JSON parsing or image decoding.
  await db
    .updateTable("operations")
    .set({
      response: json({
        rawText: raw,
        httpStatus: response.status,
        requestId: response.headers.get("x-request-id"),
      }),
      status: "received",
    })
    .where("id", "=", id)
    .execute();
  const key = `operations/${id}/response.json`;
  await putBytes(key, Buffer.from(raw), "application/json");
  await db
    .updateTable("operations")
    .set({ raw_key: key })
    .where("id", "=", id)
    .execute();
  return JSON.parse(raw) as Record<string, unknown>;
}
export async function finish(
  id: string,
  response: Record<string, unknown>,
  cost: number | null,
) {
  await db
    .updateTable("operations")
    .set({
      status: "complete",
      response: json(response),
      actual_usd: cost,
      completed_at: new Date().toISOString(),
    })
    .where("id", "=", id)
    .execute();
}
export async function uncertain(id: string, error: unknown): Promise<never> {
  const message = error instanceof Error ? error.message : String(error);
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? Number(error.status)
      : 0;
  const definitive = status >= 400 && status < 500 && status !== 408;
  await db
    .updateTable("operations")
    .set({
      status: definitive ? "failed" : "unknown",
      error: message,
      ...(definitive ? { actual_usd: 0 } : {}),
    })
    .where("id", "=", id)
    .execute();
  throw new Paused(
    definitive
      ? `Provider rejected the request: ${message}`
      : "A provider request has an uncertain outcome. Its cost remains reserved; it will not be purchased again automatically.",
  );
}
export function parsedReceipt(
  response: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!response) return null;
  return typeof response.rawText === "string"
    ? JSON.parse(response.rawText)
    : response;
}
