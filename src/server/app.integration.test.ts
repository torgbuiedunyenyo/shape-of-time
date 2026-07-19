import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { sql, type Kysely } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDatabase, destroyDatabase } from "./db/database.js";
import { migrateToLatest } from "./db/migrate.js";
import { INITIAL_SCHEMA_DIGEST } from "./db/migrations/001_initial.js";
import type { Database } from "./db/types.js";
import { createApp } from "./app.js";

let container: StartedPostgreSqlContainer;
let database: Kysely<Database>;
let clientRoot: string;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18.4-alpine")
    .withDatabase("shape_of_time")
    .withUsername("shape_of_time")
    .withPassword("shape_of_time")
    .start();
  database = createDatabase(container.getConnectionUri());
  await migrateToLatest(database);
  clientRoot = await mkdtemp(path.join(tmpdir(), "shape-of-time-client-"));
  await writeFile(path.join(clientRoot, "index.html"), "<!doctype html><title>Shape of Time</title>");
  await mkdir(path.join(clientRoot, "assets"));
  await writeFile(path.join(clientRoot, "assets", "reader.js"), "export const reader = true;");
});

afterAll(async () => {
  await destroyDatabase(database);
  await container.stop();
  if (clientRoot !== undefined) await rm(clientRoot, { force: true, recursive: true });
});

describe("one-process HTTP composition", () => {
  it("reports the live database, migration digest, and active commit without provider work", async () => {
    const app = createApp({ clientRoot, database, gitCommitSha: "test-commit" });
    const response = await app.request("http://reader.test/healthz");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      commit: "test-commit",
      database: { migration: "001_initial" },
      status: "ok",
    });
    expect(body.database.serverVersion).toMatch(/^18\.4/);
    expect(body.database.schemaDigest).toBe(INITIAL_SCHEMA_DIGEST);
  });

  it("fails health closed when the live migration checksum differs from the running artifact", async () => {
    const app = createApp({ clientRoot, database });
    await sql`update shape_of_time_schema set content_digest = ${"0".repeat(64)} where migration_name = '001_initial'`.execute(
      database,
    );
    const response = await app.request("http://reader.test/healthz");
    expect(response.status).toBe(503);
    await sql`update shape_of_time_schema set content_digest = ${INITIAL_SCHEMA_DIGEST} where migration_name = '001_initial'`.execute(
      database,
    );
  });

  it("serves direct reader navigation while preserving API and method errors", async () => {
    const app = createApp({ clientRoot, database });

    const directReader = await app.request("http://reader.test/books/root/folios/12");
    expect(directReader.status).toBe(200);
    expect(await directReader.text()).toContain("<title>Shape of Time</title>");
    expect(directReader.headers.get("cache-control")).toBe("no-cache");

    const unknownApi = await app.request("http://reader.test/api/not-real");
    expect(unknownApi.status).toBe(404);
    expect(unknownApi.headers.get("content-type")).toContain("application/json");

    const nonGet = await app.request("http://reader.test/books/root", { method: "POST" });
    expect(nonGet.status).toBe(404);
    expect(await nonGet.text()).not.toContain("<title>Shape of Time</title>");

    const asset = await app.request("http://reader.test/assets/reader.js");
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain("reader = true");
    expect(asset.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");

    for (const missing of ["/assets", "/assets/missing.js", "/missing.js"]) {
      const response = await app.request(`http://reader.test${missing}`, {
        headers: { accept: "text/html" },
      });
      expect(response.status).toBe(404);
      expect(await response.text()).not.toContain("<title>Shape of Time</title>");
    }
  });
});
