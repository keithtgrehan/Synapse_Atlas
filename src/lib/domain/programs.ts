import { z } from "zod";

import { nctIdSchema } from "./trials";
import {
  claimReviewStatusSchema,
  offsetDateTimeSchema,
  processingFollowsRetrieval,
  sha256HexSchema,
} from "../evidence/provenance";
import {
  clinicalTrialsPolicy,
  evaluateSourceRequest,
} from "../sources/policies";

const nonBlankTextSchema = z.string().trim().min(1).max(5_000);
const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const programmeSlugSchema = stableIdSchema.max(100);

const programmeSnapshotFields = [
  "NCTId",
  "BriefTitle",
  "OverallStatus",
  "StartDate",
  "LastUpdatePostDate",
  "LeadSponsorName",
  "Condition",
  "InterventionName",
] as const;

export const mappingResolutionStateValues = [
  "RESOLVED",
  "UNRESOLVED",
  "CONFLICTING",
] as const;

export const mappingResolutionStateSchema = z.enum(
  mappingResolutionStateValues,
);

const fieldLocatorsSchema = z
  .object({
    nctId: nonBlankTextSchema,
    briefTitle: nonBlankTextSchema,
    reportedSponsorOrganisation: nonBlankTextSchema,
    reportedConditions: nonBlankTextSchema,
    reportedInterventions: nonBlankTextSchema,
    registryLastUpdatePostedDate: nonBlankTextSchema,
  })
  .strict();

const observedRegistryFactsSchema = z
  .object({
    nctId: nctIdSchema,
    briefTitle: nonBlankTextSchema,
    reportedSponsorOrganisation: nonBlankTextSchema,
    reportedConditions: z.array(nonBlankTextSchema).min(1).max(100),
    reportedInterventions: z.array(nonBlankTextSchema).min(1).max(200),
    registryLastUpdatePostedDate: z.iso.date(),
  })
  .strict();

