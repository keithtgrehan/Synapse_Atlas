import type { Capture } from "../snapshots/model";
export function summarizeCatalogue(captures: Capture[]) {
  const count = (values: string[]) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((item) => item === value).length]));
  return {
    version: "catalogue-description/v1",
    evidenceClass: "DERIVED_CALCULATION",
    count: captures.length,
    statuses: count(captures.map((item) => item.record.overallStatus.value ?? "Not reported")),
    phases: count(captures.map((item) => item.record.phases.value?.join(" / ") || "Not reported")),
    enrollmentDefinitions: count(captures.map((item) => item.record.enrollment.value?.type ?? "Not reported")),
    primaryEndpointReported: captures.filter((item) => item.record.primaryOutcomes.state === "reported").length,
    retrievalDates: [...new Set(captures.map((item) => item.retrievedAt.slice(0, 10)))].sort(),
    inputs: captures.map((item) => ({ nctId: item.nctId, projectedSha256: item.projectedSha256, fields: ["overallStatus", "phases", "enrollment", "primaryOutcomes"], locators: item.record.provenance.fieldLocators })),
    method: "Count each retained NCT record once in each descriptive category. Combined phases stay a combined category. Missing types are explicit. Endpoint coverage counts reported primary-outcome fields, not results. No enrolment totals or clinical outcomes are pooled.",
    limitations: "This is a selected set of dated study records, not a systematic review or a representative sample. The records describe different study populations and designs and were saved on different dates. These counts cannot show treatment effects or market opportunity.",
  };
}
