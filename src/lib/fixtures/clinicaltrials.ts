import { z } from "zod";

const nonEmptyTextSchema = z.string().trim().min(1);
const dateSchema = z.iso.date();

const clinicalTrialsStudySchema = z.object({
  protocolSection: z.object({
    identificationModule: z.object({
      nctId: z.string().regex(/^NCT\d{8}$/),
      briefTitle: nonEmptyTextSchema,
    }),
    statusModule: z.object({
      overallStatus: nonEmptyTextSchema,
      startDateStruct: z.object({
        date: dateSchema,
      }),
      lastUpdatePostDateStruct: z.object({
        date: dateSchema,
      }),
    }),
    sponsorCollaboratorsModule: z.object({
      leadSponsor: z.object({
        name: nonEmptyTextSchema,
      }),
    }),
    conditionsModule: z.object({
      conditions: z.array(nonEmptyTextSchema).min(1),
    }),
    armsInterventionsModule: z.object({
      interventions: z
        .array(
          z.object({
            name: nonEmptyTextSchema,
          }),
        )
        .min(1),
    }),
  }),
});

export const clinicalTrialsFixtureSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  studies: z.array(clinicalTrialsStudySchema).min(1),
  nextPageToken: nonEmptyTextSchema.optional(),
});

export const clinicalTrialsFixtureMetadataSchema = z
  .object({
    sourceId: z.literal("SRC-CTG"),
    provider: z.literal("ClinicalTrials.gov"),
    externalId: z.string().regex(/^NCT\d{8}$/),
    sourceUrl: z
      .url()
      .refine((value) => {
        if (!URL.canParse(value)) {
          return false;
        }

        const url = new URL(value);
        return url.protocol === "https:" && url.hostname === "clinicaltrials.gov";
      }),
    retrievedAt: z.iso.datetime({ offset: true }),
    processedAt: z.iso.datetime({ offset: true }),
    registryLastUpdatePostedDate: dateSchema,
    contentSha256: z.string().regex(/^[a-f0-9]{64}$/),
    transformation: nonEmptyTextSchema,
    rightsStatus: nonEmptyTextSchema,
    attribution: nonEmptyTextSchema,
  })
  .strict();
