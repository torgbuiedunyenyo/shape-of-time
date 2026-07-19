import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { sql, type Kysely } from "kysely";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { FilesystemAssetStore } from "../assets/filesystem-asset-store.js";
import { contentAddress } from "../assets/asset-store.js";
import { createDatabase, destroyDatabase } from "../db/database.js";
import { migrateToLatest } from "../db/migrate.js";
import type { Database } from "../db/types.js";
import { sha256 } from "../domain/digests.js";
import { LibraryRepository } from "./library-repository.js";

let container: StartedPostgreSqlContainer;
let database: Kysely<Database>;
let repository: LibraryRepository;
let assetRoot: string;
let assetStore: FilesystemAssetStore;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:18.4-alpine")
    .withDatabase("shape_of_time")
    .withUsername("shape_of_time")
    .withPassword("shape_of_time")
    .start();
  database = createDatabase(container.getConnectionUri());
  await migrateToLatest(database);
  repository = new LibraryRepository(database);
  assetRoot = await mkdtemp(path.join(tmpdir(), "shape-of-time-integration-assets-"));
  assetStore = new FilesystemAssetStore(assetRoot);
});

afterAll(async () => {
  await destroyDatabase(database);
  await container.stop();
  if (assetRoot !== undefined) await rm(assetRoot, { force: true, recursive: true });
});

