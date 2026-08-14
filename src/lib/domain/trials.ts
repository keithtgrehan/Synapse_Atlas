import { z } from "zod";

import {
  offsetDateTimeSchema,
  processingFollowsRetrieval,
  sha256HexSchema,
} from "../evidence/provenance";

const nonBlankTextSchema = z.string().trim().min(1);
const boundedTextSchema = nonBlankTextSchema.max(50_000);

export const nctIdSchema = z.string().regex(/^NCT\d{8}$/);

export const partialDateValueSchema = z
  .string()
  .regex(/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/)
  .superRefine((value, context) => {
    const [, monthText, dayText] = value.split("-");

    if (monthText === undefined) {
      return;
    }

    const month = Number(monthText);

    if (month < 1 || month > 12) {
      context.addIssue({ code: "custom", message: "Invalid partial-date month" });
      return;
    }

    if (dayText === undefined) {
      return;
    }

    const year = Number(value.slice(0, 4));
    const day = Number(dayText);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    if (day < 1 || day > daysInMonth) {
      context.addIssue({ code: "custom", message: "Invalid partial-date day" });
    }
  });

const partialDateStructSchema = z.object({
  date: partialDateValueSchema,
  type: nonBlankTextSchema.max(100).optional(),
});

const interventionSchema = z.object({
  name: nonBlankTextSchema.max(1_000),
  type: nonBlankTextSchema.max(100).optional(),
});

const outcomeSchema = z.object({
  measure: nonBlankTextSchema.max(5_000),
  timeFrame: boundedTextSchema.optional(),
});

export const clinicalTrialsApiStudySchema = z.object({
  protocolSection: z.object({
    identificationModule: z.object({
      nctId: nctIdSchema,
      briefTitle: nonBlankTextSchema.max(5_000),
      officialTitle: boundedTextSchema.optional(),
    }),
    statusModule: z
      .object({
        overallStatus: nonBlankTextSchema.max(100).optional(),
        startDateStruct: partialDateStructSchema.optional(),
        primaryCompletionDateStruct: partialDateStructSchema.optional(),
        completionDateStruct: partialDateStructSchema.optional(),
        lastUpdatePostDateStruct: partialDateStructSchema.optional(),
      })
      .optional(),
    sponsorCollaboratorsModule: z
      .object({
        leadSponsor: z
          .object({
            name: nonBlankTextSchema.max(1_000),
            class: nonBlankTextSchema.max(100).optional(),
          })
          .optional(),
      })
      .optional(),
    descriptionModule: z
      .object({ briefSummary: boundedTextSchema.optional() })
      .optional(),
    conditionsModule: z
      .object({ conditions: z.array(nonBlankTextSchema.max(1_000)).max(100).optional() })
      .optional(),
    designModule: z
      .object({
        studyType: nonBlankTextSchema.max(100).optional(),
        phases: z.array(nonBlankTextSchema.max(100)).max(20).optional(),
        enrollmentInfo: z
          .object({
            count: z.number().int().nonnegative(),
            type: nonBlankTextSchema.max(100).optional(),
          })
          .optional(),
      })
      .optional(),
    armsInterventionsModule: z
      .object({ interventions: z.array(interventionSchema).max(200).optional() })
      .optional(),
    outcomesModule: z
      .object({ primaryOutcomes: z.array(outcomeSchema).max(100).optional() })
      .optional(),
  }),
});

export const clinicalTrialsPageTokenSchema = z
  .string()
  .trim()
  .min(1)
  .max(2_048)
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), {
    message: "Page tokens cannot contain control characters",
  });

export const clinicalTrialsApiPageSchema = z.object({
  totalCount: z.number().int().nonnegative().optional(),
  studies: z.array(clinicalTrialsApiStudySchema).max(10),
  nextPageToken: clinicalTrialsPageTokenSchema.optional(),
});

export type ClinicalTrialsApiStudy = z.infer<
  typeof clinicalTrialsApiStudySchema
>;

export type Availability<T> =
  | { state: "reported"; value: T }
  | { state: "not_reported"; value: null }
  | { state: "not_requested"; value: null };

export type PartialDate = {
  value: string;
  precision: "YEAR" | "MONTH" | "DAY";
  type: string | null;
};

export type TrialIntervention = { name: string; type: string | null };
export type TrialOutcome = { measure: string; timeFrame: string | null };

