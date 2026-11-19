import { z } from "zod";

const nct = z.string().regex(/^NCT\d{8}$/);
export const researchManifestSchema = z.object({
  version: z.literal("1"),
  capturedAt: z.string().datetime({ offset: true }),
  selectionMethod: z.string().min(20),
  entries: z.array(z.object({
    nctId: nct,
    sourcePath: z.string().regex(/^data\/research-catalogue\/v1\/NCT\d{8}\.json$/),
    requestUrl: z.url(),
    retrievedAt: z.string().datetime({ offset: true }),
    processedAt: z.string().datetime({ offset: true }),
    rawSha256: z.string().regex(/^[a-f0-9]{64}$/),
    groupIds: z.array(z.string()).min(1),
    selectionRationale: z.string().min(20),
  })).length(26),
  groups: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    question: z.string(),
    description: z.string(),
    studyIds: z.array(nct).min(1),
    comparisonDimensions: z.array(z.string()).min(1),
    limitations: z.string().min(20),
  })).min(1),
});
export type ResearchManifest = z.infer<typeof researchManifestSchema>;
export type ResearchCollection = ResearchManifest["groups"][number];
