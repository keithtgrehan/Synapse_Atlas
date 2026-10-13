import { z } from "zod";
import { offsetDateTimeSchema, sha256Bytes, sha256HexSchema } from "../evidence/provenance";
import { clinicalTrialsPolicy, evaluateSourceRequest } from "../sources/policies";
import { clinicalTrialsApiPageSchema, clinicalTrialsFieldValues, nctIdSchema, normalizeClinicalTrial, trialProvenanceSchema } from "./trials";

export const briefVersion = "2026-10-13";
export const briefFieldsRequested = [...clinicalTrialsFieldValues, "StartDateType", "PrimaryCompletionDateType", "CompletionDateType"] as const;

export function briefRequestUrl(nctId: string): string {
  nctIdSchema.parse(nctId);
  const url = new URL("https://clinicaltrials.gov/api/v2/studies");
  url.search = new URLSearchParams({
    "query.id": nctId, pageSize: "1", countTotal: "true", format: "json",
    fields: briefFieldsRequested.join(","),
  }).toString();
  return url.href;
}

export const briefSnapshotSchema = z.object({
  nctId: nctIdSchema,
  sourceId: z.literal("SRC-CTG"),
  policyVersion: z.literal("1"),
  requestUrl: z.url(),
  retrievedAt: offsetDateTimeSchema,
  processedAt: offsetDateTimeSchema,
  sha256: sha256HexSchema,
}).strict();

export const briefManifestSchema = z.object({
  version: z.literal(briefVersion),
  snapshots: z.array(briefSnapshotSchema).length(3),
}).strict().refine((manifest) => new Set(manifest.snapshots.map((s) => s.nctId)).size === 3, "Duplicate study snapshot");

export function validateBriefSnapshot(metadataInput: unknown, bytes: Uint8Array) {
  const metadata = briefSnapshotSchema.parse(metadataInput);
  const decision = evaluateSourceRequest({ sourceId: metadata.sourceId, policyVersion: metadata.policyVersion, method: "GET", url: metadata.requestUrl }, undefined, new Date(metadata.retrievedAt));
  if (!decision.allowed || metadata.requestUrl !== briefRequestUrl(metadata.nctId) || bytes.byteLength > 1_048_576 || sha256Bytes(bytes) !== metadata.sha256) {
    throw new Error("INVALID_BRIEF_SOURCE");
  }
  const page = clinicalTrialsApiPageSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
  if (page.totalCount !== 1 || page.studies.length !== 1 || page.studies[0]!.protocolSection.identificationModule.nctId !== metadata.nctId) {
    throw new Error("INVALID_BRIEF_STUDY");
  }
  const trial = normalizeClinicalTrial(page.studies[0]!, {
    apiRequestUrl: metadata.requestUrl, retrievedAt: metadata.retrievedAt,
    processedAt: metadata.processedAt, contentSha256: metadata.sha256,
    requestedFields: new Set(briefFieldsRequested), studyIndex: 0,
  });
  trialProvenanceSchema.parse(trial.provenance);
  if (trial.provenance.attribution !== clinicalTrialsPolicy.attribution) throw new Error("INVALID_ATTRIBUTION");
  return trial;
}
