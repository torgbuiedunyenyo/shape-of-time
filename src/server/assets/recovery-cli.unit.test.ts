import { describe, expect, it } from "vitest";

import { readArguments, readS3Options } from "./recovery-cli.js";

describe("recovery smoke command safety", () => {
  it("accepts only a tool-owned smoke archive ID and exposes no caller-controlled cleanup root", () => {
    expect(readArguments(["smoke", "--archive-id", "synthetic-test"])).toEqual({
      archiveId: "synthetic-test",
      command: "smoke",
    });
    expect(() =>
      readArguments(["smoke", "--archive-id", "synthetic-test", "--root", "/Users/ratpartyserver"]),
    ).toThrow(/requires only --archive-id/);
  });

  it("refuses to send bucket credentials to a non-HTTPS endpoint", () => {
    const environment = {
      S3_ACCESS_KEY_ID: "test-access",
      S3_BUCKET: "test-bucket",
      S3_ENDPOINT: "http://bucket.invalid",
      S3_REGION: "test-region",
      S3_SECRET_ACCESS_KEY: "test-secret",
    };

    expect(() => readS3Options(environment)).toThrow(/HTTPS/i);
    expect(readS3Options({ ...environment, S3_ENDPOINT: "https://bucket.invalid" })).toMatchObject({
      endpoint: "https://bucket.invalid",
    });
  });
});
