import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  clinicalTrialsApiPageSchema,
  getTrialFreshness,
  normalizeClinicalTrial,
  partialDateValueSchema,
  trialProvenanceSchema,
} from "../../src/lib/domain/trials";
import { sha256Bytes } from "../../src/lib/evidence/provenance";

const fixtureUrl = new URL(
  "../../data/fixtures/clinicaltrials.gov/NCT03866174.json",
  import.meta.url,
);
const metadataUrl = new URL(
  "../../data/fixtures/clinicaltrials.gov/NCT03866174.metadata.json",
  import.meta.url,
);

describe("ClinicalTrials.gov trial normalization", () => {
  it("preserves valid partial dates without inventing precision", () => {
    for (const value of ["2026", "2026-08", "2026-08-14"]) {
      expect(partialDateValueSchema.parse(value)).toBe(value);
    }

    for (const value of ["2026-00", "2026-13", "2025-02-29", "2026-08-00"] ) {
      expect(partialDateValueSchema.safeParse(value).success).toBe(false);
    }
  });

  it("normalizes the checked-in fixture with exact provenance and availability", async () => {
    const [fixtureBytes, metadataText] = await Promise.all([
      readFile(fixtureUrl),
      readFile(metadataUrl, "utf8"),
    ]);
    const fixture = clinicalTrialsApiPageSchema.parse(
      JSON.parse(fixtureBytes.toString("utf8")),
    );
    const metadata = JSON.parse(metadataText) as {
      sourceUrl: string;
      retrievedAt: string;
      processedAt: string;
      contentSha256: string;
    };
    const requestedFields = new Set(
      new URL(metadata.sourceUrl).searchParams.get("fields")?.split(",") ?? [],
    );
    const study = fixture.studies[0];

    expect(study).toBeDefined();

    const trial = normalizeClinicalTrial(study!, {
      apiRequestUrl: metadata.sourceUrl,
      retrievedAt: metadata.retrievedAt,
      processedAt: metadata.processedAt,
      contentSha256: sha256Bytes(fixtureBytes),
      requestedFields,
      studyIndex: 0,
    });

    expect(trial.nctId).toBe("NCT03866174");
    expect(trial.overallStatus).toEqual({
      state: "reported",
      value: "COMPLETED",
    });
    expect(trial.startDate).toEqual({
      state: "reported",
      value: { value: "2020-01-23", precision: "DAY", type: null },
    });
    expect(trial.phases).toEqual({ state: "not_requested", value: null });
    expect(trial.enrollment).toEqual({
      state: "not_requested",
      value: null,
    });
    expect(trial.provenance.registryLastUpdatePostedDate).toBe("2026-04-22");
    expect(trial.provenance.retrievedAt).not.toBe(
      trial.provenance.registryLastUpdatePostedDate,
    );
    expect(trial.provenance.contentSha256).toBe(metadata.contentSha256);
    expect(trial.provenance.sourceUrl).toBe(
      "https://clinicaltrials.gov/study/NCT03866174",
    );
    expect(trial.provenance.fieldLocators.overallStatus).toBe(
      "/studies/0/protocolSection/statusModule/overallStatus",
    );
    expect(trial.provenance.fieldLocators.phases).toBeUndefined();
    expect(trial.provenance.fieldLocators.enrollment).toBeUndefined();
    expect(trialProvenanceSchema.parse(trial.provenance)).toEqual(
      trial.provenance,
    );
  });

  it("distinguishes fields that are unreported from fields not requested", () => {
    const page = clinicalTrialsApiPageSchema.parse({
      studies: [
        {
          protocolSection: {
            identificationModule: {
              nctId: "NCT00000001",
              briefTitle: "Sparse registered study",
            },
          },
        },
      ],
    });
    const base = {
      apiRequestUrl:
        "https://clinicaltrials.gov/api/v2/studies?query.id=NCT00000001",
      retrievedAt: "2026-08-14T20:00:00Z",
      processedAt: "2026-08-14T20:00:00Z",
      contentSha256: "a".repeat(64),
      studyIndex: 0,
    };

    expect(
      normalizeClinicalTrial(page.studies[0]!, {
        ...base,
        requestedFields: new Set(["OverallStatus"]),
      }).overallStatus,
    ).toEqual({ state: "not_reported", value: null });
    expect(
      normalizeClinicalTrial(page.studies[0]!, {
        ...base,
        requestedFields: new Set(),
      }).overallStatus,
    ).toEqual({ state: "not_requested", value: null });
  });

  it("calculates retrieval freshness at deterministic boundaries", () => {
    const retrievedAt = "2026-08-14T00:00:00Z";

    expect(
      getTrialFreshness(retrievedAt, new Date("2026-08-15T23:59:59Z")),
    ).toMatchObject({ state: "fresh", thresholdHours: 48 });
    expect(
      getTrialFreshness(retrievedAt, new Date("2026-08-16T00:00:00Z")),
    ).toMatchObject({ state: "fresh", ageHours: 48 });
    expect(
      getTrialFreshness(retrievedAt, new Date("2026-08-16T00:00:01Z")),
    ).toMatchObject({ state: "stale" });
    expect(
      getTrialFreshness(retrievedAt, new Date("2026-08-13T23:59:59Z")),
    ).toEqual({ state: "clock_error", ageHours: null, thresholdHours: 48 });
  });
});
