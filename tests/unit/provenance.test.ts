import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  claimDraftSchema,
  evidenceClassSchema,
  sha256Bytes,
  sha256HexSchema,
  sourceVersionProvenanceSchema,
} from "../../src/lib/evidence/provenance";

const fixtureUrl = new URL(
  "../../data/fixtures/clinicaltrials.gov/NCT03866174.json",
  import.meta.url,
);
const metadataUrl = new URL(
  "../../data/fixtures/clinicaltrials.gov/NCT03866174.metadata.json",
  import.meta.url,
);
const sourceId = "6a0e4d31-4113-4192-b8d4-351489acba60";
const inputClaimId = "d8b9b440-d195-49d5-bd41-b616705ba52a";
const secondInputClaimId = "1d603f04-256f-489f-9bf0-65cda179c344";

describe("source-version provenance", () => {
  it("accepts only lowercase SHA-256 hex and detects one-byte tampering", async () => {
    const [fixtureBytes, metadataText] = await Promise.all([
      readFile(fixtureUrl),
      readFile(metadataUrl, "utf8"),
    ]);
    const metadata = JSON.parse(metadataText) as { contentSha256: string };

    expect(sha256HexSchema.parse(metadata.contentSha256)).toBe(
      metadata.contentSha256,
    );
    expect(sha256Bytes(fixtureBytes)).toBe(metadata.contentSha256);
    expect(sha256Bytes(Buffer.concat([fixtureBytes, Buffer.from([0])]))).not.toBe(
      metadata.contentSha256,
    );

    for (const invalid of [
      "A".repeat(64),
      "g".repeat(64),
      "a".repeat(63),
      "a".repeat(65),
    ]) {
      expect(sha256HexSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it("orders processing after retrieval by instant, including offsets", () => {
    const base = {
      retrievedAt: "2026-08-14T15:00:00+02:00",
      processedAt: "2026-08-14T13:00:00Z",
      contentSha256: "a".repeat(64),
    };

    expect(sourceVersionProvenanceSchema.safeParse(base).success).toBe(true);
    expect(
      sourceVersionProvenanceSchema.safeParse({
        ...base,
        processedAt: "2026-08-14T12:59:59Z",
      }).success,
    ).toBe(false);
    expect(
      sourceVersionProvenanceSchema.safeParse({
        ...base,
        retrievedAt: "2026-08-14T13:00:00",
      }).success,
    ).toBe(false);
    expect(
      sourceVersionProvenanceSchema.safeParse({
        ...base,
        processedAt: "not-a-date",
      }).success,
    ).toBe(false);
  });

  it("keeps the provider-reported registry date independent", () => {
    const result = sourceVersionProvenanceSchema.parse({
      retrievedAt: "2026-08-14T13:56:45Z",
      processedAt: "2026-08-14T14:27:25Z",
      registryLastUpdatePostedDate: "2030-01-01",
      contentSha256: "a".repeat(64),
    });

    expect(result.registryLastUpdatePostedDate).toBe("2030-01-01");
  });
});

describe("claim provenance invariants", () => {
  const baseClaim = {
    valueJson: "observed value",
    reviewStatus: "PENDING" as const,
  };

  it("rejects unknown evidence classes", () => {
    expect(evidenceClassSchema.safeParse("GENERATED_FACT").success).toBe(false);
  });

  it.each(["SOURCE_FACT", "STRUCTURED_EXTRACTION"] as const)(
    "%s requires a source or stable external ID",
    (evidenceClass) => {
      expect(
        claimDraftSchema.safeParse({ ...baseClaim, evidenceClass }).success,
      ).toBe(false);
      expect(
        claimDraftSchema.safeParse({
          ...baseClaim,
          evidenceClass,
          externalId: "NCT03866174",
        }).success,
      ).toBe(true);
      expect(
        claimDraftSchema.safeParse({
          ...baseClaim,
          evidenceClass,
          sourceId,
        }).success,
      ).toBe(true);
      expect(
        claimDraftSchema.safeParse({
          ...baseClaim,
          evidenceClass,
          externalId: "   ",
        }).success,
      ).toBe(false);
    },
  );

  it("requires unique inputs and a formula version for calculations", () => {
    expect(
      claimDraftSchema.safeParse({
        ...baseClaim,
        evidenceClass: "DERIVED_CALCULATION",
      }).success,
    ).toBe(false);
    expect(
      claimDraftSchema.safeParse({
        ...baseClaim,
        evidenceClass: "DERIVED_CALCULATION",
        inputClaimIds: [inputClaimId, inputClaimId],
        formulaVersion: "v1",
      }).success,
    ).toBe(false);
    expect(
      claimDraftSchema.safeParse({
        ...baseClaim,
        evidenceClass: "DERIVED_CALCULATION",
        inputClaimIds: [inputClaimId, secondInputClaimId],
        formulaVersion: "v1",
      }).success,
    ).toBe(true);
  });

  it("requires complete model provenance without promoting it to fact", () => {
    const modelClaim = {
      ...baseClaim,
      evidenceClass: "MODEL_INFERENCE" as const,
      modelVersion: "model-v1",
      promptVersion: "prompt-v1",
      schemaVersion: "schema-v1",
      sourceLocator: "protocolSection.statusModule",
      confidence: 0.75,
    };

    expect(claimDraftSchema.safeParse(modelClaim).success).toBe(true);

    for (const missing of [
      "modelVersion",
      "promptVersion",
      "schemaVersion",
      "sourceLocator",
      "confidence",
    ] as const) {
      const incomplete: Record<string, unknown> = { ...modelClaim };
      delete incomplete[missing];
      expect(claimDraftSchema.safeParse(incomplete).success).toBe(false);
    }

    for (const modelOnlyField of [
      "modelVersion",
      "promptVersion",
      "schemaVersion",
    ] as const) {
      expect(
        claimDraftSchema.safeParse({
          ...baseClaim,
          evidenceClass: "SOURCE_FACT",
          externalId: "NCT03866174",
          [modelOnlyField]: "model-origin-sentinel",
        }).success,
      ).toBe(false);
    }
  });

  it("preserves unknown, unverified, and human-inference states", () => {
    const unknown = claimDraftSchema.parse({
      evidenceClass: "UNKNOWN",
      valueJson: null,
      reviewStatus: "PENDING",
    });
    const unverified = claimDraftSchema.parse({
      ...baseClaim,
      evidenceClass: "UNVERIFIED",
    });
    const humanInference = claimDraftSchema.parse({
      ...baseClaim,
      evidenceClass: "HUMAN_INFERENCE",
    });

    expect(unknown.evidenceClass).toBe("UNKNOWN");
    expect(unverified.evidenceClass).toBe("UNVERIFIED");
    expect(humanInference.evidenceClass).toBe("HUMAN_INFERENCE");
    expect(
      claimDraftSchema.safeParse({
        evidenceClass: "UNKNOWN",
        valueJson: "invented",
        reviewStatus: "PENDING",
      }).success,
    ).toBe(false);
  });
});
