import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { Capture } from "../snapshots/model";
import { researchCases } from "./content";
import type { CaseEvidence, VerifiedCase } from "./model";
import { validateReadingReferences } from "./reading-references";

const hash = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
// Only named public protocol fields used by the editorial cases may leave the server.
const publicField = /^\/studies\/0\/protocolSection\/(?:identificationModule\/(?:nctId|briefTitle|officialTitle)|conditionsModule\/conditions(?:\/\d+)?|statusModule\/overallStatus|descriptionModule\/briefSummary|designModule\/(?:studyType|phases|enrollmentInfo|designInfo)(?:\/[A-Za-z0-9]+)*|outcomesModule\/primaryOutcomes\/\d+\/(?:measure|timeFrame)|armsInterventionsModule\/(?:interventions|armGroups)\/\d+\/(?:name|label|type|description|interventionNames)(?:\/\d+)?)$/;

export async function loadResearchCases(catalogue: Capture[], root = process.cwd()): Promise<VerifiedCase[]> {
  const documents = new Map<string, unknown>();
  async function verify(item: CaseEvidence) {
    const capture = catalogue.find((entry) => entry.nctId === item.nctId);
    if (!capture || capture.retainedSourcePath !== item.sourcePath || capture.retrievedAt !== item.retrievedAt ||
        item.sourceUrl !== capture.record.provenance.sourceUrl || !publicField.test(item.locator))
      throw new Error("CASE_EVIDENCE_IDENTITY_MISMATCH");
    if (!documents.has(item.sourcePath)) {
      if (!item.sourcePath.startsWith("data/") || item.sourcePath.split("/").includes("..") || item.sourcePath.includes("\\"))
        throw new Error("CASE_SOURCE_PATH_OUTSIDE_PUBLIC_DATA");
      // A static data-directory boundary also keeps unrelated project files out of server bundles.
      const bytes = await readFile(path.join(root, "data", item.sourcePath.slice(5)));
      if (hash(bytes) !== capture.rawSha256) throw new Error("CASE_SOURCE_HASH_MISMATCH");
      documents.set(item.sourcePath, JSON.parse(bytes.toString("utf8")));
    }
    let actual = documents.get(item.sourcePath);
    for (const key of item.locator.slice(1).split("/")) {
      actual = actual && typeof actual === "object" ? (actual as Record<string, unknown>)[key] : undefined;
    }
    if (actual === undefined || !isDeepStrictEqual(actual, item.expectedValue)) throw new Error("CASE_FIELD_MISMATCH");
    return { ...item, rawSha256: capture.rawSha256, valueSha256: hash(JSON.stringify(actual)) };
  }
  return Promise.all(researchCases.map(async (content) => {
    validateReadingReferences(content.readingReferences);
    const inputs = [...content.dimensions.flatMap((row) => row.cells.flatMap((cell) => cell.evidence)),
      ...content.takeaways.flatMap((claim) => claim.evidence)];
    const unique = [...new Map(inputs.map((item) => [`${item.sourcePath}:${item.locator}`, item])).values()];
    // Verify every claim reference, including duplicate references, before deduplicating the bundle.
    await Promise.all(inputs.map(verify));
    return { content, contentSha256: hash(JSON.stringify(content)), evidence: await Promise.all(unique.map(verify)),
      verificationVersion: "research-case-evidence/v1" as const };
  }));
}
