import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          include: ["src/**/*.unit.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          fileParallelism: false,
          hookTimeout: 120_000,
          include: ["src/**/*.integration.test.ts"],
          testTimeout: 120_000,
        },
      },
    ],
  },
});
