import { pathToFileURL } from "node:url";
import { sql } from "kysely";
import { db, pool } from "./index.js";
import { config } from "../config.js";
export async function migrate() {
  // A transaction-scoped lock also protects first boot of a completely fresh schema.
  await db.transaction().execute(async (tx) => {
    await sql`select pg_advisory_xact_lock(hashtext(${`shape-of-time:migrate:${config.schema}`}))`.execute(
      tx,
    );
    await sql.raw(`create schema if not exists "${config.schema}"`).execute(tx);
    await sql
      .raw(
        `
      create table if not exists editions (id text primary key, title text not null, root_work_id text, source jsonb not null, budget_usd double precision not null, created_at timestamptz not null default now());
      create table if not exists works (id text primary key, edition_id text not null references editions(id), title text not null, founding jsonb not null, created_at timestamptz not null default now());
      create table if not exists documents (id text primary key, edition_id text not null references editions(id), path text not null, revision integer not null, body text not null, operation_key text not null unique, created_at timestamptz not null default now(), unique(edition_id,path,revision));
      create table if not exists publications (id text primary key, work_id text not null references works(id), ordinal integer not null, document_id text not null references documents(id), blocks jsonb not null, created_at timestamptz not null default now(), unique(work_id,ordinal), unique(work_id,document_id));
      create table if not exists sessions (id text primary key, edition_id text not null references editions(id), role text not null, input jsonb not null, step integer not null default 0, parent_id text references sessions(id), created_at timestamptz not null default now());
      create table if not exists intents (id text primary key, edition_id text not null references editions(id), dedupe_key text not null unique, kind text not null, work_id text references works(id), payload jsonb not null, status text not null default 'queued', result_work_id text references works(id), error text, session_id text references sessions(id), created_at timestamptz not null default now());
      create table if not exists operations (id text primary key, edition_id text not null references editions(id), session_id text not null references sessions(id), key text not null unique, kind text not null, status text not null, request jsonb not null, provider_id text, response jsonb, raw_key text, reserved_usd double precision not null, actual_usd double precision, error text, completed_at timestamptz, created_at timestamptz not null default now());
      create table if not exists assets (id text primary key, edition_id text not null references editions(id), storage_key text not null, mime text not null, width integer not null, height integer not null, operation_id text not null, description text not null, "references" jsonb not null, created_at timestamptz not null default now());
      create table if not exists tool_results (id text primary key, session_id text not null references sessions(id), call_id text not null, output jsonb not null, created_at timestamptz not null default now(), unique(session_id,call_id));
      create table if not exists openings (id text primary key, work_id text not null references works(id), source jsonb not null, target_work_id text not null references works(id), label text not null, operation_key text not null unique, created_at timestamptz not null default now());
      create index if not exists intents_pending on intents(edition_id,status,created_at);
      create index if not exists documents_lookup on documents(edition_id,path,revision desc);
      create index if not exists operations_session on operations(session_id,created_at);
    `,
      )
      .execute(tx);
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await migrate();
  console.log(`Database schema ${config.schema} is ready.`);
  await pool.end();
}