export const programmeSourceSnapshotSchema = z
  .object({
    id: stableIdSchema,
    sourceId: z.literal("SRC-CTG"),
    policyVersion: z.literal("1"),
    provider: z.literal("ClinicalTrials.gov"),
    externalId: nctIdSchema,
    apiRequestUrl: z.url(),
    humanStudyUrl: z.url(),
    retrievedAt: offsetDateTimeSchema,
    processedAt: offsetDateTimeSchema,
    registryLastUpdatePostedDate: z.iso.date(),
    responseSha256: sha256HexSchema,
    fixturePath: z
      .string()
      .regex(/^data\/fixtures\/clinicaltrials\.gov\/NCT\d{8}\.json$/),
    metadataPath: z
      .string()
      .regex(
        /^data\/fixtures\/clinicaltrials\.gov\/NCT\d{8}\.metadata\.json$/,
      ),
    evidenceClass: z.literal("STRUCTURED_EXTRACTION"),
    attribution: nonBlankTextSchema,
    fieldLocators: fieldLocatorsSchema,
    observedRegistryFacts: observedRegistryFactsSchema,
  })
  .strict()
  .superRefine((snapshot, context) => {
    if (!processingFollowsRetrieval(snapshot.retrievedAt, snapshot.processedAt)) {
      context.addIssue({
        code: "custom",
        message: "processedAt must be at or after retrievedAt",
        path: ["processedAt"],
      });
    }

    const requestDecision = evaluateSourceRequest(
      {
        sourceId: snapshot.sourceId,
        policyVersion: snapshot.policyVersion,
        method: "GET",
        url: snapshot.apiRequestUrl,
      },
      [clinicalTrialsPolicy],
      new Date(snapshot.retrievedAt),
    );

    if (!requestDecision.allowed) {
      context.addIssue({
        code: "custom",
        message: `API request URL violates source policy: ${requestDecision.code}`,
        path: ["apiRequestUrl"],
      });
    } else {
      const requestUrl = new URL(snapshot.apiRequestUrl);
      const requiredParameters = new Map<string, string>([
        ["query.id", snapshot.externalId],
        ["pageSize", "1"],
        ["countTotal", "true"],
        ["format", "json"],
        ["fields", programmeSnapshotFields.join(",")],
      ]);
      const parameterEntries = Array.from(requestUrl.searchParams.entries());

      if (
        parameterEntries.length !== requiredParameters.size ||
        parameterEntries.some(([name]) => !requiredParameters.has(name)) ||
        Array.from(requiredParameters).some(
          ([name, expectedValue]) => {
            const values = requestUrl.searchParams.getAll(name);

            return values.length !== 1 || values[0] !== expectedValue;
          },
        )
      ) {
        context.addIssue({
          code: "custom",
          message:
            "Snapshot request must contain exactly one of every approved parameter and no others",
          path: ["apiRequestUrl"],
        });
      }
    }

    if (
      snapshot.humanStudyUrl !==
      `https://clinicaltrials.gov/study/${snapshot.externalId}`
    ) {
      context.addIssue({
        code: "custom",
        message: "Human study URL must match the NCT identifier",
        path: ["humanStudyUrl"],
      });
    }

    const expectedFixturePath =
      `data/fixtures/clinicaltrials.gov/${snapshot.externalId}.json`;
    const expectedMetadataPath =
      `data/fixtures/clinicaltrials.gov/${snapshot.externalId}.metadata.json`;

    if (snapshot.fixturePath !== expectedFixturePath) {
      context.addIssue({
        code: "custom",
        message: "Fixture path must match the NCT identifier",
        path: ["fixturePath"],
      });
    }

    if (snapshot.metadataPath !== expectedMetadataPath) {
      context.addIssue({
        code: "custom",
        message: "Metadata path must match the NCT identifier",
        path: ["metadataPath"],
      });
    }

    if (snapshot.observedRegistryFacts.nctId !== snapshot.externalId) {
      context.addIssue({
        code: "custom",
        message: "Observed NCT identifier must match snapshot external ID",
        path: ["observedRegistryFacts", "nctId"],
      });
    }

    if (
      snapshot.observedRegistryFacts.registryLastUpdatePostedDate !==
      snapshot.registryLastUpdatePostedDate
    ) {
      context.addIssue({
        code: "custom",
        message: "Registry update date must remain a matching provider fact",
        path: ["observedRegistryFacts", "registryLastUpdatePostedDate"],
      });
    }
  });

const rawAliasSchema = z
  .object({
    value: nonBlankTextSchema,
    sourceSnapshotId: stableIdSchema,
    locator: nonBlankTextSchema,
  })
  .strict();

export const sponsorOrganisationSchema = z
  .object({
    id: stableIdSchema,
    canonicalLabel: nonBlankTextSchema,
    rawAliases: z.array(rawAliasSchema).min(1).max(20),
  })
  .strict();

export const compoundSchema = z
  .object({
    id: stableIdSchema,
    canonicalLabel: nonBlankTextSchema,
    rawAliases: z.array(rawAliasSchema).min(1).max(50),
  })
  .strict();

export const programmeCandidateSchema = z
  .object({
    id: stableIdSchema,
    slug: programmeSlugSchema,
    canonicalLabel: nonBlankTextSchema,
    mappingAssertionId: stableIdSchema,
    companyIdentity: z
      .object({
        state: z.literal("UNKNOWN"),
        rationale: nonBlankTextSchema,
      })
      .strict(),
    explicitUnknowns: z.array(nonBlankTextSchema).min(1).max(20),
    conflicts: z.array(nonBlankTextSchema).max(20),
  })
  .strict();

const mappingEvidenceSchema = z
  .object({
    sourceSnapshotId: stableIdSchema,
    locators: z.array(nonBlankTextSchema).min(1).max(20),
  })
  .strict();