export type TrialProvenance = {
  sourcePolicyId: "SRC-CTG";
  policyVersion: "1";
  provider: "ClinicalTrials.gov";
  externalId: string;
  apiRequestUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  processedAt: string;
  registryLastUpdatePostedDate: string | null;
  contentSha256: string;
  evidenceClass: "STRUCTURED_EXTRACTION";
  transformation: "clinicaltrials-api-v1";
  attribution: string;
  fieldLocators: Readonly<Record<string, string>>;
};

export type TrialRecord = {
  nctId: string;
  briefTitle: string;
  officialTitle: Availability<string>;
  overallStatus: Availability<string>;
  studyType: Availability<string>;
  phases: Availability<readonly string[]>;
  leadSponsor: Availability<{ name: string; class: string | null }>;
  conditions: Availability<readonly string[]>;
  interventions: Availability<readonly TrialIntervention[]>;
  enrollment: Availability<{ count: number; type: string | null }>;
  startDate: Availability<PartialDate>;
  primaryCompletionDate: Availability<PartialDate>;
  completionDate: Availability<PartialDate>;
  registryLastUpdatePostedDate: Availability<PartialDate>;
  briefSummary: Availability<string>;
  primaryOutcomes: Availability<readonly TrialOutcome[]>;
  provenance: TrialProvenance;
};

export const clinicalTrialsFieldValues = [
  "NCTId",
  "BriefTitle",
  "OfficialTitle",
  "OverallStatus",
  "StartDate",
  "PrimaryCompletionDate",
  "CompletionDate",
  "LastUpdatePostDate",
  "LeadSponsorName",
  "LeadSponsorClass",
  "Condition",
  "InterventionName",
  "InterventionType",
  "Phase",
  "EnrollmentCount",
  "EnrollmentType",
  "StudyType",
  "BriefSummary",
  "PrimaryOutcomeMeasure",
  "PrimaryOutcomeTimeFrame",
] as const;

export type ClinicalTrialsField = (typeof clinicalTrialsFieldValues)[number];

type NormalizeTrialInput = {
  apiRequestUrl: string;
  retrievedAt: string;
  processedAt: string;
  contentSha256: string;
  requestedFields: ReadonlySet<string>;
  studyIndex: number;
};

function availability<T>(
  requested: boolean,
  value: T | null | undefined,
): Availability<T> {
  if (!requested) {
    return { state: "not_requested", value: null };
  }

  if (value === undefined || value === null) {
    return { state: "not_reported", value: null };
  }

  return { state: "reported", value };
}

function collectionAvailability<T>(
  requested: boolean,
  value: readonly T[] | null | undefined,
): Availability<readonly T[]> {
  return availability(requested, value?.length ? value : null);
}

function normalizePartialDate(
  value: z.infer<typeof partialDateStructSchema> | undefined,
): PartialDate | null {
  if (value === undefined) {
    return null;
  }

  const precision = value.date.length === 4
    ? "YEAR"
    : value.date.length === 7
      ? "MONTH"
      : "DAY";

  return { value: value.date, precision, type: value.type ?? null };
}

