#!/usr/bin/env node
// Additive, exact-ID capture for the MAPP PTSD case. It never changes the MDD v1 inventory.
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { evaluateSourceRequest } from "../src/lib/sources/policies.ts";

const ids = ["NCT03537014", "NCT04077437"];
const target = path.resolve("data/research-cases/mdma-ptsd/v1");
const fields = [
  "NCTId", "BriefTitle", "OfficialTitle", "OverallStatus", "StartDate",
  "PrimaryCompletionDate", "CompletionDate", "LastUpdatePostDate", "LeadSponsorName",
  "LeadSponsorClass", "Condition", "InterventionName", "InterventionType", "Phase",
  "EnrollmentCount", "EnrollmentType", "StudyType", "PrimaryOutcomeMeasure",
  "PrimaryOutcomeTimeFrame", "StartDateType", "PrimaryCompletionDateType", "CompletionDateType",
];
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const rationale = "Two exact-NCT MAPP phase-3 records selected for a separate PTSD study-design reading case; not part of the MDD inventory, a pooled result or a treatment ranking.";

function requestUrl(nctId, evaluatedAt) {
  const url = new URL("https://clinicaltrials.gov/api/v2/studies");
  for (const [key, value] of Object.entries({
    "query.id": nctId,
    pageSize: "1",
    countTotal: "true",
    format: "json",
    fields: fields.join(","),
  })) url.searchParams.set(key, value);
  const decision = evaluateSourceRequest({
    sourceId: "SRC-CTG", policyVersion: "1", method: "GET", url: url.toString(),
  }, undefined, evaluatedAt);
  if (!decision.allowed || url.searchParams.getAll("query.id").join() !== nctId)
    throw new Error("SRC_CTG_POLICY_DENIED");
  return url;
}

async function capture(nctId) {
  const retrievedAt = new Date().toISOString();
  const url = requestUrl(nctId, new Date(retrievedAt));
  const response = await fetch(url, {
    redirect: "error", credentials: "omit", signal: AbortSignal.timeout(15_000),
    headers: { accept: "application/json" },
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json") || !response.body)
    throw new Error(`CAPTURE_FAILED:${nctId}`);
  const chunks = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > 1_048_576) throw new Error(`CAPTURE_TOO_LARGE:${nctId}`);
    chunks.push(chunk);
  }
  const bytes = Buffer.concat(chunks);
  let page;
  try { page = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { throw new Error(`CAPTURE_INVALID_JSON:${nctId}`); }
  if (page.totalCount !== 1 || page.studies?.length !== 1 ||
      page.studies[0]?.protocolSection?.identificationModule?.nctId !== nctId)
    throw new Error(`CAPTURE_EXACT_ID_MISMATCH:${nctId}`);
  return {
    bytes,
    entry: {
      nctId,
      sourcePath: `data/research-cases/mdma-ptsd/v1/${nctId}.json`,
      requestUrl: url.toString(),
      retrievedAt,
      processedAt: new Date().toISOString(),
      rawSha256: hash(bytes),
      groupIds: ["ptsd-mdma-design-context"],
      selectionRationale: rationale,
    },
  };
}

async function exists(location) {
  try { await stat(location); return true; }
  catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

if (await exists(target)) throw new Error("MAPP_CAPTURE_ALREADY_EXISTS");
if (new Set(ids).size !== ids.length) throw new Error("MAPP_CAPTURE_DUPLICATE_ID");

const captures = await Promise.all(ids.map(capture));
const stagingParent = path.dirname(target);
await mkdir(stagingParent, { recursive: true });
const staging = await mkdtemp(path.join(stagingParent, ".mdma-ptsd-v1-"));
try {
  const manifest = {
    version: "1",
    capturedAt: captures.at(-1).entry.processedAt,
    selectionMethod: "Two exact-ID MAPP phase-3 PTSD records captured for a separate registered-design reading case. This is not a systematic, complete or representative sample, a treatment ranking or pooled outcome analysis.",
    fields,
    entries: captures.map((item) => item.entry),
    groups: [{
      id: "ptsd-mdma-design-context",
      title: "PTSD: MAPP1/MAPP2 design context",
      question: "What registered measures, timing and treatment context need inspection before reading MAPP1 and MAPP2 together?",
      description: "Two phase-3 PTSD records retained for a design-reading case. This context is separate from the MDD collections; linked publications, protocol and FDA documents are external reading, not registry results.",
      studyIds: ids,
      comparisonDimensions: ["registered title and condition", "primary measure", "assessment window", "intervention names", "phase and enrolment type"],
      limitations: "A common measure does not establish comparable populations, successful blinding, efficacy, safety or approval. Eligibility, arm assignments, results and regulatory conclusions are outside the retained field projection.",
    }],
  };
  for (const { bytes, entry } of captures)
    await writeFile(path.join(staging, `${entry.nctId}.json`), bytes, { flag: "wx" });
  await writeFile(path.join(staging, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });
  if (await exists(target)) throw new Error("MAPP_CAPTURE_RACE");
  await rename(staging, target);
  console.log(JSON.stringify(captures.map(({ entry }) => ({ nctId: entry.nctId, retrievedAt: entry.retrievedAt, rawSha256: entry.rawSha256 }))));
} catch (error) {
  await rm(staging, { recursive: true, force: true });
  throw error;
}
