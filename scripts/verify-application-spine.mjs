#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { packageContractIssues } from "./verify-architecture-decision.mjs";

const REQUIRED_A2_FILES = [
  ".env.example",
  ".github/workflows/ci.yml",
  ".npmrc",
  "compose.yaml",
  "eslint.config.js",
  "index.html",
  "package.json",
  "playwright.config.ts",
  "pnpm-lock.yaml",
  "pnpm-workspace.yaml",
  "railway.json",
  "src/client/App.tsx",
  "src/client/main.tsx",
  "src/client/styles.css",
  "src/server/app.ts",
  "src/server/assets/asset-store.ts",
  "src/server/assets/filesystem-asset-store.ts",
  "src/server/assets/s3-asset-store.ts",
  "src/server/config.ts",
  "src/server/db/database.ts",
  "src/server/db/migrate.ts",
  "src/server/db/migrations/001_initial.ts",
  "src/server/db/types.ts",
  "src/server/domain/folio-state.ts",
  "src/server/index.ts",
  "src/server/repositories/library-repository.ts",
  "tsconfig.json",
  "tsconfig.server.json",
  "tests/browser/reader-shell.spec.ts",
  "vite.config.ts",
  "vitest.config.ts",
];

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".cache",
  ".claude",
  ".local",
  ".memory",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);

async function listFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(root, absolute)));
    if (entry.isFile()) files.push(path.relative(root, absolute).split(path.sep).join("/"));
  }

  return files;
}

