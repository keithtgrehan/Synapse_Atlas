import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import comparisonManifest from "../../../data/comparison/2026-10-13/manifest.json";
import {
  clinicalTrialsApiPageSchema,
  clinicalTrialsFieldValues,
  normalizeClinicalTrial,
} from "../domain/trials";
import { briefManifestSchema } from "../domain/brief-snapshots";
import { sha256Bytes } from "../evidence/provenance";
import { clinicalTrialsFixtureMetadataSchema } from "../fixtures/clinicaltrials";
import { evaluateSourceRequest } from "../sources/policies";
import { studyExampleCatalog } from "../studies/examples";
import type { Capture } from "./model";
import { loadResearchManifest } from "../catalogue/load";

const TRANSFORMATION = "nct-snapshot-catalogue/v1";
const exportedProjectionFields = [
  "nctId",
  "briefTitle",
  "overallStatus",
  "dates",
  "leadSponsor",
  "conditions",
  "phases",
  "enrollment",
  "interventions",
  "primaryOutcomes",
] as const;
const comparisonEntries =
  briefManifestSchema.parse(comparisonManifest).snapshots;

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const moduleFields: Record<string, readonly string[]> = {
  IdentificationModule: ["NCTId", "BriefTitle", "OfficialTitle"],
  StatusModule: [
    "OverallStatus",
    "StartDate",
    "PrimaryCompletionDate",
    "CompletionDate",
    "LastUpdatePostDate",
    "StartDateType",
    "PrimaryCompletionDateType",
    "CompletionDateType",
  ],
  SponsorCollaboratorsModule: ["LeadSponsorName", "LeadSponsorClass"],
  ConditionsModule: ["Condition"],
  DesignModule: ["Phase", "EnrollmentCount", "EnrollmentType", "StudyType"],
  ArmsInterventionsModule: ["InterventionName", "InterventionType"],
  OutcomesModule: ["PrimaryOutcomeMeasure", "PrimaryOutcomeTimeFrame"],
};
function requestedFieldSet(requestUrl: string) {
  const raw =
    new URL(requestUrl).searchParams
      .get("fields")
      ?.split(",")
      .filter(Boolean) ?? clinicalTrialsFieldValues;
  return new Set(raw.flatMap((field) => moduleFields[field] ?? [field]));
}
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function captureFromBytes(
  bytes: Uint8Array,
  input: {
    nctId: string;
    requestUrl: string;
    retrievedAt: string;
    processedAt: string;
    rawSha256: string;
  },
  includeExactResponse = false,
): Capture {
  if (sha256Bytes(bytes) !== input.rawSha256)
    throw new Error("SNAPSHOT_HASH_MISMATCH");
  const decision = evaluateSourceRequest(
    {
      sourceId: "SRC-CTG",
      policyVersion: "1",
      method: "GET",
      url: input.requestUrl,
    },
    undefined,
    new Date(input.retrievedAt),
  );
  const requestedIds = new URL(input.requestUrl).searchParams.getAll(
    "query.id",
  );
  if (
    !decision.allowed ||
    requestedIds.length !== 1 ||
    requestedIds[0] !== input.nctId
  )
    throw new Error("SNAPSHOT_SOURCE_POLICY_DENIED");
  let source: unknown;
  let decoded: string;
  try {
    decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    source = JSON.parse(decoded);
  } catch {
    throw new Error("SNAPSHOT_INVALID_JSON");
  }
  // Zod strips unrequested fields (including contact modules) before this data can be displayed or exported.
  const page = clinicalTrialsApiPageSchema.parse(source);
  if (
    page.totalCount !== 1 ||
    page.studies.length !== 1 ||
    page.studies[0]?.protocolSection.identificationModule.nctId !== input.nctId
  )
    throw new Error("SNAPSHOT_ID_MISMATCH");
  const protocol = page.studies[0].protocolSection;
  // Deliberately exclude free-text summaries, contacts and locations from public evidence bundles.
  const sourceProjectionJson = JSON.stringify({
    totalCount: page.totalCount,
    nextPageToken: page.nextPageToken,
    studies: [
      {
        protocolSection: {
          identificationModule: {
            nctId: protocol.identificationModule.nctId,
            briefTitle: protocol.identificationModule.briefTitle,
          },
          statusModule: protocol.statusModule,
          sponsorCollaboratorsModule: protocol.sponsorCollaboratorsModule,
          conditionsModule: protocol.conditionsModule,
          designModule: protocol.designModule,
          armsInterventionsModule: protocol.armsInterventionsModule,
          outcomesModule: protocol.outcomesModule,
        },
      },
    ],
  });
  const requestedFields = requestedFieldSet(input.requestUrl);
  // Normalize the exact exported projection, so its hash can be replayed without access to omitted source fields.
  const projectionPage = clinicalTrialsApiPageSchema.parse(
    JSON.parse(sourceProjectionJson),
  );
  const record = normalizeClinicalTrial(projectionPage.studies[0]!, {
    apiRequestUrl: input.requestUrl,
    retrievedAt: input.retrievedAt,
    processedAt: input.processedAt,
    contentSha256: input.rawSha256,
    requestedFields,
    studyIndex: 0,
  });
  if (
    includeExactResponse &&
    canonicalJson(source) !== canonicalJson(JSON.parse(sourceProjectionJson))
  )
    throw new Error("SNAPSHOT_UNSAFE_LIVE_RESPONSE");
  return {
    nctId: input.nctId,
    sourceProjectionJson,
    sourceEvidenceMode: includeExactResponse
      ? "exact-response"
      : "field-projection",
    ...(includeExactResponse ? { rawResponseJson: decoded } : {}),
    rawSha256: input.rawSha256,
    projectedSha256: hash(sourceProjectionJson),
    projection: {
      kind: "allowlisted-response-projection",
      fields: exportedProjectionFields,
    },
    normalizedSha256: hash(JSON.stringify(record)),
    requestUrl: input.requestUrl,
    requestedFields: [...requestedFields].sort(),
    retrievedAt: input.retrievedAt,
    processedAt: input.processedAt,
    record,
    transformationVersion: TRANSFORMATION,
  };
}

