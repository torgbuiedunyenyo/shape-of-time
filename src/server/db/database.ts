import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";

import type { Database } from "./types.js";

const { Pool } = pg;

export function createDatabase(
  connectionString: string,
  options: { onPoolError?: (error: Error) => void } = {},
): Kysely<Database> {
  const pool = new Pool({
    allowExitOnIdle: true,
    connectionString,
    connectionTimeoutMillis: 5_000,
    max: 10,
    statement_timeout: 5_000,
  });
  pool.on("error", (error) => options.onPoolError?.(error));
  return new Kysely<Database>({ dialect: new PostgresDialect({ pool }) });
}

export async function destroyDatabase(database: Kysely<Database> | undefined): Promise<void> {
  await database?.destroy();
}
