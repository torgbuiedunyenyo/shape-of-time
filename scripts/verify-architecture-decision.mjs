#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REQUIRED_DECISION_FRAGMENTS = [
  "Status: Accepted",
  "one TypeScript package",
  "one deployable Node process",
  "React",
  "HTTP",
  "Postgres",
  "migration",
  "Railway",
  "8b20e07d-c256-44c9-85be-d1c7e50ac83d",
  "shape-of-time",
  "Git-triggered",
  "object storage",
  "Fresh-clone command matrix",
  "Rejected alternatives",
  "src/server/app.ts",
  "vite build && tsc -p tsconfig.server.json",
  "node dist/server/index.js",
  "Docker",
  "playwright install chromium",
  "application source deployments",
  "app autodeploy disabled",
  "ghcr.io/railwayapp-templates/postgres-ssl:18.4",
  "daily volume backups",
  "external TCP proxy disabled",
  "bucket contents remain disposable until B1",
  "public domain is created only after",
  "docker compose up -d --wait postgres",
  "docker compose down",
  "ASSET_DRIVER=filesystem",
  "127.0.0.1:55432",
  ".local/assets",
];

export const EXPECTED_VERSION_PINS = [
  "node@24.18.0",
  "pnpm@11.15.0",
  "typescript@6.0.3",
  "react@19.2.7",
  "react-dom@19.2.7",
  "react-router@8.2.0",
  "vite@8.1.5",
  "@vitejs/plugin-react@6.0.3",
  "hono@4.12.31",
  "@hono/node-server@2.0.10",
  "kysely@0.29.4",
  "pg@8.22.0",
  "zod@4.4.3",
  "pino@10.3.1",
  "@aws-sdk/client-s3@3.1090.0",
  "@aws-sdk/s3-request-presigner@3.1090.0",
  "vitest@4.1.10",
  "@testcontainers/postgresql@12.0.4",
  "@playwright/test@1.61.1",
  "eslint@10.7.0",
  "@eslint/js@10.0.1",
  "typescript-eslint@8.64.0",
  "globals@17.7.0",
  "tsx@4.23.1",
  "concurrently@10.0.3",
  "@types/node@24.13.3",
  "@types/react@19.2.17",
  "@types/react-dom@19.2.3",
  "@types/pg@8.20.0",
];

export const ACCEPTED_DEPENDENCIES = Object.freeze({
  "@aws-sdk/client-s3": "3.1090.0",
  "@aws-sdk/s3-request-presigner": "3.1090.0",
  "@hono/node-server": "2.0.10",
  hono: "4.12.31",
  kysely: "0.29.4",
  pg: "8.22.0",
  pino: "10.3.1",
  react: "19.2.7",
  "react-dom": "19.2.7",
  "react-router": "8.2.0",
  zod: "4.4.3",
});

export const ACCEPTED_DEV_DEPENDENCIES = Object.freeze({
  "@eslint/js": "10.0.1",
  "@playwright/test": "1.61.1",
  "@testcontainers/postgresql": "12.0.4",
  "@types/node": "24.13.3",
  "@types/pg": "8.20.0",
  "@types/react": "19.2.17",
  "@types/react-dom": "19.2.3",
  "@vitejs/plugin-react": "6.0.3",
  concurrently: "10.0.3",
  eslint: "10.7.0",
  globals: "17.7.0",
  tsx: "4.23.1",
  typescript: "6.0.3",
  "typescript-eslint": "8.64.0",
  vite: "8.1.5",
  vitest: "4.1.10",
});

export const ACCEPTED_SCRIPTS = Object.freeze({
  dev: "pnpm run dev:infra && pnpm run db:migrate:dev && concurrently -k -n reader,api \"vite\" \"tsx watch src/server/index.ts\"",
  "dev:infra": "docker compose up -d --wait postgres",
  "dev:infra:down": "docker compose down",
  build: "vite build && tsc -p tsconfig.server.json",
  start: "node dist/server/index.js",
  lint: "eslint . --max-warnings 0",
  typecheck: "tsc --noEmit",
  "test:content": "node --test scripts/*.test.mjs",
  "test:unit": "vitest run --project unit",
  "test:integration": "vitest run --project integration",
  "test:browser": "playwright test",
  test: "pnpm run test:content && pnpm run test:unit && pnpm run test:integration && pnpm run test:browser",
  "db:migrate:dev": "tsx src/server/db/migrate.ts",
  "db:migrate": "node dist/server/db/migrate.js",
  gates: "pnpm run lint && pnpm run typecheck && pnpm run test && pnpm run build",
});

