import { toResponseInputItems } from "openai/lib/responses/ResponseInputItems";
import { readFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import type {
  ResponseInputItem,
  ResponseInputContent,
} from "openai/resources/responses/responses";
import { db, json, pool } from "../db/index.js";
import { currentMechanism, mechanismMatches } from "../mechanism.js";
import { config } from "../config.js";
import { renewBeforeRequest } from "./renewal.js";
import { astra, appendItems } from "../providers/astra.js";
import { Paused } from "../providers/operations.js";
import { storeImages } from "../providers/protocol.js";
import { imageContent } from "../library/assets.js";
import { getBook, writeDocument } from "../library/store.js";
import { toolDefinitions, recordedTool, type ToolContext } from "./tools.js";
import { nextIntent, useAvailableContinuation } from "./preparation.js";
async function orientation(editionId: string, role: string) {
  const e = await db
    .selectFrom("editions")
    .selectAll()
    .where("id", "=", editionId)
    .executeTakeFirstOrThrow();
  const prompt = await readFile(
    `prompts/${role === "critic" ? "critic" : "creative-agent"}.md`,
    "utf8",
  );
  return (
    prompt +
    "\n\n" +
    Object.entries(e.source)
      .map(([name, text]) => `<source name="${name}">\n${text}\n</source>`)
      .join("\n\n")
  );
}
const finalText = (items: ResponseInputItem[]) =>
  items
    .flatMap((i) =>
      i.type === "message" && "content" in i && Array.isArray(i.content)
        ? i.content
            .filter((c) => c.type === "output_text")
            .map((c) => ("text" in c ? c.text : ""))
        : [],
    )
    .join("\n");
async function loop(ctx: ToolContext, readOnly = false): Promise<string> {
  for (;;) {
    const session = await db
      .selectFrom("sessions")
      .selectAll()
      .where("id", "=", ctx.sessionId)
      .executeTakeFirstOrThrow();
    const edition = await db.selectFrom("editions").select("mechanism")
      .where("id", "=", ctx.editionId).executeTakeFirstOrThrow();
    if (!mechanismMatches(edition.mechanism, await currentMechanism()))
      throw new Paused("The creative mechanism differs from this edition’s pinned process. Saved work is intact; review the change before continuing.");
    const inputs = session.input;
    const answered = new Set(
      inputs
        .filter((i) => i.type === "function_call_output")
        .map((i) => i.call_id),
    );
    const pending = inputs.filter(
      (i) => i.type === "function_call" && !answered.has(i.call_id),
    );
    if (pending.length) {
      for (const call of pending) {
        if (call.type !== "function_call") continue;
        const result = await recordedTool(
          call.name,
          call.arguments,
          call.call_id,
          ctx,
          readOnly,
        );
        await appendItems(ctx.sessionId, [result]);
      }
      continue;
    }
    // A persisted final message is already a completed turn, including after a restart.
    const tail = inputs.at(-1);
    if (
      tail?.type === "message" &&
      tail.role === "assistant" &&
      "content" in tail
    )
      return finalText([tail]);
    const response = await astra(
      ctx.editionId,
      ctx.sessionId,
      `${ctx.sessionId}:response:${session.step}`,
      inputs,
      toolDefinitions(readOnly),
    );
    const items = toResponseInputItems(response.output);
    await appendItems(ctx.sessionId, items, true);
    if (!response.output.some((i) => i.type === "function_call"))
      return finalText(items);
  }
}
export async function critique(
  editionId: string,
  parentId: string,
  question: string,
  subjects: string[],
  key: string,
) {
  const id =
    "critic-" + createHash("sha256").update(key).digest("hex").slice(0, 32);
  const exists = await db
    .selectFrom("sessions")
    .select("id")
    .where("id", "=", id)
    .executeTakeFirst();
  if (!exists) {
    const material = [];
    for (const subject of subjects) {
      const doc = await db
        .selectFrom("documents")
        .selectAll()
        .where("id", "=", subject)
        .where("edition_id", "=", editionId)
        .executeTakeFirst();
      if (doc) {
        material.push(doc);
        continue;
      }
      const work = await db
        .selectFrom("works")
        .select("id")
        .where("id", "=", subject)
        .where("edition_id", "=", editionId)
        .executeTakeFirst();
      if (work) {
        material.push(await getBook(work.id));
        continue;
      }
      const pub = await db
        .selectFrom("publications")
        .selectAll()
        .where("id", "=", subject)
        .executeTakeFirst();
      material.push(
        pub ?? {
          id: subject,
          note: "Use the archive or view_image to investigate this source.",
        },
      );
    }
    const input: ResponseInputItem[] = [
      { role: "developer", content: await orientation(editionId, "critic") },
      {
        role: "user",
        content: `Review request: ${question}\n\nActual subjects:\n${json(material)}`,
      },
    ];
    await db
      .insertInto("sessions")
      .values({
        id,
        edition_id: editionId,
        role: "critic",
        input: json(input),
        parent_id: parentId,
      })
      .onConflict((c) => c.column("id").doNothing())
      .execute();
  }
  const result = await loop(
    {
      editionId,
      sessionId: id,
      intentId: null,
      critic: async () => {
        throw new Error("A critic cannot commission another critic.");
      },
    },
    true,
  );
  await writeDocument(
    editionId,
    `criticism/${id}.md`,
    result,
    0,
    key + ":review",
  );
  return result;
}
export async function runIntent(intentId: string) {
  let intent = await db
    .selectFrom("intents")
    .selectAll()
    .where("id", "=", intentId)
    .executeTakeFirstOrThrow();
  if (intent.status === "done") return;
  if (await useAvailableContinuation(intentId)) return;
  if (!intent.session_id) {
    let session = await db
      .selectFrom("sessions")
      .selectAll()
      .where("edition_id", "=", intent.edition_id)
      .where("role", "=", "author")
      .orderBy("created_at", "desc")
      .executeTakeFirst();
    if (session && config.generationEnabled) {
      try {
        await renewBeforeRequest(session.id, intent.id, toolDefinitions(false));
      } catch (e) {
        await db
          .updateTable("intents")
          .set({
            status: e instanceof Paused ? "paused" : "failed",
            error: e instanceof Error ? e.message : String(e),
          })
          .where("id", "=", intentId)
          .execute();
        throw e;
      }
    }
    if (!session) {
      const input: ResponseInputItem[] = [
        {
          role: "developer",
          content: await orientation(intent.edition_id, "author"),
        },
      ];
      session = await db
        .insertInto("sessions")
        .values({
          id: randomUUID(),
          edition_id: intent.edition_id,
          role: "author",
          input: json(input),
          parent_id: null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
    }
    const content: ResponseInputContent[] = [
      {
        type: "input_text",
        text: `Reader request ${intent.id}: ${intent.kind}\n${json(intent.payload)}\n${intent.work_id ? "Current work: " + intent.work_id : "Establish an independent work and open it using open_work."}\n${intent.kind === "begin" ? "Begin the root narrative of Jay and Tan in The Shape of Time. Create the first absorbing illustrated stretch, using the source world and your own creative judgment." : ""}${intent.kind === "continue" ? "Continue the current work from its published frontier. Access earlier originals and your workspace as useful." : ""}${intent.kind === "explore" ? "Open a nested narrative rooted in this encountered material, with its own life and room for sustained reading." : ""}`,
      },
    ];
    if (intent.kind === "prepare")
      content.push({
        type: "input_text",
        text: "A reader is spending time in this work. This is an opportunity to prepare ahead, not a request for a particular new book or scene. The payload gives their recent place and what remains unread. You may continue this work, develop a promising nested opening from its actual material, investigate or save useful notes, or decide that nothing further is useful yet. Favor useful saved reading over unnecessary delay. Any publication is immediately readable; offer_opening connects a prepared book to its source. Actual queued reader requests take priority over further speculation. Keep this preparation bounded by what is useful ahead of this reader and the shared allowance. Finishing without a new publication is allowed.",
      });
    const source = intent.payload.source as
      | {
          anchor?: {
            assetId?: string;
            region?: { x: number; y: number; width: number; height: number };
          };
          publication?: { blocks?: { assetId?: string }[] };
        }
      | undefined;
    const imageIds = [
      ...new Set(
        source?.publication?.blocks?.flatMap((b) =>
          b.assetId ? [b.assetId] : [],
        ) ?? [],
      ),
    ];
    for (const imageId of imageIds) content.push(await imageContent(imageId));
    if (source?.anchor?.assetId && source.anchor.region)
      content.push(
        await imageContent(source.anchor.assetId, source.anchor.region),
      );
    await db.transaction().execute(async (tx) => {
      const current = await tx
        .selectFrom("sessions")
        .selectAll()
        .where("id", "=", session.id)
        .forUpdate()
        .executeTakeFirstOrThrow();
      await tx
        .updateTable("sessions")
        .set({
          input: json(
            await storeImages([...current.input, { role: "user", content }]),
          ),
        })
        .where("id", "=", session.id)
        .execute();
      await tx
        .updateTable("intents")
        .set({ session_id: session.id, status: "running", error: null })
        .where("id", "=", intentId)
        .execute();
    });
    intent = await db
      .selectFrom("intents")
      .selectAll()
      .where("id", "=", intentId)
      .executeTakeFirstOrThrow();
  }
  const sessionId = intent.session_id!;
  try {
    await loop({
      editionId: intent.edition_id,
      sessionId,
      intentId,
      critic: (question, subjects, key) =>
        critique(intent.edition_id, sessionId, question, subjects, key),
    });
    const result = await db
      .selectFrom("intents")
      .selectAll()
      .where("id", "=", intentId)
      .executeTakeFirstOrThrow();
    const workId = result.result_work_id ?? result.work_id;
    const published = workId
      ? await db
          .selectFrom("publications")
          .select("id")
          .where("work_id", "=", workId)
          .$if(intent.kind === "continue", (q) =>
            q.where("created_at", ">=", intent.created_at),
          )
          .executeTakeFirst()
      : null;
    if (!published && intent.kind !== "prepare")
      throw new Paused(
        "The creative agent saved its work but has not published the requested passage. Inspect the saved session before continuing.",
      );
    await db
      .updateTable("intents")
      .set({ status: "done", result_work_id: workId, error: null })
      .where("id", "=", intentId)
      .execute();
  } catch (e) {
    await db
      .updateTable("intents")
      .set({
        status: e instanceof Paused ? "paused" : "failed",
        error: e instanceof Error ? e.message : String(e),
      })
      .where("id", "=", intentId)
      .execute();
    throw e;
  }
}
let pumping = false;
export async function pump() {
  if (pumping) return;
  pumping = true;
  const connection = await pool.connect();
  try {
    const { rows } = await connection.query<{ locked: boolean }>(
      "select pg_try_advisory_lock(hashtext($1)) as locked",
      ["shape-of-time:author"],
    );
    if (!rows[0].locked) return;
    try {
      for (;;) {
        const intent = await nextIntent();
        if (!intent || ["paused", "failed"].includes(intent.status)) break;
        try {
          await runIntent(intent.id);
        } catch (e) {
          console.error(
            "Reader request paused:",
            intent.id,
            e instanceof Error ? e.message : String(e),
          );
          break;
        }
      }
    } finally {
      await connection.query("select pg_advisory_unlock(hashtext($1))", [
        "shape-of-time:author",
      ]);
    }
  } finally {
    connection.release();
    pumping = false;
  }
}
