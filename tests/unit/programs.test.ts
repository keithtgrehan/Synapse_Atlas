import { describe, expect, it } from "vitest";

import rawDataset from "../../data/program-mappings/v1.json";
import {
  getProgrammeBySlug,
  listProgrammes,
  normalizeProgrammeAlias,
  parseProgrammeSearchParameters,
  programmeMappingAssertionSchema,
  programmeMappingDatasetSchema,
  resolveProgrammeAlias,
  searchProgrammes,
  type ProgrammeMappingAssertion,
} from "../../src/lib/domain/programs";
import { programmeMappingDataset } from "../../src/lib/programs/dataset";

function syntheticAssertion(
  overrides: Partial<ProgrammeMappingAssertion> & {
    id: string;
    programmeId: string;
  },
): ProgrammeMappingAssertion {
  const base = programmeMappingDataset.mappingAssertions[0]!;
  const unreviewedBase = structuredClone(base) as Record<string, unknown>;

  delete unreviewedBase.reviewerReference;
  delete unreviewedBase.reviewRationale;
  delete unreviewedBase.reviewedAt;

  return programmeMappingAssertionSchema.parse({
    ...unreviewedBase,
    aliases: ["Synthetic alias"],
    reviewStatus: "PENDING",
    resolutionState: "UNRESOLVED",
    ...overrides,
  });
}

function approvedAssertion(
  id: string,
  programmeId: string,
  alias = "Synthetic alias",
): ProgrammeMappingAssertion {
  return syntheticAssertion({
    id,
    programmeId,
    aliases: [alias],
    reviewStatus: "APPROVED",
    resolutionState: "RESOLVED",
    reviewerReference: "synthetic-review-reference",
    reviewRationale: "Approved only inside a deterministic unit test.",
    reviewedAt: "2026-08-14T22:00:00Z",
  });
}

function expectDatasetIssue(
  candidate: unknown,
  message: string,
  path: PropertyKey[],
): void {
  const result = programmeMappingDatasetSchema.safeParse(candidate);

  expect(result.success).toBe(false);

  if (result.success) {
    throw new Error("EXPECTED_PROGRAMME_DATASET_REJECTION");
  }

  expect(result.error.issues).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        message,
        path,
      }),
    ]),
  );
}

