import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { z } from "zod";
import { db } from "./db/index.js";
import { config } from "./config.js";
import { getBook, enqueue, sourceContext } from "./library/store.js";
import { getBytes } from "./library/assets.js";
const region = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().positive().max(1),
    height: z.number().positive().max(1),
  })
  .refine((r) => r.x + r.width <= 1.00001 && r.y + r.height <= 1.00001);
const anchor = z.object({
  publicationId: z.string(),
  blockId: z.string(),
  offset: z.number().int().nonnegative().optional(),
  endBlockId: z.string().optional(),
  endOffset: z.number().int().nonnegative().optional(),
  quote: z.string().optional(),
  assetId: z.string().optional(),
  region: region.optional(),
});
export const app = new Hono();
app.onError((error, c) => {
  console.error(error.name, error.message);
  return c.json(
    {
      error:
        error instanceof z.ZodError
          ? "Please check the request."
          : error.message,
    },
    400,
  );
});
app.get("/healthz", async (c) => {
  await db.selectFrom("editions").select("id").limit(1).execute();
  return c.json({
    status: "ok",
    revision: process.env.RAILWAY_GIT_COMMIT_SHA ?? "local",
  });
});
app.get("/api/library", async (c) => {
  const query = c.req.query("q") ?? "";
  const edition = await db
    .selectFrom("editions")
    .select(["id", "title", "root_work_id"])
    .where("id", "=", "shape-of-time")
    .executeTakeFirstOrThrow();
  const works = await db
    .selectFrom("works")
    .selectAll()
    .where("edition_id", "=", edition.id)
    .where("title", "ilike", `%${query}%`)
    .where((eb) =>
      eb.exists(
        eb
          .selectFrom("publications")
          .select("id")
          .whereRef("publications.work_id", "=", "works.id"),
      ),
    )
    .orderBy("created_at")
    .execute();
  return c.json({
    edition: {
      ...edition,
      root_work_id:
        works.some((w) => w.id === edition.root_work_id) || query
          ? edition.root_work_id
          : null,
    },
    works,
    generationEnabled: config.generationEnabled,
  });
});
app.get("/api/works/:id", async (c) =>
  c.json(await getBook(c.req.param("id"))),
);
app.get("/api/assets/:id", async (c) => {
  const asset = await db
    .selectFrom("assets")
    .selectAll()
    .where("id", "=", c.req.param("id"))
    .executeTakeFirstOrThrow();
  const bytes = await getBytes(asset.storage_key);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": asset.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});
app.get("/api/intents/:id", async (c) => {
  const intent = await db
    .selectFrom("intents")
    .select(["id", "kind", "status", "work_id", "result_work_id", "error"])
    .where("id", "=", c.req.param("id"))
    .executeTakeFirstOrThrow();
  const ready = intent.result_work_id
    ? await db
        .selectFrom("publications")
        .select("id")
        .where("work_id", "=", intent.result_work_id)
        .executeTakeFirst()
    : null;
  return c.json({
    ...intent,
    result_work_id: ready ? intent.result_work_id : null,
  });
});
app.post("/api/intents", async (c) => {
  if (!config.generationEnabled)
    return c.json(
      { error: "New writing is paused. Saved books remain available." },
      503,
    );
  const body = z
    .object({
      key: z.string().min(8).max(300),
      kind: z.enum(["begin", "continue", "explore", "title"]),
      workId: z.string().nullable(),
      source: anchor.optional(),
      angle: z.string().max(4000).optional(),
      title: z.string().max(300).optional(),
    })
    .parse(await c.req.json());
  let source;
  if (body.kind === "explore") {
    if (!body.source)
      return c.json({ error: "Choose a passage or image to open." }, 400);
    source = await sourceContext(body.source);
  }
  if (body.workId)
    await db
      .selectFrom("works")
      .select("id")
      .where("id", "=", body.workId)
      .where("edition_id", "=", "shape-of-time")
      .executeTakeFirstOrThrow();
  const payload = {
    ...(source ? { source } : {}),
    ...(body.angle ? { angle: body.angle } : {}),
    ...(body.title ? { title: body.title } : {}),
  };
  const intent = await enqueue(
    "shape-of-time",
    body.kind,
    body.workId,
    payload,
    body.key,
  );
  return c.json(intent, 202);
});
app.use("/assets/*", serveStatic({ root: "./dist/client" }));
app.get("*", serveStatic({ path: "./dist/client/index.html" }));
