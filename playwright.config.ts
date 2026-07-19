import { defineConfig, devices } from "@playwright/test";

const postgresPort = process.env.SHAPE_OF_TIME_POSTGRES_PORT ?? "55432";

export default defineConfig({
  expect: { timeout: 5_000 },
  fullyParallel: false,
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  reporter: "line",
  testDir: "tests/browser",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm run build && pnpm run dev:infra && pnpm run db:migrate && pnpm run start",
    env: {
      ...process.env,
      ASSET_DRIVER: "filesystem",
      DATABASE_URL: `postgresql://shape_of_time:shape_of_time@127.0.0.1:${postgresPort}/shape_of_time`,
      HOST: "127.0.0.1",
      NODE_ENV: "development",
      PORT: "4173",
      SHAPE_OF_TIME_POSTGRES_PORT: postgresPort,
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:4173",
  },
});