export const programmeMappingAssertionSchema = z
  .object({
    id: stableIdSchema,
    programmeId: stableIdSchema,
    aliases: z.array(nonBlankTextSchema).min(1).max(20),
    reportedSponsorOrganisationId: stableIdSchema,
    compoundId: stableIdSchema,
    nctIds: z.array(nctIdSchema).min(1).max(10),
    evidenceClass: z.literal("HUMAN_INFERENCE"),
    reviewStatus: claimReviewStatusSchema,
    resolutionState: mappingResolutionStateSchema,
    rationale: nonBlankTextSchema,
    evidence: z.array(mappingEvidenceSchema).min(1).max(20),
    reviewerReference: nonBlankTextSchema.optional(),
    reviewRationale: nonBlankTextSchema.optional(),
    reviewedAt: offsetDateTimeSchema.optional(),
  })
  .strict()
  .superRefine((assertion, context) => {
    const normalizedAliases = assertion.aliases.map(normalizeProgrammeAlias);

    if (new Set(normalizedAliases).size !== normalizedAliases.length) {
      context.addIssue({
        code: "custom",
        message: "Aliases must be unique after conservative normalization",
        path: ["aliases"],
      });
    }

    const reviewFields = [
      assertion.reviewerReference,
      assertion.reviewRationale,
      assertion.reviewedAt,
    ];

    if (assertion.reviewStatus === "PENDING") {
      if (reviewFields.some((value) => value !== undefined)) {
        context.addIssue({
          code: "custom",
          message: "Pending mappings cannot carry fabricated review metadata",
          path: ["reviewerReference"],
        });
      }
    } else if (reviewFields.some((value) => value === undefined)) {
      context.addIssue({
        code: "custom",
        message: "Reviewed mappings require reviewer, rationale, and timestamp",
        path: ["reviewerReference"],
      });
    }

    if (
      assertion.reviewStatus === "APPROVED" &&
      assertion.resolutionState !== "RESOLVED"
    ) {
      context.addIssue({
        code: "custom",
        message: "Approved mappings must be valid resolved candidates",
        path: ["resolutionState"],
      });
    }

    if (
      assertion.reviewStatus !== "APPROVED" &&
      assertion.resolutionState === "RESOLVED"
    ) {
      context.addIssue({
        code: "custom",
        message: "Only approved mappings may be marked resolved",
        path: ["resolutionState"],
      });
    }
  });

