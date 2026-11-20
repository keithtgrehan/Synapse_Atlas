import type { Availability } from "../domain/trials";
import type { Capture } from "./model";

export type OutcomeField = { value: string; status: "reported" | "not_reported" | "not_captured" };
export const outcomeFieldText = (field: OutcomeField) => field.value;
export type SavedPrimaryOutcomes = {
  version: "saved-primary-outcomes/v1"; label: "Saved registry primary-outcome fields — not results."; limitation: string; studyCount: number; entryCount: number;
  studies: Array<{ nctId: string; retrievedAt: string; registryLastUpdate: string | null; rawSha256: string; projectedSha256: string; requestUrl: string; sourceUrl: string; status: "reported" | "not_reported" | "not_captured";
    context: { conditions: readonly string[]; interventions: readonly { name: string; type: string | null }[]; phases: readonly string[] }; contextStatus: { conditions: OutcomeField["status"]; interventions: OutcomeField["status"]; phases: OutcomeField["status"] };
    entries: Array<{ index: number; measure: OutcomeField; timeFrame: OutcomeField; evidenceClass: "STRUCTURED_EXTRACTION"; parentLocator: string; measureLocator: string; timeFrameLocator: string | null; derivedLocators: true; projectionSha256: string; sourceValue: { measure: string | null; timeFrame: string | null } }> }>;
};
const missing = (state: Availability<unknown>["state"]): OutcomeField => ({ value: state === "not_requested" ? "Not captured" : "Not reported in this captured response", status: state === "not_requested" ? "not_captured" : "not_reported" });
function pointer(value: unknown, path: string) { return path.slice(1).split("/").reduce<unknown>((at, key) => at && typeof at === "object" ? (at as Record<string, unknown>)[key] : undefined, value); }
function reported<T>(value: Availability<T>): T { if (value.state !== "reported") throw new Error("PRIMARY_OUTCOMES_NORMALIZED_SOURCE_MISMATCH"); return value.value; }
export function savedPrimaryOutcomes(captures: Capture[]): SavedPrimaryOutcomes {
  const studies = captures.map((capture) => {
    const parentLocator = capture.record.provenance.fieldLocators.primaryOutcomes;
    const source = JSON.parse(capture.sourceProjectionJson);
    const normalized = capture.record.primaryOutcomes;
    const entries = normalized.state === "reported" ? reported(normalized).map((outcome, index) => {
      if (!parentLocator) throw new Error("PRIMARY_OUTCOMES_NORMALIZED_SOURCE_MISMATCH");
      const sourceOutcome = pointer(source, `${parentLocator}/${index}`) as { measure?: unknown; timeFrame?: unknown } | undefined;
      if (!sourceOutcome || sourceOutcome.measure !== outcome.measure || (sourceOutcome.timeFrame ?? null) !== outcome.timeFrame) throw new Error("PRIMARY_OUTCOMES_NORMALIZED_SOURCE_MISMATCH");
      const state = (v: string | null, key: "measure" | "timeFrame"): OutcomeField => v === null ? missing("not_reported") : { value: v, status: "reported" };
      return { index, measure: state(outcome.measure, "measure"), timeFrame: state(outcome.timeFrame, "timeFrame"), evidenceClass: "STRUCTURED_EXTRACTION" as const, parentLocator, measureLocator: `${parentLocator}/${index}/measure`, timeFrameLocator: outcome.timeFrame === null ? null : `${parentLocator}/${index}/timeFrame`, derivedLocators: true as const, projectionSha256: capture.projectedSha256, sourceValue: { measure: outcome.measure, timeFrame: outcome.timeFrame } };
    }) : [];
    const context = <T>(value: Availability<T>, fallback: T) => value.state === "reported" ? value.value : fallback;
    const availability = (value: Availability<unknown>): OutcomeField["status"] => value.state === "reported" ? "reported" : value.state === "not_requested" ? "not_captured" : "not_reported";
    return { nctId: capture.nctId, retrievedAt: capture.retrievedAt, registryLastUpdate: capture.record.provenance.registryLastUpdatePostedDate, rawSha256: capture.rawSha256, projectedSha256: capture.projectedSha256, requestUrl: capture.requestUrl, sourceUrl: capture.record.provenance.sourceUrl, status: availability(normalized), context: { conditions: context(capture.record.conditions, []), interventions: context(capture.record.interventions, []), phases: context(capture.record.phases, []) }, contextStatus: { conditions: availability(capture.record.conditions), interventions: availability(capture.record.interventions), phases: availability(capture.record.phases) }, entries };
  });
  return { version: "saved-primary-outcomes/v1", label: "Saved registry primary-outcome fields — not results.", limitation: "Saved registry fields are not reported outcomes, results, or a comparability assessment.", studyCount: studies.length, entryCount: studies.reduce((sum, study) => sum + study.entries.length, 0), studies };
}
