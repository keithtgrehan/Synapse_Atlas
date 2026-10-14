import { z } from "zod";

import {
  programmeMappingDatasetSchema,
  mappingEvidenceClassSchema,
  mappingDatasetVersionSchema,
  programmeSlugSchema,
} from "./programs";
import { nctIdSchema, partialDateValueSchema } from "./trials";
import {
  offsetDateTimeSchema,
  sha256HexSchema,
} from "../evidence/provenance";
import type { ValidatedProgrammeFixture } from "../fixtures/programs";

const nonBlankTextSchema = z.string().trim().min(1).max(5_000);

export const registeredTrialCountFormulaVersion =
  "registered-trial-count/distinct-nct/v1" as const;

export const comparisonFixtureRecordSchema = z
  .object({
    sourceSnapshotId: nonBlankTextSchema,
    sourceId: z.literal("SRC-CTG"),
    policyVersion: z.literal("1"),
    externalId: nctIdSchema,
    responseSha256: sha256HexSchema,
    retrievedAt: offsetDateTimeSchema,
    processedAt: offsetDateTimeSchema,
    reportedSponsorOrganisation: nonBlankTextSchema,
    reportedConditions: z.array(nonBlankTextSchema).min(1).max(100),
    reportedInterventions: z.array(nonBlankTextSchema).min(1).max(200),
    overallStatus: nonBlankTextSchema.max(100),
    registeredStartDate: partialDateValueSchema,
    registryLastUpdatePostedDate: partialDateValueSchema,
  })
  .strict();

export type ComparisonFixtureRecord = z.infer<
  typeof comparisonFixtureRecordSchema
>;

const provenanceReferenceSchema = z
  .object({
    sourceId: z.literal("SRC-CTG"),
    policyVersion: z.literal("1"),
    sourceSnapshotId: nonBlankTextSchema,
    nctId: nctIdSchema,
    locator: nonBlankTextSchema,
  })
  .strict();

export const registeredTrialCountInputSchema = provenanceReferenceSchema;

const registeredTrialCountSchema = z
  .object({
    value: z.number().int().nonnegative(),
    evidenceClass: z.literal("DERIVED_CALCULATION"),
    formula: z.literal("COUNT(DISTINCT registered NCT identifier)"),
    formulaVersion: z.literal(registeredTrialCountFormulaVersion),
    inputReferences: z.array(provenanceReferenceSchema).min(1).max(100),
  })
  .strict();

const partialDateSchema = z
  .object({
    value: partialDateValueSchema,
    precision: z.enum(["YEAR", "MONTH", "DAY"]),
  })
  .strict();

