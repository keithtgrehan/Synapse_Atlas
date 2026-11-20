import type { TrialRecord } from "../domain/trials";

export type Capture = {
  nctId: string;
  retainedSourcePath?: string;
  /** A field-limited, safe replay projection; rawSha256 identifies the immutable source bytes. */
  sourceProjectionJson: string;
  sourceEvidenceMode: "field-projection" | "exact-response";
  /** Present only for a live response that passed the strict public-field allowlist. */
  rawResponseJson?: string;
  /** Hash of the immutable response received from the registry. */
  rawSha256: string;
  /** Hash of rawJson; distinguishes the export-safe projection from the source bytes. */
  projectedSha256: string;
  projection: {
    kind: "allowlisted-response-projection";
    fields: readonly string[];
  };
  normalizedSha256: string;
  requestUrl: string;
  requestedFields: readonly string[];
  retrievedAt: string;
  processedAt: string;
  record: TrialRecord;
  transformationVersion: string;
};

export const snapshotFieldKeys = [
  "overallStatus",
  "enrollment",
  "primaryOutcomes",
  "primaryCompletionDate",
  "completionDate",
  "leadSponsor",
  "interventions",
] as const;

export type SnapshotFieldKey = (typeof snapshotFieldKeys)[number];
export type SnapshotChangeState =
  | "unchanged"
  | "changed"
  | "added"
  | "removed"
  | "not_compared"
  | "ambiguous";

export type SnapshotFieldChange = {
  key: SnapshotFieldKey;
  label: string;
  state: SnapshotChangeState;
  before: string;
  after: string;
  baselineLocators: string[];
  currentLocators: string[];
  note?: string;
};

export type SnapshotDiff = {
  nctId: string;
  comparatorVersion: string;
  baseline: Capture;
  current: Capture;
  fields: SnapshotFieldChange[];
};