function fieldLocators(
  studyIndex: number,
  study: ClinicalTrialsApiStudy,
  requestedFields: ReadonlySet<string>,
): Readonly<Record<string, string>> {
  const root = `/studies/${studyIndex}/protocolSection`;
  const {
    identificationModule,
    statusModule,
    sponsorCollaboratorsModule,
    conditionsModule,
    armsInterventionsModule,
    designModule,
    descriptionModule,
    outcomesModule,
  } = study.protocolSection;
  const locators: Record<string, string> = {
    nctId: `${root}/identificationModule/nctId`,
    briefTitle: `${root}/identificationModule/briefTitle`,
  };

  const add = (field: string, locator: string, isReported: boolean) => {
    if (isReported) {
      locators[field] = locator;
    }
  };

  add(
    "officialTitle",
    `${root}/identificationModule/officialTitle`,
    requestedFields.has("OfficialTitle") &&
      identificationModule.officialTitle !== undefined,
  );
  add(
    "overallStatus",
    `${root}/statusModule/overallStatus`,
    requestedFields.has("OverallStatus") &&
      statusModule?.overallStatus !== undefined,
  );
  add(
    "studyType",
    `${root}/designModule/studyType`,
    requestedFields.has("StudyType") && designModule?.studyType !== undefined,
  );
  add(
    "phases",
    `${root}/designModule/phases`,
    requestedFields.has("Phase") && Boolean(designModule?.phases?.length),
  );
  add(
    "leadSponsor",
    `${root}/sponsorCollaboratorsModule/leadSponsor`,
    requested(
      requestedFields,
      "LeadSponsorName",
      "LeadSponsorClass",
    ) && sponsorCollaboratorsModule?.leadSponsor !== undefined,
  );
  add(
    "conditions",
    `${root}/conditionsModule/conditions`,
    requestedFields.has("Condition") && Boolean(conditionsModule?.conditions?.length),
  );
  add(
    "interventions",
    `${root}/armsInterventionsModule/interventions`,
    requested(
      requestedFields,
      "InterventionName",
      "InterventionType",
    ) && Boolean(armsInterventionsModule?.interventions?.length),
  );
  add(
    "enrollment",
    `${root}/designModule/enrollmentInfo`,
    requested(
      requestedFields,
      "EnrollmentCount",
      "EnrollmentType",
    ) && designModule?.enrollmentInfo !== undefined,
  );
  add(
    "startDate",
    `${root}/statusModule/startDateStruct`,
    requestedFields.has("StartDate") && statusModule?.startDateStruct !== undefined,
  );
  add(
    "primaryCompletionDate",
    `${root}/statusModule/primaryCompletionDateStruct`,
    requestedFields.has("PrimaryCompletionDate") &&
      statusModule?.primaryCompletionDateStruct !== undefined,
  );
  add(
    "completionDate",
    `${root}/statusModule/completionDateStruct`,
    requestedFields.has("CompletionDate") &&
      statusModule?.completionDateStruct !== undefined,
  );
  add(
    "registryLastUpdatePostedDate",
    `${root}/statusModule/lastUpdatePostDateStruct/date`,
    requestedFields.has("LastUpdatePostDate") &&
      statusModule?.lastUpdatePostDateStruct !== undefined,
  );
  add(
    "briefSummary",
    `${root}/descriptionModule/briefSummary`,
    requestedFields.has("BriefSummary") &&
      descriptionModule?.briefSummary !== undefined,
  );
  add(
    "primaryOutcomes",
    `${root}/outcomesModule/primaryOutcomes`,
    requested(
      requestedFields,
      "PrimaryOutcomeMeasure",
      "PrimaryOutcomeTimeFrame",
    ) && Boolean(outcomesModule?.primaryOutcomes?.length),
  );

  return Object.freeze(locators);
}

function requested(fields: ReadonlySet<string>, ...names: string[]): boolean {
  return names.some((name) => fields.has(name));
}

