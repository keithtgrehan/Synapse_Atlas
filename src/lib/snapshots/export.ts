import type { SnapshotDiff } from "./model";

function safeCell(value: string): string {
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** All export views use the already captured pair; this function performs no retrieval. */
export function createSnapshotBrief(diff: SnapshotDiff) {
  return {
    format: "synapse-atlas-snapshot-diff/v1",
    nctId: diff.nctId,
    comparatorVersion: diff.comparatorVersion,
    limitation:
      "A registry update does not establish clinical progress, efficacy, ownership, or commercial opportunity.",
    baseline: captureEvidence(diff.baseline),
    current: captureEvidence(diff.current),
    fields: diff.fields,
  };
}
function captureEvidence(capture: SnapshotDiff["baseline"]) {
  return {
    nctId: capture.nctId,
    ...(capture.retainedSourcePath
      ? { retainedSourcePath: capture.retainedSourcePath }
      : {}),
    requestUrl: capture.requestUrl,
    sourceUrl: capture.record.provenance.sourceUrl,
    fieldLocators: capture.record.provenance.fieldLocators,
    requestedFields: capture.requestedFields,
    retrievedAt: capture.retrievedAt,
    processedAt: capture.processedAt,
    registryLastUpdate: capture.record.provenance.registryLastUpdatePostedDate,
    rawSha256: capture.rawSha256,
    projectedSha256: capture.projectedSha256,
    projection: capture.projection,
    sourceEvidenceMode: capture.sourceEvidenceMode,
    ...(capture.rawResponseJson === undefined
      ? {}
      : { rawResponseJson: capture.rawResponseJson }),
    normalizedSha256: capture.normalizedSha256,
    transformationVersion: capture.transformationVersion,
    sourceProjectionJson: capture.sourceProjectionJson,
  };
}
export function snapshotBriefCsv(diff: SnapshotDiff): string {
  const rows = [
    [
      "NCT ID",
      "Comparator version",
      "Saved request URL",
      "Saved retrieved UTC",
      "Saved raw SHA-256",
      "Current request URL",
      "Current retrieved UTC",
      "Current raw SHA-256",
      "Field",
      "Change",
      "Saved snapshot",
      "Current capture",
      "Saved locators",
      "Current locators",
      "Note",
    ],
    ...diff.fields.map((field) => [
      diff.nctId,
      diff.comparatorVersion,
      diff.baseline.requestUrl,
      diff.baseline.retrievedAt,
      diff.baseline.rawSha256,
      diff.current.requestUrl,
      diff.current.retrievedAt,
      diff.current.rawSha256,
      field.label,
      field.state,
      field.before,
      field.after,
      field.baselineLocators.join("; "),
      field.currentLocators.join("; "),
      field.note ?? "",
    ]),
  ];
  return (
    "\uFEFF" +
    rows.map((row) => row.map(safeCell).join(",")).join("\r\n") +
    "\r\n"
  );
}

export const snapshotDiffCsv = snapshotBriefCsv;
