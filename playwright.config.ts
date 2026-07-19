import { defineConfig, devices } from "@playwright/test";

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
      DATABASE_URL: "postgresql://shape_of_time:shape_of_time@127.0.0.1:55432/shape_of_time",
      HOST: "127.0.0.1",
      NODE_ENV: "development",
      PORT: "4173",
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: "http://127.0.0.1:4173",
  },
});
