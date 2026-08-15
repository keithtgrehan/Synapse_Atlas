import { describe, expect, it, vi } from "vitest";

import rawDataset from "../../data/program-mappings/v1.json";
import {
  buildComparison,
  buildComparisonCatalog,
  comparisonCatalogSchema,
  comparisonFixtureRecordFromValidatedFixture,
  deriveRegisteredTrialCount,
  normalizeComparisonPartialDate,
  parseComparisonSelection,
  registeredTrialCountFormulaVersion,
  type ComparisonCatalog,
  type ComparisonFixtureRecord,
} from "../../src/lib/domain/comparisons";
import { readAndValidateProgrammeFixture } from "../../src/lib/fixtures/programs";
import { loadComparisonCatalog } from "../../src/lib/programs/comparison-dataset";
import { programmeMappingDataset } from "../../src/lib/programs/dataset";

async function loadFixtureRecords(): Promise<ComparisonFixtureRecord[]> {
  return Promise.all(
    programmeMappingDataset.sourceSnapshots.map(async (snapshot) =>
      comparisonFixtureRecordFromValidatedFixture(
        await readAndValidateProgrammeFixture(snapshot),
      ),
    ),
  );
}

function extendCatalog(catalog: ComparisonCatalog, total: number): ComparisonCatalog {
  const candidates = [...catalog.candidates];

  while (candidates.length < total) {
    const index = candidates.length + 1;
    const candidate = structuredClone(catalog.candidates[0]!);
    candidate.slug = `synthetic-programme-${index}`;
    candidate.canonicalLabel = `Synthetic programme ${index}`;
    candidate.programmeHref = `/programs/${candidate.slug}`;
    candidates.push(candidate);
  }

  return comparisonCatalogSchema.parse({ ...catalog, candidates });
}