describe("initial durable library spine", () => {
  it("migrates exactly the five domain tables on PostgreSQL 18.4", async () => {
    const tables = await sql<{ table_name: string }>`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('books', 'folios', 'apertures', 'assets', 'generation_attempts')
      order by table_name
    `.execute(database);
    const version = await sql<{ server_version: string }>`show server_version`.execute(database);

    expect(tables.rows.map(({ table_name }) => table_name)).toEqual([
      "apertures",
      "assets",
      "books",
      "folios",
      "generation_attempts",
    ]);
    expect(version.rows[0]?.server_version).toMatch(/^18\.4/);
  });

  it("rejects a direct ready Folio insert that bypasses the publication path", async () => {
    const book = await repository.createBook({
      title: "No Bypass",
      origin: { kind: "title" },
      firstMovement: { id: "guard-01", brief: "The database guards the initial state." },
    });
    const attemptId = randomUUID();
    await expect(
      sql`
        insert into generation_attempts (
          id, book_id, folio_ordinal, idempotency_key, intent_digest, state, exact_inputs
        ) values (
          ${attemptId}, ${book.id}, 1, ${`direct-ready:${attemptId}`}, ${"b".repeat(64)}, 'ready', '{}'::jsonb
        )
      `.execute(database),
    ).rejects.toThrow(/new generation attempt must begin reserved/);

    await expect(
      database.transaction().execute(async (transaction) => {
        await sql`
          insert into generation_attempts (
            id, book_id, folio_ordinal, idempotency_key, intent_digest, state, exact_inputs
          ) values (
            ${attemptId}, ${book.id}, 1, ${`direct-reserved:${attemptId}`}, ${"b".repeat(64)}, 'reserved', '{}'::jsonb
          )
        `.execute(transaction);
        await sql`
          insert into folios (
            id, book_id, ordinal, movement_id, generation_attempt_id, state
          ) values (
            ${randomUUID()}, ${book.id}, 1, 'guard-01', ${attemptId}, 'ready'
          )
        `.execute(transaction);
      }),
    ).rejects.toThrow(/new folio must begin reserved/);
  });

  it("rejects attempt transitions without an active lease or matching Folio state", async () => {
    const book = await repository.createBook({
      title: "No State Drift",
      origin: { kind: "title" },
      firstMovement: { id: "state-drift-01", brief: "Attempt and Folio state remain one transaction." },
    });
    const reservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "state-drift-01",
      ordinal: 1,
    });

    await expect(
      database
        .updateTable("generation_attempts")
        .set({ state: "generating" })
        .where("id", "=", reservation.attempt.id)
        .execute(),
    ).rejects.toThrow(/generating attempt requires an active lease/);

    const now = new Date();
    await expect(
      database
        .updateTable("generation_attempts")
        .set({
          lease_epoch: 1,
          lease_expires_at: new Date(now.getTime() + 60_000),
          lease_owner: "raw-worker",
          lease_token: randomUUID(),
          started_at: now,
          state: "generating",
        })
        .where("id", "=", reservation.attempt.id)
        .execute(),
    ).rejects.toThrow(/folio and generation attempt states must agree/);
  });

  it("rejects orphan orchestration attempts and mismatched Folio identity", async () => {
    const firstBook = await repository.createBook({
      title: "The Attempt's Book",
      origin: { kind: "title" },
      firstMovement: { id: "attempt-book-01", brief: "The attempt belongs to this exact book and ordinal." },
    });
    const secondBook = await repository.createBook({
      title: "A Different Book",
      origin: { kind: "title" },
      firstMovement: { id: "different-book-01", brief: "A different book cannot claim that attempt." },
    });
    const orphanId = randomUUID();
    await expect(
      sql`
        insert into generation_attempts (
          id, book_id, folio_ordinal, idempotency_key, intent_digest, state, exact_inputs
        ) values (
          ${orphanId}, ${firstBook.id}, 1, ${`orphan:${orphanId}`}, ${"c".repeat(64)}, 'reserved', '{}'::jsonb
        )
      `.execute(database),
    ).rejects.toThrow(/orchestration attempt must be linked to its current folio/);

    const mismatchedId = randomUUID();
    await expect(
      database.transaction().execute(async (transaction) => {
        await sql`
          insert into generation_attempts (
            id, book_id, folio_ordinal, idempotency_key, intent_digest, state, exact_inputs
          ) values (
            ${mismatchedId}, ${firstBook.id}, 1, ${`mismatch:${mismatchedId}`}, ${"d".repeat(64)}, 'reserved', '{}'::jsonb
          )
        `.execute(transaction);
        await sql`
          insert into folios (
            id, book_id, ordinal, movement_id, generation_attempt_id, state
          ) values (
            ${randomUUID()}, ${secondBook.id}, 1, 'different-book-01', ${mismatchedId}, 'reserved'
          )
        `.execute(transaction);
      }),
    ).rejects.toThrow(/folio and generation attempt identity must agree/);
  });

  it("rejects dirty reserved Folios, missing failure timestamps, and Folio deletion", async () => {
    const book = await repository.createBook({
      title: "Lifecycle Fields",
      origin: { kind: "title" },
      firstMovement: { id: "lifecycle-01", brief: "State and durable fields tell the same story." },
    });
    const dirtyReservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "lifecycle-01",
      ordinal: 1,
    });
    await expect(
      database.updateTable("folios").set({ prose: "premature prose" }).where("id", "=", dirtyReservation.folio.id).execute(),
    ).rejects.toThrow(/reserved folio must have an empty candidate/);

    const failedReservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:2`,
      movementId: "lifecycle-01",
      ordinal: 2,
    });
    await expect(
      database.updateTable("folios").set({ state: "failed" }).where("id", "=", failedReservation.folio.id).execute(),
    ).rejects.toThrow(/failed folio requires failed_at/);

    const deletedReservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:3`,
      movementId: "lifecycle-01",
      ordinal: 3,
    });
    await expect(
      database.deleteFrom("folios").where("id", "=", deletedReservation.folio.id).execute(),
    ).rejects.toThrow(/folios are immutable records/);
  });

  it("reserves one folio and one spend owner under concurrent duplicate requests", async () => {
    const book = await repository.createBook({
      title: "The Shape of Time",
      origin: { kind: "root" },
      firstMovement: {
        id: "root-movement-01",
        brief: "Jay decides whether to accept Tan's invitation.",
      },
    });
    const idempotencyKey = `folio:${book.id}:1`;

    const reservations = await Promise.all(
      Array.from({ length: 8 }, () =>
        repository.reserveFolio({
          bookId: book.id,
          idempotencyKey,
          movementId: "root-movement-01",
          ordinal: 1,
        }),
      ),
    );

    expect(reservations.filter(({ created }) => created)).toHaveLength(1);
    expect(new Set(reservations.map(({ folio }) => folio.id))).toHaveLength(1);
    expect(new Set(reservations.map(({ attempt }) => attempt.id))).toHaveLength(1);

    await expect(
      repository.reserveFolio({
        bookId: book.id,
        idempotencyKey: `different:${randomUUID()}`,
        movementId: "root-movement-01",
        ordinal: 1,
      }),
    ).rejects.toThrow(/different idempotency key/);

    const [attemptCount, folioCount] = await Promise.all([
      database
        .selectFrom("generation_attempts")
        .select(({ fn }) => fn.countAll<number>().as("count"))
        .where("book_id", "=", book.id)
        .executeTakeFirstOrThrow(),
      database
        .selectFrom("folios")
        .select(({ fn }) => fn.countAll<number>().as("count"))
        .where("book_id", "=", book.id)
        .executeTakeFirstOrThrow(),
    ]);
    expect(Number(attemptCount.count)).toBe(1);
    expect(Number(folioCount.count)).toBe(1);

    const attemptId = reservations[0]!.attempt.id;
    const claims = await Promise.all([
      repository.claimFolioGeneration({ attemptId, leaseMilliseconds: 60_000, workerId: "worker-a" }),
      repository.claimFolioGeneration({ attemptId, leaseMilliseconds: 60_000, workerId: "worker-b" }),
    ]);
    expect(claims.filter(Boolean)).toHaveLength(1);
  });

  it("reserves one Book identity under concurrency while titles remain display metadata", async () => {
    const idempotencyKey = `book:${randomUUID()}`;
    const input = {
      firstMovement: { id: "book-01", brief: "A book reservation starts here." },
      idempotencyKey,
      origin: { kind: "title" as const },
      title: "The Same Display Title",
    };
    const reservations = await Promise.all(Array.from({ length: 6 }, () => repository.reserveBook(input)));
    expect(reservations.filter(({ created }) => created)).toHaveLength(1);
    expect(new Set(reservations.map(({ book }) => book.id))).toHaveLength(1);

    await expect(repository.reserveBook({ ...input, title: "Changed intent" })).rejects.toThrow(
      /book idempotency key was reused with different intent/,
    );
    const sameTitleElsewhere = await repository.reserveBook({ ...input, idempotencyKey: `book:${randomUUID()}` });
    expect(sameTitleElsewhere.book.id).not.toBe(reservations[0]!.book.id);
    expect(sameTitleElsewhere.book.title).toBe(reservations[0]!.book.title);
  });

  it("rejects an idempotency key already bound to another folio intent", async () => {
    const first = await repository.createBook({
      title: "First intent",
      origin: { kind: "title" },
      firstMovement: { id: "first-01", brief: "The first intent." },
    });
    const second = await repository.createBook({
      title: "Second intent",
      origin: { kind: "title" },
      firstMovement: { id: "second-01", brief: "The second intent." },
    });
    const idempotencyKey = `shared:${randomUUID()}`;
    await repository.reserveFolio({ bookId: first.id, idempotencyKey, movementId: "first-01", ordinal: 1 });

    await expect(
      repository.reserveFolio({ bookId: second.id, idempotencyKey, movementId: "second-01", ordinal: 1 }),
    ).rejects.toThrow(/idempotency key was reused with different intent/);
  });

  it("atomically exposes ready prose, layout, apertures, and required assets, then freezes them", async () => {
    const book = await repository.createBook({
      title: "A Child Book",
      origin: { kind: "aperture", phrase: "the clock under the lake" },
      firstMovement: { id: "child-01", brief: "A diver finds a municipal clock still keeping time." },
    });
    const reservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "child-01",
      ordinal: 1,
    });
    const leaseToken = await repository.claimFolioGeneration({
        attemptId: reservation.attempt.id,
        leaseMilliseconds: 60_000,
        workerId: "worker-a",
      });
    expect(leaseToken).toMatch(/^[a-f0-9-]{36}$/);

    const asset = await repository.storeAsset(assetStore, {
      bytes: new TextEncoder().encode("verified narrative plate"),
      mediaType: "image/webp",
    });
    const targetBook = await repository.createBook({
      title: "The Clock Under the Lake",
      origin: { kind: "aperture", phrase: "the clock under the lake" },
      firstMovement: { id: "target-01", brief: "The clock's keeper hears a diver overhead." },
    });
    await repository.markFolioReady({
      apertures: [
        {
          endOffset: 45,
          kind: "suggested",
          sourceText: "the clock under the lake",
          startOffset: 21,
          targetBookId: targetBook.id,
        },
      ],
      folioId: reservation.folio.id,
      layout: { kind: "plate", imagePosition: "after" },
      leaseToken: leaseToken!,
      prose: "Mara surfaced beside the clock under the lake, and heard it strike through the water.",
      requiredAssetIds: [asset.id],
    });

    const exposed = await repository.exposeFolio(reservation.folio.id);
    expect(exposed.state).toBe("exposed");
    expect(exposed.exposedAt).toBeInstanceOf(Date);

    await expect(
      database.updateTable("folios").set({ prose: "a quiet rewrite" }).where("id", "=", exposed.id).execute(),
    ).rejects.toThrow(/exposed folio is immutable/);
    await expect(
      database
        .updateTable("apertures")
        .set({ start_offset: 0 })
        .where("source_folio_id", "=", exposed.id)
        .execute(),
    ).rejects.toThrow(/apertures are immutable/);
    await expect(
      database.updateTable("assets").set({ object_key: "sha256/bb/replacement" }).where("id", "=", asset.id).execute(),
    ).rejects.toThrow(/ready asset is immutable/);
    await expect(
      repository.failFolio({ failure: { reason: "too late" }, folioId: exposed.id, leaseToken: randomUUID() }),
    ).rejects.toThrow(
      /illegal folio transition/,
    );
  });

  it("keeps a folio generating when any required asset is not ready", async () => {
    const book = await repository.createBook({
      title: "An Unready Plate",
      origin: { kind: "title" },
      firstMovement: { id: "movement-01", brief: "The image has not arrived." },
    });
    const reservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "movement-01",
      ordinal: 1,
    });
    const leaseToken = await repository.claimFolioGeneration({
      attemptId: reservation.attempt.id,
      leaseMilliseconds: 60_000,
      workerId: "worker-a",
    });
    await expect(
      repository.markFolioReady({
        apertures: [],
        folioId: reservation.folio.id,
        layout: { kind: "text-led" },
        leaseToken: leaseToken!,
        prose: "The folio is complete, but its required plate is not.",
        requiredAssetIds: [randomUUID()],
      }),
    ).rejects.toThrow(/required assets are not ready/);
    expect((await repository.getFolio(reservation.folio.id)).state).toBe("generating");
  });

  it("derives durable storage identity from the AssetStore and rejects a conflicting driver", async () => {
    const bytes = new TextEncoder().encode(`driver-provenance:${randomUUID()}`);
    const digest = sha256(bytes);
    await database
      .insertInto("assets")
      .values({
        byte_length: bytes.byteLength,
        created_by_attempt_id: null,
        digest,
        id: randomUUID(),
        media_type: "image/webp",
        metadata: "{}",
        object_key: contentAddress(digest),
        storage_driver: "s3",
      })
      .execute();

    await expect(
      repository.storeAsset(assetStore, {
        bytes,
        mediaType: "image/webp",
      }),
    ).rejects.toThrow(/asset digest was reused with different metadata/);
  });

  it("locks the Attempt before the Folio when publication races another lifecycle transaction", async () => {
    const book = await repository.createBook({
      title: "One Lock Order",
      origin: { kind: "title" },
      firstMovement: { id: "lock-order-01", brief: "Recovery and publication cannot deadlock each other." },
    });
    const reservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "lock-order-01",
      ordinal: 1,
    });
    const leaseToken = await repository.claimFolioGeneration({
      attemptId: reservation.attempt.id,
      leaseMilliseconds: 60_000,
      workerId: "worker-lock-order",
    });

    let announceAttemptLock!: () => void;
    const attemptLocked = new Promise<void>((resolve) => {
      announceAttemptLock = resolve;
    });
    let releaseLifecycle!: () => void;
    const lifecycleMayContinue = new Promise<void>((resolve) => {
      releaseLifecycle = resolve;
    });
    const lifecycleTransaction = database.transaction().execute(async (transaction) => {
      await transaction
        .selectFrom("generation_attempts")
        .select("id")
        .where("id", "=", reservation.attempt.id)
        .forUpdate()
        .executeTakeFirstOrThrow();
      announceAttemptLock();
      await lifecycleMayContinue;
      await transaction
        .selectFrom("folios")
        .select("id")
        .where("id", "=", reservation.folio.id)
        .forUpdate()
        .executeTakeFirstOrThrow();
    });
    await attemptLocked;

    const publication = repository.markFolioReady({
      apertures: [],
      folioId: reservation.folio.id,
      layout: { kind: "text-led" },
      leaseToken: leaseToken!,
      prose: "The lifecycle transaction and publisher agree on one lock order.",
      requiredAssetIds: [],
    });

    let publisherIsWaiting = false;
    for (let count = 0; count < 100; count += 1) {
      const waiting = await sql<{ waiting: number }>`
        select count(*)::integer as waiting
        from pg_stat_activity
        where datname = current_database()
          and pid <> pg_backend_pid()
          and wait_event_type = 'Lock'
          and query ilike '%generation_attempts%'
      `.execute(database);
      if ((waiting.rows[0]?.waiting ?? 0) > 0) {
        publisherIsWaiting = true;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    releaseLifecycle();
    expect(publisherIsWaiting).toBe(true);

    const results = await Promise.allSettled([lifecycleTransaction, publication]);
    expect(results.map(({ status }) => status)).toEqual(["fulfilled", "fulfilled"]);
    expect((await repository.getFolio(reservation.folio.id)).state).toBe("ready");
  });

  it("fences an expired worker and retries a named failed attempt without changing folio identity", async () => {
    const book = await repository.createBook({
      title: "A Recoverable Folio",
      origin: { kind: "title" },
      firstMovement: { id: "recover-01", brief: "A worker disappears and the folio recovers." },
    });
    const reservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "recover-01",
      ordinal: 1,
    });
    const staleToken = await repository.claimFolioGeneration({
      attemptId: reservation.attempt.id,
      leaseMilliseconds: 1,
      workerId: "worker-stale",
    });
    await new Promise((resolve) => setTimeout(resolve, 10));
    const currentToken = await repository.claimFolioGeneration({
      attemptId: reservation.attempt.id,
      leaseMilliseconds: 60_000,
      workerId: "worker-current",
    });
    expect(currentToken).not.toBe(staleToken);
    const reclaimedAttempt = await database
      .selectFrom("generation_attempts")
      .select("lease_epoch")
      .where("id", "=", reservation.attempt.id)
      .executeTakeFirstOrThrow();
    expect(Number(reclaimedAttempt.lease_epoch)).toBe(2);

    await expect(
      repository.markFolioReady({
        apertures: [],
        folioId: reservation.folio.id,
        layout: { kind: "text-led" },
        leaseToken: staleToken!,
        prose: "A late result that must never become visible.",
        requiredAssetIds: [],
      }),
    ).rejects.toThrow(/generation lease is stale/);
    await repository.failFolio({
      failure: { reason: "named-retry" },
      folioId: reservation.folio.id,
      leaseToken: currentToken!,
    });
    const retry = await repository.retryFailedFolio({
      folioId: reservation.folio.id,
      idempotencyKey: `retry:${reservation.attempt.id}:1`,
    });
    expect(retry.created).toBe(true);
    expect(retry.folio.id).toBe(reservation.folio.id);
    expect(retry.attempt.id).not.toBe(reservation.attempt.id);
    expect(retry.folio.state).toBe("reserved");
    const repeatedRetry = await repository.retryFailedFolio({
      folioId: reservation.folio.id,
      idempotencyKey: `retry:${reservation.attempt.id}:1`,
    });
    expect(repeatedRetry.created).toBe(false);
    expect(repeatedRetry.attempt.id).toBe(retry.attempt.id);
  });

  it("replaces a rejected ready-but-unexposed candidate through one linked retry", async () => {
    const book = await repository.createBook({
      title: "A Replaceable Candidate",
      origin: { kind: "title" },
      firstMovement: { id: "replace-01", brief: "A complete unseen candidate is rejected." },
    });
    const targetBook = await repository.createBook({
      title: "The Blue Door",
      origin: { kind: "aperture", phrase: "blue door" },
      firstMovement: { id: "blue-door-01", brief: "A passage begins on the other side of the door." },
    });
    const reservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "replace-01",
      ordinal: 1,
    });
    const leaseToken = await repository.claimFolioGeneration({
      attemptId: reservation.attempt.id,
      leaseMilliseconds: 60_000,
      workerId: "worker-ready",
    });
    const rejectedProse = "A complete but rejected passage opens the blue door.";
    const rejectedStart = rejectedProse.indexOf("blue door");
    await repository.markFolioReady({
      apertures: [
        {
          endOffset: rejectedStart + "blue door".length,
          kind: "suggested",
          sourceText: "blue door",
          startOffset: rejectedStart,
          targetBookId: targetBook.id,
        },
      ],
      folioId: reservation.folio.id,
      layout: { kind: "text-led" },
      leaseToken: leaseToken!,
      prose: rejectedProse,
      requiredAssetIds: [],
    });
    await repository.failFolio({
      failure: { reason: "human-rejected-unseen-candidate" },
      folioId: reservation.folio.id,
    });
    const retry = await repository.retryFailedFolio({
      folioId: reservation.folio.id,
      idempotencyKey: `retry:${reservation.attempt.id}:ready-rejection`,
    });
    expect(retry.folio.id).toBe(reservation.folio.id);
    expect(retry.folio.prose).toBeNull();
    expect(retry.folio.state).toBe("reserved");

    const staleApertures = await database
      .selectFrom("apertures")
      .selectAll()
      .where("source_folio_id", "=", reservation.folio.id)
      .execute();
    expect(staleApertures).toHaveLength(0);

    const retryLeaseToken = await repository.claimFolioGeneration({
      attemptId: retry.attempt.id,
      leaseMilliseconds: 60_000,
      workerId: "worker-replacement",
    });
    const replacementProse = "A clearer replacement passage opens the blue door.";
    const replacementStart = replacementProse.indexOf("blue door");
    await repository.markFolioReady({
      apertures: [
        {
          endOffset: replacementStart + "blue door".length,
          kind: "suggested",
          sourceText: "blue door",
          startOffset: replacementStart,
          targetBookId: targetBook.id,
        },
      ],
      folioId: reservation.folio.id,
      layout: { kind: "text-led" },
      leaseToken: retryLeaseToken!,
      prose: replacementProse,
      requiredAssetIds: [],
    });
    await repository.exposeFolio(reservation.folio.id);

    const replacementApertures = await database
      .selectFrom("apertures")
      .selectAll()
      .where("source_folio_id", "=", reservation.folio.id)
      .execute();
    expect(replacementApertures).toHaveLength(1);
    expect(replacementApertures[0]?.source_text).toBe("blue door");
    await expect(
      database.deleteFrom("apertures").where("id", "=", replacementApertures[0]!.id).execute(),
    ).rejects.toThrow(/apertures are immutable/);
  });

  it("uses JavaScript UTF-16 source offsets for apertures containing surrogate pairs", async () => {
    const book = await repository.createBook({
      title: "Emoji Coordinates",
      origin: { kind: "title" },
      firstMovement: { id: "emoji-01", brief: "A clock glyph is part of the source phrase." },
    });
    const target = await repository.createBook({
      title: "The Clock Glyph",
      origin: { kind: "aperture" },
      firstMovement: { id: "glyph-01", brief: "The glyph becomes a place." },
    });
    const reservation = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "emoji-01",
      ordinal: 1,
    });
    const leaseToken = await repository.claimFolioGeneration({
      attemptId: reservation.attempt.id,
      leaseMilliseconds: 60_000,
      workerId: "worker-emoji",
    });
    const prose = "Mara found the 🕰️ under the lake.";
    const sourceText = "🕰️ under the lake";
    const startOffset = prose.indexOf(sourceText);
    await repository.markFolioReady({
      apertures: [
        {
          endOffset: startOffset + sourceText.length,
          kind: "suggested",
          sourceText,
          startOffset,
          targetBookId: target.id,
        },
      ],
      folioId: reservation.folio.id,
      layout: { kind: "text-led" },
      leaseToken: leaseToken!,
      prose,
      requiredAssetIds: [],
    });
    expect((await repository.getFolio(reservation.folio.id)).state).toBe("ready");
  });

  it("allows movement briefs to append but never be rewritten or removed", async () => {
    const book = await repository.createBook({
      title: "Movements",
      origin: { kind: "root" },
      firstMovement: { id: "movement-01", brief: "The first finite movement." },
    });
    const updated = await repository.appendMovementBrief(book.id, {
      id: "movement-02",
      brief: "The book continues from the changed situation.",
    });
    expect(updated.movementBriefs.map(({ id }) => id)).toEqual(["movement-01", "movement-02"]);

    await expect(
      database
        .updateTable("books")
        .set({ movement_briefs: JSON.stringify([{ id: "movement-01", brief: "rewritten" }]) })
        .where("id", "=", book.id)
        .execute(),
    ).rejects.toThrow(/movement briefs are append-only/);
  });

  it("freezes Book and Folio identity outside a validated linked retry", async () => {
    const book = await repository.createBook({
      title: "Stable Founding Identity",
      origin: { kind: "title", phrase: "stable founding identity" },
      firstMovement: { id: "stable-01", brief: "The founding premise remains attributable." },
    });
    const first = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:1`,
      movementId: "stable-01",
      ordinal: 1,
    });
    const second = await repository.reserveFolio({
      bookId: book.id,
      idempotencyKey: `folio:${book.id}:2`,
      movementId: "stable-01",
      ordinal: 2,
    });

    await expect(
      database
        .updateTable("books")
        .set({ idempotency_key: `rewritten:${randomUUID()}` })
        .where("id", "=", book.id)
        .execute(),
    ).rejects.toThrow(/book founding identity is immutable/);
    await expect(database.deleteFrom("books").where("id", "=", book.id).execute()).rejects.toThrow(
      /books are immutable records/,
    );
    await expect(
      database.updateTable("folios").set({ ordinal: 3 }).where("id", "=", first.folio.id).execute(),
    ).rejects.toThrow(/folio identity is immutable/);
    await expect(
      database
        .updateTable("folios")
        .set({ generation_attempt_id: second.attempt.id })
        .where("id", "=", first.folio.id)
        .execute(),
    ).rejects.toThrow(/folio attempt pointer can change only during linked retry/);
  });
});