async function readCapture(
  root: string,
  relative: string,
  input: {
    nctId: string;
    requestUrl: string;
    retrievedAt: string;
    processedAt: string;
    rawSha256: string;
  },
) {
  return {
    ...captureFromBytes(await readFile(path.join(root, relative)), input),
    retainedSourcePath: relative,
  };
}

async function originalCaptures(root: string): Promise<Capture[]> {
  return Promise.all(
    comparisonEntries.map(async (entry) => {
      const metadata = clinicalTrialsFixtureMetadataSchema.parse(
        JSON.parse(
          await readFile(
            path.join(
              root,
              "data/fixtures/clinicaltrials.gov",
              `${entry.nctId}.metadata.json`,
            ),
            "utf8",
          ),
        ),
      );
      return readCapture(
        root,
        path.join("data/fixtures/clinicaltrials.gov", `${entry.nctId}.json`),
        {
          nctId: metadata.externalId,
          requestUrl: metadata.sourceUrl,
          retrievedAt: metadata.retrievedAt,
          processedAt: metadata.processedAt,
          rawSha256: metadata.contentSha256,
        },
      );
    }),
  );
}

async function comparisonCaptures(root: string): Promise<Capture[]> {
  return Promise.all(
    comparisonEntries.map((entry) =>
      readCapture(
        root,
        path.join(
          "data/comparison",
          comparisonManifest.version,
          `${entry.nctId}.json`,
        ),
        {
          nctId: entry.nctId,
          requestUrl: entry.requestUrl,
          retrievedAt: entry.retrievedAt,
          processedAt: entry.processedAt,
          rawSha256: entry.sha256,
        },
      ),
    ),
  );
}

async function exampleCaptures(root: string): Promise<Capture[]> {
  return Promise.all(
    studyExampleCatalog.studies.map((entry) =>
      readCapture(
        root,
        path.join("data/study-examples/v1", `${entry.nctId}.json`),
        {
          nctId: entry.nctId,
          requestUrl: entry.registry.requestUrl,
          retrievedAt: entry.registry.retrievedAt,
          processedAt: entry.registry.processedAt,
          rawSha256: entry.registry.contentSha256,
        },
      ),
    ),
  );
}

async function researchCaptures(root: string): Promise<Capture[]> {
  const manifest = await loadResearchManifest(root);
  return Promise.all(manifest.entries.map((entry) => {
    if (entry.sourcePath !== `data/research-catalogue/v1/${entry.nctId}.json`) throw new Error("RESEARCH_CAPTURE_PATH_MISMATCH");
    return readCapture(root, entry.sourcePath, entry);
  }));
}

/** Thirty-nine retained, validated captures. Programme mappings are intentionally not consulted. */
export async function loadSnapshotCatalogue(
  repositoryRoot = process.cwd(),
): Promise<Capture[]> {
  const captures = [
    ...(await comparisonCaptures(repositoryRoot)),
    ...(await exampleCaptures(repositoryRoot)),
    ...(await researchCaptures(repositoryRoot)),
  ];
  if (
    new Set(captures.map((capture) => capture.nctId)).size !== captures.length
  )
    throw new Error("DUPLICATE_SNAPSHOT_NCT_ID");
  return captures.sort((left, right) => left.nctId.localeCompare(right.nctId));
}

export async function getSnapshotCapture(
  nctId: string,
  repositoryRoot = process.cwd(),
): Promise<Capture | null> {
  return (
    (await loadSnapshotCatalogue(repositoryRoot)).find(
      (capture) => capture.nctId === nctId,
    ) ?? null
  );
}

/** Deterministic offline replay for the three studies with two retained capture dates. */
export async function loadReplayPair(
  nctId: string,
  repositoryRoot = process.cwd(),
): Promise<{ baseline: Capture; current: Capture } | null> {
  const [baselines, currents] = await Promise.all([
    originalCaptures(repositoryRoot),
    comparisonCaptures(repositoryRoot),
  ]);
  const baseline = baselines.find((capture) => capture.nctId === nctId);
  const current = currents.find((capture) => capture.nctId === nctId);
  return baseline === undefined || current === undefined
    ? null
    : { baseline, current };
}

export function captureForLiveResponse(
  bytes: Uint8Array,
  input: {
    nctId: string;
    requestUrl: string;
    retrievedAt: string;
    processedAt: string;
  },
): Capture {
  return captureFromBytes(
    bytes,
    { ...input, rawSha256: sha256Bytes(bytes) },
    true,
  );
}
