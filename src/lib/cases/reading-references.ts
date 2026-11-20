import { z } from "zod";

const hosts = new Set(["www.nature.com", "pmc.ncbi.nlm.nih.gov", "maps.org", "mapscontent.s3-us-west-1.amazonaws.com", "www.fda.gov"]);
const publicUrl = z.url().refine(value => {
  const url = new URL(value);
  return url.protocol === "https:" && !url.username && !url.password && !url.port && hosts.has(url.hostname);
}, "External reading must use an approved public HTTPS host");
const date = z.union([z.iso.date(), z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)]);

/** Bibliographic metadata and original notes only; never captured registry evidence. */
export const readingReferenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(300),
  documentType: z.enum(["Trial report", "Protocol", "Regulatory briefing", "Guidance"]),
  citation: z.string().min(1).max(500),
  doi: z.string().regex(/^10\.\d{4,9}\/\S+$/).optional(),
  publicationOrVersionDate: date.nullable(),
  version: z.string().max(200).optional(),
  checkedAt: z.iso.date(),
  availability: z.enum(["available", "metadata_only", "unavailable"]),
  availabilityNote: z.string().min(1).max(400),
  url: publicUrl.nullable(),
  checkedUrl: publicUrl.optional(),
  status: z.enum(["active", "corrected", "retracted"]),
  note: z.string().min(1).max(800),
  notice: z.object({
    appliesTo: z.string(),
    kind: z.enum(["correction", "retraction"]),
    title: z.string().min(1).max(300),
    url: publicUrl,
    date: z.iso.date(),
    note: z.string().min(1).max(500),
  }).strict().optional(),
}).strict().superRefine((reference, context) => {
  if ((reference.availability === "unavailable") !== (reference.url === null))
    context.addIssue({ code: "custom", message: "Unavailable reading must have no active link" });
  if (reference.notice?.appliesTo !== (reference.notice ? reference.id : undefined) ||
      (reference.status === "active" && reference.notice) ||
      (reference.status === "corrected" && reference.notice?.kind !== "correction") ||
      (reference.status === "retracted" && reference.notice?.kind !== "retraction"))
    context.addIssue({ code: "custom", message: "Publication notice must match this reference and its status" });
});

export type ExternalReadingReference = z.infer<typeof readingReferenceSchema>;
export const readingBoundary = "Further reading contains citation details, links and Atlas notes. The full documents are not stored in this brief or included in its saved-record comparison. Links were checked on the stated date and may become unavailable.";
export const readingAvailability = { available: "Available when checked", metadata_only: "Metadata checked; full-text access intermittent", unavailable: "Unavailable at checked link" } as const;

export function validateReadingReferences(references: ExternalReadingReference[] = []) {
  const parsed = z.array(readingReferenceSchema).max(8).parse(references);
  if (new Set(parsed.map(item => item.id)).size !== parsed.length) throw new Error("DUPLICATE_READING_REFERENCE");
  return parsed;
}

export function readingMetadata(reference: ExternalReadingReference) {
  return `${reference.documentType} · ${reference.publicationOrVersionDate ?? "Document date unverified"}${reference.version ? ` · ${reference.version}` : ""} · Checked ${reference.checkedAt} · ${readingAvailability[reference.availability]}`;
}
