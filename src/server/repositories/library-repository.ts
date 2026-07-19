import { randomUUID } from "node:crypto";

import { sql, type Kysely, type Selectable } from "kysely";

import type { AssetStore } from "../assets/asset-store.js";
import type { Database, FolioTable, GenerationAttemptTable, JsonValue, MovementBrief } from "../db/types.js";
import { digestJson, sha256 } from "../domain/digests.js";
import { assertFolioTransition, type FolioState } from "../domain/folio-state.js";

export interface BookRecord {
  createdAt: Date;
  id: string;
  movementBriefs: MovementBrief[];
  origin: { [key: string]: JsonValue };
  title: string;
  updatedAt: Date;
}

export interface FolioRecord {
  bookId: string;
  exposedAt: Date | null;
  generationAttemptId: string;
  id: string;
  layout: { [key: string]: JsonValue } | null;
  movementId: string;
  ordinal: number;
  prose: string | null;
  requiredApertureIds: string[];
  requiredAssetIds: string[];
  state: FolioState;
}

export interface AttemptRecord {
  id: string;
  idempotencyKey: string;
  state: FolioState;
}

interface ApertureCandidate {
  endOffset: number;
  kind: "selection" | "suggested";
  sourceText: string;
  startOffset: number;
  targetBookId: string;
}

export class LibraryRepository {
  readonly #database: Kysely<Database>;

  constructor(database: Kysely<Database>) {
    this.#database = database;
  }

  async createBook(input: {
    firstMovement: MovementBrief;
    origin: { [key: string]: JsonValue };
    title: string;
  }): Promise<BookRecord> {
    return (
      await this.reserveBook({
        ...input,
        idempotencyKey: `static-book:${randomUUID()}`,
      })
    ).book;
  }

  async reserveBook(input: {
    firstMovement: MovementBrief;
    idempotencyKey: string;
    origin: { [key: string]: JsonValue };
    title: string;
  }): Promise<{ book: BookRecord; created: boolean }> {
    const title = input.title.trim();
    if (title.length === 0) throw new Error("book title cannot be empty");
    const movement = normalizeMovement(input.firstMovement);
    const intentDigest = digestJson({ firstMovement: movement, origin: input.origin, title });
    return this.#database.transaction().execute(async (transaction) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${`book:${input.idempotencyKey}`}, 0))`.execute(transaction);
      const existing = await transaction
        .selectFrom("books")
        .selectAll()
        .where("idempotency_key", "=", input.idempotencyKey)
        .executeTakeFirst();
      if (existing !== undefined) {
        if (existing.intent_digest !== intentDigest) {
          throw new Error("book idempotency key was reused with different intent");
        }
        return { book: mapBook(existing), created: false };
      }
      const row = await transaction
        .insertInto("books")
        .values({
          id: randomUUID(),
          idempotency_key: input.idempotencyKey,
          intent_digest: intentDigest,
          movement_briefs: JSON.stringify([movement]),
          origin: JSON.stringify(input.origin),
          title,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return { book: mapBook(row), created: true };
    });
  }

