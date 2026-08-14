import { createHash } from "node:crypto";

import { z } from "zod";

export const evidenceClassValues = [
  "SOURCE_FACT",
  "STRUCTURED_EXTRACTION",
  "DERIVED_CALCULATION",
  "HUMAN_INFERENCE",
  "MODEL_INFERENCE",
  "UNVERIFIED",
  "UNKNOWN",
] as const;

export const claimReviewStatusValues = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "NEEDS_REVISION",
] as const;

export const reviewDecisionValues = [
  "APPROVED",
  "REJECTED",
  "NEEDS_REVISION",
] as const;

export const evidenceClassSchema = z.enum(evidenceClassValues);
export const claimReviewStatusSchema = z.enum(claimReviewStatusValues);
export const sha256HexSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const offsetDateTimeSchema = z.iso.datetime({ offset: true });
const nonBlankTextSchema = z.string().trim().min(1);

export function processingFollowsRetrieval(
  retrievedAt: string,
  processedAt: string,
): boolean {
  return Date.parse(processedAt) >= Date.parse(retrievedAt);
}

export const sourceVersionProvenanceSchema = z
  .object({
    retrievedAt: offsetDateTimeSchema,
    processedAt: offsetDateTimeSchema,
    registryLastUpdatePostedDate: z.iso.date().optional(),
    contentSha256: sha256HexSchema,
  })
  .strict()
  .superRefine((provenance, context) => {
    if (
      !processingFollowsRetrieval(
        provenance.retrievedAt,
        provenance.processedAt,
      )
    ) {
      context.addIssue({
        code: "custom",
        message: "processedAt must be at or after retrievedAt",
        path: ["processedAt"],
      });
    }
  });

export const claimDraftSchema = z
  .object({
    evidenceClass: evidenceClassSchema,
    valueJson: z.json().nullable().optional(),
    sourceId: z.uuid().optional(),
    sourceVersionId: z.uuid().optional(),
    externalId: nonBlankTextSchema.optional(),
    sourceLocator: nonBlankTextSchema.optional(),
    extractionMethod: nonBlankTextSchema.optional(),
    inputClaimIds: z.array(z.uuid()).optional(),
    formulaVersion: nonBlankTextSchema.optional(),
    modelVersion: nonBlankTextSchema.optional(),
    promptVersion: nonBlankTextSchema.optional(),
    schemaVersion: nonBlankTextSchema.optional(),
    confidence: z.number().min(0).max(1).optional(),
    reviewStatus: claimReviewStatusSchema,
  })
  .strict()
  .superRefine((claim, context) => {
    const hasStableSource = claim.sourceId !== undefined || claim.externalId !== undefined;

    if (
      (claim.evidenceClass === "SOURCE_FACT" ||
        claim.evidenceClass === "STRUCTURED_EXTRACTION") &&
      !hasStableSource
    ) {
      context.addIssue({
        code: "custom",
        message: "A source ID or stable external ID is required",
        path: ["sourceId"],
      });
    }

    if (claim.sourceVersionId !== undefined && claim.sourceId === undefined) {
      context.addIssue({
        code: "custom",
        message: "A source version requires its source ID",
        path: ["sourceVersionId"],
      });
    }

    if (claim.evidenceClass === "DERIVED_CALCULATION") {
      if (!claim.inputClaimIds?.length) {
        context.addIssue({
          code: "custom",
          message: "Derived calculations require input claim IDs",
          path: ["inputClaimIds"],
        });
      } else if (new Set(claim.inputClaimIds).size !== claim.inputClaimIds.length) {
        context.addIssue({
          code: "custom",
          message: "Derived calculation input claim IDs must be unique",
          path: ["inputClaimIds"],
        });
      }

      if (claim.formulaVersion === undefined) {
        context.addIssue({
          code: "custom",
          message: "Derived calculations require a formula version",
          path: ["formulaVersion"],
        });
      }
    }

    if (claim.evidenceClass === "MODEL_INFERENCE") {
      const requiredModelFields = [
        ["modelVersion", claim.modelVersion],
        ["promptVersion", claim.promptVersion],
        ["schemaVersion", claim.schemaVersion],
        ["sourceLocator", claim.sourceLocator],
        ["confidence", claim.confidence],
      ] as const;

      for (const [path, value] of requiredModelFields) {
        if (value === undefined) {
          context.addIssue({
            code: "custom",
            message: `Model inference requires ${path}`,
            path: [path],
          });
        }
      }
    }

    if (claim.evidenceClass === "SOURCE_FACT") {
      for (const [path, value] of [
        ["modelVersion", claim.modelVersion],
        ["promptVersion", claim.promptVersion],
        ["schemaVersion", claim.schemaVersion],
      ] as const) {
        if (value !== undefined) {
          context.addIssue({
            code: "custom",
            message: "A source fact cannot carry model-only provenance",
            path: [path],
          });
        }
      }
    }

    if (claim.evidenceClass === "UNKNOWN" && claim.valueJson !== null) {
      context.addIssue({
        code: "custom",
        message: "Unknown claims must preserve a null value",
        path: ["valueJson"],
      });
    }

    if (claim.evidenceClass !== "UNKNOWN" && claim.valueJson == null) {
      context.addIssue({
        code: "custom",
        message: "Known claims require a value",
        path: ["valueJson"],
      });
    }
  });

export function sha256Bytes(bytes: Uint8Array | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}
