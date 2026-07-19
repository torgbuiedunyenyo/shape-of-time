import { describe, expect, it } from "vitest";

import { assertSupportedPostgresVersion } from "./health.js";

describe("database health contract", () => {
  it("accepts only the pinned PostgreSQL 18.4 server line", () => {
    expect(() => assertSupportedPostgresVersion("18.4 (Debian 18.4-1.pgdg13+1)")).not.toThrow();
    for (const unsupported of ["18.5", "18.3", "17.9", "19.0", ""]) {
      expect(() => assertSupportedPostgresVersion(unsupported)).toThrow(/PostgreSQL 18\.4/);
    }
  });
});
