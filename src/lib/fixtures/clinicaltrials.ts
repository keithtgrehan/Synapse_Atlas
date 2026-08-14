import { z } from "zod";

import {
  offsetDateTimeSchema,
  processingFollowsRetrieval,
  sha256HexSchema,
} from "../evidence/provenance";
import {
  clinicalTrialsPolicy,
  evaluateSourceRequest,
  type SourcePolicy,
} from "../sources/policies";

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

type ClinicalTrialsFixtureSource = {
  sourceId: string;
  sourceUrl: string;
  retrievedAt: string;
};

export function evaluateClinicalTrialsFixtureSource(
  metadata: ClinicalTrialsFixtureSource,
  policy: SourcePolicy = clinicalTrialsPolicy,
) {
  return evaluateSourceRequest(
    {
      sourceId: metadata.sourceId,
      policyVersion: policy.policyVersion,
      method: "GET",
      url: metadata.sourceUrl,
    },
    [policy],
    new Date(metadata.retrievedAt),
  );
}

export const clinicalTrialsFixtureMetadataSchema = z
  .object({
    sourceId: z.literal("SRC-CTG"),
    provider: z.literal("ClinicalTrials.gov"),
    externalId: z.string().regex(/^NCT\d{8}$/),
    sourceUrl: z.url(),
    retrievedAt: offsetDateTimeSchema,
    processedAt: offsetDateTimeSchema,
    registryLastUpdatePostedDate: dateSchema,
    contentSha256: sha256HexSchema,
    transformation: nonEmptyTextSchema,
    rightsStatus: nonEmptyTextSchema,
    attribution: nonEmptyTextSchema,
  })
  .strict()
  .superRefine((metadata, context) => {
    if (
      !processingFollowsRetrieval(metadata.retrievedAt, metadata.processedAt)
    ) {
      context.addIssue({
        code: "custom",
        message: "processedAt must be at or after retrievedAt",
        path: ["processedAt"],
      });
    }

    const policyDecision = evaluateClinicalTrialsFixtureSource(metadata);

    if (!policyDecision.allowed) {
      context.addIssue({
        code: "custom",
        message: `Source URL violates policy: ${policyDecision.code}`,
        path: ["sourceUrl"],
      });
    } else {
      const queryIds = new URL(metadata.sourceUrl).searchParams.getAll(
        "query.id",
      );

      if (queryIds.length !== 1 || queryIds[0] !== metadata.externalId) {
        context.addIssue({
          code: "custom",
          message: "Fixture query ID must match its external ID",
          path: ["sourceUrl"],
        });
      }
    }
  });