export const programmeMappingDatasetSchema = z
  .object({
    datasetVersion: z.literal("1.0.0"),
    updatedAt: offsetDateTimeSchema,
    sourceBoundary: z
      .object({
        sourceId: z.literal("SRC-CTG"),
        policyVersion: z.literal("1"),
        provider: z.literal("ClinicalTrials.gov"),
        statement: nonBlankTextSchema,
      })
      .strict(),
    sourceSnapshots: z.array(programmeSourceSnapshotSchema).min(1).max(3),
    sponsorOrganisations: z.array(sponsorOrganisationSchema).min(1).max(3),
    compounds: z.array(compoundSchema).min(1).max(3),
    programmes: z.array(programmeCandidateSchema).min(1).max(3),
    mappingAssertions: z
      .array(programmeMappingAssertionSchema)
      .min(1)
      .max(3),
  })
  .strict()
  .superRefine((dataset, context) => {
    const sourceIds = uniqueValues(
      dataset.sourceSnapshots.map((snapshot) => snapshot.id),
      context,
      ["sourceSnapshots"],
      "source snapshot ID",
    );
    const sourceNctIds = uniqueValues(
      dataset.sourceSnapshots.map((snapshot) => snapshot.externalId),
      context,
      ["sourceSnapshots"],
      "source NCT identifier",
    );
    const sponsorIds = uniqueValues(
      dataset.sponsorOrganisations.map((sponsor) => sponsor.id),
      context,
      ["sponsorOrganisations"],
      "sponsor organisation ID",
    );
    const compoundIds = uniqueValues(
      dataset.compounds.map((compound) => compound.id),
      context,
      ["compounds"],
      "compound ID",
    );
    const programmeIds = uniqueValues(
      dataset.programmes.map((programme) => programme.id),
      context,
      ["programmes"],
      "programme ID",
    );
    uniqueValues(
      dataset.programmes.map((programme) => programme.slug),
      context,
      ["programmes"],
      "programme slug",
    );
    const assertionIds = uniqueValues(
      dataset.mappingAssertions.map((assertion) => assertion.id),
      context,
      ["mappingAssertions"],
      "mapping assertion ID",
    );

    const snapshotsById = new Map(
      dataset.sourceSnapshots.map((snapshot) => [snapshot.id, snapshot]),
    );
    const assertionsById = new Map(
      dataset.mappingAssertions.map((assertion) => [assertion.id, assertion]),
    );

    for (const [index, sponsor] of dataset.sponsorOrganisations.entries()) {
      for (const [aliasIndex, alias] of sponsor.rawAliases.entries()) {
        const snapshot = snapshotsById.get(alias.sourceSnapshotId);

        if (snapshot === undefined) {
          orphanIssue(context, ["sponsorOrganisations", index, "rawAliases", aliasIndex], "source snapshot");
          continue;
        }

        if (
          alias.value !== snapshot.observedRegistryFacts.reportedSponsorOrganisation ||
          alias.locator !== snapshot.fieldLocators.reportedSponsorOrganisation
        ) {
          context.addIssue({
            code: "custom",
            message: "Sponsor raw alias must match its registry observation and locator",
            path: ["sponsorOrganisations", index, "rawAliases", aliasIndex],
          });
        }
      }
    }

    for (const [index, compound] of dataset.compounds.entries()) {
      for (const [aliasIndex, alias] of compound.rawAliases.entries()) {
        const snapshot = snapshotsById.get(alias.sourceSnapshotId);

        if (snapshot === undefined) {
          orphanIssue(context, ["compounds", index, "rawAliases", aliasIndex], "source snapshot");
          continue;
        }

        const interventionIndex = snapshot.observedRegistryFacts.reportedInterventions.indexOf(alias.value);
        const expectedLocator =
          `${snapshot.fieldLocators.reportedInterventions}/${interventionIndex}/name`;

        if (interventionIndex < 0 || alias.locator !== expectedLocator) {
          context.addIssue({
            code: "custom",
            message: "Compound raw alias must match a registry intervention and exact locator",
            path: ["compounds", index, "rawAliases", aliasIndex],
          });
        }
      }
    }

    for (const [index, programme] of dataset.programmes.entries()) {
      const assertion = assertionsById.get(programme.mappingAssertionId);

      if (
        assertion === undefined ||
        !assertionIds.has(programme.mappingAssertionId) ||
        assertion.programmeId !== programme.id
      ) {
        orphanIssue(context, ["programmes", index, "mappingAssertionId"], "matching mapping assertion");
      }
    }

    for (const [index, assertion] of dataset.mappingAssertions.entries()) {
      if (!programmeIds.has(assertion.programmeId)) {
        orphanIssue(context, ["mappingAssertions", index, "programmeId"], "programme");
      }
      if (!sponsorIds.has(assertion.reportedSponsorOrganisationId)) {
        orphanIssue(context, ["mappingAssertions", index, "reportedSponsorOrganisationId"], "sponsor organisation");
      }
      if (!compoundIds.has(assertion.compoundId)) {
        orphanIssue(context, ["mappingAssertions", index, "compoundId"], "compound");
      }

      for (const [nctIndex, nctId] of assertion.nctIds.entries()) {
        if (!sourceNctIds.has(nctId)) {
          orphanIssue(context, ["mappingAssertions", index, "nctIds", nctIndex], "source NCT record");
        }
      }

      for (const [evidenceIndex, evidence] of assertion.evidence.entries()) {
        const snapshot = snapshotsById.get(evidence.sourceSnapshotId);

        if (snapshot === undefined || !sourceIds.has(evidence.sourceSnapshotId)) {
          orphanIssue(context, ["mappingAssertions", index, "evidence", evidenceIndex], "source snapshot");
          continue;
        }

        if (!assertion.nctIds.includes(snapshot.externalId)) {
          context.addIssue({
            code: "custom",
            message: "Mapping evidence must reference one of the assertion NCT records",
            path: ["mappingAssertions", index, "evidence", evidenceIndex],
          });
        }

        const allowedLocators = Object.values(snapshot.fieldLocators);

        for (const locator of evidence.locators) {
          if (!allowedLocators.some((allowed) => locator === allowed || locator.startsWith(`${allowed}/`))) {
            context.addIssue({
              code: "custom",
              message: "Mapping evidence locator must exist in its source snapshot",
              path: ["mappingAssertions", index, "evidence", evidenceIndex, "locators"],
            });
          }
        }
      }
    }
  });

