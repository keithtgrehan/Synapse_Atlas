import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  programmeFixturePageSchema,
  readAndValidateProgrammeFixture,
  validateProgrammeFixture,
} from "../../src/lib/fixtures/programs";
import { programmeMappingDataset } from "../../src/lib/programs/dataset";

async function fixtureInputs(index = 0) {
  const snapshot = programmeMappingDataset.sourceSnapshots[index]!;
  const [fixtureBytes, metadataText] = await Promise.all([
    readFile(path.join(process.cwd(), snapshot.fixturePath)),
    readFile(path.join(process.cwd(), snapshot.metadataPath), "utf8"),
  ]);

  return {
    snapshot,
    fixtureBytes,
    metadata: JSON.parse(metadataText) as Record<string, unknown>,
  };
}

describe("programme ClinicalTrials.gov snapshots", () => {
  it("cross-validates every exact fixture, metadata envelope, locator, and raw value", async () => {
    for (const snapshot of programmeMappingDataset.sourceSnapshots) {
      const validated = await readAndValidateProgrammeFixture(snapshot);

      expect(validated.fixture.studies[0]?.protocolSection.identificationModule.nctId)
        .toBe(snapshot.externalId);
      expect(validated.metadata.sourceUrl).toBe(snapshot.apiRequestUrl);
      expect(validated.metadata.registryLastUpdatePostedDate).toBe(
        snapshot.registryLastUpdatePostedDate,
      );
      expect(validated.metadata.retrievedAt).not.toBe(
        validated.metadata.registryLastUpdatePostedDate,
      );
      expect(validated.metadata.processedAt).not.toBe(
        validated.metadata.registryLastUpdatePostedDate,
      );
    }
  });

  it("rejects one-byte tampering against the exact retained response hash", async () => {
    const { snapshot, fixtureBytes, metadata } = await fixtureInputs(1);
    const tampered = Buffer.concat([fixtureBytes, Buffer.from([0])]);

    expect(() => validateProgrammeFixture(snapshot, tampered, metadata)).toThrow(
      "PROGRAMME_FIXTURE_HASH_MISMATCH",
    );
  });

  it("rejects unknown raw fields and malformed nested fixture fields", async () => {
    const { fixtureBytes } = await fixtureInputs();
    const parsed = JSON.parse(fixtureBytes.toString("utf8")) as Record<
      string,
      unknown
    >;

    expect(
      programmeFixturePageSchema.safeParse({ ...parsed, unexpected: true }).success,
    ).toBe(false);
    expect(
      programmeFixturePageSchema.safeParse({
        totalCount: 1,
        studies: [{ protocolSection: { identificationModule: {} } }],
      }).success,
    ).toBe(false);
  });

  it("rejects mismatched NCT, sponsor, intervention, locator, and hash evidence", async () => {
    const { snapshot, fixtureBytes, metadata } = await fixtureInputs(1);
    const wrongNct = {
      ...snapshot,
      externalId: "NCT00000000",
    };
    const wrongSponsor = {
      ...snapshot,
      observedRegistryFacts: {
        ...snapshot.observedRegistryFacts,
        reportedSponsorOrganisation: "Wrong sponsor",
      },
    };
    const wrongIntervention = {
      ...snapshot,
      observedRegistryFacts: {
        ...snapshot.observedRegistryFacts,
        reportedInterventions: ["Wrong intervention"],
      },
    };
    const wrongLocator = {
      ...snapshot,
      fieldLocators: {
        ...snapshot.fieldLocators,
        briefTitle: snapshot.fieldLocators.nctId,
      },
    };
    const wrongHash = { ...snapshot, responseSha256: "a".repeat(64) };

    for (const candidate of [
      wrongNct,
      wrongSponsor,
      wrongIntervention,
      wrongLocator,
      wrongHash,
    ]) {
      expect(() => validateProgrammeFixture(candidate, fixtureBytes, metadata))
        .toThrow();
    }
  });

  it("rejects mismatched metadata and source evidence", async () => {
    const { snapshot, fixtureBytes, metadata } = await fixtureInputs(2);

    expect(() =>
      validateProgrammeFixture(snapshot, fixtureBytes, {
        ...metadata,
        externalId: "NCT00000000",
      }),
    ).toThrow();

    expect(() =>
      validateProgrammeFixture(
        {
          ...snapshot,
          apiRequestUrl:
            "https://clinicaltrials.gov/api/v2/studies?query.id=NCT00000000&pageSize=1&countTotal=true&format=json",
        },
        fixtureBytes,
        metadata,
      ),
    ).toThrow();
  });

  it("keeps processing after retrieval and registry update as a separate provider fact", () => {
    for (const snapshot of programmeMappingDataset.sourceSnapshots) {
      expect(Date.parse(snapshot.processedAt)).toBeGreaterThanOrEqual(
        Date.parse(snapshot.retrievedAt),
      );
      expect(snapshot.registryLastUpdatePostedDate).not.toBe(
        snapshot.retrievedAt.slice(0, 10),
      );
      expect(snapshot.registryLastUpdatePostedDate).not.toBe(
        snapshot.processedAt.slice(0, 10),
      );
    }
  });
});
