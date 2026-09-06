import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { pool } from "../src/server/db/index.js";
import { migrate } from "../src/server/db/migrate.js";
import { config } from "../src/server/config.js";
import { getBytes, putBytes } from "../src/server/library/assets.js";

// Dependency order is also the restore order. Session parents precede children by creation time.
const tables = [
  "editions",
  "works",
  "documents",
  "publications",
  "sessions",
  "intents",
  "operations",
  "assets",
  "tool_results",
  "openings",
] as const;
const digest = (bytes: Uint8Array | string) =>
  createHash("sha256").update(bytes).digest("hex");
type Rows = Record<string, unknown>[];
type Manifest = {
  schema: string;
  created: string;
  tables: { name: string; file: string; count: number; sha256: string }[];
  objects: { key: string; file: string; mime: string; sha256: string }[];
};
const [mode, argument] = process.argv.slice(2);
if (!argument || !["export", "restore"].includes(mode))
  throw new Error(
    "Use corpus.ts export|restore DIRECTORY. Restore requires a fresh world_restore_* schema.",
  );
const directory = resolve(argument);
const connection = await pool.connect();
try {
  if (mode === "export") {
    const { rows } = await connection.query(
      "select pg_try_advisory_lock(hashtext($1)) as locked",
      ["shape-of-time:author"],
    );
    if (!rows[0].locked)
      throw new Error(
        "The author is working; export after its current request finishes.",
      );
    try {
      await mkdir(directory, { recursive: true });
      // Never overwrite a previous snapshot.
      const manifest: Manifest = {
        schema: config.schema,
        created: new Date().toISOString(),
        tables: [],
        objects: [],
      };
      const objects = new Map<string, string>();
      await connection.query("begin isolation level repeatable read read only");
      try {
        for (const name of tables) {
          const { rows }: { rows: Rows } = await connection.query(
            `select * from "${name}" order by created_at, id`,
          );
          const bytes = JSON.stringify(rows);
          const file = `${name}.json`;
          await writeFile(resolve(directory, file), bytes, {
            flag: "wx",
            mode: 0o600,
          });
          manifest.tables.push({
            name,
            file,
            count: rows.length,
            sha256: digest(bytes),
          });
          if (name === "assets")
            for (const row of rows)
              objects.set(String(row.storage_key), String(row.mime));
          if (name === "operations")
            for (const row of rows)
              if (row.raw_key)
                objects.set(String(row.raw_key), "application/json");
        }
        await connection.query("commit");
      } catch (error) {
        await connection.query("rollback");
        throw error;
      }
      for (const [key, mime] of objects) {
        const bytes = await getBytes(key);
        const file = `object-${digest(key)}`;
        await writeFile(resolve(directory, file), bytes, {
          flag: "wx",
          mode: 0o600,
        });
        manifest.objects.push({ key, file, mime, sha256: digest(bytes) });
      }
      await writeFile(
        resolve(directory, "manifest.json"),
        JSON.stringify(manifest, null, 2),
        { flag: "wx", mode: 0o600 },
      );
      console.log({
        directory,
        tables: manifest.tables.map(({ name, count }) => ({ name, count })),
        objects: manifest.objects.length,
      });
    } finally {
      await connection.query("select pg_advisory_unlock(hashtext($1))", [
        "shape-of-time:author",
      ]);
    }
  } else {
    if (!config.schema.startsWith("world_restore_") || config.generationEnabled)
      throw new Error(
        "Restore only into a fresh world_restore_* schema with generation disabled.",
      );
    const exists = await connection.query(
      "select 1 from information_schema.schemata where schema_name=$1",
      [config.schema],
    );
    if (exists.rowCount)
      throw new Error(
        "The target schema already exists; use a fresh restore name.",
      );
    const manifest: Manifest = JSON.parse(
      await readFile(resolve(directory, "manifest.json"), "utf8"),
    );
    const verified = async (file: string, checksum: string) => {
      if (file.includes("/") || file.includes("\\"))
        throw new Error("Invalid snapshot filename");
      const bytes = await readFile(resolve(directory, file));
      if (digest(bytes) !== checksum)
        throw new Error(`Snapshot checksum mismatch: ${file}`);
      return bytes;
    };
    // Verify all bytes before creating anything on Railway.
    for (const item of [...manifest.tables, ...manifest.objects])
      await verified(item.file, item.sha256);
    if (manifest.tables.map((t) => t.name).join() !== tables.join())
      throw new Error("Snapshot table order/schema is not supported.");
    await migrate();
    for (const item of manifest.objects) {
      const bytes = await verified(item.file, item.sha256);
      await putBytes(item.key, bytes, item.mime);
      if (digest(await getBytes(item.key)) !== item.sha256)
        throw new Error(`Restored object differs: ${item.key}`);
    }
    await connection.query("begin");
    try {
      for (const item of manifest.tables) {
        const rows: Rows = JSON.parse(
          (await verified(item.file, item.sha256)).toString(),
        );
        if (rows.length !== item.count)
          throw new Error(`Row count mismatch: ${item.name}`);
        const columns = await connection.query<{
          column_name: string;
          data_type: string;
        }>(
          "select column_name,data_type from information_schema.columns where table_schema=$1 and table_name=$2 order by ordinal_position",
          [config.schema, item.name],
        );
        const names = columns.rows.map((c) => c.column_name);
        for (const row of rows) {
          const values = columns.rows.map((c) =>
            c.data_type === "jsonb" && row[c.column_name] !== null
              ? JSON.stringify(row[c.column_name])
              : row[c.column_name],
          );
          await connection.query(
            `insert into "${item.name}" (${names.map((n) => `"${n}"`).join(",")}) values (${names.map((_, i) => `$${i + 1}`).join(",")})`,
            values,
          );
        }
        const restored = await connection.query(
          `select * from "${item.name}" order by created_at, id`,
        );
        if (digest(JSON.stringify(restored.rows)) !== item.sha256)
          throw new Error(`Restored table differs: ${item.name}`);
      }
      await connection.query("commit");
      console.log({
        restoredSchema: config.schema,
        verifiedTables: manifest.tables.length,
        verifiedObjects: manifest.objects.length,
        generation: "disabled",
      });
    } catch (error) {
      await connection.query("rollback");
      throw error;
    }
  }
} finally {
  connection.release();
  await pool.end();
}