export const RAILWAY_A2_SEQUENCE = Object.freeze([
  "finish and commit the runnable A2 application locally without pushing",
  "keep app autodeploy disabled before changing",
  "provision the pinned Postgres and private bucket",
  "enable daily database volume backups",
  "enable app autodeploy and push",
  "let that passing push alone create the first app source deployment",
  "create the public domain only after",
]);

const FORBIDDEN_DECISION_PATTERNS = [
  /\bRedis\b(?![^\n]*rejected)/i,
  /\bseparate worker\b(?![^\n]*rejected)/i,
  /\bTurborepo\b(?![^\n]*rejected)/i,
  /\bpnpm workspace\b(?![^\n]*rejected)/i,
  /\brailway up\b(?![^\n]*(?:never|forbidden|do not))/i,
];

const IGNORED_DIRECTORIES = new Set([".git", ".cache", ".claude", ".memory", "node_modules"]);

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

export function architectureDecisionTextIssues(text) {
  const issues = [];

  for (const fragment of REQUIRED_DECISION_FRAGMENTS) {
    if (!text.includes(fragment)) issues.push(`architecture decision is missing: ${fragment}`);
  }

  for (const pin of EXPECTED_VERSION_PINS) {
    if (!text.includes(`\`${pin}\``)) issues.push(`architecture decision is missing exact pin: ${pin}`);
  }

  for (const pattern of FORBIDDEN_DECISION_PATTERNS) {
    if (pattern.test(text)) issues.push(`architecture decision permits forbidden topology: ${pattern.source}`);
  }

  issues.push(...railwaySequenceIssues(text));

  return issues;
}

export function railwaySequenceIssues(text, markers = RAILWAY_A2_SEQUENCE, label = "ADR Railway A2 sequence") {
  const issues = [];
  let previous = -1;
  const normalizedText = text.replace(/\s+/g, " ");
  for (const marker of markers) {
    const normalizedMarker = marker.replace(/\s+/g, " ");
    const position = normalizedText.indexOf(normalizedMarker);
    if (position < 0) {
      issues.push(`${label} is missing: ${marker}`);
    } else if (position <= previous) {
      issues.push(`${label} is out of order at: ${marker}`);
    }
    previous = Math.max(previous, position);
  }
  return issues;
}

export function packageContractIssues(manifest) {
  const issues = [];
  const requiredScalars = {
    name: "shape-of-time",
    private: true,
    type: "module",
    packageManager: "pnpm@11.15.0",
  };
  for (const [field, expected] of Object.entries(requiredScalars)) {
    if (manifest[field] !== expected) issues.push(`package.json ${field} must equal ${String(expected)}`);
  }
  if (manifest.engines?.node !== "24.18.0") {
    issues.push("package.json engines.node must equal 24.18.0");
  }
  if (manifest.workspaces !== undefined) issues.push("package.json cannot define workspaces");

  for (const [name, expected] of Object.entries(ACCEPTED_SCRIPTS)) {
    if (manifest.scripts?.[name] !== expected) issues.push(`package.json script ${name} must equal ${expected}`);
  }
  for (const name of Object.keys(manifest.scripts ?? {})) {
    if (!(name in ACCEPTED_SCRIPTS)) issues.push(`package.json script ${name} is outside the accepted A1 stack`);
  }

  for (const [field, expected] of [
    ["dependencies", ACCEPTED_DEPENDENCIES],
    ["devDependencies", ACCEPTED_DEV_DEPENDENCIES],
  ]) {
    const actual = manifest[field] ?? {};
    for (const [name, version] of Object.entries(expected)) {
      if (actual[name] !== version) issues.push(`${field}.${name} must equal ${version}`);
    }
    for (const name of Object.keys(actual)) {
      if (!(name in expected)) issues.push(`${field}.${name} is outside the accepted A1 stack`);
    }
  }

  return issues;
}

