import { createHash } from "node:crypto";

import { sql, type Kysely } from "kysely";

export const INITIAL_SCHEMA_SQL = String.raw`
    create table books (
      id uuid primary key,
      idempotency_key text not null unique check (length(btrim(idempotency_key)) > 0),
      intent_digest char(64) not null check (intent_digest ~ '^[0-9a-f]{64}$'),
      title text not null check (length(btrim(title)) > 0),
      origin jsonb not null,
      movement_briefs jsonb not null check (jsonb_typeof(movement_briefs) = 'array'),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table generation_attempts (
      id uuid primary key,
      book_id uuid not null references books(id) on delete restrict,
      folio_ordinal integer not null check (folio_ordinal >= 1),
      idempotency_key text not null unique check (length(btrim(idempotency_key)) > 0),
      intent_digest char(64) not null check (intent_digest ~ '^[0-9a-f]{64}$'),
      retry_of_attempt_id uuid unique references generation_attempts(id) on delete restrict,
      state text not null check (state in ('reserved', 'generating', 'ready', 'exposed', 'failed')),
      lease_owner text,
      lease_token uuid,
      lease_expires_at timestamptz,
      lease_epoch bigint not null default 0 check (lease_epoch >= 0),
      exact_inputs jsonb not null default '{}'::jsonb,
      provider_request_id text,
      result jsonb,
      usage jsonb,
      latency_ms bigint check (latency_ms is null or latency_ms >= 0),
      cost_microusd bigint check (cost_microusd is null or cost_microusd >= 0),
      failure jsonb,
      started_at timestamptz,
      completed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table assets (
      id uuid primary key,
      digest char(64) not null unique check (digest ~ '^[0-9a-f]{64}$'),
      object_key text not null unique,
      storage_driver text not null check (storage_driver in ('filesystem', 's3')),
      media_type text not null check (length(btrim(media_type)) > 0),
      byte_length bigint not null check (byte_length >= 0),
      created_by_attempt_id uuid references generation_attempts(id) on delete restrict,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      check (object_key = 'sha256/' || substr(digest, 1, 2) || '/' || digest)
    );

    create table folios (
      id uuid primary key,
      book_id uuid not null references books(id) on delete restrict,
      ordinal integer not null check (ordinal >= 1),
      movement_id text not null check (length(btrim(movement_id)) > 0),
      generation_attempt_id uuid not null unique references generation_attempts(id) on delete restrict,
      state text not null check (state in ('reserved', 'generating', 'ready', 'exposed', 'failed')),
      prose text,
      prose_digest char(64) check (prose_digest is null or prose_digest ~ '^[0-9a-f]{64}$'),
      layout jsonb,
      layout_digest char(64) check (layout_digest is null or layout_digest ~ '^[0-9a-f]{64}$'),
      required_asset_ids uuid[] not null default '{}',
      required_aperture_ids uuid[] not null default '{}',
      surface_digest char(64) check (surface_digest is null or surface_digest ~ '^[0-9a-f]{64}$'),
      ready_at timestamptz,
      exposed_at timestamptz,
      failed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (book_id, ordinal)
    );

    create table apertures (
      id uuid primary key,
      kind text not null check (kind in ('suggested', 'selection')),
      source_folio_id uuid not null references folios(id) on delete restrict,
      target_book_id uuid not null references books(id) on delete restrict,
      start_offset integer not null check (start_offset >= 0),
      end_offset integer not null check (end_offset > start_offset),
      span_encoding text not null default 'utf16-code-unit-v1' check (span_encoding = 'utf16-code-unit-v1'),
      source_text text not null check (length(source_text) > 0),
      created_at timestamptz not null default now(),
      unique (source_folio_id, kind, start_offset, end_offset, target_book_id)
    );

    create index folios_book_state_ordinal_idx on folios(book_id, state, ordinal);
    create index folios_book_movement_ordinal_idx on folios(book_id, movement_id, ordinal);
    create index generation_attempts_queue_idx
      on generation_attempts(state, lease_expires_at, created_at)
      where state in ('reserved', 'generating');
    create index apertures_source_idx on apertures(source_folio_id);
    create index apertures_target_idx on apertures(target_book_id);

    create function shape_of_time_validate_book_movements() returns trigger language plpgsql as $$
    declare
      old_length integer;
      position integer;
    begin
      if jsonb_typeof(new.movement_briefs) <> 'array' or jsonb_array_length(new.movement_briefs) = 0 then
        raise exception 'book requires at least one movement brief';
      end if;
      if exists (
        select 1 from jsonb_array_elements(new.movement_briefs) as entry
        where jsonb_typeof(entry) <> 'object'
           or length(btrim(coalesce(entry->>'id', ''))) = 0
           or length(btrim(coalesce(entry->>'brief', ''))) = 0
      ) then
        raise exception 'movement briefs require nonempty id and natural-prose brief';
      end if;
      if (
        select count(*) <> count(distinct entry->>'id')
        from jsonb_array_elements(new.movement_briefs) as entry
      ) then
        raise exception 'movement brief ids must be unique within a book';
      end if;
      if tg_op = 'UPDATE' then
        old_length := jsonb_array_length(old.movement_briefs);
        if jsonb_array_length(new.movement_briefs) < old_length then
          raise exception 'movement briefs are append-only';
        end if;
        for position in 0..old_length - 1 loop
          if old.movement_briefs->position is distinct from new.movement_briefs->position then
            raise exception 'movement briefs are append-only';
          end if;
        end loop;
      end if;
      return new;
    end;
    $$;

    create trigger books_validate_movements
      before insert or update of movement_briefs on books
      for each row execute function shape_of_time_validate_book_movements();

    create function shape_of_time_guard_book_mutation() returns trigger language plpgsql as $$
    begin
      if tg_op = 'DELETE' then
        raise exception 'books are immutable records';
      end if;
      if old.id is distinct from new.id
         or old.idempotency_key is distinct from new.idempotency_key
         or old.intent_digest is distinct from new.intent_digest
         or old.title is distinct from new.title
         or old.origin is distinct from new.origin
         or old.created_at is distinct from new.created_at then
        raise exception 'book founding identity is immutable';
      end if;
      return new;
    end;
    $$;

    create trigger books_guard_mutation
      before update or delete on books
      for each row execute function shape_of_time_guard_book_mutation();

    create function shape_of_time_validate_folio_movement() returns trigger language plpgsql as $$
    begin
      if not exists (
        select 1
        from books b, jsonb_array_elements(b.movement_briefs) entry
        where b.id = new.book_id and entry->>'id' = new.movement_id
      ) then
        raise exception 'folio movement is absent from its book';
      end if;
      return new;
    end;
    $$;

    create trigger folios_validate_movement
      before insert or update of book_id, movement_id on folios
      for each row execute function shape_of_time_validate_folio_movement();

    create function shape_of_time_guard_folio_update() returns trigger language plpgsql as $$
    begin
      if tg_op = 'DELETE' then
        raise exception 'folios are immutable records';
      elsif tg_op = 'INSERT' then
        if new.state <> 'reserved' then
          raise exception 'new folio must begin reserved';
        end if;
      else
        if old.id is distinct from new.id
           or old.book_id is distinct from new.book_id
           or old.ordinal is distinct from new.ordinal
           or old.movement_id is distinct from new.movement_id
           or old.created_at is distinct from new.created_at then
          raise exception 'folio identity is immutable';
        end if;
        if old.generation_attempt_id is distinct from new.generation_attempt_id and not (
          old.state = 'failed' and new.state = 'reserved'
          and exists (
            select 1 from generation_attempts retry
            where retry.id = new.generation_attempt_id
              and retry.retry_of_attempt_id = old.generation_attempt_id
              and retry.state = 'reserved'
          )
        ) then
          raise exception 'folio attempt pointer can change only during linked retry';
        end if;
        if old.state = 'exposed' then
          raise exception 'exposed folio is immutable';
        end if;
        if old.state is distinct from new.state and not (
          (old.state = 'reserved' and new.state in ('generating', 'failed')) or
          (old.state = 'generating' and new.state in ('ready', 'failed')) or
          (old.state = 'ready' and new.state in ('exposed', 'failed')) or
          (old.state = 'failed' and new.state = 'reserved' and
            old.generation_attempt_id is distinct from new.generation_attempt_id and
            exists (
              select 1 from generation_attempts retry
              where retry.id = new.generation_attempt_id
                and retry.retry_of_attempt_id = old.generation_attempt_id
                and retry.state = 'reserved'
            ))
        ) then
          raise exception 'illegal folio transition: % -> %', old.state, new.state;
        end if;
      end if;

      if new.state = 'reserved' and (
        new.prose is not null or new.prose_digest is not null or new.layout is not null
        or new.layout_digest is not null or new.surface_digest is not null
        or cardinality(new.required_asset_ids) <> 0 or cardinality(new.required_aperture_ids) <> 0
        or new.ready_at is not null or new.exposed_at is not null or new.failed_at is not null
      ) then
        raise exception 'reserved folio must have an empty candidate';
      end if;
      if new.state = 'generating' and (
        new.prose is not null or new.prose_digest is not null or new.layout is not null
        or new.layout_digest is not null or new.surface_digest is not null
        or cardinality(new.required_asset_ids) <> 0 or cardinality(new.required_aperture_ids) <> 0
        or new.ready_at is not null or new.exposed_at is not null or new.failed_at is not null
      ) then
        raise exception 'generating folio cannot hold a completed candidate';
      end if;
      if new.state = 'failed' and new.failed_at is null then
        raise exception 'failed folio requires failed_at';
      end if;
      if new.state = 'failed' and new.exposed_at is not null then
        raise exception 'failed folio cannot have been exposed';
      end if;
      if new.state in ('ready', 'exposed') then
        if length(btrim(coalesce(new.prose, ''))) = 0 or new.prose_digest is null
           or new.layout is null or new.layout_digest is null or new.surface_digest is null then
          raise exception 'ready folio requires prose, layout, and digests';
        end if;
        if cardinality(new.required_asset_ids) <> (
          select count(distinct value) from unnest(new.required_asset_ids) as value
        ) then
          raise exception 'required asset ids must be distinct';
        end if;
        if exists (
          select 1 from unnest(new.required_asset_ids) as required(id)
          left join assets on assets.id = required.id where assets.id is null
        ) then
          raise exception 'required assets are not ready';
        end if;
        if cardinality(new.required_aperture_ids) <> (
          select count(distinct value) from unnest(new.required_aperture_ids) as value
        ) then
          raise exception 'required aperture ids must be distinct';
        end if;
        if exists (
          select 1 from unnest(new.required_aperture_ids) as required(id)
          left join apertures on apertures.id = required.id and apertures.source_folio_id = new.id
          where apertures.id is null
        ) then
          raise exception 'required apertures are not ready';
        end if;
        if new.ready_at is null or new.failed_at is not null then
          raise exception 'ready folio requires ready_at without failure';
        end if;
      end if;
      if new.state = 'ready' and new.exposed_at is not null then
        raise exception 'ready folio cannot have exposed_at';
      end if;
      if new.state = 'exposed' and new.exposed_at is null then
        raise exception 'exposed folio requires exposed_at';
      end if;
      return new;
    end;
    $$;

    create trigger folios_guard_update
      before insert or update or delete on folios
      for each row execute function shape_of_time_guard_folio_update();

    create function shape_of_time_guard_attempt_mutation() returns trigger language plpgsql as $$
    begin
      if tg_op = 'INSERT' then
        if new.state <> 'reserved' then
          raise exception 'new generation attempt must begin reserved';
        end if;
      elsif tg_op = 'DELETE' then
        raise exception 'generation attempts are immutable records';
      else
        if old.state in ('exposed', 'failed') then
          raise exception 'terminal generation attempt is immutable';
        end if;
        if old.state is distinct from new.state and not (
          (old.state = 'reserved' and new.state in ('generating', 'failed')) or
          (old.state = 'generating' and new.state in ('ready', 'failed')) or
          (old.state = 'ready' and new.state in ('exposed', 'failed'))
        ) then
          raise exception 'illegal generation attempt transition: % -> %', old.state, new.state;
        end if;
        if old.id is distinct from new.id
           or old.book_id is distinct from new.book_id
           or old.folio_ordinal is distinct from new.folio_ordinal
           or old.idempotency_key is distinct from new.idempotency_key
           or old.intent_digest is distinct from new.intent_digest
           or old.retry_of_attempt_id is distinct from new.retry_of_attempt_id
           or old.exact_inputs is distinct from new.exact_inputs
           or old.created_at is distinct from new.created_at then
          raise exception 'generation attempt identity is immutable';
        end if;
      end if;

      if new.state = 'reserved' and (
        new.lease_owner is not null or new.lease_token is not null or new.lease_expires_at is not null
        or new.started_at is not null or new.completed_at is not null or new.lease_epoch <> 0
        or new.failure is not null
      ) then
        raise exception 'reserved attempt cannot hold a lease or completion';
      end if;
      if new.state = 'generating' and (
        length(btrim(coalesce(new.lease_owner, ''))) = 0
        or new.lease_token is null or new.lease_expires_at is null or new.started_at is null
        or new.completed_at is not null or new.lease_epoch < 1 or new.failure is not null
      ) then
        raise exception 'generating attempt requires an active lease';
      end if;
      if new.state in ('ready', 'exposed', 'failed') and (
        new.lease_owner is not null or new.lease_token is not null or new.lease_expires_at is not null
        or new.completed_at is null
      ) then
        raise exception 'terminal attempt requires completion without a lease';
      end if;
      if new.state in ('ready', 'exposed') and new.started_at is null then
        raise exception 'successful attempt requires a start time';
      end if;
      if new.state in ('ready', 'exposed') and new.failure is not null then
        raise exception 'successful attempt cannot hold failure evidence';
      end if;
      if new.state = 'failed' and new.failure is null then
        raise exception 'failed attempt requires failure evidence';
      end if;
      return new;
    end;
    $$;

    create trigger generation_attempts_guard_mutation
      before insert or update or delete on generation_attempts
      for each row execute function shape_of_time_guard_attempt_mutation();

    create function shape_of_time_validate_folio_attempt_agreement() returns trigger language plpgsql as $$
    declare
      attempt_book_id uuid;
      attempt_ordinal integer;
      attempt_state text;
    begin
      select attempt.book_id, attempt.folio_ordinal, attempt.state
        into attempt_book_id, attempt_ordinal, attempt_state
        from generation_attempts attempt
        where attempt.id = new.generation_attempt_id;
      if not found or attempt_state <> new.state then
        raise exception 'folio and generation attempt states must agree';
      end if;
      if attempt_book_id <> new.book_id or attempt_ordinal <> new.ordinal then
        raise exception 'folio and generation attempt identity must agree';
      end if;
      return new;
    end;
    $$;

    create constraint trigger folios_validate_attempt_agreement
      after insert or update on folios
      deferrable initially deferred
      for each row execute function shape_of_time_validate_folio_attempt_agreement();

    create function shape_of_time_validate_attempt_folio_agreement() returns trigger language plpgsql as $$
    begin
      if exists (
        select 1 from folios folio
        where folio.generation_attempt_id = new.id and folio.state <> new.state
      ) then
        raise exception 'folio and generation attempt states must agree';
      end if;
      if exists (
        select 1 from folios folio
        where folio.generation_attempt_id = new.id
          and (folio.book_id <> new.book_id or folio.ordinal <> new.folio_ordinal)
      ) then
        raise exception 'folio and generation attempt identity must agree';
      end if;
      if not exists (select 1 from folios folio where folio.generation_attempt_id = new.id)
         and not (
           new.state = 'failed'
           and exists (
             select 1 from generation_attempts successor where successor.retry_of_attempt_id = new.id
           )
         ) then
        raise exception 'orchestration attempt must be linked to its current folio';
      end if;
      return new;
    end;
    $$;

    create constraint trigger generation_attempts_validate_folio_agreement
      after insert or update on generation_attempts
      deferrable initially deferred
      for each row execute function shape_of_time_validate_attempt_folio_agreement();

    create function shape_of_time_guard_aperture_mutation() returns trigger language plpgsql as $$
    begin
      if tg_op = 'UPDATE' then
        raise exception 'folio apertures are immutable after insertion';
      end if;
      if exists (
        select 1 from folios where id = old.source_folio_id and state = 'exposed'
      ) then
        raise exception 'exposed folio apertures are immutable';
      end if;
      return old;
    end;
    $$;

    create trigger apertures_are_immutable
      before update or delete on apertures
      for each row execute function shape_of_time_guard_aperture_mutation();

    create function shape_of_time_reject_asset_mutation() returns trigger language plpgsql as $$
    begin
      raise exception 'ready asset is immutable';
    end;
    $$;

    create trigger assets_are_immutable
      before update or delete on assets
      for each row execute function shape_of_time_reject_asset_mutation();
`;

