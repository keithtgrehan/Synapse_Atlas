import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import catalogInput from "../../../data/study-examples/v1/catalog.json";
import {
  clinicalTrialsApiPageSchema,
  clinicalTrialsFieldValues,
  nctIdSchema,
  normalizeClinicalTrial,
  trialProvenanceSchema,
} from "../domain/trials";
import { offsetDateTimeSchema, processingFollowsRetrieval, sha256Bytes, sha256HexSchema } from "../evidence/provenance";
import { evaluateClinicalTrialsFixtureSource } from "../fixtures/clinicaltrials";

const text = z.string().trim().min(1);
const captureSchema = z.object({
  requestUrl: z.url(),
  retrievedAt: offsetDateTimeSchema,
  processedAt: offsetDateTimeSchema,
  contentSha256: sha256HexSchema,
}).strict().refine((value) => processingFollowsRetrieval(value.retrievedAt, value.processedAt));

export const studyExampleCatalogSchema = z.object({
  version: z.literal(1),
  publicationSource: captureSchema,
  studies: z.array(z.object({
    nctId: nctIdSchema,
    label: text,
    indication: text,
    intervention: text,
    comparator: text,
    pmid: z.string().regex(/^\d+$/),
    publicationUrl: z.url(),
    publicationLinkEvidence: z.url(),
    caution: text,
    researchCheckedDate: z.iso.date(),
    reviewStatus: z.literal("PENDING"),
    selectionEvidenceClass: z.literal("MODEL_INFERENCE"),
    registry: captureSchema,
  }).strict()).length(10),
}).strict().superRefine((catalog, context) => {
  if (new Set(catalog.studies.map((study) => study.nctId)).size !== catalog.studies.length) {
    context.addIssue({ code: "custom", message: "Duplicate study identifier" });
  }
  for (const study of catalog.studies) {
    if (study.publicationUrl !== `https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/`) {
      context.addIssue({ code: "custom", message: "Publication identifier mismatch" });
    }
    for (const source of [study.registry]) {
      const decision = evaluateClinicalTrialsFixtureSource({
        sourceId: "SRC-CTG", sourceUrl: source.requestUrl, retrievedAt: source.retrievedAt,
      });
      if (!decision.allowed || new URL(source.requestUrl).searchParams.get("query.id") !== study.nctId) {
        context.addIssue({ code: "custom", message: "Invalid retained registry source" });
      }
    }
  }
});

export const studyExampleCatalog = studyExampleCatalogSchema.parse(catalogInput);

const supplementSchema = z.object({
  studies: z.array(z.object({
    hasResults: z.boolean().optional(),
    protocolSection: z.object({
      identificationModule: z.object({ nctId: nctIdSchema }),
      statusModule: z.object({
        resultsFirstPostDateStruct: z.object({ date: text, type: text.optional() }).optional(),
      }),
      armsInterventionsModule: z.object({
        armGroups: z.array(z.object({
          label: text, type: text.optional(), description: text.optional(),
          interventionNames: z.array(text).optional(),
        })).optional(),
      }),
      referencesModule: z.object({ references: z.array(z.object({ pmid: text.optional() })).optional() }).optional(),
    }),
  })).length(1),
});

const publicationsSchema = z.object({ resultList: z.object({ result: z.array(z.object({
  id: text, source: z.literal("MED"), title: text, authorString: text,
  journalTitle: text, pubYear: text, doi: text.optional(),
})) }) });

export function decodeRetainedSource(bytes: Uint8Array, expectedHash: string): unknown {
  if (sha256Bytes(bytes) !== expectedHash) throw new Error("STUDY_EXAMPLE_HASH_MISMATCH");
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
}

async function readSource(root: string, file: string, hash: string) {
  return decodeRetainedSource(await readFile(path.join(root, "data/study-examples/v1", file)), hash);
}

export async function loadStudyExamples(repositoryRoot = process.cwd()) {
  const publications = publicationsSchema.parse(await readSource(
    repositoryRoot, "publications.json", studyExampleCatalog.publicationSource.contentSha256,
  )).resultList.result;

  return Promise.all(studyExampleCatalog.studies.map(async (entry) => {
    const raw = await readSource(repositoryRoot, `${entry.nctId}.json`, entry.registry.contentSha256);
    const page = clinicalTrialsApiPageSchema.parse(raw);
    const supplement = supplementSchema.parse(raw).studies[0];
    if (page.studies.length !== 1 || page.studies[0].protocolSection.identificationModule.nctId !== entry.nctId ||
        supplement.protocolSection.identificationModule.nctId !== entry.nctId) {
      throw new Error("STUDY_EXAMPLE_ID_MISMATCH");
    }
    const trial = normalizeClinicalTrial(page.studies[0], {
      apiRequestUrl: entry.registry.requestUrl,
      ...entry.registry,
      requestedFields: new Set(clinicalTrialsFieldValues), studyIndex: 0,
    });
    trialProvenanceSchema.parse(trial.provenance);
    const matches = publications.filter((publication) => publication.id === entry.pmid);
    if (matches.length !== 1) throw new Error("STUDY_EXAMPLE_PUBLICATION_MISMATCH");
    const references = supplement.protocolSection.referencesModule?.references ?? [];
    const linkedInRegistry = references.some((reference) => reference.pmid === entry.pmid);
    if (!linkedInRegistry && entry.publicationLinkEvidence !== "https://www.nature.com/articles/s41386-024-01862-x") {
      throw new Error("STUDY_EXAMPLE_PUBLICATION_LINK_MISSING");
    }
    return { ...entry, trial, supplement, publication: matches[0], linkedInRegistry };
  }));
}

export type StudyExample = Awaited<ReturnType<typeof loadStudyExamples>>[number];
