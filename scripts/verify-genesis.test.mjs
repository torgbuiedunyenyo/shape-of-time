import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EXPECTED_UNDERTOW_SHA256,
  EXPECTED_WORLD_SHA256,
  auditGenesis,
  forbiddenLayoutIssues,
} from "./verify-genesis.mjs";

test("the repository genesis has one authority chain and byte-exact canon", async () => {
  assert.deepEqual(await auditGenesis(new URL("../", import.meta.url)), []);
});

test("the layout audit rejects retired composition roots and nested constitutions", () => {
  assert.deepEqual(
    forbiddenLayoutIssues([
      "apps/reader/src/index.ts",
      "packages/ledger/package.json",
      "src/feature/CLAUDE.md",
      "STATUS.md",
    ]),
    [
      "retired composition root is active: apps/",
      "retired composition root is active: packages/",
      "nested agent constitution is forbidden: src/feature/CLAUDE.md",
      "duplicate live-state authority is forbidden: STATUS.md",
    ],
  );
});

test("the source digests are fixed historical identities", () => {
  assert.equal(
    EXPECTED_WORLD_SHA256,
    "e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c",
  );
  assert.equal(
    EXPECTED_UNDERTOW_SHA256,
    "9dc8f105dac17a8a751a397026ff9b243d1de529633be1cc1431819e19c55dd3",
  );
});
