import type {
  Availability,
  PartialDate,
  TrialIntervention,
  TrialOutcome,
} from "../domain/trials";
import {
  snapshotFieldKeys,
  type Capture,
  type SnapshotDiff,
  type SnapshotFieldChange,
  type SnapshotFieldKey,
} from "./model";

export const snapshotComparatorVersion = "nct-snapshot-diff/v1";
const knownRegistryStatuses = new Set([
  "ACTIVE_NOT_RECRUITING",
  "APPROVED_FOR_MARKETING",
  "AVAILABLE",
  "COMPLETED",
  "ENROLLING_BY_INVITATION",
  "NO_LONGER_AVAILABLE",
  "NOT_YET_RECRUITING",
  "RECRUITING",
  "SUSPENDED",
  "TEMPORARILY_NOT_AVAILABLE",
  "TERMINATED",
  "UNKNOWN",
  "WITHDRAWN",
  "WITHHELD",
]);

const labels: Record<SnapshotFieldKey, string> = {
  overallStatus: "Registry status",
  enrollment: "Enrolment",
  primaryOutcomes: "Primary endpoints",
  primaryCompletionDate: "Primary completion",
  completionDate: "Study completion",
  leadSponsor: "Lead sponsor",
  interventions: "Interventions",
};
const requiredSourceFields: Record<SnapshotFieldKey, readonly string[]> = {
  overallStatus: ["OverallStatus"],
  enrollment: ["EnrollmentCount", "EnrollmentType"],
  primaryOutcomes: ["PrimaryOutcomeMeasure", "PrimaryOutcomeTimeFrame"],
  primaryCompletionDate: ["PrimaryCompletionDate", "PrimaryCompletionDateType"],
  completionDate: ["CompletionDate", "CompletionDateType"],
  leadSponsor: ["LeadSponsorName", "LeadSponsorClass"],
  interventions: ["InterventionName", "InterventionType"],
};

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "Not reported";
  if (typeof value === "string") return value.replaceAll("_", " ");
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return value.map(formatValue).join("; ");
  if (typeof value === "object") {
    const valueRecord = value as Record<string, unknown>;
    if ("value" in valueRecord && "precision" in valueRecord)
      return `${formatValue(valueRecord.value)} (${String(valueRecord.precision).toLowerCase()} precision${valueRecord.type === null ? "; type not reported" : `; ${formatValue(valueRecord.type)}`})`;
    if ("count" in valueRecord)
      return `${formatValue(valueRecord.count)} (${valueRecord.type === null ? "type not reported" : formatValue(valueRecord.type)})`;
    if ("type" in valueRecord && "name" in valueRecord)
      return valueRecord.type === null
        ? formatValue(valueRecord.name)
        : `${formatValue(valueRecord.type)}: ${formatValue(valueRecord.name)}`;
    if ("name" in valueRecord)
      return valueRecord.class === null
        ? formatValue(valueRecord.name)
        : `${formatValue(valueRecord.name)} (${formatValue(valueRecord.class)})`;
    if ("measure" in valueRecord)
      return `${formatValue(valueRecord.measure)} — ${valueRecord.timeFrame === null ? "time frame not reported" : formatValue(valueRecord.timeFrame)}`;
    return JSON.stringify(value);
  }
  return String(value);
}

function availabilityValue<T>(value: Availability<T>): T | null {
  return value.state === "reported" ? value.value : null;
}
function stable(value: unknown): string {
  return JSON.stringify(value);
}
function locator(capture: Capture, key: SnapshotFieldKey): string[] {
  const value = capture.record.provenance.fieldLocators[key];
  return value === undefined ? [] : [value];
}
function dateEqual(a: PartialDate, b: PartialDate) {
  return (
    a.value === b.value && a.precision === b.precision && a.type === b.type
  );
}
function interventionKeys(value: readonly TrialIntervention[]) {
  return value.map((item) => `${item.type ?? ""}\u0000${item.name}`);
}
function outcomeKeys(value: readonly TrialOutcome[]) {
  return value.map((item) => `${item.measure}\u0000${item.timeFrame ?? ""}`);
}

