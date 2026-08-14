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

  it("retains pending, rejected, and needs-revision history without resolving it", () => {
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

    expect(result.state).toBe("UNRESOLVED");
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