export const INITIAL_SCHEMA_DIGEST = createHash("sha256").update(INITIAL_SCHEMA_SQL).digest("hex");

export async function up(database: Kysely<unknown>): Promise<void> {
  await sql.raw(INITIAL_SCHEMA_SQL).execute(database);
  await sql`
    create table shape_of_time_schema (
      migration_name text primary key,
      content_digest char(64) not null check (content_digest ~ '^[0-9a-f]{64}$'),
      applied_at timestamptz not null default now()
    )
  `.execute(database);
  await sql`
    insert into shape_of_time_schema (migration_name, content_digest)
    values ('001_initial', ${INITIAL_SCHEMA_DIGEST})
  `.execute(database);
}

export async function down(database: Kysely<unknown>): Promise<void> {
  await sql`
    drop table if exists shape_of_time_schema;
    drop table if exists apertures;
    drop table if exists folios;
    drop table if exists assets;
    drop table if exists generation_attempts;
    drop table if exists books;
    drop function if exists shape_of_time_reject_asset_mutation();
    drop function if exists shape_of_time_guard_aperture_mutation();
    drop function if exists shape_of_time_validate_attempt_folio_agreement();
    drop function if exists shape_of_time_validate_folio_attempt_agreement();
    drop function if exists shape_of_time_guard_attempt_mutation();
    drop function if exists shape_of_time_guard_folio_update();
    drop function if exists shape_of_time_validate_folio_movement();
    drop function if exists shape_of_time_guard_book_mutation();
    drop function if exists shape_of_time_validate_book_movements();
  `.execute(database);
}
