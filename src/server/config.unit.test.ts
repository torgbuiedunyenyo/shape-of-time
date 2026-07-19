import { describe, expect, it } from "vitest";

import { parseConfig } from "./config.js";

describe("runtime configuration", () => {
  it("provides explicit safe local defaults", () => {
    const config = parseConfig({
      DATABASE_URL: "postgresql://shape_of_time:shape_of_time@127.0.0.1:55432/shape_of_time",
      NODE_ENV: "development",
    });

    expect(config).toMatchObject({
      assetDriver: "filesystem",
      assetFilesystemRoot: ".local/assets",
      host: "0.0.0.0",
      port: 3000,
    });
  });

  it("refuses a production filesystem fallback", () => {
    expect(() =>
      parseConfig({
        ASSET_DRIVER: "filesystem",
        DATABASE_URL: "postgresql://postgres.internal/railway",
        NODE_ENV: "production",
      }),
    ).toThrow(/production requires ASSET_DRIVER=s3/);
  });

  it("requires every private-bucket input in production", () => {
    expect(() =>
      parseConfig({
        ASSET_DRIVER: "s3",
        DATABASE_URL: "postgresql://postgres.internal/railway",
        NODE_ENV: "production",
        S3_BUCKET: "shape-of-time",
      }),
    ).toThrow(/S3_ENDPOINT/);
  });

  it("forces production storage semantics when Railway metadata is present", () => {
    expect(() =>
      parseConfig({
        ASSET_DRIVER: "filesystem",
        DATABASE_URL: "postgresql://postgres.internal/railway",
        NODE_ENV: "development",
        RAILWAY_PROJECT_ID: "8b20e07d-c256-44c9-85be-d1c7e50ac83d",
      }),
    ).toThrow(/production requires ASSET_DRIVER=s3/);
  });

  it("requires an attributable Git commit and HTTPS bucket endpoint in production", () => {
    const production = {
      ASSET_DRIVER: "s3",
      DATABASE_URL: "postgresql://postgres.internal/railway",
      NODE_ENV: "production",
      S3_ACCESS_KEY_ID: "access",
      S3_BUCKET: "shape-of-time",
      S3_ENDPOINT: "http://storage.railway.app",
      S3_REGION: "sjc",
      S3_SECRET_ACCESS_KEY: "secret",
    };
    expect(() => parseConfig(production)).toThrow(/RAILWAY_GIT_COMMIT_SHA/);
    expect(() =>
      parseConfig({ ...production, RAILWAY_GIT_COMMIT_SHA: "a".repeat(40) }),
    ).toThrow(/S3_ENDPOINT must use HTTPS/);
  });
});