  async appendMovementBrief(bookId: string, movement: MovementBrief): Promise<BookRecord> {
    return this.#database.transaction().execute(async (transaction) => {
      const book = await transaction
        .selectFrom("books")
        .selectAll()
        .where("id", "=", bookId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      const normalized = normalizeMovement(movement);
      if (book.movement_briefs.some(({ id }) => id === normalized.id)) {
        throw new Error(`movement already exists in book: ${normalized.id}`);
      }
      const updated = await transaction
        .updateTable("books")
        .set({ movement_briefs: JSON.stringify([...book.movement_briefs, normalized]), updated_at: new Date() })
        .where("id", "=", bookId)
        .returningAll()
        .executeTakeFirstOrThrow();
      return mapBook(updated);
    });
  }

  async reserveFolio(input: {
    bookId: string;
    idempotencyKey: string;
    movementId: string;
    ordinal: number;
  }): Promise<{ attempt: AttemptRecord; created: boolean; folio: FolioRecord }> {
    if (!Number.isInteger(input.ordinal) || input.ordinal < 1) throw new Error("folio ordinal must be a positive integer");
    const exactInputs = {
      bookId: input.bookId,
      movementId: input.movementId,
      ordinal: input.ordinal,
    } satisfies { [key: string]: JsonValue };
    const intentDigest = digestJson(exactInputs);

    return this.#database.transaction().execute(async (transaction) => {
      const lockNames = [
        `folio:${input.bookId}:${input.ordinal}`,
        `generation:${input.idempotencyKey}`,
      ].sort();
      for (const lockName of lockNames) {
        await sql`select pg_advisory_xact_lock(hashtextextended(${lockName}, 0))`.execute(transaction);
      }

      const existingAttempt = await transaction
        .selectFrom("generation_attempts")
        .selectAll()
        .where("idempotency_key", "=", input.idempotencyKey)
        .executeTakeFirst();
      if (existingAttempt !== undefined) {
        if (existingAttempt.intent_digest !== intentDigest) {
          throw new Error("generation idempotency key was reused with different intent");
        }
        const folio = await transaction
          .selectFrom("folios")
          .selectAll()
          .where("generation_attempt_id", "=", existingAttempt.id)
          .executeTakeFirstOrThrow();
        return { attempt: mapAttempt(existingAttempt), created: false, folio: mapFolio(folio) };
      }

      const existingFolio = await transaction
        .selectFrom("folios")
        .selectAll()
        .where("book_id", "=", input.bookId)
        .where("ordinal", "=", input.ordinal)
        .executeTakeFirst();
      if (existingFolio !== undefined) {
        const attempt = await transaction
          .selectFrom("generation_attempts")
          .selectAll()
          .where("id", "=", existingFolio.generation_attempt_id)
          .executeTakeFirstOrThrow();
        if (attempt.idempotency_key !== input.idempotencyKey) {
          throw new Error("folio ordinal is already reserved with a different idempotency key");
        }
        throw new Error("folio reservation identity is inconsistent");
      }

      const attemptId = randomUUID();
      const attempt = await transaction
        .insertInto("generation_attempts")
        .values({
          book_id: input.bookId,
          completed_at: null,
          cost_microusd: null,
          exact_inputs: JSON.stringify(exactInputs),
          failure: null,
          folio_ordinal: input.ordinal,
          id: attemptId,
          idempotency_key: input.idempotencyKey,
          intent_digest: intentDigest,
          latency_ms: null,
          lease_expires_at: null,
          lease_epoch: 0,
          lease_owner: null,
          lease_token: null,
          provider_request_id: null,
          result: null,
          retry_of_attempt_id: null,
          started_at: null,
          state: "reserved",
          usage: null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      const folio = await transaction
        .insertInto("folios")
        .values({
          book_id: input.bookId,
          exposed_at: null,
          failed_at: null,
          generation_attempt_id: attemptId,
          id: randomUUID(),
          layout: null,
          layout_digest: null,
          movement_id: input.movementId,
          ordinal: input.ordinal,
          prose: null,
          prose_digest: null,
          ready_at: null,
          required_aperture_ids: [],
          required_asset_ids: [],
          state: "reserved",
          surface_digest: null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      return { attempt: mapAttempt(attempt), created: true, folio: mapFolio(folio) };
    });
  }

  async claimFolioGeneration(input: {
    attemptId: string;
    leaseMilliseconds: number;
    workerId: string;
  }): Promise<string | null> {
    if (input.leaseMilliseconds <= 0) throw new Error("lease duration must be positive");
    return this.#database.transaction().execute(async (transaction) => {
      const attempt = await transaction
        .selectFrom("generation_attempts")
        .selectAll()
        .where("id", "=", input.attemptId)
        .forUpdate()
        .executeTakeFirstOrThrow();
      const clock = await sql<{ now: Date }>`select clock_timestamp() as now`.execute(transaction);
      const now = clock.rows[0]!.now;
      if (
        attempt.state !== "reserved" &&
        !(attempt.state === "generating" && attempt.lease_expires_at !== null && attempt.lease_expires_at < now)
      ) {
        return null;
      }
      const folio = await transaction
        .selectFrom("folios")
        .selectAll()
        .where("generation_attempt_id", "=", attempt.id)
        .forUpdate()
        .executeTakeFirstOrThrow();
      if (folio.state !== attempt.state || folio.book_id !== attempt.book_id || folio.ordinal !== attempt.folio_ordinal) {
        throw new Error("folio and generation attempt lifecycle disagree while claiming");
      }
      const leaseExpiresAt = new Date(now.getTime() + input.leaseMilliseconds);
      const leaseToken = randomUUID();
      await transaction
        .updateTable("generation_attempts")
        .set({
          lease_expires_at: leaseExpiresAt,
          lease_epoch: sql<string>`${sql.ref("lease_epoch")} + 1`,
          lease_owner: input.workerId,
          lease_token: leaseToken,
          started_at: attempt.started_at ?? now,
          state: "generating",
          updated_at: now,
        })
        .where("id", "=", attempt.id)
        .executeTakeFirstOrThrow();
      if (attempt.state === "reserved") {
        await transaction
          .updateTable("folios")
          .set({ state: "generating", updated_at: now })
          .where("generation_attempt_id", "=", attempt.id)
          .executeTakeFirstOrThrow();
      }
      return leaseToken;
    });
  }

  async storeAsset(store: AssetStore, input: {
    bytes: Uint8Array;
    mediaType: string;
  }): Promise<{ id: string }> {
    const stored = await store.put(input.bytes, { mediaType: input.mediaType });
    const roundTrip = await store.get(stored.key);
    if (sha256(roundTrip) !== stored.digest || roundTrip.byteLength !== stored.byteLength) {
      throw new Error("stored asset failed digest and length verification");
    }
    return this.#database.transaction().execute(async (transaction) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${`asset:${stored.digest}`}, 0))`.execute(transaction);
      const existing = await transaction.selectFrom("assets").selectAll().where("digest", "=", stored.digest).executeTakeFirst();
      if (existing !== undefined) {
        if (
          existing.object_key !== stored.key ||
          Number(existing.byte_length) !== stored.byteLength ||
          existing.media_type !== stored.mediaType ||
          existing.storage_driver !== store.driver
        ) {
          throw new Error("asset digest was reused with different metadata");
        }
        return { id: existing.id };
      }
      const asset = await transaction
        .insertInto("assets")
        .values({
          byte_length: stored.byteLength,
          created_by_attempt_id: null,
          digest: stored.digest,
          id: randomUUID(),
          media_type: stored.mediaType,
          metadata: "{}",
          object_key: stored.key,
          storage_driver: store.driver,
        })
        .returning("id")
        .executeTakeFirstOrThrow();
      return asset;
    });
  }

  async markFolioReady(input: {
    apertures: ApertureCandidate[];
    folioId: string;
    layout: { [key: string]: JsonValue };
    leaseToken: string;
    prose: string;
    requiredAssetIds: string[];
  }): Promise<FolioRecord> {
    return this.#database.transaction().execute(async (transaction) => {
      const { attempt, folio } = await lockAttemptThenFolio(transaction, input.folioId);
      assertFolioTransition(folio.state, "ready");
      await assertCurrentLease(transaction, attempt, input.leaseToken);
      if (input.prose.trim().length === 0) throw new Error("ready folio prose cannot be empty");
      const apertureIds: string[] = [];
      for (const aperture of input.apertures) {
        if (input.prose.slice(aperture.startOffset, aperture.endOffset) !== aperture.sourceText) {
          throw new Error("aperture offsets do not identify their source text");
        }
        const id = randomUUID();
        await transaction
          .insertInto("apertures")
          .values({
            end_offset: aperture.endOffset,
            id,
            kind: aperture.kind,
            source_folio_id: folio.id,
            source_text: aperture.sourceText,
            span_encoding: "utf16-code-unit-v1",
            start_offset: aperture.startOffset,
            target_book_id: aperture.targetBookId,
          })
          .execute();
        apertureIds.push(id);
      }
      const proseDigest = sha256(input.prose);
      const layoutDigest = digestJson(input.layout);
      const surfaceDigest = digestJson({
        apertures: input.apertures,
        layoutDigest,
        proseDigest,
        requiredAssetIds: input.requiredAssetIds,
      });
      const now = new Date();
      const updated = await transaction
        .updateTable("folios")
        .set({
          layout: JSON.stringify(input.layout),
          layout_digest: layoutDigest,
          prose: input.prose,
          prose_digest: proseDigest,
          ready_at: now,
          required_aperture_ids: apertureIds,
          required_asset_ids: input.requiredAssetIds,
          state: "ready",
          surface_digest: surfaceDigest,
          updated_at: now,
        })
        .where("id", "=", folio.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      await transaction
        .updateTable("generation_attempts")
        .set({
          completed_at: now,
          lease_expires_at: null,
          lease_owner: null,
          lease_token: null,
          state: "ready",
          updated_at: now,
        })
        .where("id", "=", folio.generation_attempt_id)
        .executeTakeFirstOrThrow();
      return mapFolio(updated);
    });
  }

  async exposeFolio(folioId: string): Promise<FolioRecord> {
    return this.#database.transaction().execute(async (transaction) => {
      const { folio } = await lockAttemptThenFolio(transaction, folioId);
      assertFolioTransition(folio.state, "exposed");
      const now = new Date();
      const updated = await transaction
        .updateTable("folios")
        .set({ exposed_at: now, state: "exposed", updated_at: now })
        .where("id", "=", folio.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      await transaction
        .updateTable("generation_attempts")
        .set({ state: "exposed", updated_at: now })
        .where("id", "=", folio.generation_attempt_id)
        .executeTakeFirstOrThrow();
      return mapFolio(updated);
    });
  }

  async failFolio(input: {
    failure: { [key: string]: JsonValue };
    folioId: string;
    leaseToken?: string;
  }): Promise<FolioRecord> {
    return this.#database.transaction().execute(async (transaction) => {
      const { attempt, folio } = await lockAttemptThenFolio(transaction, input.folioId);
      assertFolioTransition(folio.state, "failed");
      if (folio.state === "generating") {
        if (input.leaseToken === undefined) throw new Error("generation lease token is required");
        await assertCurrentLease(transaction, attempt, input.leaseToken);
      }
      const now = new Date();
      const updated = await transaction
        .updateTable("folios")
        .set({ failed_at: now, state: "failed", updated_at: now })
        .where("id", "=", folio.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      await transaction
        .updateTable("generation_attempts")
        .set({
          completed_at: now,
          failure: JSON.stringify(input.failure),
          lease_expires_at: null,
          lease_owner: null,
          lease_token: null,
          state: "failed",
          updated_at: now,
        })
        .where("id", "=", folio.generation_attempt_id)
        .executeTakeFirstOrThrow();
      return mapFolio(updated);
    });
  }

  async retryFailedFolio(input: {
    folioId: string;
    idempotencyKey: string;
  }): Promise<{ attempt: AttemptRecord; created: boolean; folio: FolioRecord }> {
    return this.#database.transaction().execute(async (transaction) => {
      await sql`select pg_advisory_xact_lock(hashtextextended(${`generation:${input.idempotencyKey}`}, 0))`.execute(transaction);
      const existingAttempt = await transaction
        .selectFrom("generation_attempts")
        .selectAll()
        .where("idempotency_key", "=", input.idempotencyKey)
        .executeTakeFirst();
      if (existingAttempt !== undefined) {
        const exactInputs = existingAttempt.exact_inputs;
        if (exactInputs.folioId !== input.folioId) {
          throw new Error("generation idempotency key was reused with different intent");
        }
        const folio = await transaction.selectFrom("folios").selectAll().where("id", "=", input.folioId).executeTakeFirstOrThrow();
        if (folio.generation_attempt_id !== existingAttempt.id) {
          throw new Error("retry attempt is no longer current for this folio");
        }
        return { attempt: mapAttempt(existingAttempt), created: false, folio: mapFolio(folio) };
      }

      const folio = await transaction.selectFrom("folios").selectAll().where("id", "=", input.folioId).forUpdate().executeTakeFirstOrThrow();
      assertFolioTransition(folio.state, "reserved");
      const previousAttempt = await transaction
        .selectFrom("generation_attempts")
        .selectAll()
        .where("id", "=", folio.generation_attempt_id)
        .executeTakeFirstOrThrow();
      const exactInputs = {
        bookId: folio.book_id,
        folioId: folio.id,
        ordinal: folio.ordinal,
        retryOfAttemptId: previousAttempt.id,
      } satisfies { [key: string]: JsonValue };
      const now = new Date();
      const attempt = await transaction
        .insertInto("generation_attempts")
        .values({
          book_id: folio.book_id,
          completed_at: null,
          cost_microusd: null,
          exact_inputs: JSON.stringify(exactInputs),
          failure: null,
          folio_ordinal: folio.ordinal,
          id: randomUUID(),
          idempotency_key: input.idempotencyKey,
          intent_digest: digestJson(exactInputs),
          latency_ms: null,
          lease_epoch: 0,
          lease_expires_at: null,
          lease_owner: null,
          lease_token: null,
          provider_request_id: null,
          result: null,
          retry_of_attempt_id: previousAttempt.id,
          started_at: null,
          state: "reserved",
          usage: null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      await transaction.deleteFrom("apertures").where("source_folio_id", "=", folio.id).execute();
      const updated = await transaction
        .updateTable("folios")
        .set({
          exposed_at: null,
          failed_at: null,
          generation_attempt_id: attempt.id,
          layout: null,
          layout_digest: null,
          prose: null,
          prose_digest: null,
          ready_at: null,
          required_aperture_ids: [],
          required_asset_ids: [],
          state: "reserved",
          surface_digest: null,
          updated_at: now,
        })
        .where("id", "=", folio.id)
        .returningAll()
        .executeTakeFirstOrThrow();
      return { attempt: mapAttempt(attempt), created: true, folio: mapFolio(updated) };
    });
  }

  async getFolio(folioId: string): Promise<FolioRecord> {
    const folio = await this.#database.selectFrom("folios").selectAll().where("id", "=", folioId).executeTakeFirstOrThrow();
    return mapFolio(folio);
  }
}