describe("programme mapping dataset", () => {
  it("strictly validates production data and rejects unknown or malformed fields", () => {
    expect(programmeMappingDatasetSchema.parse(rawDataset)).toEqual(
      programmeMappingDataset,
    );
    expect(
      programmeMappingDatasetSchema.safeParse({
        ...structuredClone(rawDataset),
        unexpected: true,
      }).success,
    ).toBe(false);

    const malformed = structuredClone(rawDataset);
    malformed.programmes[0]!.companyIdentity.state = "KNOWN";
    expect(programmeMappingDatasetSchema.safeParse(malformed).success).toBe(false);
  });

  it("preserves every exact production mapping and its six material locators", () => {
    const expectedBindings = [
      {
        assertionId: "mapping-usona-psilocybin-mdd",
        sponsorId: "sponsor-usona-institute",
        compoundId: "compound-psilocybin",
        nctId: "NCT03866174",
        snapshotId: "snapshot-ctg-nct03866174-20260814",
      },
      {
        assertionId: "mapping-comp360-trd",
        sponsorId: "sponsor-compass-pathways",
        compoundId: "compound-psilocybin",
        nctId: "NCT05711940",
        snapshotId: "snapshot-ctg-nct05711940-20260814",
      },
      {
        assertionId: "mapping-cyb003-mdd",
        sponsorId: "sponsor-cybin-irl-limited",
        compoundId: "compound-cyb003",
        nctId: "NCT06605105",
        snapshotId: "snapshot-ctg-nct06605105-20260814",
      },
    ] as const;

    expect(programmeMappingDataset.updatedAt).toBe("2026-08-15T09:04:16Z");

    for (const expected of expectedBindings) {
      const assertion = programmeMappingDataset.mappingAssertions.find(
        (candidate) => candidate.id === expected.assertionId,
      );
      const snapshot = programmeMappingDataset.sourceSnapshots.find(
        (candidate) => candidate.id === expected.snapshotId,
      );
      const compound = programmeMappingDataset.compounds.find(
        (candidate) => candidate.id === expected.compoundId,
      );
      const compoundLocator = compound?.rawAliases.find(
        (alias) => alias.sourceSnapshotId === expected.snapshotId,
      )?.locator;

      expect(assertion).toMatchObject({
        reportedSponsorOrganisationId: expected.sponsorId,
        compoundId: expected.compoundId,
        nctIds: [expected.nctId],
        evidence: [{ sourceSnapshotId: expected.snapshotId }],
      });
      expect(assertion?.evidence[0]?.locators).toEqual([
        snapshot?.fieldLocators.nctId,
        snapshot?.fieldLocators.briefTitle,
        snapshot?.fieldLocators.reportedSponsorOrganisation,
        snapshot?.fieldLocators.reportedConditions,
        snapshot?.fieldLocators.reportedInterventions,
        compoundLocator,
      ]);
    }
  });

  it("requires unique stable IDs and slugs with no orphan references", () => {
    const duplicateSlug = structuredClone(rawDataset);
    duplicateSlug.programmes[1]!.slug = duplicateSlug.programmes[0]!.slug;
    expect(programmeMappingDatasetSchema.safeParse(duplicateSlug).success).toBe(false);

    const orphanAssertion = structuredClone(rawDataset);
    orphanAssertion.programmes[0]!.mappingAssertionId = "missing-assertion";
    expect(programmeMappingDatasetSchema.safeParse(orphanAssertion).success).toBe(false);

    const orphanCompound = structuredClone(rawDataset);
    orphanCompound.mappingAssertions[0]!.compoundId = "missing-compound";
    expect(programmeMappingDatasetSchema.safeParse(orphanCompound).success).toBe(false);

    const orphanSponsor = structuredClone(rawDataset);
    orphanSponsor.mappingAssertions[0]!.reportedSponsorOrganisationId = "missing-sponsor";
    expect(programmeMappingDatasetSchema.safeParse(orphanSponsor).success).toBe(false);

    const orphanNct = structuredClone(rawDataset);
    orphanNct.mappingAssertions[0]!.nctIds = ["NCT00000000"];
    expect(programmeMappingDatasetSchema.safeParse(orphanNct).success).toBe(false);

    const orphanSource = structuredClone(rawDataset);
    orphanSource.compounds[0]!.rawAliases[0]!.sourceSnapshotId = "missing-snapshot";
    expect(programmeMappingDatasetSchema.safeParse(orphanSource).success).toBe(false);
  });

  it("binds every mapping sponsor and compound to each evidence snapshot", () => {
    const wrongSponsor = structuredClone(rawDataset);
    wrongSponsor.mappingAssertions[0]!.reportedSponsorOrganisationId =
      "sponsor-compass-pathways";
    expectDatasetIssue(
      wrongSponsor,
      "Mapping sponsor must have a raw alias from every evidence snapshot",
      ["mappingAssertions", 0, "reportedSponsorOrganisationId"],
    );

    const wrongCompound = structuredClone(rawDataset);
    wrongCompound.mappingAssertions[2]!.compoundId = "compound-psilocybin";
    expectDatasetIssue(
      wrongCompound,
      "Mapping compound must have a raw alias from every evidence snapshot",
      ["mappingAssertions", 2, "compoundId"],
    );

    const duplicatedSponsorEvidence = structuredClone(rawDataset);
    duplicatedSponsorEvidence.mappingAssertions[0]!.reportedSponsorOrganisationId =
      "sponsor-compass-pathways";
    duplicatedSponsorEvidence.sponsorOrganisations[1]!.rawAliases.push(
      structuredClone(
        duplicatedSponsorEvidence.sponsorOrganisations[0]!.rawAliases[0]!,
      ),
    );
    expectDatasetIssue(
      duplicatedSponsorEvidence,
      "Every sponsor raw-alias evidence reference must be unique",
      ["sponsorOrganisations"],
    );

    const duplicatedCompoundEvidence = structuredClone(rawDataset);
    duplicatedCompoundEvidence.mappingAssertions[2]!.compoundId =
      "compound-psilocybin";
    duplicatedCompoundEvidence.compounds[0]!.rawAliases.push(
      structuredClone(
        duplicatedCompoundEvidence.compounds[1]!.rawAliases[0]!,
      ),
    );
    expectDatasetIssue(
      duplicatedCompoundEvidence,
      "Every compound raw-alias evidence reference must be unique",
      ["compounds"],
    );
  });

  it("requires unique NCTs and exact one-to-one evidence snapshot coverage", () => {
    const missingEvidence = structuredClone(rawDataset);
    missingEvidence.mappingAssertions[0]!.nctIds.push("NCT05711940");
    expectDatasetIssue(
      missingEvidence,
      "Mapping evidence must cover every assertion NCT exactly once",
      ["mappingAssertions", 0, "nctIds", 1],
    );

    const unrelatedEvidence = structuredClone(rawDataset);
    unrelatedEvidence.mappingAssertions[0]!.evidence.push(
      structuredClone(rawDataset.mappingAssertions[1]!.evidence[0]!),
    );
    expectDatasetIssue(
      unrelatedEvidence,
      "Mapping evidence must reference one of the assertion NCT records",
      ["mappingAssertions", 0, "evidence", 1],
    );

    const duplicateEvidence = structuredClone(rawDataset);
    duplicateEvidence.mappingAssertions[0]!.evidence.push(
      structuredClone(duplicateEvidence.mappingAssertions[0]!.evidence[0]!),
    );
    expectDatasetIssue(
      duplicateEvidence,
      "Mapping evidence snapshot IDs must be unique",
      ["mappingAssertions", 0, "evidence"],
    );

    const duplicateNct = structuredClone(rawDataset);
    duplicateNct.mappingAssertions[0]!.nctIds.push("NCT03866174");
    expectDatasetIssue(
      duplicateNct,
      "Assertion NCT identifiers must be unique",
      ["mappingAssertions", 0, "nctIds"],
    );
  });

  it("requires unique exact material and selected-compound locators", () => {
    const evidencePath = ["mappingAssertions", 0, "evidence", 0, "locators"];
    const requiredLocators = [
      [
        "NCT ID",
        rawDataset.sourceSnapshots[0]!.fieldLocators.nctId,
        "Mapping evidence must include every required material snapshot locator",
      ],
      [
        "brief title",
        rawDataset.sourceSnapshots[0]!.fieldLocators.briefTitle,
        "Mapping evidence must include every required material snapshot locator",
      ],
      [
        "sponsor",
        rawDataset.sourceSnapshots[0]!.fieldLocators
          .reportedSponsorOrganisation,
        "Mapping evidence must include every required material snapshot locator",
      ],
      [
        "conditions",
        rawDataset.sourceSnapshots[0]!.fieldLocators.reportedConditions,
        "Mapping evidence must include every required material snapshot locator",
      ],
      [
        "interventions parent",
        rawDataset.sourceSnapshots[0]!.fieldLocators.reportedInterventions,
        "Mapping evidence must include every required material snapshot locator",
      ],
      [
        "selected compound child",
        rawDataset.compounds[0]!.rawAliases[0]!.locator,
        "Mapping evidence must select exactly one same-snapshot compound child locator",
      ],
    ] as const;

    for (const [, locator, message] of requiredLocators) {
      const missingLocator = structuredClone(rawDataset);
      missingLocator.mappingAssertions[0]!.evidence[0]!.locators =
        missingLocator.mappingAssertions[0]!.evidence[0]!.locators.filter(
          (candidate) => candidate !== locator,
        );
      expectDatasetIssue(missingLocator, message, evidencePath);
    }

    const duplicateLocator = structuredClone(rawDataset);
    duplicateLocator.mappingAssertions[0]!.evidence[0]!.locators.push(
      duplicateLocator.mappingAssertions[0]!.evidence[0]!.locators[0]!,
    );
    expectDatasetIssue(
      duplicateLocator,
      "Mapping evidence locators must be unique",
      evidencePath,
    );

    const wrongCompoundChild = structuredClone(rawDataset);
    wrongCompoundChild.mappingAssertions[0]!.evidence[0]!.locators =
      wrongCompoundChild.mappingAssertions[0]!.evidence[0]!.locators.map(
        (locator) =>
          locator === rawDataset.compounds[0]!.rawAliases[0]!.locator
            ? `${rawDataset.sourceSnapshots[0]!.fieldLocators.reportedInterventions}/1/name`
            : locator,
      );
    expectDatasetIssue(
      wrongCompoundChild,
      "Mapping evidence locator must be an exact declared snapshot or selected compound locator",
      evidencePath,
    );
    expectDatasetIssue(
      wrongCompoundChild,
      "Mapping evidence must select exactly one same-snapshot compound child locator",
      evidencePath,
    );

    const multipleCompoundChildren = structuredClone(rawDataset);
    multipleCompoundChildren.compounds[0]!.rawAliases.push({
      value: "Niacin",
      sourceSnapshotId: rawDataset.sourceSnapshots[0]!.id,
      locator: `${rawDataset.sourceSnapshots[0]!.fieldLocators.reportedInterventions}/1/name`,
    });
    multipleCompoundChildren.mappingAssertions[0]!.evidence[0]!.locators.push(
      `${rawDataset.sourceSnapshots[0]!.fieldLocators.reportedInterventions}/1/name`,
    );
    expectDatasetIssue(
      multipleCompoundChildren,
      "Mapping evidence must select exactly one same-snapshot compound child locator",
      evidencePath,
    );

    const exactOptionalLocator = structuredClone(rawDataset);
    exactOptionalLocator.mappingAssertions[0]!.evidence[0]!.locators.push(
      exactOptionalLocator.sourceSnapshots[0]!.fieldLocators
        .registryLastUpdatePostedDate,
    );
    expect(
      programmeMappingDatasetSchema.safeParse(exactOptionalLocator).success,
    ).toBe(true);

    const collidingSnapshotLocators = structuredClone(rawDataset);
    collidingSnapshotLocators.sourceSnapshots[0]!.fieldLocators.nctId =
      collidingSnapshotLocators.sourceSnapshots[0]!.fieldLocators.briefTitle;
    collidingSnapshotLocators.mappingAssertions[0]!.evidence[0]!.locators =
      collidingSnapshotLocators.mappingAssertions[0]!.evidence[0]!.locators.filter(
        (locator) => locator !== rawDataset.sourceSnapshots[0]!.fieldLocators.nctId,
      );
    expectDatasetIssue(
      collidingSnapshotLocators,
      "Snapshot field locators must be unique",
      ["sourceSnapshots", 0, "fieldLocators"],
    );
  });

  it("enforces review chronology while keeping registry update dates separate", () => {
    const reviewBeforeProcessing = structuredClone(rawDataset);
    reviewBeforeProcessing.mappingAssertions[0]!.reviewedAt =
      "2026-08-14T14:27:24.999Z";
    expectDatasetIssue(
      reviewBeforeProcessing,
      "Mapping review must be at or after all evidence processing",
      ["mappingAssertions", 0, "reviewedAt"],
    );

    const datasetBeforeReview = structuredClone(rawDataset);
    datasetBeforeReview.updatedAt = "2026-08-14T22:10:16.999Z";
    expectDatasetIssue(
      datasetBeforeReview,
      "Dataset update must be at or after every mapping review",
      ["updatedAt"],
    );

    const reviewEqualsProcessing = structuredClone(rawDataset);
    reviewEqualsProcessing.mappingAssertions[0]!.reviewedAt =
      reviewEqualsProcessing.sourceSnapshots[0]!.processedAt;
    expect(
      programmeMappingDatasetSchema.safeParse(reviewEqualsProcessing).success,
    ).toBe(true);

    const datasetEqualsReview = structuredClone(rawDataset);
    datasetEqualsReview.updatedAt = "2026-08-14T22:10:17Z";
    expect(
      programmeMappingDatasetSchema.safeParse(datasetEqualsReview).success,
    ).toBe(true);

    const laterRegistryFact = structuredClone(rawDataset);
    laterRegistryFact.sourceSnapshots[0]!.registryLastUpdatePostedDate =
      "2099-01-01";
    laterRegistryFact.sourceSnapshots[0]!.observedRegistryFacts.registryLastUpdatePostedDate =
      "2099-01-01";
    expect(
      programmeMappingDatasetSchema.safeParse(laterRegistryFact).success,
    ).toBe(true);

    const subMillisecondProcessing = structuredClone(rawDataset);
    subMillisecondProcessing.sourceSnapshots[0]!.processedAt =
      "2026-08-14T22:10:17.0001Z";
    expectDatasetIssue(
      subMillisecondProcessing,
      "Mapping review must be at or after all evidence processing",
      ["mappingAssertions", 0, "reviewedAt"],
    );

    const subMillisecondDatasetUpdate = structuredClone(rawDataset);
    subMillisecondDatasetUpdate.mappingAssertions[0]!.reviewedAt =
      "2026-08-15T09:04:16.0001Z";
    expectDatasetIssue(
      subMillisecondDatasetUpdate,
      "Dataset update must be at or after every mapping review",
      ["updatedAt"],
    );

    const subMillisecondEquality = structuredClone(rawDataset);
    subMillisecondEquality.sourceSnapshots[0]!.processedAt =
      "2026-08-14T22:10:17.0001Z";
    subMillisecondEquality.mappingAssertions[0]!.reviewedAt =
      "2026-08-14T22:10:17.0001Z";
    expect(
      programmeMappingDatasetSchema.safeParse(subMillisecondEquality).success,
    ).toBe(true);

    const fractionalPrecisionEquality = structuredClone(rawDataset);
    fractionalPrecisionEquality.sourceSnapshots[0]!.processedAt =
      "2026-08-14T22:10:17.1Z";
    fractionalPrecisionEquality.mappingAssertions[0]!.reviewedAt =
      "2026-08-14T22:10:17.1000Z";
    expect(
      programmeMappingDatasetSchema.safeParse(fractionalPrecisionEquality)
        .success,
    ).toBe(true);

    const offsetEquality = structuredClone(rawDataset);
    offsetEquality.sourceSnapshots[0]!.processedAt =
      "2026-08-14T22:10:17Z";
    offsetEquality.mappingAssertions[0]!.reviewedAt =
      "2026-08-14T23:10:17+01:00";
    expect(programmeMappingDatasetSchema.safeParse(offsetEquality).success).toBe(
      true,
    );

    const subMillisecondAcrossOffsets = structuredClone(rawDataset);
    subMillisecondAcrossOffsets.sourceSnapshots[0]!.processedAt =
      "2026-08-14T23:10:17.0001+01:00";
    expectDatasetIssue(
      subMillisecondAcrossOffsets,
      "Mapping review must be at or after all evidence processing",
      ["mappingAssertions", 0, "reviewedAt"],
    );
  });

  it("uses only conservative NFKC, whitespace, and lowercase normalization", () => {
    expect(normalizeProgrammeAlias("  ＣＯＭＰ３６０\t  TRD  ")).toBe(
      "comp360 trd",
    );
    expect(normalizeProgrammeAlias("CYB-003")).not.toBe(
      normalizeProgrammeAlias("CYB003"),
    );
    expect(normalizeProgrammeAlias("Psilocybín")).not.toBe(
      normalizeProgrammeAlias("Psilocybin"),
    );
    expect(normalizeProgrammeAlias("COMP360—TRD")).not.toBe(
      normalizeProgrammeAlias("COMP360 TRD"),
    );
  });

  it("returns UNRESOLVED for unknown aliases without guessing", () => {
    expect(
      resolveProgrammeAlias(
        "not present",
        programmeMappingDataset.mappingAssertions,
      ),
    ).toEqual({
      state: "UNRESOLVED",
      normalizedInput: "not present",
      candidates: [],
      winnerProgrammeId: null,
    });
  });

  it("retains review history and conflicts across distinct open programmes", () => {
    const pending = syntheticAssertion({
      id: "mapping-history-pending",
      programmeId: "programme-history-pending",
    });
    const rejected = syntheticAssertion({
      id: "mapping-history-rejected",
      programmeId: "programme-history-rejected",
      reviewStatus: "REJECTED",
      resolutionState: "UNRESOLVED",
      reviewerReference: "synthetic-review-reference",
      reviewRationale: "Rejected only inside a deterministic unit test.",
      reviewedAt: "2026-08-14T22:00:00Z",
    });
    const needsRevision = syntheticAssertion({
      id: "mapping-history-needs-revision",
      programmeId: "programme-history-needs-revision",
      reviewStatus: "NEEDS_REVISION",
      resolutionState: "UNRESOLVED",
      reviewerReference: "synthetic-review-reference",
      reviewRationale: "Needs revision only inside a deterministic unit test.",
      reviewedAt: "2026-08-14T22:00:00Z",
    });
    const result = resolveProgrammeAlias("Synthetic alias", [
      needsRevision,
      pending,
      rejected,
    ]);

    expect(result.state).toBe("CONFLICTING");
    expect(result.winnerProgrammeId).toBeNull();
    expect(result.candidates.map((candidate) => candidate.reviewStatus).sort())
      .toEqual(["NEEDS_REVISION", "PENDING", "REJECTED"]);
  });

  it("requires complete synthetic approval metadata and evidence", () => {
    const base = {
      ...programmeMappingDataset.mappingAssertions[0]!,
      id: "mapping-synthetic-approved",
      programmeId: "programme-synthetic-approved",
      aliases: ["Synthetic approved alias"],
      reviewStatus: "APPROVED" as const,
      resolutionState: "RESOLVED" as const,
      reviewerReference: "synthetic-review-reference",
      reviewRationale: "Approved only inside a deterministic unit test.",
      reviewedAt: "2026-08-14T22:00:00Z",
    };

    expect(programmeMappingAssertionSchema.safeParse(base).success).toBe(true);

    for (const field of [
      "reviewerReference",
      "reviewRationale",
      "reviewedAt",
      "evidence",
    ] as const) {
      const candidate: Record<string, unknown> = { ...base };
      delete candidate[field];
      expect(programmeMappingAssertionSchema.safeParse(candidate).success).toBe(false);
    }

    expect(
      programmeMappingAssertionSchema.safeParse({
        ...base,
        resolutionState: "UNRESOLVED",
      }).success,
    ).toBe(false);

    expect(
      programmeMappingAssertionSchema.safeParse({
        ...syntheticAssertion({
          id: "mapping-pending-with-review-metadata",
          programmeId: "programme-pending-with-review-metadata",
        }),
        reviewerReference: "must-not-exist",
      }).success,
    ).toBe(false);

    for (const reviewStatus of ["REJECTED", "NEEDS_REVISION"] as const) {
      expect(
        programmeMappingAssertionSchema.safeParse({
          ...base,
          reviewStatus,
          resolutionState: "RESOLVED",
        }).success,
      ).toBe(false);
    }
  });

  it("returns every approved collision candidate deterministically and no winner", () => {
    const first = approvedAssertion(
      "mapping-collision-a",
      "programme-collision-a",
      "Collision alias",
    );
    const second = approvedAssertion(
      "mapping-collision-b",
      "programme-collision-b",
      "Collision alias",
    );
    const result = resolveProgrammeAlias("Collision alias", [second, first]);

    expect(result.state).toBe("CONFLICTING");
    expect(result.winnerProgrammeId).toBeNull();
    expect(result.candidates.map((candidate) => candidate.programmeId)).toEqual([
      "programme-collision-a",
      "programme-collision-b",
    ]);
  });

  it("allows exactly one approved mapping to resolve with a winner", () => {
    const approved = approvedAssertion(
      "mapping-resolved",
      "programme-resolved",
      "Resolved alias",
    );

    expect(resolveProgrammeAlias("Resolved alias", [approved])).toMatchObject({
      state: "RESOLVED",
      winnerProgrammeId: "programme-resolved",
    });
  });

  it("blocks an approved winner while another programme remains open", () => {
    const approved = approvedAssertion(
      "mapping-active-approved",
      "programme-active-approved",
      "Active collision alias",
    );
    const pending = syntheticAssertion({
      id: "mapping-active-pending",
      programmeId: "programme-active-pending",
      aliases: ["Active collision alias"],
    });
    const needsRevision = syntheticAssertion({
      id: "mapping-active-needs-revision",
      programmeId: "programme-active-needs-revision",
      aliases: ["Active collision alias"],
      reviewStatus: "NEEDS_REVISION",
      reviewerReference: "synthetic-review-reference",
      reviewRationale: "Needs revision only inside a deterministic unit test.",
      reviewedAt: "2026-08-14T22:00:00Z",
    });

    for (const openCandidate of [pending, needsRevision]) {
      expect(
        resolveProgrammeAlias("Active collision alias", [
          approved,
          openCandidate,
        ]),
      ).toMatchObject({
        state: "CONFLICTING",
        winnerProgrammeId: null,
        candidates: expect.arrayContaining([
          expect.objectContaining({ programmeId: approved.programmeId }),
          expect.objectContaining({ programmeId: openCandidate.programmeId }),
        ]),
      });
    }
  });

  it("ignores rejected cross-programme history without dropping candidates", () => {
    const approved = approvedAssertion(
      "mapping-rejected-history-approved",
      "programme-rejected-history-approved",
      "Rejected history alias",
    );
    const rejected = syntheticAssertion({
      id: "mapping-rejected-history",
      programmeId: "programme-rejected-history",
      aliases: ["Rejected history alias"],
      reviewStatus: "REJECTED",
      reviewerReference: "synthetic-review-reference",
      reviewRationale: "Rejected only inside a deterministic unit test.",
      reviewedAt: "2026-08-14T22:00:00Z",
    });
    const result = resolveProgrammeAlias("Rejected history alias", [
      rejected,
      approved,
    ]);

    expect(result).toMatchObject({
      state: "RESOLVED",
      winnerProgrammeId: approved.programmeId,
    });
    expect(result.candidates).toHaveLength(2);
    expect(
      result.candidates
        .map((candidate) => candidate.reviewStatus)
        .sort(),
    ).toEqual(["APPROVED", "REJECTED"]);
  });

  it("does not treat multiple active assertions for one programme as a conflict", () => {
    const approved = approvedAssertion(
      "mapping-same-programme-approved",
      "programme-same-active",
      "Same programme alias",
    );
    const pending = syntheticAssertion({
      id: "mapping-same-programme-pending",
      programmeId: "programme-same-active",
      aliases: ["Same programme alias"],
    });

    expect(
      resolveProgrammeAlias("Same programme alias", [pending, approved]),
    ).toMatchObject({
      state: "RESOLVED",
      winnerProgrammeId: "programme-same-active",
      candidates: expect.arrayContaining([
        expect.objectContaining({ reviewStatus: "APPROVED" }),
        expect.objectContaining({ reviewStatus: "PENDING" }),
      ]),
    });
  });

  it("keeps resolver candidates and outcomes independent of insertion order", () => {
    const approved = approvedAssertion(
      "mapping-order-approved",
      "programme-order-approved",
      "Order collision alias",
    );
    const pending = syntheticAssertion({
      id: "mapping-order-pending",
      programmeId: "programme-order-pending",
      aliases: ["Order collision alias"],
    });
    const rejected = syntheticAssertion({
      id: "mapping-order-rejected",
      programmeId: "programme-order-rejected",
      aliases: ["Order collision alias"],
      reviewStatus: "REJECTED",
      reviewerReference: "synthetic-review-reference",
      reviewRationale: "Rejected only inside a deterministic unit test.",
      reviewedAt: "2026-08-14T22:00:00Z",
    });
    const forward = resolveProgrammeAlias("Order collision alias", [
      approved,
      pending,
      rejected,
    ]);
    const reversed = resolveProgrammeAlias("Order collision alias", [
      rejected,
      pending,
      approved,
    ]);

    expect(forward).toEqual(reversed);
    expect(forward).toMatchObject({
      state: "CONFLICTING",
      winnerProgrammeId: null,
    });
  });

  it("resolves every approved production alias only to its reviewed programme grouping", () => {
    for (const assertion of programmeMappingDataset.mappingAssertions) {
      for (const alias of assertion.aliases) {
        expect(
          resolveProgrammeAlias(
            alias,
            programmeMappingDataset.mappingAssertions,
          ),
        ).toMatchObject({
          state: "RESOLVED",
          winnerProgrammeId: assertion.programmeId,
        });
      }
    }
  });

  it("searches programme, compound, sponsor, alias, condition, and NCT ID", () => {
    const slugs = (query: string) =>
      searchProgrammes(programmeMappingDataset, query).map(
        (view) => view.programme.slug,
      );

    expect(slugs("COMP360 for treatment-resistant depression")).toEqual([
      "comp360-treatment-resistant-depression",
    ]);
    expect(slugs("Psilocybin")).toEqual([
      "comp360-treatment-resistant-depression",
      "usona-psilocybin-mdd",
    ]);
    expect(slugs("Cybin IRL Limited")).toEqual([
      "cyb003-major-depressive-disorder",
    ]);
    expect(slugs("Usona psilocybin MDD")).toEqual([
      "usona-psilocybin-mdd",
    ]);
    expect(slugs("Depressive Disorder, Major")).toEqual([
      "usona-psilocybin-mdd",
    ]);
    expect(slugs("NCT05711940")).toEqual([
      "comp360-treatment-resistant-depression",
    ]);
  });

  it("filters and orders deterministically independent of dataset order", () => {
    const reversedInput = {
      ...structuredClone(rawDataset),
      programmes: structuredClone(rawDataset.programmes).reverse(),
      mappingAssertions: structuredClone(rawDataset.mappingAssertions).reverse(),
    };
    const reversedDataset = programmeMappingDatasetSchema.parse(reversedInput);
    const expected = [
      "comp360-treatment-resistant-depression",
      "cyb003-major-depressive-disorder",
      "usona-psilocybin-mdd",
    ];

    expect(listProgrammes(programmeMappingDataset).map((view) => view.programme.slug))
      .toEqual(expected);
    expect(searchProgrammes(reversedDataset, "depress").map((view) => view.programme.slug))
      .toEqual(expected);
  });

  it("finds exact details and preserves the expected trial reference", () => {
    const detail = getProgrammeBySlug(
      programmeMappingDataset,
      "comp360-treatment-resistant-depression",
    );

    expect(detail?.mapping.nctIds).toEqual(["NCT05711940"]);
    expect(detail?.sourceSnapshots[0]?.humanStudyUrl).toBe(
      "https://clinicaltrials.gov/study/NCT05711940",
    );
    expect(getProgrammeBySlug(programmeMappingDataset, "missing-programme"))
      .toBeNull();
    expect(getProgrammeBySlug(programmeMappingDataset, "../unsafe")).toBeNull();
  });

  it("rejects repeated, unexpected, control-character, and overlong search parameters", () => {
    expect(parseProgrammeSearchParameters({ q: "COMP360" })).toEqual({
      valid: true,
      query: "COMP360",
    });
    expect(parseProgrammeSearchParameters({ q: ["one", "two"] }).valid).toBe(false);
    expect(parseProgrammeSearchParameters({ q: "safe", extra: "no" }).valid).toBe(false);
    expect(parseProgrammeSearchParameters({ q: "bad\u0000value" }).valid).toBe(false);
    expect(parseProgrammeSearchParameters({ q: "x".repeat(121) }).valid).toBe(false);
  });

  it("records the three exact human approvals and excludes prohibited inferred fields", () => {
    expect(programmeMappingDataset.mappingAssertions).toHaveLength(3);

    const expectedReviewRationales = new Map([
      [
        "mapping-usona-psilocybin-mdd",
        "Approved as a human-reviewed association of NCT03866174 with a Usona Institute–reported psilocybin-in-major-depressive-disorder programme candidate. ClinicalTrials.gov names Psilocybin in the study title, reports Usona Institute as lead sponsor organisation, and reports Depressive Disorder, Major. Niacin and Set and Setting (SaS) Protocol remain separately preserved registry interventions. This approval does not assert that psilocybin is the only intervention, or establish company identity, ownership, developer status, commercial rights, programme-level phase/status, mechanism, efficacy, or safety.",
      ],
      [
        "mapping-comp360-trd",
        "Approved as a human-reviewed association within NCT05711940: the ClinicalTrials.gov title names COMP360, the intervention field reports Psilocybin, the lead sponsor organisation is COMPASS Pathways, and the condition is Treatment Resistant Depression. This does not establish that COMP360 and Psilocybin are synonyms or chemically/formulation-equivalent, nor company identity, ownership, developer status, commercial rights, programme-level phase/status, efficacy, or safety.",
      ],
      [
        "mapping-cyb003-mdd",
        "Approved as an evidence-bounded human-inference mapping: ClinicalTrials.gov record NCT06605105 names CYB003 in the study title, reports CYB003 as its sole intervention, Major Depressive Disorder as the condition, and Cybin IRL Limited as the lead sponsor organisation. This approval links the study to the programme candidate ‘CYB003 for major depressive disorder’ and candidate compound label ‘CYB003’ only. It does not establish chemical identity, company identity, ownership, developer or commercial-rights status, programme-wide phase/status, mechanism, efficacy, safety, or superiority.",
      ],
    ]);

    expect(
      programmeMappingDataset.mappingAssertions.every(
        (assertion) =>
          assertion.evidenceClass === "HUMAN_INFERENCE" &&
          assertion.reviewStatus === "APPROVED" &&
          assertion.resolutionState === "RESOLVED" &&
          assertion.reviewerReference ===
            "Keith Grehan — explicit human review decision in the S1-04 Codex task" &&
          assertion.reviewedAt === "2026-08-14T22:10:17Z" &&
          assertion.reviewRationale === expectedReviewRationales.get(assertion.id),
      ),
    ).toBe(true);
    expect(
      programmeMappingDataset.sourceSnapshots.every(
        (snapshot) => snapshot.evidenceClass === "STRUCTURED_EXTRACTION",
      ),
    ).toBe(true);
    expect(
      programmeMappingDataset.programmes.every(
        (programme) => programme.companyIdentity.state === "UNKNOWN",
      ),
    ).toBe(true);

    const prohibitedKeys = new Set([
      "modelVersion",
      "mechanism",
      "target",
      "chemicalIdentifier",
      "efficacy",
      "safety",
      "programmePhase",
      "ownership",
    ]);
    expect(collectKeys(programmeMappingDataset).filter((key) => prohibitedKeys.has(key)))
      .toEqual([]);
  });

  it("keeps programme aliases namespace-scoped and compound equivalence unknown", () => {
    expect(
      resolveProgrammeAlias(
        "Psilocybin",
        programmeMappingDataset.mappingAssertions,
      ),
    ).toEqual({
      state: "UNRESOLVED",
      normalizedInput: "psilocybin",
      candidates: [],
      winnerProgrammeId: null,
    });

    const psilocybin = programmeMappingDataset.compounds.find(
      (compound) => compound.id === "compound-psilocybin",
    );
    const comp360 = getProgrammeBySlug(
      programmeMappingDataset,
      "comp360-treatment-resistant-depression",
    );
    const usona = getProgrammeBySlug(
      programmeMappingDataset,
      "usona-psilocybin-mdd",
    );
    const cyb003 = getProgrammeBySlug(
      programmeMappingDataset,
      "cyb003-major-depressive-disorder",
    );

    expect(psilocybin?.rawAliases.map((alias) => alias.value)).toEqual([
      "Psilocybin",
      "Psilocybin",
    ]);
    expect(psilocybin?.rawAliases.some((alias) => alias.value === "COMP360"))
      .toBe(false);
    expect(comp360?.mapping.rationale).toBe(
      "COMP360-labelled programme candidate associated with the registry-reported Psilocybin intervention in NCT05711940.",
    );
    expect(comp360?.programme.explicitUnknowns.join(" ")).toContain(
      "not asserted to be synonyms, aliases, identical substances, or chemically/formulation-equivalent",
    );
    expect(
      usona?.sourceSnapshots[0]?.observedRegistryFacts.reportedInterventions,
    ).toEqual([
      "Psilocybin",
      "Niacin",
      "Set and Setting (SaS) Protocol",
    ]);
    expect(usona?.programme.explicitUnknowns.join(" ")).toContain(
      "whether Psilocybin is an exclusive programme compound",
    );
    expect(cyb003?.programme.explicitUnknowns.join(" ")).toContain(
      "Chemical identity beyond the candidate compound label CYB003",
    );
    expect(cyb003?.programme.explicitUnknowns.join(" ")).toContain(
      "superiority",
    );
  });
});

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectKeys);
  }

  if (value === null || typeof value !== "object") {
    return [];
  }

  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectKeys(child),
  ]);
}
