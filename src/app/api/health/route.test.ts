import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports readiness when required configuration is present", async () => {
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://postgres:postgres@localhost:5432/synapse_atlas",
    );

    const response = GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      service: "synapse-atlas",
      checks: { databaseConfiguration: "present" },
    });
  });

  it("fails closed when database configuration is missing", async () => {
    vi.stubEnv("DATABASE_URL", "");

    const response = GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      status: "degraded",
      service: "synapse-atlas",
      checks: { databaseConfiguration: "missing" },
    });
  });
});