async function lockAttemptThenFolio(
  database: Kysely<Database>,
  folioId: string,
): Promise<{ attempt: Selectable<GenerationAttemptTable>; folio: Selectable<FolioTable> }> {
  const pointer = await database
    .selectFrom("folios")
    .select("generation_attempt_id")
    .where("id", "=", folioId)
    .executeTakeFirstOrThrow();
  const attempt = await database
    .selectFrom("generation_attempts")
    .selectAll()
    .where("id", "=", pointer.generation_attempt_id)
    .forUpdate()
    .executeTakeFirstOrThrow();
  const folio = await database.selectFrom("folios").selectAll().where("id", "=", folioId).forUpdate().executeTakeFirstOrThrow();
  if (
    folio.generation_attempt_id !== attempt.id ||
    folio.state !== attempt.state ||
    folio.book_id !== attempt.book_id ||
    folio.ordinal !== attempt.folio_ordinal
  ) {
    throw new Error("folio and generation attempt lifecycle changed while locking");
  }
  return { attempt, folio };
}

function normalizeMovement(movement: MovementBrief): MovementBrief {
  const id = movement.id.trim();
  const brief = movement.brief.trim();
  if (id.length === 0 || brief.length === 0) throw new Error("movement requires a nonempty id and brief");
  return { id, brief };
}

