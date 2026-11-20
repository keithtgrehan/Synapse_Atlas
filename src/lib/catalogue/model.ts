import { z } from "zod";

const nct = z.string().regex(/^NCT\d{8}$/);
export const mappNctIds = ["NCT03537014", "NCT04077437"] as const;
export const mappCollectionId = "ptsd-mdma-design-context";
const manifestFields = z.array(z.string().min(1)).min(1);
const selectionRationale = z.string().min(20);
const collectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  question: z.string(),
  description: z.string(),
  studyIds: z.array(nct).min(1),
  comparisonDimensions: z.array(z.string()).min(1),
  limitations: z.string().min(20),
});
const manifestEntrySchema = z.object({
  nctId: nct,
  sourcePath: z.string().regex(/^data\/(?:research-catalogue\/v1|research-cases\/mdma-ptsd\/v1)\/NCT\d{8}\.json$/),
  requestUrl: z.url(),
  retrievedAt: z.string().datetime({ offset: true }),
  processedAt: z.string().datetime({ offset: true }),
  rawSha256: z.string().regex(/^[a-f0-9]{64}$/),
  groupIds: z.array(z.string()).min(1),
  selectionRationale,
}).superRefine((entry, context) => {
  if (!entry.sourcePath.endsWith(`/${entry.nctId}.json`)) {
    context.addIssue({
      code: "custom",
      path: ["sourcePath"],
      message: "Capture path must name its declared NCT ID",
    });
  }
});

/** A composed, read-only catalogue view; individual manifests are validated more narrowly below. */
export const catalogueManifestSchema = z.object({
  version: z.literal("1"),
  capturedAt: z.string().datetime({ offset: true }),
  selectionMethod: z.string().min(20),
  fields: manifestFields,
  entries: z.array(manifestEntrySchema).min(1),
  groups: z.array(collectionSchema).min(1),
});
export type ResearchManifest = z.infer<typeof catalogueManifestSchema>;

export const researchManifestSchema = catalogueManifestSchema.extend({
  entries: z.array(manifestEntrySchema.safeExtend({
    sourcePath: z.string().regex(/^data\/research-catalogue\/v1\/NCT\d{8}\.json$/),
  })).length(26),
});

export const mappManifestSchema = catalogueManifestSchema.extend({
  entries: z.array(manifestEntrySchema.safeExtend({
    sourcePath: z.string().regex(/^data\/research-cases\/mdma-ptsd\/v1\/NCT\d{8}\.json$/),
  })).length(2),
  groups: z.array(collectionSchema).length(1),
}).superRefine((manifest, context) => {
  const exactIds = (ids: readonly string[]) =>
    ids.length === mappNctIds.length &&
    mappNctIds.every((id) => ids.includes(id));
  if (!exactIds(manifest.entries.map((entry) => entry.nctId))) {
    context.addIssue({ code: "custom", path: ["entries"], message: "MAPP manifest must contain the two approved exact IDs" });
  }
  const group = manifest.groups[0];
  if (group?.id !== mappCollectionId || !exactIds(group?.studyIds ?? [])) {
    context.addIssue({ code: "custom", path: ["groups"], message: "MAPP records must remain in their sole PTSD collection" });
  }
  if (manifest.entries.some((entry) => entry.groupIds.length !== 1 || entry.groupIds[0] !== mappCollectionId)) {
    context.addIssue({ code: "custom", path: ["entries"], message: "MAPP entries may belong only to the PTSD collection" });
  }
});
export type ResearchCollection = ResearchManifest["groups"][number];
