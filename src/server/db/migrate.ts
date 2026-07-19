import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { Kysely } from "kysely";
import { FileMigrationProvider, Migrator } from "kysely/migration";

import { parseConfig } from "../config.js";
import { createDatabase, destroyDatabase } from "./database.js";
import type { Database } from "./types.js";

export async function migrateToLatest(database: Kysely<Database>): Promise<void> {
  const migrator = new Migrator({
    db: database,
    provider: new FileMigrationProvider({
      fs,
      migrationFolder: fileURLToPath(new URL("./migrations", import.meta.url)),
      path,
    }),
  });
  const { error, results } = await migrator.migrateToLatest();
  if (error !== undefined) throw error;
  const failed = results?.find(({ status }) => status === "Error");
  if (failed !== undefined) throw new Error(`migration failed: ${failed.migrationName}`);
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) {
  const config = parseConfig(process.env);
  const database = createDatabase(config.databaseUrl);
  try {
    await migrateToLatest(database);
  } finally {
    await destroyDatabase(database);
  }
}
