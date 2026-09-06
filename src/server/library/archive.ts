import { db } from "../db/index.js";

export async function listArchive(
  editionId: string,
  kind: string,
  query: string | undefined,
  offset: number,
  limit: number,
): Promise<Record<string, unknown> & { next_offset: number | null }> {
  const result: Record<string, unknown> = {};
  const q = query?.toLocaleLowerCase();
  const pattern = `%${(query ?? "").replace(/[\\%_]/g, "\\$&")}%`;
  const excerpt = (body: string) => {
    const start = q
      ? Math.max(0, body.toLocaleLowerCase().indexOf(q) - 150)
      : 0;
    return body.slice(start, start + 700);
  };
  let more = false;
  const page = <T>(name: string, rows: T[]) => {
    if (rows.length > limit) more = true;
    result[name] = rows.slice(0, limit);
  };
  const wants = (name: string) => kind === "all" || kind === name;
  const reads: Promise<void>[] = [];
  if (wants("source"))
    reads.push(
      (async () => {
        const edition = await db
          .selectFrom("editions")
          .select("source")
          .where("id", "=", editionId)
          .executeTakeFirstOrThrow();
        page(
          "source",
          Object.entries(edition.source)
            .filter(
              ([id, body]) =>
                !q || (id + "\n" + body).toLocaleLowerCase().includes(q),
            )
            .map(([id, body]) => ({
              id,
              ...(q ? { excerpt: excerpt(body) } : {}),
            }))
            .slice(offset, offset + limit + 1),
        );
      })(),
    );
  if (wants("work"))
    reads.push(
      (async () => {
        page(
          "works",
          await db
            .selectFrom("works")
            .select(["id", "title", "created_at"])
            .where("edition_id", "=", editionId)
            .where("title", "ilike", pattern)
            .orderBy("created_at")
            .orderBy("id")
            .offset(offset)
            .limit(limit + 1)
            .execute(),
        );
      })(),
    );
  if (wants("document"))
    reads.push(
      (async () => {
        const rows = await db
          .selectFrom("documents")
          .select(["id", "path", "revision", "body"])
          .where("edition_id", "=", editionId)
          .where((eb) =>
            eb.or([eb("path", "ilike", pattern), eb("body", "ilike", pattern)]),
          )
          .orderBy("path")
          .orderBy("revision", "desc")
          .offset(offset)
          .limit(limit + 1)
          .execute();
        page(
          "documents",
          rows.map(({ body, ...row }) => ({ ...row, excerpt: excerpt(body) })),
        );
      })(),
    );
  if (wants("publication"))
    reads.push(
      (async () => {
        const rows = await db
          .selectFrom("publications")
          .innerJoin("works", "works.id", "publications.work_id")
          .innerJoin("documents", "documents.id", "publications.document_id")
          .select([
            "publications.id",
            "publications.work_id",
            "publications.ordinal",
            "publications.document_id",
            "works.title",
            "documents.body",
          ])
          .where("works.edition_id", "=", editionId)
          .where((eb) =>
            eb.or([
              eb("works.title", "ilike", pattern),
              eb("documents.body", "ilike", pattern),
            ]),
          )
          .orderBy("publications.created_at")
          .orderBy("publications.id")
          .offset(offset)
          .limit(limit + 1)
          .execute();
        page(
          "publications",
          rows.map(({ body, ...row }) => ({ ...row, excerpt: excerpt(body) })),
        );
      })(),
    );
  if (wants("image"))
    reads.push(
      (async () => {
        const rows = await db
          .selectFrom("assets")
          .select(["id", "description", "width", "height", "references"])
          .where("edition_id", "=", editionId)
          .where("description", "ilike", pattern)
          .orderBy("created_at")
          .orderBy("id")
          .offset(offset)
          .limit(limit + 1)
          .execute();
        page(
          "images",
          rows.map(({ description, ...row }) => ({
            ...row,
            brief_excerpt: excerpt(description),
          })),
        );
      })(),
    );
  await Promise.all(reads);
  return { ...result, next_offset: more ? offset + limit : null };
}
