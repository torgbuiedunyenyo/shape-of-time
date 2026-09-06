import { defineConfig } from "vitest/config";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
try {
  Object.assign(process.env, parseEnv(readFileSync(".env", "utf8")));
} catch {
  /* CI supplies Railway connection variables. */
}
process.env.DATABASE_SCHEMA = "world_checks";
process.env.GENERATION_ENABLED = "false";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 60000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