const registryTrialSchema = z
  .object({
    nctId: nctIdSchema,
    trialHref: z.string().startsWith("/trials/"),
    officialSourceUrl: z.url(),
    apiRequestUrl: z.url(),
    reportedSponsorOrganisation: nonBlankTextSchema,
    reportedConditions: z.array(nonBlankTextSchema).min(1).max(100),
    reportedInterventions: z.array(nonBlankTextSchema).min(1).max(200),
    overallStatus: nonBlankTextSchema.max(100),
    registeredStartDate: partialDateSchema,
    registryLastUpdatePostedDate: partialDateSchema,
    retrievedAt: offsetDateTimeSchema,
    processedAt: offsetDateTimeSchema,
    evidenceClass: z.literal("STRUCTURED_EXTRACTION"),
    provenance: z
      .object({
        sourceId: z.literal("SRC-CTG"),
        policyVersion: z.literal("1"),
        sourceSnapshotId: nonBlankTextSchema,
        responseSha256: sha256HexSchema,
        fieldLocators: z
          .object({
            nctId: nonBlankTextSchema,
            briefTitle: nonBlankTextSchema,
            reportedSponsorOrganisation: nonBlankTextSchema,
            reportedConditions: nonBlankTextSchema,
            reportedInterventions: nonBlankTextSchema,
            overallStatus: nonBlankTextSchema,
            registeredStartDate: nonBlankTextSchema,
            registryLastUpdatePostedDate: nonBlankTextSchema,
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

const mappingComparisonSchema = z
  .object({
    assertionId: nonBlankTextSchema,
    reviewStatus: z.literal("APPROVED"),
    resolutionState: z.literal("RESOLVED"),
    reportedSponsorOrganisation: nonBlankTextSchema,
    candidateCompound: nonBlankTextSchema,
    evidenceClass: mappingEvidenceClassSchema,
    approvalBasis: z.literal("OWNER_ACCEPTED_UNATTRIBUTED_PACKET").optional(),
    reviewPacketSha256: sha256HexSchema.optional(),
    reviewRationale: nonBlankTextSchema.optional(),
    caveats: z.array(nonBlankTextSchema).max(20).optional(),
    provenanceReferences: z.array(provenanceReferenceSchema).min(1).max(100),
  })
  .strict();

const explicitUnknownSchema = z
  .object({
    statement: nonBlankTextSchema,
    displayValue: z.literal("Not established from approved sources."),
    evidenceClass: z.literal("UNKNOWN"),
  })
  .strict();

export const comparisonProgrammeSchema = z
  .object({
    slug: programmeSlugSchema,
    canonicalLabel: nonBlankTextSchema,
    programmeHref: z.string().startsWith("/programs/"),
    mapping: mappingComparisonSchema,
    registeredTrials: z.array(registryTrialSchema).min(1).max(10),
    registeredTrialCount: registeredTrialCountSchema,
    explicitUnknowns: z.array(explicitUnknownSchema).min(1).max(20),
  })
  .strict();

export const comparisonCatalogSchema = z
  .object({
    datasetVersion: mappingDatasetVersionSchema,
    datasetUpdatedAt: offsetDateTimeSchema,
    candidates: z.array(comparisonProgrammeSchema).max(20),
  })
  .strict();

export type ComparisonProgramme = z.infer<typeof comparisonProgrammeSchema>;
export type ComparisonCatalog = z.infer<typeof comparisonCatalogSchema>;

export const comparisonResultSchema = z
  .object({
    datasetVersion: mappingDatasetVersionSchema,
    datasetUpdatedAt: offsetDateTimeSchema,
    programmes: z.array(comparisonProgrammeSchema).min(2).max(4),
  })
  .strict();

export type ComparisonResult = z.infer<typeof comparisonResultSchema>;

export type ComparisonSelection =
  | { state: "selection"; selectedSlugs: readonly [] }
  | { state: "too_few"; selectedSlugs: readonly [string] }
  | { state: "invalid"; selectedSlugs: readonly [] }
  | {
      state: "ready";
      selectedSlugs: readonly [string, string, ...string[]];
    };

export function comparisonFixtureRecordFromValidatedFixture(
  validated: ValidatedProgrammeFixture,
): ComparisonFixtureRecord {
  const protocol = validated.fixture.studies[0]!.protocolSection;

  return comparisonFixtureRecordSchema.parse({
    sourceSnapshotId: validated.snapshot.id,
    sourceId: validated.snapshot.sourceId,
    policyVersion: validated.snapshot.policyVersion,
    externalId: protocol.identificationModule.nctId,
    responseSha256: validated.metadata.contentSha256,
    retrievedAt: validated.metadata.retrievedAt,
    processedAt: validated.metadata.processedAt,
    reportedSponsorOrganisation:
      protocol.sponsorCollaboratorsModule.leadSponsor.name,
    reportedConditions: protocol.conditionsModule.conditions,
    reportedInterventions:
      protocol.armsInterventionsModule.interventions.map(
        (intervention) => intervention.name,
      ),
    overallStatus: protocol.statusModule.overallStatus,
    registeredStartDate: protocol.statusModule.startDateStruct.date,
    registryLastUpdatePostedDate:
      protocol.statusModule.lastUpdatePostDateStruct.date,
  });
}

export function deriveRegisteredTrialCount(
  inputReferencesInput: unknown,
): z.infer<typeof registeredTrialCountSchema> {
  const inputReferences = z
    .array(registeredTrialCountInputSchema)
    .min(1)
    .max(100)
    .parse(inputReferencesInput);
  const exactReferences = new Map(
    inputReferences.map((reference) => [
      `${reference.sourceSnapshotId}\u0000${reference.nctId}\u0000${reference.locator}`,
      reference,
    ]),
  );

  return registeredTrialCountSchema.parse({
    value: new Set(inputReferences.map((reference) => reference.nctId)).size,
    evidenceClass: "DERIVED_CALCULATION",
    formula: "COUNT(DISTINCT registered NCT identifier)",
    formulaVersion: registeredTrialCountFormulaVersion,
    inputReferences: Array.from(exactReferences.values()),
  });
}

export function buildComparisonCatalog(
  datasetInput: unknown,
  fixtureRecordsInput: unknown,
): ComparisonCatalog {
  const dataset = programmeMappingDatasetSchema.parse(datasetInput);
  const fixtureRecords = z
    .array(comparisonFixtureRecordSchema)
    .min(1)
    .max(13)
    .parse(fixtureRecordsInput);
  const fixturesBySnapshotId = uniqueFixtureMap(fixtureRecords);

  if (fixturesBySnapshotId.size !== dataset.sourceSnapshots.length) {
    throw new Error("INVALID_COMPARISON_DATA");
  }

  for (const snapshot of dataset.sourceSnapshots) {
    const fixture = fixturesBySnapshotId.get(snapshot.id);

    if (fixture === undefined || !fixtureMatchesSnapshot(fixture, snapshot)) {
      throw new Error("INVALID_COMPARISON_DATA");
    }
  }

  const candidates = dataset.programmes.flatMap((programme) => {
    const mapping = dataset.mappingAssertions.find(
      (assertion) => assertion.id === programme.mappingAssertionId,
    );

    if (
      mapping === undefined ||
      mapping.reviewStatus !== "APPROVED" ||
      mapping.resolutionState !== "RESOLVED"
    ) {
      return [];
    }

    const sponsor = dataset.sponsorOrganisations.find(
      (candidate) =>
        candidate.id === mapping.reportedSponsorOrganisationId,
    );
    const compound = dataset.compounds.find(
      (candidate) => candidate.id === mapping.compoundId,
    );

    if (sponsor === undefined || compound === undefined) {
      throw new Error("INVALID_COMPARISON_DATA");
    }

    const registeredTrials = mapping.nctIds.map((nctId) => {
      const snapshot = dataset.sourceSnapshots.find(
        (candidate) => candidate.externalId === nctId,
      );
      const fixture = snapshot
        ? fixturesBySnapshotId.get(snapshot.id)
        : undefined;

      if (snapshot === undefined || fixture === undefined) {
        throw new Error("INVALID_COMPARISON_DATA");
      }

      return {
        nctId,
        trialHref: `/trials/${nctId}`,
        officialSourceUrl: snapshot.humanStudyUrl,
        apiRequestUrl: snapshot.apiRequestUrl,
        reportedSponsorOrganisation:
          fixture.reportedSponsorOrganisation,
        reportedConditions: fixture.reportedConditions,
        reportedInterventions: fixture.reportedInterventions,
        overallStatus: fixture.overallStatus,
        registeredStartDate: normalizeComparisonPartialDate(
          fixture.registeredStartDate,
        ),
        registryLastUpdatePostedDate: normalizeComparisonPartialDate(
          fixture.registryLastUpdatePostedDate,
        ),
        retrievedAt: fixture.retrievedAt,
        processedAt: fixture.processedAt,
        evidenceClass: "STRUCTURED_EXTRACTION" as const,
        provenance: {
          sourceId: snapshot.sourceId,
          policyVersion: snapshot.policyVersion,
          sourceSnapshotId: snapshot.id,
          responseSha256: fixture.responseSha256,
          fieldLocators: snapshot.fieldLocators,
        },
      };
    });
    const countReferences = registeredTrials.map((trial) => ({
      sourceId: trial.provenance.sourceId,
      policyVersion: trial.provenance.policyVersion,
      sourceSnapshotId: trial.provenance.sourceSnapshotId,
      nctId: trial.nctId,
      locator: trial.provenance.fieldLocators.nctId,
    }));
    const mappingReferences = mapping.evidence.flatMap((evidence) => {
      const trial = registeredTrials.find(
        (candidate) =>
          candidate.provenance.sourceSnapshotId === evidence.sourceSnapshotId,
      );

      if (trial === undefined) {
        throw new Error("INVALID_COMPARISON_DATA");
      }

      return evidence.locators.map((locator) => ({
        sourceId: trial.provenance.sourceId,
        policyVersion: trial.provenance.policyVersion,
        sourceSnapshotId: trial.provenance.sourceSnapshotId,
        nctId: trial.nctId,
        locator,
      }));
    });

    return [
      comparisonProgrammeSchema.parse({
        slug: programme.slug,
        canonicalLabel: programme.canonicalLabel,
        programmeHref: `/programs/${programme.slug}`,
        mapping: {
          assertionId: mapping.id,
          reviewStatus: mapping.reviewStatus,
          resolutionState: mapping.resolutionState,
          reportedSponsorOrganisation: sponsor.canonicalLabel,
          candidateCompound: compound.canonicalLabel,
          evidenceClass: mapping.evidenceClass,
          approvalBasis: mapping.approvalBasis,
          reviewPacketSha256: mapping.reviewPacketSha256,
          reviewRationale: mapping.reviewRationale,
          caveats: programme.conflicts,
          provenanceReferences: mappingReferences,
        },
        registeredTrials,
        registeredTrialCount: deriveRegisteredTrialCount(countReferences),
        explicitUnknowns: programme.explicitUnknowns.map((statement) => ({
          statement,
          displayValue: "Not established from approved sources." as const,
          evidenceClass: "UNKNOWN" as const,
        })),
      }),
    ];
  });

  return comparisonCatalogSchema.parse({
    datasetVersion: dataset.datasetVersion,
    datasetUpdatedAt: dataset.updatedAt,
    candidates,
  });
}

export function parseComparisonSelection(
  parametersInput: unknown,
  catalog: ComparisonCatalog,
): ComparisonSelection {
  return parseComparisonSelectionForKnownSlugs(
    parametersInput,
    catalog.candidates.map((candidate) => candidate.slug),
  );
}

export function parseComparisonSelectionForKnownSlugs(
  parametersInput: unknown,
  knownSlugsInput: unknown,
): ComparisonSelection {
  const knownSlugs = new Set(
    z.array(programmeSlugSchema).min(1).max(20).parse(knownSlugsInput),
  );

  if (
    parametersInput === null ||
    typeof parametersInput !== "object" ||
    Array.isArray(parametersInput)
  ) {
    return invalidSelection();
  }

  const parameters = parametersInput as Record<string, unknown>;
  const keys = Object.keys(parameters);

  if (keys.length === 0) {
    return { state: "selection", selectedSlugs: [] };
  }

  if (keys.length !== 1 || keys[0] !== "programme") {
    return invalidSelection();
  }

  const rawValue = parameters.programme;
  const values = typeof rawValue === "string"
    ? [rawValue]
    : Array.isArray(rawValue) && rawValue.every((value) => typeof value === "string")
      ? rawValue
      : null;

  if (values === null || values.length === 0 || values.length > 4) {
    return invalidSelection();
  }

  if (
    values.some(
      (value) =>
        !programmeSlugSchema.safeParse(value).success ||
        /\p{Cc}/u.test(value) ||
        !knownSlugs.has(value),
    ) ||
    new Set(values).size !== values.length
  ) {
    return invalidSelection();
  }

  if (values.length === 1) {
    return { state: "too_few", selectedSlugs: [values[0]!] };
  }

  return {
    state: "ready",
    selectedSlugs: values as [string, string, ...string[]],
  };
}

export function eligibleComparisonProgrammeSlugs(
  datasetInput: unknown,
): readonly string[] {
  const dataset = programmeMappingDatasetSchema.parse(datasetInput);

  return dataset.programmes.flatMap((programme) => {
    const mapping = dataset.mappingAssertions.find(
      (assertion) => assertion.id === programme.mappingAssertionId,
    );

    return mapping?.reviewStatus === "APPROVED" &&
      mapping.resolutionState === "RESOLVED"
      ? [programme.slug]
      : [];
  });
}

export function buildComparison(
  catalogInput: unknown,
  selectedSlugsInput: unknown,
): ComparisonResult {
  const catalog = comparisonCatalogSchema.parse(catalogInput);
  const selectedSlugs = z
    .array(programmeSlugSchema)
    .min(2)
    .max(4)
    .parse(selectedSlugsInput);

  if (new Set(selectedSlugs).size !== selectedSlugs.length) {
    throw new Error("INVALID_COMPARISON_SELECTION");
  }

  const selected = new Set(selectedSlugs);
  const programmes = catalog.candidates.filter((candidate) =>
    selected.has(candidate.slug),
  );

  if (programmes.length !== selectedSlugs.length) {
    throw new Error("INVALID_COMPARISON_SELECTION");
  }

  return comparisonResultSchema.parse({
    datasetVersion: catalog.datasetVersion,
    datasetUpdatedAt: catalog.datasetUpdatedAt,
    programmes,
  });
}

function uniqueFixtureMap(
  fixtures: readonly ComparisonFixtureRecord[],
): ReadonlyMap<string, ComparisonFixtureRecord> {
  const bySnapshotId = new Map<string, ComparisonFixtureRecord>();
  const nctIds = new Set<string>();

  for (const fixture of fixtures) {
    if (
      bySnapshotId.has(fixture.sourceSnapshotId) ||
      nctIds.has(fixture.externalId)
    ) {
      throw new Error("INVALID_COMPARISON_DATA");
    }

    bySnapshotId.set(fixture.sourceSnapshotId, fixture);
    nctIds.add(fixture.externalId);
  }

  return bySnapshotId;
}

function fixtureMatchesSnapshot(
  fixture: ComparisonFixtureRecord,
  snapshot: z.infer<
    typeof programmeMappingDatasetSchema
  >["sourceSnapshots"][number],
): boolean {
  const observed = snapshot.observedRegistryFacts;

  return (
    fixture.sourceId === snapshot.sourceId &&
    fixture.policyVersion === snapshot.policyVersion &&
    fixture.externalId === snapshot.externalId &&
    fixture.responseSha256 === snapshot.responseSha256 &&
    fixture.retrievedAt === snapshot.retrievedAt &&
    fixture.processedAt === snapshot.processedAt &&
    fixture.reportedSponsorOrganisation ===
      observed.reportedSponsorOrganisation &&
    sameStrings(fixture.reportedConditions, observed.reportedConditions) &&
    sameStrings(
      fixture.reportedInterventions,
      observed.reportedInterventions,
    ) &&
    fixture.overallStatus === observed.overallStatus &&
    fixture.registeredStartDate === observed.registeredStartDate &&
    fixture.registryLastUpdatePostedDate ===
      observed.registryLastUpdatePostedDate
  );
}

function sameStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function normalizeComparisonPartialDate(
  valueInput: unknown,
): z.infer<typeof partialDateSchema> {
  const value = partialDateValueSchema.parse(valueInput);
  const precision = value.length === 4
    ? "YEAR"
    : value.length === 7
      ? "MONTH"
      : "DAY";

  return partialDateSchema.parse({ value, precision });
}

function invalidSelection(): ComparisonSelection {
  return { state: "invalid", selectedSlugs: [] };
}
