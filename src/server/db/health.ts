import { sql, type Kysely } from "kysely";

import { INITIAL_SCHEMA_DIGEST } from "./migrations/001_initial.js";
import type { Database } from "./types.js";

export interface DatabaseHealth {
  migration: string;
  schemaDigest: string;
  serverVersion: string;
}

export async function readDatabaseHealth(database: Kysely<Database>): Promise<DatabaseHealth> {
  await sql`select 1`.execute(database);
  const version = await sql<{ server_version: string }>`show server_version`.execute(database);
  const migrations = await sql<{ name: string }>`
    select name from kysely_migration order by timestamp, name
  `.execute(database);
  const schemaEntries = await sql<{ content_digest: string; migration_name: string }>`
    select migration_name, content_digest from shape_of_time_schema order by migration_name
  `.execute(database);
  const names = migrations.rows.map(({ name }) => name);
  const migration = names.at(-1);
  const serverVersion = version.rows[0]?.server_version;
  if (migration === undefined || serverVersion === undefined) throw new Error("database health metadata is incomplete");
  assertSupportedPostgresVersion(serverVersion);
  const schemaEntry = schemaEntries.rows[0];
  if (
    schemaEntries.rows.length !== 1 ||
    schemaEntry?.migration_name !== "001_initial" ||
    schemaEntry.content_digest !== INITIAL_SCHEMA_DIGEST ||
    names.join("\n") !== "001_initial"
  ) {
    throw new Error("database migration identity does not match the running artifact");
  }
  return {
    migration,
    schemaDigest: INITIAL_SCHEMA_DIGEST,
    serverVersion,
  };
}

export function assertSupportedPostgresVersion(serverVersion: string): void {
  if (serverVersion.split(/\s/, 1)[0] !== "18.4") {
    throw new Error("database server must be PostgreSQL 18.4");
  }
}