describe("deterministic programme comparison", () => {
  it("loads the exact three approved and resolved production candidates without network access", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("NETWORK_MUST_NOT_BE_USED"));

    try {
      const catalog = await loadComparisonCatalog();

      expect(catalog.candidates.map((candidate) => candidate.slug)).toEqual([
        "usona-psilocybin-mdd",
        "comp360-treatment-resistant-depression",
        "cyb003-major-depressive-disorder",
      ]);
      expect(
        catalog.candidates.every(
          (candidate) =>
            candidate.mapping.reviewStatus === "APPROVED" &&
            candidate.mapping.resolutionState === "RESOLVED",
        ),
      ).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it("accepts exactly two, three, or four distinct known programme slugs", async () => {
    const catalog = extendCatalog(await loadComparisonCatalog(), 4);
    const slugs = catalog.candidates.map((candidate) => candidate.slug);

    for (const size of [2, 3, 4]) {
      const selection = parseComparisonSelection(
        { programme: slugs.slice(0, size) },
        catalog,
      );

      expect(selection).toEqual({
        state: "ready",
        selectedSlugs: slugs.slice(0, size),
      });
    }
  });

  it("keeps zero selections in selection mode and one valid selection in a bounded too-few state", async () => {
    const catalog = await loadComparisonCatalog();

    expect(parseComparisonSelection({}, catalog)).toEqual({
      state: "selection",
      selectedSlugs: [],
    });
    expect(
      parseComparisonSelection(
        { programme: "usona-psilocybin-mdd" },
        catalog,
      ),
    ).toEqual({
      state: "too_few",
      selectedSlugs: ["usona-psilocybin-mdd"],
    });
  });

  it("rejects duplicates, unknowns, unexpected parameters, empty, control, malformed, non-string, and over-limit values", async () => {
    const catalog = extendCatalog(await loadComparisonCatalog(), 5);
    const known = catalog.candidates.map((candidate) => candidate.slug);
    const invalidParameters: unknown[] = [
      { programme: [known[0], known[0]] },
      { programme: [known[0], "unknown-programme"] },
      { programme: [known[0], known[1]], unexpected: "value" },
      { programme: "" },
      { programme: [known[0], `bad\u0000value`] },
      { programme: [known[0], "Not-A-Slug"] },
      { programme: 42 },
      { programme: [] },
      { programme: known },
      null,
    ];

    for (const parameters of invalidParameters) {
      expect(parseComparisonSelection(parameters, catalog)).toEqual({
        state: "invalid",
        selectedSlugs: [],
      });
    }
  });

  it("preserves dataset order regardless of query-parameter order", async () => {
    const catalog = await loadComparisonCatalog();
    const result = buildComparison(catalog, [
      "cyb003-major-depressive-disorder",
      "usona-psilocybin-mdd",
    ]);

    expect(result.programmes.map((programme) => programme.slug)).toEqual([
      "usona-psilocybin-mdd",
      "cyb003-major-depressive-disorder",
    ]);
  });

  it("resolves each production programme to its expected record, NCT evidence, sponsor, compound, and exact retained facts", async () => {
    const catalog = await loadComparisonCatalog();
    const expected = [
      {
        slug: "usona-psilocybin-mdd",
        nctId: "NCT03866174",
        sponsor: "Usona Institute",
        compound: "Psilocybin",
        conditions: ["Depressive Disorder, Major"],
        interventions: ["Psilocybin", "Niacin", "Set and Setting (SaS) Protocol"],
        status: "COMPLETED",
        startDate: "2020-01-23",
        lastUpdate: "2026-04-22",
        hash: "ca2f41faaa07ce8c8d92530ff8b0eed7bee05906453b2de01c294cdb38c851cf",
        retrievedAt: "2026-08-14T13:56:45Z",
        processedAt: "2026-08-14T14:27:25Z",
      },
      {
        slug: "comp360-treatment-resistant-depression",
        nctId: "NCT05711940",
        sponsor: "COMPASS Pathways",
        compound: "Psilocybin",
        conditions: ["Treatment Resistant Depression"],
        interventions: ["Psilocybin"],
        status: "ACTIVE_NOT_RECRUITING",
        startDate: "2023-02-14",
        lastUpdate: "2026-08-10",
        hash: "f74975e80e8863377bcdc2cdc7c9cd3266b9cd7efa865a202354b118aec99807",
        retrievedAt: "2026-08-14T21:24:04.791Z",
        processedAt: "2026-08-14T21:26:00.000Z",
      },
      {
        slug: "cyb003-major-depressive-disorder",
        nctId: "NCT06605105",
        sponsor: "Cybin IRL Limited",
        compound: "CYB003",
        conditions: ["Major Depressive Disorder"],
        interventions: ["CYB003"],
        status: "ENROLLING_BY_INVITATION",
        startDate: "2025-07-18",
        lastUpdate: "2026-07-13",
        hash: "84e6019edf82426d76ff6d8fcf6187852e5a48f7ee91b50cc646c0a5d09bbb2d",
        retrievedAt: "2026-08-14T21:24:04.938Z",
        processedAt: "2026-08-14T21:26:00.000Z",
      },
    ] as const;

    for (const item of expected) {
      const candidate = catalog.candidates.find(
        (programme) => programme.slug === item.slug,
      );
      const trial = candidate?.registeredTrials[0];

      expect(candidate?.mapping).toMatchObject({
        reviewStatus: "APPROVED",
        resolutionState: "RESOLVED",
        reportedSponsorOrganisation: item.sponsor,
        candidateCompound: item.compound,
        evidenceClass: "HUMAN_INFERENCE",
      });
      expect(trial).toMatchObject({
        nctId: item.nctId,
        reportedSponsorOrganisation: item.sponsor,
        reportedConditions: item.conditions,
        reportedInterventions: item.interventions,
        overallStatus: item.status,
        registeredStartDate: { value: item.startDate, precision: "DAY" },
        registryLastUpdatePostedDate: { value: item.lastUpdate, precision: "DAY" },
        retrievedAt: item.retrievedAt,
        processedAt: item.processedAt,
        evidenceClass: "STRUCTURED_EXTRACTION",
        provenance: {
          sourceId: "SRC-CTG",
          policyVersion: "1",
          responseSha256: item.hash,
        },
      });
      expect(trial?.provenance.fieldLocators.overallStatus).toBe(
        "/studies/0/protocolSection/statusModule/overallStatus",
      );
      expect(trial?.provenance.fieldLocators.registeredStartDate).toBe(
        "/studies/0/protocolSection/statusModule/startDateStruct/date",
      );
      expect(trial?.provenance.fieldLocators.registryLastUpdatePostedDate).toBe(
        "/studies/0/protocolSection/statusModule/lastUpdatePostDateStruct/date",
      );
      expect(trial?.retrievedAt).not.toBe(item.lastUpdate);
      expect(trial?.processedAt).not.toBe(item.lastUpdate);
    }
  });

  it("preserves YEAR, MONTH, and DAY precision and rejects invalid partial dates", () => {
    expect(normalizeComparisonPartialDate("2026")).toEqual({
      value: "2026",
      precision: "YEAR",
    });
    expect(normalizeComparisonPartialDate("2026-08")).toEqual({
      value: "2026-08",
      precision: "MONTH",
    });
    expect(normalizeComparisonPartialDate("2026-08-15")).toEqual({
      value: "2026-08-15",
      precision: "DAY",
    });

    for (const invalid of ["2026-00", "2026-13", "2026-02-30", "2026-8", ""] as const) {
      expect(() => normalizeComparisonPartialDate(invalid)).toThrow();
    }
  });

  it("deduplicates NCT identifiers with a named versioned formula and exact inputs", () => {
    const inputs = [
      {
        sourceId: "SRC-CTG",
        policyVersion: "1",
        sourceSnapshotId: "snapshot-one",
        nctId: "NCT03866174",
        locator: "/studies/0/protocolSection/identificationModule/nctId",
      },
      {
        sourceId: "SRC-CTG",
        policyVersion: "1",
        sourceSnapshotId: "snapshot-two",
        nctId: "NCT03866174",
        locator: "/studies/0/protocolSection/identificationModule/nctId",
      },
    ] as const;

    expect(deriveRegisteredTrialCount([...inputs, inputs[0]])).toEqual({
      value: 1,
      evidenceClass: "DERIVED_CALCULATION",
      formula: "COUNT(DISTINCT registered NCT identifier)",
      formulaVersion: registeredTrialCountFormulaVersion,
      inputReferences: inputs,
    });
  });

  it("keeps human inference, structured extraction, calculation, and unknown classifications distinct", async () => {
    const candidate = (await loadComparisonCatalog()).candidates[0]!;

    expect(candidate.mapping.evidenceClass).toBe("HUMAN_INFERENCE");
    expect(candidate.registeredTrials[0]?.evidenceClass).toBe(
      "STRUCTURED_EXTRACTION",
    );
    expect(candidate.registeredTrialCount.evidenceClass).toBe(
      "DERIVED_CALCULATION",
    );
    expect(
      candidate.explicitUnknowns.every(
        (unknown) =>
          unknown.evidenceClass === "UNKNOWN" &&
          unknown.displayValue === "Not established from approved sources.",
      ),
    ).toBe(true);
  });

  it("rejects missing provenance and mismatched programme, NCT, or source records", async () => {
    const records = await loadFixtureRecords();
    const missingProvenance = structuredClone(records) as Array<Record<string, unknown>>;
    delete missingProvenance[0]!.sourceSnapshotId;
    const mismatchedNct = structuredClone(records);
    mismatchedNct[0]!.externalId = "NCT00000000";
    const mismatchedSource = structuredClone(records) as Array<Record<string, unknown>>;
    mismatchedSource[0]!.sourceId = "SRC-OTHER";
    const mismatchedProgramme = structuredClone(rawDataset);
    mismatchedProgramme.programmes[0]!.mappingAssertionId = "mapping-comp360-trd";

    for (const [dataset, fixtureRecords] of [
      [rawDataset, missingProvenance],
      [rawDataset, mismatchedNct],
      [rawDataset, mismatchedSource],
      [mismatchedProgramme, records],
    ] as const) {
      expect(() => buildComparisonCatalog(dataset, fixtureRecords)).toThrow();
    }
  });

  it("does not introduce ranking, recommendation, or unsupported positive-claim fields", async () => {
    const catalog = await loadComparisonCatalog();
    const keys = collectKeys(catalog);
    const prohibitedKeys = new Set([
      "rank",
      "ranking",
      "score",
      "winner",
      "superiority",
      "efficacy",
      "safety",
      "investment",
      "ownership",
      "developer",
      "rights",
      "chemicalEquivalence",
    ]);

    expect(keys.filter((key) => prohibitedKeys.has(key))).toEqual([]);
    expect(
      catalog.candidates
        .flatMap((candidate) => candidate.explicitUnknowns)
        .filter((unknown) =>
          /superiority|efficacy|safety|ownership|developer|rights|chemical/i.test(
            unknown.statement,
          ),
        )
        .every((unknown) => unknown.evidenceClass === "UNKNOWN"),
    ).toBe(true);
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
