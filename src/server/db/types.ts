import type { ColumnType } from "kysely";

import type { FolioState } from "../domain/folio-state.js";

export type JsonPrimitive = boolean | number | string | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonColumn<T extends JsonValue> = ColumnType<T, string, string>;
export type NullableJsonColumn<T extends JsonValue> = ColumnType<T | null, string | null, string | null>;
export type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;
export type BigIntColumn = ColumnType<string, number | string | undefined, number | string>;
export type NullableBigIntColumn = ColumnType<string | null, number | string | null, number | string | null>;

export interface MovementBrief extends Record<string, JsonValue> {
  brief: string;
  id: string;
}

export interface BookTable {
  created_at: Timestamp;
  id: string;
  idempotency_key: string;
  intent_digest: string;
  movement_briefs: JsonColumn<MovementBrief[]>;
  origin: JsonColumn<{ [key: string]: JsonValue }>;
  title: string;
  updated_at: Timestamp;
}

export interface GenerationAttemptTable {
  book_id: string;
  completed_at: Timestamp | null;
  cost_microusd: NullableBigIntColumn;
  created_at: Timestamp;
  exact_inputs: JsonColumn<{ [key: string]: JsonValue }>;
  failure: NullableJsonColumn<{ [key: string]: JsonValue }>;
  folio_ordinal: number;
  id: string;
  idempotency_key: string;
  intent_digest: string;
  latency_ms: NullableBigIntColumn;
  lease_expires_at: Timestamp | null;
  lease_epoch: BigIntColumn;
  lease_owner: string | null;
  lease_token: string | null;
  provider_request_id: string | null;
  result: NullableJsonColumn<{ [key: string]: JsonValue }>;
  retry_of_attempt_id: string | null;
  started_at: Timestamp | null;
  state: FolioState;
  updated_at: Timestamp;
  usage: NullableJsonColumn<{ [key: string]: JsonValue }>;
}

export interface FolioTable {
  book_id: string;
  created_at: Timestamp;
  exposed_at: Timestamp | null;
  failed_at: Timestamp | null;
  generation_attempt_id: string;
  id: string;
  layout: NullableJsonColumn<{ [key: string]: JsonValue }>;
  layout_digest: string | null;
  movement_id: string;
  ordinal: number;
  prose: string | null;
  prose_digest: string | null;
  ready_at: Timestamp | null;
  required_aperture_ids: string[];
  required_asset_ids: string[];
  state: FolioState;
  surface_digest: string | null;
  updated_at: Timestamp;
}

export interface ApertureTable {
  created_at: Timestamp;
  end_offset: number;
  id: string;
  kind: "selection" | "suggested";
  source_folio_id: string;
  source_text: string;
  span_encoding: "utf16-code-unit-v1";
  start_offset: number;
  target_book_id: string;
}

export interface AssetTable {
  byte_length: ColumnType<string, number | string, never>;
  created_at: Timestamp;
  created_by_attempt_id: string | null;
  digest: string;
  id: string;
  media_type: string;
  metadata: JsonColumn<{ [key: string]: JsonValue }>;
  object_key: string;
  storage_driver: "filesystem" | "s3";
}

export interface Database {
  apertures: ApertureTable;
  assets: AssetTable;
  books: BookTable;
  folios: FolioTable;
  generation_attempts: GenerationAttemptTable;
}
