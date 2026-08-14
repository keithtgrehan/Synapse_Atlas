import { describe, expect, it } from "vitest";

import { parseServerEnvironment } from "./env";

describe("parseServerEnvironment", () => {
  it("accepts a PostgreSQL connection URL", () => {
    expect(
      parseServerEnvironment({
        DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/synapse_atlas",
      }),
    ).toEqual({
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/synapse_atlas",
    });
  });

  it("rejects a missing database URL without exposing environment values", () => {
    expect(() => parseServerEnvironment({})).toThrowError(
      "Invalid server environment: DATABASE_URL",
    );
  });

  it("rejects non-PostgreSQL URLs", () => {
    expect(() =>
      parseServerEnvironment({ DATABASE_URL: "https://example.com/database" }),
    ).toThrowError("Invalid server environment: DATABASE_URL");
  });
});
