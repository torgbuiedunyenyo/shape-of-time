import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ACCEPTED_DEPENDENCIES,
  ACCEPTED_DEV_DEPENDENCIES,
  ACCEPTED_SCRIPTS,
  EXPECTED_VERSION_PINS,
  RAILWAY_A2_SEQUENCE,
  REQUIRED_DECISION_FRAGMENTS,
  architectureDecisionTextIssues,
  auditArchitectureDecision,
  packageContractIssues,
  pnpmWorkspaceConfigIssues,
  railwaySequenceIssues,
} from "./verify-architecture-decision.mjs";

test("A1 pins one supported application stack and its Railway execution contract", async () => {
  assert.deepEqual(await auditArchitectureDecision(new URL("../", import.meta.url)), []);
});

test("the architecture contract rejects topology creep", () => {
  const baseline = [
    "Status: Accepted",
    "one TypeScript package",
    "one deployable Node process",
    "React HTTP Postgres migration Railway object storage",
    "8b20e07d-c256-44c9-85be-d1c7e50ac83d shape-of-time Git-triggered",
    "Fresh-clone command matrix",
    "Rejected alternatives",
    ...REQUIRED_DECISION_FRAGMENTS,
    ...RAILWAY_A2_SEQUENCE,
    ...EXPECTED_VERSION_PINS.map((pin) => `\`${pin}\``),
  ].join("\n");

  assert.deepEqual(architectureDecisionTextIssues(baseline), []);

  for (const mutation of ["Redis", "separate worker", "Turborepo", "pnpm workspace", "railway up"]) {
    assert.ok(
      architectureDecisionTextIssues(`${baseline}\n${mutation}`).some((issue) =>
        issue.includes("forbidden topology"),
      ),
      `architecture mutation escaped: ${mutation}`,
    );
  }
});

test("the eventual package manifest must implement the accepted stack exactly", () => {
  const baseline = {
    name: "shape-of-time",
    private: true,
    type: "module",
    packageManager: "pnpm@11.15.0",
    engines: { node: "24.18.0" },
    scripts: { ...ACCEPTED_SCRIPTS },
    dependencies: { ...ACCEPTED_DEPENDENCIES },
    devDependencies: { ...ACCEPTED_DEV_DEPENDENCIES },
  };

  assert.deepEqual(packageContractIssues(baseline), []);

  const missingIntegrationScript = { ...baseline.scripts };
  delete missingIntegrationScript["test:integration"];
  const missingDevInfraScript = { ...baseline.scripts };
  delete missingDevInfraScript["dev:infra"];
  const mutations = [
    { ...baseline, packageManager: "pnpm@latest" },
    { ...baseline, workspaces: ["packages/*"] },
    { ...baseline, scripts: { ...baseline.scripts, start: "vite preview" } },
    { ...baseline, scripts: missingIntegrationScript },
    { ...baseline, scripts: missingDevInfraScript },
    { ...baseline, dependencies: { ...baseline.dependencies, react: "^19.2.7" } },
    { ...baseline, dependencies: { ...baseline.dependencies, ioredis: "5.0.0" } },
  ];
  for (const mutation of mutations) {
    assert.notDeepEqual(packageContractIssues(mutation), [], "package mutation escaped the contract");
  }
});

test("Railway setup order cannot deploy the docs-only source or expose a premature domain", () => {
  const safe = RAILWAY_A2_SEQUENCE.join("\n");
  assert.deepEqual(railwaySequenceIssues(safe), []);

  const unsafe = [
    RAILWAY_A2_SEQUENCE[6],
    ...RAILWAY_A2_SEQUENCE.slice(0, 6),
  ].join("\n");
  assert.notDeepEqual(railwaySequenceIssues(unsafe), []);
});

test("pnpm 11 security policy cannot become a workspace graph or run unapproved builds", () => {
  const safe = `allowBuilds:\n  cpu-features: false\n  esbuild: true\n  protobufjs: false\n  ssh2: false\nminimumReleaseAgeExclude:\n  - hono@4.12.31\n`;
  assert.deepEqual(pnpmWorkspaceConfigIssues(safe), []);

  for (const mutation of [
    `${safe}packages:\n  - packages/*\n`,
    safe.replace("esbuild: true", "esbuild: false"),
    safe.replace("ssh2: false", "ssh2: true"),
  ]) {
    assert.notDeepEqual(pnpmWorkspaceConfigIssues(mutation), [], "unsafe pnpm policy escaped");
  }
});
