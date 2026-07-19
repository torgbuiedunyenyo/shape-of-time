import assert from "node:assert/strict";
import { test } from "node:test";

import {
  auditApplicationSpine,
  ciConfigIssues,
  compositionRootIssues,
  composeConfigIssues,
  isProductionListenOwner,
  loggingContractIssues,
  playwrightConfigIssues,
  railwayConfigIssues,
  storageContractIssues,
} from "./verify-application-spine.mjs";

test("A2 provides one executable reader/server, durable spine, and storage boundary", async () => {
  assert.deepEqual(await auditApplicationSpine(new URL("../", import.meta.url)), []);
});

test("A2 deployment config preserves one healthy US-West process and durable local Postgres", () => {
  const railway = {
    build: { buildCommand: "pnpm run build", builder: "RAILPACK" },
    deploy: {
      drainingSeconds: 10,
      healthcheckPath: "/healthz",
      healthcheckTimeout: 120,
      multiRegionConfig: { "us-west2": { numReplicas: 1 } },
      preDeployCommand: "pnpm run db:migrate",
      restartPolicyMaxRetries: 10,
      restartPolicyType: "ON_FAILURE",
      sleepApplication: false,
      startCommand: "pnpm run start",
    },
  };
  assert.deepEqual(railwayConfigIssues(railway), []);
  assert.notDeepEqual(
    railwayConfigIssues({ ...railway, deploy: { ...railway.deploy, multiRegionConfig: { "europe-west4": { numReplicas: 1 } } } }),
    [],
  );
  assert.notDeepEqual(railwayConfigIssues({ ...railway, deploy: { ...railway.deploy, sleepApplication: true } }), []);

  const compose = `
    image: postgres:18.4-alpine
    ports:\n      - "127.0.0.1:\${SHAPE_OF_TIME_POSTGRES_PORT:-55432}:5432"
    volumes:\n      - shape_of_time_postgres:/var/lib/postgresql
  `;
  assert.deepEqual(composeConfigIssues(compose), []);
  assert.notDeepEqual(composeConfigIssues(compose.replace("/var/lib/postgresql", "/var/lib/postgresql/data")), []);

  assert.equal(isProductionListenOwner('import { serve } from "@hono/node-server";\nserve({ fetch });'), true);
  assert.equal(
    isProductionListenOwner('import { serveStatic } from "@hono/node-server/serve-static";\nserveStatic({ root });'),
    false,
  );

  const ci = `
    uses: actions/checkout@v6
    uses: pnpm/action-setup@v6
    uses: actions/setup-node@v6
    run: pnpm install --frozen-lockfile
    run: docker info
    run: pnpm exec playwright install --with-deps chromium
    run: pnpm run gates
  `;
  assert.deepEqual(ciConfigIssues(ci), []);
  assert.notDeepEqual(ciConfigIssues(ci.replace("checkout@v6", "checkout@v4")), []);

  const playwright = `SHAPE_OF_TIME_POSTGRES_PORT pnpm run build && pnpm run dev:infra && pnpm run db:migrate && pnpm run start`;
  assert.deepEqual(playwrightConfigIssues(playwright), []);
  assert.notDeepEqual(playwrightConfigIssues("pnpm exec vite --host 127.0.0.1"), []);

  assert.deepEqual(
    compositionRootIssues({
      "src/server/app.ts":
        'import { parseConfig } from "./config.js";\nimport { createDatabase } from "./db/database.js";\nFilesystemAssetStore;\nS3AssetStore;',
      "src/server/index.ts": 'import { serve } from "@hono/node-server";\nimport { composeApplication } from "./app.js";',
    }),
    [],
  );
  assert.notDeepEqual(
    compositionRootIssues({
      "src/server/app.ts": "export const app = true;",
      "src/server/index.ts": 'import { createDatabase } from "./db/database.js";',
    }),
    [],
  );

  assert.deepEqual(
    loggingContractIssues({
      "src/server/app.ts": 'logger.error({ err: error }, "failed")',
      "src/server/index.ts": 'logger.error({ err: error }, "failed")',
    }),
    [],
  );
  assert.notDeepEqual(
    loggingContractIssues({
      "src/server/app.ts": 'logger.error({ error }, "failed")',
      "src/server/index.ts": "",
    }),
    [],
  );

  assert.deepEqual(
    storageContractIssues({
      "src/server/assets/asset-store.ts": 'readonly driver: "filesystem" | "s3"',
      "src/server/assets/filesystem-asset-store.ts": 'readonly driver = "filesystem"',
      "src/server/assets/s3-asset-store.ts":
        'readonly driver = "s3"; existing.ContentType !== options.mediaType',
      "src/server/repositories/library-repository.ts": "storage_driver: store.driver",
    }),
    [],
  );
  assert.notDeepEqual(
    storageContractIssues({
      "src/server/assets/asset-store.ts": "export interface AssetStore {}",
      "src/server/assets/filesystem-asset-store.ts": "export class FilesystemAssetStore {}",
      "src/server/assets/s3-asset-store.ts": "export class S3AssetStore {}",
      "src/server/repositories/library-repository.ts": "storageDriver: input.storageDriver",
    }),
    [],
  );
});