export type ProgrammeMappingDataset = z.infer<
  typeof programmeMappingDatasetSchema
>;
export type ProgrammeCandidate = z.infer<typeof programmeCandidateSchema>;
export type ProgrammeMappingAssertion = z.infer<
  typeof programmeMappingAssertionSchema
>;
export type ProgrammeSourceSnapshot = z.infer<
  typeof programmeSourceSnapshotSchema
>;

export type ProgrammeView = {
  programme: ProgrammeCandidate;
  mapping: ProgrammeMappingAssertion;
  sponsorOrganisation: z.infer<typeof sponsorOrganisationSchema>;
  compound: z.infer<typeof compoundSchema>;
  sourceSnapshots: readonly ProgrammeSourceSnapshot[];
};

function uniqueValues(
  values: readonly string[],
  context: z.RefinementCtx,
  path: PropertyKey[],
  label: string,
): ReadonlySet<string> {
  const unique = new Set(values);

  if (unique.size !== values.length) {
    context.addIssue({
      code: "custom",
      message: `Every ${label} must be unique`,
      path,
    });
  }

  return unique;
}

function orphanIssue(
  context: z.RefinementCtx,
  path: PropertyKey[],
  entity: string,
): void {
  context.addIssue({
    code: "custom",
    message: `Reference must identify an existing ${entity}`,
    path,
  });
}

export function normalizeProgrammeAlias(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/gu, " ")
    .toLowerCase();
}