export function pnpmWorkspaceConfigIssues(text) {
  const issues = [];
  for (const forbidden of [/^packages:/m, /^catalogs?:/m, /^linkWorkspacePackages:/m, /^sharedWorkspaceLockfile:/m]) {
    if (forbidden.test(text)) issues.push(`pnpm security config enables workspace behavior: ${forbidden.source}`);
  }
  for (const line of [
    "  cpu-features: false",
    "  esbuild: true",
    "  protobufjs: false",
    "  ssh2: false",
    "  - hono@4.12.31",
  ]) {
    if (!text.includes(line)) issues.push(`pnpm security config is missing: ${line.trim()}`);
  }
  const approvedBuilds = [...text.matchAll(/^\s{2}([^\s:]+): true$/gm)].map((match) => match[1]);
  if (approvedBuilds.length !== 1 || approvedBuilds[0] !== "esbuild") {
    issues.push("pnpm security config may approve only esbuild lifecycle scripts");
  }
  return issues;
}

export async function auditArchitectureDecision(rootUrl) {
  const root = fileURLToPath(rootUrl);
  const files = await listFiles(root);
  const issues = [];
  const decisionPath = "docs/adr/0001-one-process-stack.md";
  const decision = await readIfPresent(root, decisionPath);
  const nvmrc = await readIfPresent(root, ".nvmrc");

  if (decision === undefined) {
    issues.push(`missing accepted architecture decision: ${decisionPath}`);
  } else {
    issues.push(...architectureDecisionTextIssues(decision));
  }

  if (nvmrc?.trim() !== "24.18.0") {
    issues.push(".nvmrc must pin the accepted Node runtime 24.18.0");
  }

  const packageManifests = files.filter((file) => file === "package.json" || file.endsWith("/package.json"));
  if (packageManifests.some((file) => file !== "package.json")) {
    issues.push(`nested package manifest violates one-package boundary: ${packageManifests.join(", ")}`);
  }
  if (files.includes("turbo.json")) {
    issues.push("workspace graph violates one-package boundary");
  }
  const pnpmConfig = await readIfPresent(root, "pnpm-workspace.yaml");
  if (pnpmConfig !== undefined) issues.push(...pnpmWorkspaceConfigIssues(pnpmConfig));
  if (packageManifests.length > 0 && pnpmConfig === undefined) {
    issues.push("pnpm 11 package requires an explicit security-only pnpm-workspace.yaml");
  }
  const packageText = await readIfPresent(root, "package.json");
  if (packageText !== undefined) issues.push(...packageContractIssues(JSON.parse(packageText)));

  const authorityNames = ["SPEC.md", "EVALS.md", "PLAN.md", "HANDOFF.md", "README.md", "AGENTS.md"];
  const authorityEntries = await Promise.all(
    authorityNames.map(async (name) => [name, await readFile(path.join(root, name), "utf8")]),
  );
  const authority = Object.fromEntries(authorityEntries);
  if (
    !authority["PLAN.md"].includes("A2 — Scaffold the application and durable state spine **[DONE]**") ||
    !authority["PLAN.md"].includes("B0 — Author movement beats and continuation topology **[DONE]**") ||
    !authority["PLAN.md"].includes("B1 — Build the GPT Image 2 adapter and replay contract **[CURRENT]**")
  ) {
    issues.push("PLAN.md must record completed A2/B0 and identify B1 as the current item");
  }
  issues.push(
    ...railwaySequenceIssues(
      authority["PLAN.md"],
      [
        "Finish and commit the runnable application locally",
        "Keep app autodeploy disabled",
        "provisioning Postgres pinned",
        "Enable daily volume backups",
        "Then enable app autodeploy and push",
        "that passing push alone creates the first app source deployment",
        "generate the public domain",
      ],
      "PLAN.md Railway A2 sequence",
    ),
  );
  for (const name of ["PLAN.md", "HANDOFF.md", "AGENTS.md"]) {
    if (!authority[name].includes("8b20e07d-c256-44c9-85be-d1c7e50ac83d")) {
      issues.push(`${name} must name the owner-designated Railway target`);
    }
  }
  for (const [name, text] of authorityEntries) {
    if (text.includes("7ab4e3ad-05f8-4e64-8026-0f77800e814a")) {
      issues.push(`${name} cannot retain the retired Railway reference as an active target`);
    }
  }

  return issues;
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) {
  const issues = await auditArchitectureDecision(new URL("../", import.meta.url));
  if (issues.length > 0) {
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log("Shape of Time architecture decision audit passed.");
  }
}
