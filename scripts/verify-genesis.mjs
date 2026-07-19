#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const EXPECTED_WORLD_SHA256 =
  "e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c";
export const EXPECTED_UNDERTOW_SHA256 =
  "9dc8f105dac17a8a751a397026ff9b243d1de529633be1cc1431819e19c55dd3";

const REQUIRED_ROOT_FILES = [
  "README.md",
  "AGENTS.md",
  "CLAUDE.md",
  "SPEC.md",
  "EVALS.md",
  "PLAN.md",
  "HANDOFF.md",
  "LEGACY.md",
];

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".cache",
  ".claude",
  ".memory",
  "coverage",
  "dist",
  "node_modules",
  "test-results",
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function listFiles(root, directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, absolute)));
    } else if (entry.isFile()) {
      files.push(path.relative(root, absolute).split(path.sep).join("/"));
    }
  }

  return files;
}

export function forbiddenLayoutIssues(files) {
  const issues = [];

  if (files.some((file) => file === "apps" || file.startsWith("apps/"))) {
    issues.push("retired composition root is active: apps/");
  }
  if (files.some((file) => file === "packages" || file.startsWith("packages/"))) {
    issues.push("retired composition root is active: packages/");
  }
  if (files.some((file) => file === "turbo.json" || file === "pnpm-workspace.yaml")) {
    issues.push("retired workspace graph is active");
  }

  for (const file of files) {
    if ((file.endsWith("/AGENTS.md") || file.endsWith("/CLAUDE.md")) && !REQUIRED_ROOT_FILES.includes(file)) {
      issues.push(`nested agent constitution is forbidden: ${file}`);
    }
  }

  if (files.includes("STATUS.md")) {
    issues.push("duplicate live-state authority is forbidden: STATUS.md");
  }
  if (files.includes("INVARIANTS.md")) {
    issues.push("duplicate product authority is forbidden: INVARIANTS.md");
  }

  return issues;
}

export async function auditGenesis(rootUrl) {
  const root = fileURLToPath(rootUrl);
  const files = await listFiles(root);
  const issues = forbiddenLayoutIssues(files);

  for (const required of REQUIRED_ROOT_FILES) {
    if (!files.includes(required)) issues.push(`missing root authority: ${required}`);
  }

  const sourceChecks = [
    ["content/shape-of-time/world.md", EXPECTED_WORLD_SHA256],
    ["content/shape-of-time/undertow.md", EXPECTED_UNDERTOW_SHA256],
  ];
  for (const [relative, expected] of sourceChecks) {
    if (!files.includes(relative)) {
      issues.push(`missing canonical source: ${relative}`);
      continue;
    }
    const actual = sha256(await readFile(path.join(root, relative)));
    if (actual !== expected) {
      issues.push(`source digest mismatch: ${relative} expected ${expected} received ${actual}`);
    }
  }

  if (files.includes("CLAUDE.md")) {
    const claude = await readFile(path.join(root, "CLAUDE.md"), "utf8");
    if (!claude.includes("AGENTS.md") || claude.split("\n").length > 8) {
      issues.push("CLAUDE.md must remain a short pointer to AGENTS.md");
    }
  }

  return issues;
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) {
  const workspace = new URL("../", import.meta.url);
  const issues = await auditGenesis(workspace);
  if (issues.length > 0) {
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log("Shape of Time genesis audit passed.");
  }
}
