import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import type { Kysely } from "kysely";
import type { Logger } from "pino";
import pino from "pino";

import type { AssetStore } from "./assets/asset-store.js";
import { FilesystemAssetStore } from "./assets/filesystem-asset-store.js";
import { S3AssetStore } from "./assets/s3-asset-store.js";
import { parseConfig, type AppConfig } from "./config.js";
import { createDatabase, destroyDatabase } from "./db/database.js";
import { readDatabaseHealth } from "./db/health.js";
import type { Database } from "./db/types.js";
import { registerNextPageRoutes, type NextPageGeneration } from "./next-page.js";
import { LibraryRepository } from "./repositories/library-repository.js";

export interface AppDependencies {
  assetStore?: AssetStore;
  clientRoot: string;
  database: Kysely<Database>;
  /** When present (with assetStore), the Next Page live path is served under /api. */
  generation?: NextPageGeneration;
  gitCommitSha?: string;
  logger?: Logger;
}

export interface ApplicationRuntime {
  app: Hono;
  assetStore: AssetStore;
  close(): Promise<void>;
  config: AppConfig;
  logger: Logger;
}

export function composeApplication(environment: NodeJS.ProcessEnv): ApplicationRuntime {
  const config = parseConfig(environment);
  const logger = pino({ level: config.logLevel });
  const database = createDatabase(config.databaseUrl, {
    onPoolError: (error) => logger.error({ err: error }, "idle database connection failed"),
  });
  const assetStore =
    config.assetDriver === "s3"
      ? new S3AssetStore(config.s3!)
      : new FilesystemAssetStore(config.assetFilesystemRoot);
  const clientRoot = path.resolve("dist/client");
  if (config.nodeEnvironment === "production" && !existsSync(path.join(clientRoot, "index.html"))) {
    throw new Error("production reader shell is missing dist/client/index.html");
  }
  const app = createApp({
    assetStore,
    clientRoot,
    database,
    ...(config.gitCommitSha === undefined ? {} : { gitCommitSha: config.gitCommitSha }),
    logger,
  });
  return {
    app,
    assetStore,
    close: () => destroyDatabase(database),
    config,
    logger,
  };
}

export function createApp(dependencies: AppDependencies): Hono {
  const app = new Hono();
  const clientRoot = path.resolve(dependencies.clientRoot);
  const indexPath = path.join(clientRoot, "index.html");

  app.use("*", async (context, next) => {
    const requestId = context.req.header("x-request-id") ?? randomUUID();
    const startedAt = performance.now();
    context.header("X-Request-Id", requestId);
    await next();
    const record = {
      durationMs: Math.round((performance.now() - startedAt) * 10) / 10,
      method: context.req.method,
      path: context.req.path,
      requestId,
      status: context.res.status,
    };
    if (context.req.path === "/healthz" && context.res.status < 500) {
      dependencies.logger?.debug(record, "request completed");
    } else {
      dependencies.logger?.info(record, "request completed");
    }
  });

  app.get("/healthz", async (context) => {
    try {
      const database = await withTimeout(readDatabaseHealth(dependencies.database), 3_000);
      return context.json({
        commit: dependencies.gitCommitSha ?? null,
        database,
        status: "ok",
      });
    } catch (error) {
      dependencies.logger?.error({ err: error }, "health check failed");
      return context.json({ status: "unavailable" }, 503);
    }
  });

  if (dependencies.generation !== undefined) {
    if (dependencies.assetStore === undefined) {
      throw new Error("the Next Page live path needs an asset store");
    }
    registerNextPageRoutes(app, {
      assetStore: dependencies.assetStore,
      generation: dependencies.generation,
      repository: new LibraryRepository(dependencies.database),
    });
  }

  app.all("/api", (context) => context.json({ error: "not found" }, 404));
  app.all("/api/*", (context) => context.json({ error: "not found" }, 404));

  app.use("/assets/*", async (context, next) => {
    await next();
    if (context.res.status === 200) {
      context.res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
    }
  });
  app.get("/assets/*", serveStatic({ root: clientRoot }));
  app.get("/assets/*", (context) => context.notFound());
  app.get("*", async (context) => {
    const accept = context.req.header("accept") ?? "*/*";
    if (
      path.posix.extname(context.req.path) !== "" ||
      (!accept.includes("text/html") && !accept.includes("*/*"))
    ) {
      return context.notFound();
    }
    try {
      const index = await readFile(indexPath, "utf8");
      context.header("Cache-Control", "no-cache");
      return context.html(index);
    } catch (error) {
      dependencies.logger?.error({ err: error }, "reader shell is unavailable");
      return context.text("Reader shell unavailable", 503);
    }
  });

  app.notFound((context) => context.text("Not found", 404));
  return app;
}

async function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("operation timed out")), milliseconds);
      }),
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