function change(
  key: SnapshotFieldKey,
  baseline: Capture,
  current: Capture,
): SnapshotFieldChange {
  const beforeAvailability = baseline.record[key] as Availability<unknown>;
  const afterAvailability = current.record[key] as Availability<unknown>;
  const before = availabilityValue(beforeAvailability);
  const after = availabilityValue(afterAvailability);
  const base: Omit<SnapshotFieldChange, "state" | "note"> = {
    key,
    label: labels[key],
    before: formatValue(before),
    after: formatValue(after),
    baselineLocators: locator(baseline, key),
    currentLocators: locator(current, key),
  };
  const missingSourceFields = requiredSourceFields[key].filter(
    (field) =>
      !baseline.requestedFields.includes(field) ||
      !current.requestedFields.includes(field),
  );
  if (missingSourceFields.length > 0)
    return {
      ...base,
      state: "not_compared",
      note: `At least one capture did not request ${missingSourceFields.join(", ")}; no grouped-field change is inferred.`,
    };
  if (
    beforeAvailability.state === "not_requested" ||
    afterAvailability.state === "not_requested"
  )
    return {
      ...base,
      state: "not_compared",
      note: "At least one capture did not request this field, so no change is inferred.",
    };
  if (
    key === "overallStatus" &&
    (before === "UNKNOWN" ||
      after === "UNKNOWN" ||
      !knownRegistryStatuses.has(String(before)) ||
      !knownRegistryStatuses.has(String(after)))
  )
    return {
      ...base,
      state: "not_compared",
      note: "The registry returned an unknown or unsupported status; no meaning is inferred.",
    };
  if (before === null && after === null)
    return {
      ...base,
      state: "not_compared",
      note: "Neither captured record reported this requested field.",
    };
  if (before === null) return { ...base, state: "added" };
  if (after === null) return { ...base, state: "removed" };
  if (key === "primaryCompletionDate" || key === "completionDate")
    return {
      ...base,
      state: dateEqual(before as PartialDate, after as PartialDate)
        ? "unchanged"
        : "changed",
    };
  if (key === "interventions" || key === "primaryOutcomes") {
    const keys =
      key === "interventions"
        ? [
            interventionKeys(before as readonly TrialIntervention[]),
            interventionKeys(after as readonly TrialIntervention[]),
          ]
        : [
            outcomeKeys(before as readonly TrialOutcome[]),
            outcomeKeys(after as readonly TrialOutcome[]),
          ];
    if (
      new Set(keys[0]).size !== keys[0].length ||
      new Set(keys[1]).size !== keys[1].length
    )
      return {
        ...base,
        state: "ambiguous",
        note: "Repeated entries cannot be aligned reliably; inspect both source locations.",
      };
    if (key === "interventions")
      return {
        ...base,
        state:
          stable([...keys[0]].sort()) === stable([...keys[1]].sort())
            ? "unchanged"
            : "changed",
        note: "Intervention order is compared as an unordered unique set.",
      };
    if (stable(keys[0]) === stable(keys[1]))
      return { ...base, state: "unchanged" };
    if (stable([...keys[0]].sort()) === stable([...keys[1]].sort()))
      return {
        ...base,
        state: "changed",
        note: "Endpoint order changed; clinical meaning is not inferred.",
      };
    return { ...base, state: "changed" };
  }
  return {
    ...base,
    state: stable(before) === stable(after) ? "unchanged" : "changed",
  };
}

export function compareCaptures(
  baseline: Capture,
  current: Capture,
): SnapshotDiff {
  if (
    baseline.nctId !== current.nctId ||
    baseline.record.nctId !== baseline.nctId ||
    current.record.nctId !== current.nctId
  )
    throw new Error("SNAPSHOT_ID_MISMATCH");
  return {
    nctId: baseline.nctId,
    comparatorVersion: snapshotComparatorVersion,
    baseline,
    current,
    fields: snapshotFieldKeys.map((key) => change(key, baseline, current)),
  };
}