export function normalizeClinicalTrial(
  study: ClinicalTrialsApiStudy,
  input: NormalizeTrialInput,
): TrialRecord {
  const {
    identificationModule,
    statusModule,
    sponsorCollaboratorsModule,
    conditionsModule,
    armsInterventionsModule,
    designModule,
    descriptionModule,
    outcomesModule,
  } = study.protocolSection;

  if (!processingFollowsRetrieval(input.retrievedAt, input.processedAt)) {
    throw new Error("INVALID_PROVENANCE_TIME");
  }

  const provenance = {
    sourcePolicyId: "SRC-CTG",
    policyVersion: "1",
    provider: "ClinicalTrials.gov",
    externalId: identificationModule.nctId,
    apiRequestUrl: input.apiRequestUrl,
    sourceUrl: `https://clinicaltrials.gov/study/${identificationModule.nctId}`,
    retrievedAt: input.retrievedAt,
    processedAt: input.processedAt,
    registryLastUpdatePostedDate:
      statusModule?.lastUpdatePostDateStruct?.date ?? null,
    contentSha256: input.contentSha256,
    evidenceClass: "STRUCTURED_EXTRACTION",
    transformation: "clinicaltrials-api-v1",
    attribution: "ClinicalTrials.gov, U.S. National Library of Medicine",
    fieldLocators: fieldLocators(
      input.studyIndex,
      study,
      input.requestedFields,
    ),
  } as const satisfies TrialProvenance;

  const interventions = armsInterventionsModule?.interventions?.map(
    (intervention) => ({
      name: intervention.name,
      type: intervention.type ?? null,
    }),
  );
  const outcomes = outcomesModule?.primaryOutcomes?.map((outcome) => ({
    measure: outcome.measure,
    timeFrame: outcome.timeFrame ?? null,
  }));

  return {
    nctId: identificationModule.nctId,
    briefTitle: identificationModule.briefTitle,
    officialTitle: availability(
      input.requestedFields.has("OfficialTitle"),
      identificationModule.officialTitle,
    ),
    overallStatus: availability(
      input.requestedFields.has("OverallStatus"),
      statusModule?.overallStatus,
    ),
    studyType: availability(
      input.requestedFields.has("StudyType"),
      designModule?.studyType,
    ),
    phases: collectionAvailability(
      input.requestedFields.has("Phase"),
      designModule?.phases,
    ),
    leadSponsor: availability(
      requested(input.requestedFields, "LeadSponsorName", "LeadSponsorClass"),
      sponsorCollaboratorsModule?.leadSponsor === undefined
        ? null
        : {
            name: sponsorCollaboratorsModule.leadSponsor.name,
            class: sponsorCollaboratorsModule.leadSponsor.class ?? null,
          },
    ),
    conditions: collectionAvailability(
      input.requestedFields.has("Condition"),
      conditionsModule?.conditions,
    ),
    interventions: collectionAvailability(
      requested(input.requestedFields, "InterventionName", "InterventionType"),
      interventions,
    ),
    enrollment: availability(
      requested(input.requestedFields, "EnrollmentCount", "EnrollmentType"),
      designModule?.enrollmentInfo === undefined
        ? null
        : {
            count: designModule.enrollmentInfo.count,
            type: designModule.enrollmentInfo.type ?? null,
          },
    ),
    startDate: availability(
      input.requestedFields.has("StartDate"),
      normalizePartialDate(statusModule?.startDateStruct),
    ),
    primaryCompletionDate: availability(
      input.requestedFields.has("PrimaryCompletionDate"),
      normalizePartialDate(statusModule?.primaryCompletionDateStruct),
    ),
    completionDate: availability(
      input.requestedFields.has("CompletionDate"),
      normalizePartialDate(statusModule?.completionDateStruct),
    ),
    registryLastUpdatePostedDate: availability(
      input.requestedFields.has("LastUpdatePostDate"),
      normalizePartialDate(statusModule?.lastUpdatePostDateStruct),
    ),
    briefSummary: availability(
      input.requestedFields.has("BriefSummary"),
      descriptionModule?.briefSummary,
    ),
    primaryOutcomes: collectionAvailability(
      requested(
        input.requestedFields,
        "PrimaryOutcomeMeasure",
        "PrimaryOutcomeTimeFrame",
      ),
      outcomes,
    ),
    provenance,
  };
}

export const trialProvenanceSchema = z
  .object({
    sourcePolicyId: z.literal("SRC-CTG"),
    policyVersion: z.literal("1"),
    provider: z.literal("ClinicalTrials.gov"),
    externalId: nctIdSchema,
    apiRequestUrl: z.url(),
    sourceUrl: z.url(),
    retrievedAt: offsetDateTimeSchema,
    processedAt: offsetDateTimeSchema,
    registryLastUpdatePostedDate: partialDateValueSchema.nullable(),
    contentSha256: sha256HexSchema,
    evidenceClass: z.literal("STRUCTURED_EXTRACTION"),
    transformation: z.literal("clinicaltrials-api-v1"),
    attribution: nonBlankTextSchema,
    fieldLocators: z.record(z.string(), nonBlankTextSchema),
  })
  .strict()
  .superRefine((value, context) => {
    if (!processingFollowsRetrieval(value.retrievedAt, value.processedAt)) {
      context.addIssue({
        code: "custom",
        message: "processedAt must be at or after retrievedAt",
        path: ["processedAt"],
      });
    }

    if (value.sourceUrl !== `https://clinicaltrials.gov/study/${value.externalId}`) {
      context.addIssue({
        code: "custom",
        message: "Canonical source URL must match the external ID",
        path: ["sourceUrl"],
      });
    }
  });

export type TrialFreshness = {
  state: "fresh" | "stale" | "clock_error";
  ageHours: number | null;
  thresholdHours: number;
};

export function getTrialFreshness(
  retrievedAt: string,
  asOf: Date,
  thresholdHours = 48,
): TrialFreshness {
  const retrievedMs = Date.parse(retrievedAt);
  const asOfMs = asOf.getTime();

  if (!Number.isFinite(retrievedMs) || !Number.isFinite(asOfMs)) {
    return { state: "clock_error", ageHours: null, thresholdHours };
  }

  const ageHours = (asOfMs - retrievedMs) / 3_600_000;

  if (ageHours < 0) {
    return { state: "clock_error", ageHours: null, thresholdHours };
  }

  return {
    state: ageHours <= thresholdHours ? "fresh" : "stale",
    ageHours,
    thresholdHours,
  };
}
