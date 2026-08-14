import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  clinicalTrialsPolicy,
  evaluateSourceRequest,
  sourcePolicySchema,
  type SourcePolicy,
  type SourcePolicyStatus,
} from "../../src/lib/sources/policies";

const metadataUrl = new URL(
  "../../data/fixtures/clinicaltrials.gov/NCT03866174.metadata.json",
  import.meta.url,
);

async function approvedFixtureRequest() {
  const metadata = JSON.parse(await readFile(metadataUrl, "utf8")) as {
    sourceId: string;
    sourceUrl: string;
  };

  return {
    sourceId: metadata.sourceId,
    policyVersion: clinicalTrialsPolicy.policyVersion,
    method: "GET",
    url: metadata.sourceUrl,
  } as const;
}

function registryWithStatus(status: SourcePolicyStatus): readonly SourcePolicy[] {
  return [sourcePolicySchema.parse({ ...clinicalTrialsPolicy, status })];
}

describe("source policy gate", () => {
  it("allows the bounded official fixture request", async () => {
    const request = await approvedFixtureRequest();

    expect(evaluateSourceRequest(request)).toMatchObject({
      allowed: true,
      policyId: "SRC-CTG",
      policyVersion: "1",
    });
    expect(Object.isFrozen(clinicalTrialsPolicy)).toBe(true);
    expect(Object.isFrozen(clinicalTrialsPolicy.allowedMethods)).toBe(true);
    expect(Object.isFrozen(clinicalTrialsPolicy.allowedPaths)).toBe(true);
  });

  it("denies unknown, mismatched, and non-approved policies", async () => {
    const request = await approvedFixtureRequest();

    expect(
      evaluateSourceRequest({ ...request, sourceId: "SRC-UNKNOWN" }),
    ).toEqual({ allowed: false, code: "UNKNOWN_SOURCE" });
    expect(
      evaluateSourceRequest({ ...request, policyVersion: "999" }),
    ).toEqual({ allowed: false, code: "POLICY_VERSION_MISMATCH" });

    for (const status of [
      "PROPOSED",
      "BLOCKED",
      "DISABLED",
      "EXPIRED",
    ] as const) {
      expect(evaluateSourceRequest(request, registryWithStatus(status))).toEqual(
        { allowed: false, code: "POLICY_NOT_APPROVED" },
      );
    }
  });

  it("denies an approved policy at and after its expiry", async () => {
    const request = await approvedFixtureRequest();
    const expiringPolicy = sourcePolicySchema.parse({
      ...clinicalTrialsPolicy,
      expiresAt: "2026-08-15T00:00:00Z",
    });
    const registry = [expiringPolicy];

    expect(
      evaluateSourceRequest(
        request,
        registry,
        new Date("2026-08-13T23:59:59Z"),
      ),
    ).toEqual({ allowed: false, code: "POLICY_NOT_YET_APPROVED" });
    expect(
      evaluateSourceRequest(
        request,
        registry,
        new Date("2026-08-14T23:59:59Z"),
      ),
    ).toMatchObject({ allowed: true });
    expect(
      evaluateSourceRequest(
        request,
        registry,
        new Date("2026-08-15T00:00:00Z"),
      ),
    ).toEqual({ allowed: false, code: "POLICY_EXPIRED" });
    expect(
      evaluateSourceRequest(
        request,
        registry,
        new Date("2026-08-15T00:00:01Z"),
      ),
    ).toEqual({ allowed: false, code: "POLICY_EXPIRED" });
    expect(
      evaluateSourceRequest(request, registry, new Date(Number.NaN)),
    ).toEqual({ allowed: false, code: "INVALID_EVALUATION_TIME" });
  });

  it("rejects policy approval and expiry timestamps out of order", () => {
    expect(
      sourcePolicySchema.safeParse({
        ...clinicalTrialsPolicy,
        reviewedAt: "2026-08-15T00:00:00Z",
        approvedAt: "2026-08-14T00:00:00Z",
      }).success,
    ).toBe(false);
    expect(
      sourcePolicySchema.safeParse({
        ...clinicalTrialsPolicy,
        expiresAt: clinicalTrialsPolicy.approvedAt,
      }).success,
    ).toBe(false);
  });

  it.each([
    ["not a URL", "INVALID_URL"],
    ["http://clinicaltrials.gov/api/v2/studies", "SCHEME_NOT_ALLOWED"],
    [
      "https://clinicaltrials.gov.evil.test/api/v2/studies",
      "HOST_NOT_ALLOWED",
    ],
    ["https://api.clinicaltrials.gov/api/v2/studies", "HOST_NOT_ALLOWED"],
    ["https://clinicaltrials.gov./api/v2/studies", "HOST_NOT_ALLOWED"],
    [
      "https://user:credential-sentinel@clinicaltrials.gov/api/v2/studies",
      "CREDENTIALS_NOT_ALLOWED",
    ],
    ["https://clinicaltrials.gov:444/api/v2/studies", "PORT_NOT_ALLOWED"],
    ["https://clinicaltrials.gov/api/v2/studies/", "PATH_NOT_ALLOWED"],
    [
      "https://clinicaltrials.gov/api/v2/studies/NCT03866174",
      "PATH_NOT_ALLOWED",
    ],
    ["https://clinicaltrials.gov/api/v2/studiesevil", "PATH_NOT_ALLOWED"],
    ["https://clinicaltrials.gov/api/v1/studies", "PATH_NOT_ALLOWED"],
    [
      "https://clinicaltrials.gov/api/v2/studies#fragment",
      "FRAGMENT_NOT_ALLOWED",
    ],
  ])("denies URL outside the exact boundary: %s", async (url, code) => {
    const request = await approvedFixtureRequest();

    expect(evaluateSourceRequest({ ...request, url })).toEqual({
      allowed: false,
      code,
    });
  });

  it.each(["POST", "get", " GET"])(
    "does not normalize an unapproved method: %s",
    async (method) => {
      const request = await approvedFixtureRequest();

      expect(evaluateSourceRequest({ ...request, method })).toEqual({
        allowed: false,
        code: "METHOD_NOT_ALLOWED",
      });
    },
  );

  it("revalidates redirects and allows only the same policy boundary", async () => {
    const request = await approvedFixtureRequest();

    expect(
      evaluateSourceRequest({
        ...request,
        redirectLocations: ["?query.id=NCT03866174&pageSize=1"],
      }),
    ).toMatchObject({ allowed: true });

    for (const location of [
      "https://evil.test/api/v2/studies",
      "//evil.test/api/v2/studies",
      "/api/v2/studies/NCT03866174",
    ]) {
      expect(
        evaluateSourceRequest({ ...request, redirectLocations: [location] }),
      ).toEqual({ allowed: false, code: "REDIRECT_NOT_ALLOWED" });
    }
  });

  it("never reflects credential-bearing input in a denial", async () => {
    const request = await approvedFixtureRequest();
    const decision = evaluateSourceRequest({
      ...request,
      url: "https://user:credential-sentinel@clinicaltrials.gov/api/v2/studies",
    });

    expect(JSON.stringify(decision)).not.toContain("credential-sentinel");
  });
});