async function readIfPresent(root, relative) {
  try {
    return await readFile(path.join(root, relative), "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

export function railwayConfigIssues(config) {
  const issues = [];
  const expected = {
    buildCommand: "pnpm run build",
    builder: "RAILPACK",
  };
  for (const [key, value] of Object.entries(expected)) {
    if (config.build?.[key] !== value) issues.push(`railway build.${key} must equal ${String(value)}`);
  }
  const expectedDeploy = {
    drainingSeconds: 10,
    healthcheckPath: "/healthz",
    healthcheckTimeout: 120,
    preDeployCommand: "pnpm run db:migrate",
    restartPolicyMaxRetries: 10,
    restartPolicyType: "ON_FAILURE",
    sleepApplication: false,
    startCommand: "pnpm run start",
  };
  for (const [key, value] of Object.entries(expectedDeploy)) {
    if (config.deploy?.[key] !== value) issues.push(`railway deploy.${key} must equal ${String(value)}`);
  }
  const regions = config.deploy?.multiRegionConfig ?? {};
  if (
    Object.keys(regions).length !== 1 ||
    regions["us-west2"]?.numReplicas !== 1
  ) {
    issues.push("railway deploy must run exactly one replica in us-west2");
  }
  if (config.deploy?.region !== undefined || config.deploy?.numReplicas !== undefined) {
    issues.push("railway deploy cannot mix legacy region fields with multiRegionConfig");
  }
  return issues;
}

export function composeConfigIssues(text) {
  const issues = [];
  for (const fragment of [
    "image: postgres:18.4-alpine",
    '"127.0.0.1:${SHAPE_OF_TIME_POSTGRES_PORT:-55432}:5432"',
    "shape_of_time_postgres:/var/lib/postgresql",
  ]) {
    if (!text.includes(fragment)) issues.push(`compose config is missing: ${fragment}`);
  }
  if (text.includes("shape_of_time_postgres:/var/lib/postgresql/data")) {
    issues.push("Postgres 18 local volume uses the obsolete ephemeral data mount");
  }
  return issues;
}

export function ciConfigIssues(text) {
  const issues = [];
  for (const fragment of [
    "actions/checkout@v6",
    "pnpm/action-setup@v6",
    "actions/setup-node@v6",
    "pnpm install --frozen-lockfile",
    "docker info",
    "pnpm exec playwright install --with-deps chromium",
    "pnpm run gates",
  ]) {
    if (!text.includes(fragment)) issues.push(`CI config is missing: ${fragment}`);
  }
  return issues;
}

export function playwrightConfigIssues(text) {
  const issues = [];
  for (const fragment of [
    "pnpm run build",
    "pnpm run dev:infra",
    "pnpm run db:migrate",
    "pnpm run start",
    "SHAPE_OF_TIME_POSTGRES_PORT",
  ]) {
    if (!text.includes(fragment)) issues.push(`browser config is missing production-spine command: ${fragment}`);
  }
  if (/pnpm exec vite|vite preview/.test(text)) {
    issues.push("browser regression cannot substitute a Vite server for the production Hono spine");
  }
  return issues;
}

export function compositionRootIssues(sources) {
  const issues = [];
  const app = sources["src/server/app.ts"] ?? "";
  const index = sources["src/server/index.ts"] ?? "";
  for (const fragment of ["parseConfig", "createDatabase", "FilesystemAssetStore", "S3AssetStore"]) {
    if (!app.includes(fragment)) issues.push(`src/server/app.ts composition root is missing: ${fragment}`);
  }
  for (const forbidden of ["parseConfig", "createDatabase", "FilesystemAssetStore", "S3AssetStore", 'from "pino"']) {
    if (index.includes(forbidden)) issues.push(`src/server/index.ts owns dependency construction: ${forbidden}`);
  }
  if (!index.includes("composeApplication")) issues.push("src/server/index.ts must delegate construction to composeApplication");
  return issues;
}

export function storageContractIssues(sources) {
  const issues = [];
  const boundary = sources["src/server/assets/asset-store.ts"] ?? "";
  const filesystem = sources["src/server/assets/filesystem-asset-store.ts"] ?? "";
  const s3 = sources["src/server/assets/s3-asset-store.ts"] ?? "";
  const repository = sources["src/server/repositories/library-repository.ts"] ?? "";
  if (!boundary.includes('readonly driver: "filesystem" | "s3"')) {
    issues.push("AssetStore must own its durable storage driver identity");
  }
  if (!filesystem.includes('readonly driver = "filesystem"')) {
    issues.push("FilesystemAssetStore must identify itself as filesystem");
  }
  if (!s3.includes('readonly driver = "s3"')) {
    issues.push("S3AssetStore must identify itself as s3");
  }
  if (!s3.includes("existing.ContentType !== options.mediaType")) {
    issues.push("S3 collision verification must include ContentType");
  }
  if (!repository.includes("storage_driver: store.driver") || repository.includes("storageDriver:")) {
    issues.push("Asset persistence must derive storage_driver from AssetStore");
  }
  return issues;
}

export function loggingContractIssues(sources) {
  const issues = [];
  for (const file of ["src/server/app.ts", "src/server/index.ts"]) {
    const source = sources[file] ?? "";
    if (/\.error\(\{\s*error\s*\}/.test(source)) {
      issues.push(`${file} must pass native errors under Pino's err serializer key`);
    }
  }
  return issues;
}

export function isProductionListenOwner(source) {
  return /from\s+["']@hono\/node-server["']/.test(source) || /\bserve\s*\(/.test(source);
}

export async function auditApplicationSpine(rootUrl) {
  const root = fileURLToPath(rootUrl);
  const files = await listFiles(root);
  const issues = [];

  for (const required of REQUIRED_A2_FILES) {
    if (!files.includes(required)) issues.push(`missing A2 application file: ${required}`);
  }

  const packageText = await readIfPresent(root, "package.json");
  if (packageText !== undefined) issues.push(...packageContractIssues(JSON.parse(packageText)));
  const npmrc = await readIfPresent(root, ".npmrc");
  if (npmrc !== undefined && npmrc.trim() !== "registry=https://registry.npmjs.org/") {
    issues.push(".npmrc must pin the public registry over HTTPS without credentials");
  }

  const railwayText = await readIfPresent(root, "railway.json");
  if (railwayText !== undefined) issues.push(...railwayConfigIssues(JSON.parse(railwayText)));
  const composeText = await readIfPresent(root, "compose.yaml");
  if (composeText !== undefined) issues.push(...composeConfigIssues(composeText));
  const ciText = await readIfPresent(root, ".github/workflows/ci.yml");
  if (ciText !== undefined) issues.push(...ciConfigIssues(ciText));
  const playwrightText = await readIfPresent(root, "playwright.config.ts");
  if (playwrightText !== undefined) issues.push(...playwrightConfigIssues(playwrightText));

  const serverSources = await Promise.all(
    files
      .filter((file) => file.startsWith("src/server/") && file.endsWith(".ts"))
      .map(async (file) => [file, await readFile(path.join(root, file), "utf8")]),
  );
  const listenOwners = serverSources.filter(([, source]) => isProductionListenOwner(source));
  if (serverSources.length > 0) {
    if (listenOwners.length !== 1 || listenOwners[0][0] !== "src/server/index.ts") {
      issues.push("src/server/index.ts must be the only production listen owner");
    }
    issues.push(...compositionRootIssues(Object.fromEntries(serverSources)));
    issues.push(...loggingContractIssues(Object.fromEntries(serverSources)));
    issues.push(...storageContractIssues(Object.fromEntries(serverSources)));
  }

  return issues;
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) {
  const issues = await auditApplicationSpine(new URL("../", import.meta.url));
  if (issues.length > 0) {
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log("Shape of Time application spine audit passed.");
  }
}