function compareStable(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function buildProgrammeView(
  dataset: ProgrammeMappingDataset,
  programme: ProgrammeCandidate,
): ProgrammeView {
  const mapping = dataset.mappingAssertions.find(
    (candidate) => candidate.id === programme.mappingAssertionId,
  );

  if (mapping === undefined) {
    throw new Error("INVALID_PROGRAMME_DATASET");
  }

  const sponsorOrganisation = dataset.sponsorOrganisations.find(
    (candidate) => candidate.id === mapping.reportedSponsorOrganisationId,
  );
  const compound = dataset.compounds.find(
    (candidate) => candidate.id === mapping.compoundId,
  );
  const sourceSnapshots = mapping.nctIds.map((nctId) =>
    dataset.sourceSnapshots.find((snapshot) => snapshot.externalId === nctId),
  );

  if (
    sponsorOrganisation === undefined ||
    compound === undefined ||
    sourceSnapshots.some((snapshot) => snapshot === undefined)
  ) {
    throw new Error("INVALID_PROGRAMME_DATASET");
  }

  return {
    programme,
    mapping,
    sponsorOrganisation,
    compound,
    sourceSnapshots: sourceSnapshots as ProgrammeSourceSnapshot[],
  };
}

export function listProgrammes(
  dataset: ProgrammeMappingDataset,
): readonly ProgrammeView[] {
  return dataset.programmes
    .map((programme) => buildProgrammeView(dataset, programme))
    .sort((left, right) =>
      compareStable(
        `${normalizeProgrammeAlias(left.programme.canonicalLabel)}\u0000${left.programme.slug}`,
        `${normalizeProgrammeAlias(right.programme.canonicalLabel)}\u0000${right.programme.slug}`,
      ),
    );
}

export function getProgrammeBySlug(
  dataset: ProgrammeMappingDataset,
  slug: string,
): ProgrammeView | null {
  if (!programmeSlugSchema.safeParse(slug).success) {
    return null;
  }

  const programme = dataset.programmes.find(
    (candidate) => candidate.slug === slug,
  );

  return programme === undefined
    ? null
    : buildProgrammeView(dataset, programme);
}

export const programmeSearchQuerySchema = z
  .string()
  .max(120)
  .refine((value) => !/\p{Cc}/u.test(value), {
    message: "Search terms cannot contain control characters",
  });

export type ProgrammeSearchParameters =
  | { valid: true; query: string }
  | { valid: false; query: "" };

export function parseProgrammeSearchParameters(
  parameters: Record<string, string | string[] | undefined>,
): ProgrammeSearchParameters {
  const parsed = z
    .object({ q: programmeSearchQuerySchema.optional() })
    .strict()
    .safeParse(parameters);

  if (!parsed.success) {
    return { valid: false, query: "" };
  }

  const query = parsed.data.q ?? "";
  const normalized = normalizeProgrammeAlias(query);

  if (normalized.length > 120) {
    return { valid: false, query: "" };
  }

  return { valid: true, query };
}

export function searchProgrammes(
  dataset: ProgrammeMappingDataset,
  rawQuery: string,
): readonly ProgrammeView[] {
  const query = programmeSearchQuerySchema.parse(rawQuery);
  const normalizedQuery = normalizeProgrammeAlias(query);
  const programmes = listProgrammes(dataset);

  if (normalizedQuery === "") {
    return programmes;
  }

  return programmes.filter((view) => {
    const searchableValues = [
      view.programme.canonicalLabel,
      ...view.mapping.aliases,
      view.sponsorOrganisation.canonicalLabel,
      ...view.sponsorOrganisation.rawAliases.map((alias) => alias.value),
      view.compound.canonicalLabel,
      ...view.compound.rawAliases.map((alias) => alias.value),
      ...view.mapping.nctIds,
      ...view.sourceSnapshots.flatMap(
        (snapshot) => snapshot.observedRegistryFacts.reportedConditions,
      ),
    ];

    return searchableValues.some((value) =>
      normalizeProgrammeAlias(value).includes(normalizedQuery),
    );
  });
}

export type ProgrammeResolutionCandidate = {
  mappingAssertionId: string;
  programmeId: string;
  reviewStatus: z.infer<typeof claimReviewStatusSchema>;
  resolutionState: z.infer<typeof mappingResolutionStateSchema>;
};

export type ProgrammeResolution = {
  state: z.infer<typeof mappingResolutionStateSchema>;
  normalizedInput: string;
  candidates: readonly ProgrammeResolutionCandidate[];
  winnerProgrammeId: string | null;
};

export function resolveProgrammeAlias(
  input: string,
  assertions: readonly ProgrammeMappingAssertion[],
): ProgrammeResolution {
  const normalizedInput = normalizeProgrammeAlias(input);
  const candidates = assertions
    .filter((assertion) =>
      assertion.aliases.some(
        (alias) => normalizeProgrammeAlias(alias) === normalizedInput,
      ),
    )
    .map((assertion) => ({
      mappingAssertionId: assertion.id,
      programmeId: assertion.programmeId,
      reviewStatus: assertion.reviewStatus,
      resolutionState: assertion.resolutionState,
    }))
    .sort((left, right) =>
      compareStable(
        `${left.programmeId}\u0000${left.mappingAssertionId}`,
        `${right.programmeId}\u0000${right.mappingAssertionId}`,
      ),
    );
  const approvedProgrammeIds = Array.from(
    new Set(
      candidates
        .filter(
          (candidate) =>
            candidate.reviewStatus === "APPROVED" &&
            candidate.resolutionState === "RESOLVED",
        )
        .map((candidate) => candidate.programmeId),
    ),
  ).sort(compareStable);

  if (approvedProgrammeIds.length === 1) {
    return {
      state: "RESOLVED",
      normalizedInput,
      candidates,
      winnerProgrammeId: approvedProgrammeIds[0] ?? null,
    };
  }

  return {
    state:
      approvedProgrammeIds.length > 1 ? "CONFLICTING" : "UNRESOLVED",
    normalizedInput,
    candidates,
    winnerProgrammeId: null,
  };
}

export function reviewStatusLabel(
  status: z.infer<typeof claimReviewStatusSchema>,
): string {
  switch (status) {
    case "PENDING":
      return "Pending review";
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    case "NEEDS_REVISION":
      return "Needs revision";
  }
}

export function resolutionStateLabel(
  state: z.infer<typeof mappingResolutionStateSchema>,
): string {
  switch (state) {
    case "RESOLVED":
      return "Resolved";
    case "CONFLICTING":
      return "Conflicting";
    case "UNRESOLVED":
      return "Unknown";
  }
}
