import type { Capture } from "../../lib/snapshots/model";
import type { ResearchManifest } from "../../lib/catalogue/model";
import { summarizeCatalogue } from "../../lib/catalogue/analysis";
import { formatValue } from "../../lib/snapshots/compare";
import { csvCell } from "../../lib/domain/research-brief";

export function catalogueCsv(captures: Capture[], manifest: ResearchManifest, filters: { query: string; groupId: string; status: string }, exportedAt: string) {
  const summary = summarizeCatalogue(captures);
  const rows = [["NCT ID", "Brief title", "Registered conditions", "Phase", "Registry status", "Primary endpoints and time frames", "Enrolment and definition", "Interventions", "Lead sponsor", "Primary completion", "Study completion", "Captured at", "Registry last update", "Official source", "Exact API request", "Response SHA-256", "Evidence SHA-256", "Normalized SHA-256", "Field locators", "Research collections", "Selection rationale", "Active filters", "Descriptive analysis", "Analysis method", "Limitations", "Exported at"]];
  for (const capture of captures) {
    const record = capture.record;
    rows.push([capture.nctId, record.briefTitle, formatValue(record.conditions.value), formatValue(record.phases.value), formatValue(record.overallStatus.value), formatValue(record.primaryOutcomes.value), formatValue(record.enrollment.value), formatValue(record.interventions.value), formatValue(record.leadSponsor.value), formatValue(record.primaryCompletionDate.value), formatValue(record.completionDate.value), capture.retrievedAt, record.provenance.registryLastUpdatePostedDate ?? "Not reported", record.provenance.sourceUrl, capture.requestUrl, capture.rawSha256, capture.projectedSha256, capture.normalizedSha256, JSON.stringify(record.provenance.fieldLocators), manifest.groups.filter((group) => group.studyIds.includes(capture.nctId)).map((group) => group.title).join("; "), manifest.entries.find((entry) => entry.nctId === capture.nctId)?.selectionRationale ?? "Original retained catalogue record", JSON.stringify(filters), JSON.stringify({ count: summary.count, statuses: summary.statuses, phases: summary.phases, enrollmentDefinitions: summary.enrollmentDefinitions, primaryEndpointReported: summary.primaryEndpointReported }), summary.method, summary.limitations, exportedAt]);
  }
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