async function assertCurrentLease(
  database: Kysely<Database>,
  attempt: Selectable<GenerationAttemptTable>,
  leaseToken: string,
): Promise<void> {
  const clock = await sql<{ now: Date }>`select clock_timestamp() as now`.execute(database);
  const now = clock.rows[0]!.now;
  if (
    attempt.state !== "generating" ||
    attempt.lease_token !== leaseToken ||
    attempt.lease_expires_at === null ||
    attempt.lease_expires_at <= now
  ) {
    throw new Error("generation lease is stale");
  }
}

function mapBook(row: Selectable<Database["books"]>): BookRecord {
  return {
    createdAt: row.created_at,
    id: row.id,
    movementBriefs: row.movement_briefs,
    origin: row.origin,
    title: row.title,
    updatedAt: row.updated_at,
  };
}

function mapFolio(row: Selectable<FolioTable>): FolioRecord {
  return {
    bookId: row.book_id,
    exposedAt: row.exposed_at,
    generationAttemptId: row.generation_attempt_id,
    id: row.id,
    layout: row.layout,
    movementId: row.movement_id,
    ordinal: row.ordinal,
    prose: row.prose,
    requiredApertureIds: row.required_aperture_ids,
    requiredAssetIds: row.required_asset_ids,
    state: row.state,
  };
}

function mapAttempt(row: Selectable<GenerationAttemptTable>): AttemptRecord {
  return { id: row.id, idempotencyKey: row.idempotency_key, state: row.state };
}
