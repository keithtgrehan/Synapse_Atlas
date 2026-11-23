import { compareCaptures } from "../../lib/snapshots/compare";
import { createSnapshotBrief } from "../../lib/snapshots/export";
import type { Capture, SnapshotDiff } from "../../lib/snapshots/model";
import { snapshotLimitations } from "../../lib/product/how-it-works";
import type { VerifiedCase } from "../../lib/cases/model";
import { evidenceRows } from "./evidence-state-model";
import { savedPrimaryOutcomes, outcomeFieldText } from "../../lib/snapshots/primary-outcomes";
import { readingBoundary, readingMetadata } from "../../lib/cases/reading-references";
export type CapturedComparison = {
  mode: "current" | "replay";
  diff: SnapshotDiff;
};
export function sessionManifest(
  savedStudies: Capture[],
  comparisons: CapturedComparison[],
  exportedAt: string,
  researchCase?: VerifiedCase,
) {
  return {
    format: "synapse-atlas-research-session/v1",
    exportedAt,
    researchCase,
    source: "ClinicalTrials.gov, U.S. National Library of Medicine",
    sourceTerms: "https://clinicaltrials.gov/about-site/terms-conditions",
    limitations: snapshotLimitations,
    replayInstructions:
      "For each comparison, verify SHA-256 of the UTF-8 sourceProjectionJson projection against projectedSha256. Normalize it with the recorded transformation and request fields, then compare with the recorded comparator. Original response hashes identify source captures, not the projected bytes included here. The catalogue code and comparator are available in the repository.",
    scope:
      "Selected registered field groups only: status, enrolment, primary outcome measures/time frames, completion dates/types, lead sponsor and intervention names/types. Outcome descriptions, secondary endpoints and results are outside this comparator.",
    evidenceState: evidenceRows(savedStudies, comparisons),
    savedPrimaryOutcomes: !researchCase || researchCase.content.includePrimaryOutcomes ? savedPrimaryOutcomes(savedStudies) : undefined,
    savedStudies,
    comparisons: comparisons.map(({ mode, diff }) => ({
      mode,
      ...createSnapshotBrief(diff),
    })),
  };
}
function cell(value: string) {
  const safe =
    /^[\s\u0000-\u001f]*[=+@-]/u.test(value) || /^[\t\r\n]/.test(value)
      ? `'${value}`
      : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function sessionCsv(
  savedStudies: Capture[],
  comparisons: CapturedComparison[],
  exportedAt: string,
  researchCase?: VerifiedCase,
): string {
  const rows = [
    [
      "NCT ID",
      "Evidence mode",
      "Field",
      "State",
      "Baseline value",
      "Comparison value",
      "Baseline retrieved",
      "Comparison retrieved",
      "Baseline registry update",
      "Comparison registry update",
      "Baseline source URL",
      "Comparison source URL",
      "Baseline response SHA-256",
      "Comparison response SHA-256",
      "Baseline evidence SHA-256",
      "Comparison evidence SHA-256",
      "Comparator version",
      "Baseline locators",
      "Comparison locators",
      "Note",
      "Exported at",
      "Limitations",
      "Outcome entry (capture position)",
      "Registered primary measure",
      "Registered time frame",
      "Measure availability",
      "Time frame availability",
      "Saved study context",
    ],
  ];
  for (const capture of savedStudies) {
    // Saved rows exist even when no refresh has been attempted; no synthetic change is implied.
    const pair = compareCaptures(capture, capture);
    for (const field of pair.fields)
      rows.push([
        capture.nctId,
        "saved record",
        field.label,
        "not refreshed",
        field.before,
        "",
        capture.retrievedAt,
        "",
        capture.record.provenance.registryLastUpdatePostedDate ?? "",
        "",
        capture.record.provenance.sourceUrl,
        "",
        capture.rawSha256,
        "",
        capture.projectedSha256,
        "",
        pair.comparatorVersion,
        field.baselineLocators.join("; "),
        "",
        "Saved copy; not checked again for this row.",
        exportedAt,
        snapshotLimitations,
      ]);
  }
  if (!researchCase || researchCase.content.includePrimaryOutcomes) {
    const view = savedPrimaryOutcomes(savedStudies);
    for (const study of view.studies) {
      const context = JSON.stringify({ ...study.context, availability: study.contextStatus });
      const addOutcomeRow = (entry: (typeof study.entries)[number] | undefined) => rows.push([
        study.nctId, "saved primary-outcome fields", "Registered primary outcome", entry?.evidenceClass ?? study.status,
        entry ? `${outcomeFieldText(entry.measure)}\nTime frame: ${outcomeFieldText(entry.timeFrame)}` : study.status === "not_captured" ? "Not captured" : "Not reported in this captured response",
        "", study.retrievedAt, "", study.registryLastUpdate ?? "", "", study.sourceUrl, "", study.rawSha256, "", study.projectedSha256, "", view.version,
        entry ? [entry.parentLocator, entry.measureLocator, entry.timeFrameLocator].filter(Boolean).join("; ") : "", "",
        `${view.label} Child pointers are derived within this capture; array positions are not cross-version identities.`, exportedAt, view.limitation,
        entry ? String(entry.index + 1) : "", entry ? outcomeFieldText(entry.measure) : "", entry ? outcomeFieldText(entry.timeFrame) : "", entry?.measure.status ?? study.status, entry?.timeFrame.status ?? study.status, context,
      ]);
      if (study.entries.length) study.entries.forEach(addOutcomeRow); else addOutcomeRow(undefined);
    }
  }
  for (const { mode, diff } of comparisons)
    for (const field of diff.fields)
      rows.push([
        diff.nctId,
        mode === "replay"
          ? "retained-record replay"
          : "current session capture",
        field.label,
        field.state,
        field.before,
        field.after,
        diff.baseline.retrievedAt,
        diff.current.retrievedAt,
        diff.baseline.record.provenance.registryLastUpdatePostedDate ?? "",
        diff.current.record.provenance.registryLastUpdatePostedDate ?? "",
        diff.baseline.record.provenance.sourceUrl,
        diff.current.record.provenance.sourceUrl,
        diff.baseline.rawSha256,
        diff.current.rawSha256,
        diff.baseline.projectedSha256,
        diff.current.projectedSha256,
        diff.comparatorVersion,
        field.baselineLocators.join("; "),
        field.currentLocators.join("; "),
        field.note ?? "",
        exportedAt,
        snapshotLimitations,
      ]);
  if (researchCase) {
    const content = researchCase.content;
    const addCaseRow = (nctId: string, label: string, text: string, evidenceClass: string, evidence: VerifiedCase["evidence"]) => {
      rows.push([nctId, "saved case analysis", label, evidenceClass, text, "", evidence.map((item) => item.retrievedAt).join("; "), "", "", "",
        evidence.map((item) => item.sourceUrl).join("; "), "", evidence.map((item) => item.rawSha256).join("; "), "",
        evidence.map((item) => item.valueSha256).join("; "), "", researchCase.verificationVersion, evidence.map((item) => item.locator).join("; "), "",
        `Case: ${content.id}; content SHA-256: ${researchCase.contentSha256}`, exportedAt, content.cannotEstablish]);
    };
    addCaseRow(content.studyIds.join("; "), "Research question", content.question, "MODEL_INFERENCE", []);
    addCaseRow(content.studyIds.join("; "), "Selection rationale", content.whyTogether, "MODEL_INFERENCE", []);
    for (const dimension of content.dimensions) {
      for (const item of dimension.cells) addCaseRow(item.nctId, dimension.label, item.value, item.evidence.length ? "STRUCTURED_EXTRACTION" : "UNVERIFIED",
        researchCase.evidence.filter((entry) => item.evidence.some((ref) => ref.sourcePath === entry.sourcePath && ref.locator === entry.locator)));
      addCaseRow(content.studyIds.join("; "), `${dimension.label}: interpretation`, dimension.interpretation, "MODEL_INFERENCE", []);
    }
    for (const claim of content.takeaways) addCaseRow(content.studyIds.join("; "), "Takeaway", claim.text, claim.evidenceClass,
      researchCase.evidence.filter((entry) => claim.evidence.some((ref) => ref.sourcePath === entry.sourcePath && ref.locator === entry.locator)));
    addCaseRow(content.studyIds.join("; "), "Next research questions", content.nextQuestions.join("\n"), "MODEL_INFERENCE", []);
    for (const reference of content.readingReferences ?? []) {
      rows.push(["", "external reading reference", reference.title, reference.status,
        JSON.stringify(reference), "", "", "", "", "", reference.url ?? "", "", "", "", "", "", "", "", "",
        `${readingMetadata(reference)}. ${readingBoundary}`, exportedAt, readingBoundary]);
    }
  }
  return (
    "\uFEFF" + rows.map((row) => [...row, ...Array(Math.max(0, rows[0].length - row.length)).fill("")].map(cell).join(",")).join("\r\n") + "\r\n"
  );
}
