import {
  Kysely,
  PostgresDialect,
  type Generated,
  type JSONColumnType,
} from "kysely";
import pg from "pg";
import { config } from "../config.js";
import type { Block, Anchor } from "../../shared/types.js";
import type { ResponseInputItem } from "openai/resources/responses/responses";
import type { Mechanism } from "../mechanism.js";
type Json<T extends object> = JSONColumnType<T, string, string>;
type Row = { id: string; created_at: Generated<string> };
export interface Database {
  editions: Row & {
    title: string;
    root_work_id: string | null;
    source: Json<Record<string, string>>;
    budget_usd: number;
    mechanism: JSONColumnType<Mechanism | null, string | null | undefined, string | null>;
  };
  works: Row & {
    edition_id: string;
    title: string;
    founding: Json<Record<string, unknown>>;
  };
  documents: Row & {
    edition_id: string;
    path: string;
    revision: number;
    body: string;
    operation_key: string;
  };
  publications: Row & {
    work_id: string;
    ordinal: number;
    document_id: string;
    blocks: Json<Block[]>;
  };
  assets: Row & {
    edition_id: string;
    storage_key: string;
    mime: string;
    width: number;
    height: number;
    operation_id: string;
    description: string;
    references: Json<string[]>;
  };
  sessions: Row & {
    edition_id: string;
    role: string;
    input: Json<ResponseInputItem[]>;
    step: Generated<number>;
    parent_id: string | null;
  };
  intents: Row & {
    edition_id: string;
    dedupe_key: string;
    kind: string;
    work_id: string | null;
    payload: Json<Record<string, unknown>>;
    status: Generated<string>;
    result_work_id: string | null;
    error: string | null;
    session_id: string | null;
  };
  operations: Row & {
    edition_id: string;
    session_id: string;
    key: string;
    kind: string;
    status: string;
    request: Json<Record<string, unknown>>;
    provider_id: string | null;
    response: Json<Record<string, unknown>> | null;
    raw_key: string | null;
    reserved_usd: number;
    actual_usd: number | null;
    error: string | null;
    completed_at: string | null;
  };
  tool_results: Row & {
    session_id: string;
    call_id: string;
    output: Json<ResponseInputItem>;
  };
  openings: Row & {
    work_id: string;
    source: Json<Anchor>;
    target_work_id: string;
    label: string;
    operation_key: string;
  };
}
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 8,
  options: `-c search_path=${config.schema},public`,
});
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});
export const json = JSON.stringify;
