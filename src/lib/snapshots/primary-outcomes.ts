import type { Availability } from "../domain/trials";
import type { Capture } from "./model";

export type OutcomeField = { value: string; status: "reported" | "not_reported" | "not_captured" };
export const outcomeFieldText = (field: OutcomeField) => field.value;
export type SavedPrimaryOutcomes = {
  version: "saved-primary-outcomes/v1"; label: "Saved registry primary-outcome fields — not results."; limitation: string; studyCount: number; entryCount: number;
  studies: Array<{ nctId: string; retrievedAt: string; registryLastUpdate: string | null; rawSha256: string; projectedSha256: string; requestUrl: string; sourceUrl: string; status: "reported" | "not_reported" | "not_captured";
    context: { conditions: readonly string[]; interventions: readonly { name: string; type: string | null }[]; phases: readonly string[] }; contextStatus: { conditions: OutcomeField["status"]; interventions: OutcomeField["status"]; phases: OutcomeField["status"] };
    entries: Array<{ index: number; measure: OutcomeField; timeFrame: OutcomeField; evidenceClass: "STRUCTURED_EXTRACTION"; parentLocator: string; measureLocator: string | null; timeFrameLocator: string | null; derivedLocators: true; projectionSha256: string; sourceValue: { measure: string | null; timeFrame: string | null } }> }>;
};
const missing = (state: Availability<unknown>["state"]): OutcomeField => ({ value: state === "not_requested" ? "Not captured" : "Not reported in this captured response", status: state === "not_requested" ? "not_captured" : "not_reported" });
function pointer(value: unknown, path: string) { return path.slice(1).split("/").reduce<unknown>((at, key) => at && typeof at === "object" ? (at as Record<string, unknown>)[key] : undefined, value); }
const mismatch = () => { throw new Error("PRIMARY_OUTCOMES_NORMALIZED_SOURCE_MISMATCH"); };
const expectedParent = "/studies/0/protocolSection/outcomesModule/primaryOutcomes";
/** Consumes captures validated by the catalogue/adapter boundary. Hashes identify
 * those verified inputs; this synchronous view checks pointers and values, not
 * cryptographic integrity again. Downloaded bundles can be replayed independently. */
export function savedPrimaryOutcomes(captures: Capture[]): SavedPrimaryOutcomes {
  const studies = captures.map((capture) => {
    const parentLocator = capture.record.provenance.fieldLocators.primaryOutcomes;
    const source: unknown = JSON.parse(capture.sourceProjectionJson);
    if (pointer(source, "/studies/0/protocolSection/identificationModule/nctId") !== capture.nctId || capture.record.nctId !== capture.nctId) mismatch();
    const requested = { measure: capture.requestedFields.includes("PrimaryOutcomeMeasure"), timeFrame: capture.requestedFields.includes("PrimaryOutcomeTimeFrame") };
    const normalized = capture.record.primaryOutcomes;
    const sourceEntries = pointer(source, expectedParent);
    const hasEntries = Array.isArray(sourceEntries) && sourceEntries.length > 0;
    const expectedState = !requested.measure && !requested.timeFrame ? "not_requested" : hasEntries ? "reported" : "not_reported";
    if (normalized.state !== expectedState) mismatch();
    if (normalized.state === "reported" && (!Array.isArray(sourceEntries) || normalized.value.length !== sourceEntries.length || parentLocator !== expectedParent)) mismatch();
    const entries = normalized.state === "reported" ? normalized.value.map((outcome, index) => {
      const sourceOutcome = pointer(source, `${expectedParent}/${index}`) as { measure?: unknown; timeFrame?: unknown } | undefined;
      if (!sourceOutcome || typeof sourceOutcome !== "object") return mismatch();
      const field = (key: "measure" | "timeFrame"): OutcomeField => {
        if (!requested[key]) return missing("not_requested");
        const raw = sourceOutcome[key];
        const expected = outcome[key];
        if (raw === undefined || raw === null) {
          if (expected !== null) return mismatch();
          return missing("not_reported");
        }
        if (typeof raw !== "string" || raw.trim() !== expected) return mismatch();
        return { value: raw, status: "reported" };
      };
      const measure = field("measure"), timeFrame = field("timeFrame");
      return { index, measure, timeFrame, evidenceClass: "STRUCTURED_EXTRACTION" as const, parentLocator: expectedParent, measureLocator: measure.status === "reported" ? `${expectedParent}/${index}/measure` : null, timeFrameLocator: timeFrame.status === "reported" ? `${expectedParent}/${index}/timeFrame` : null, derivedLocators: true as const, projectionSha256: capture.projectedSha256, sourceValue: { measure: measure.status === "reported" ? measure.value : null, timeFrame: timeFrame.status === "reported" ? timeFrame.value : null } };
    }) : [];
    const context = <T>(value: Availability<T>, fallback: T) => value.state === "reported" ? value.value : fallback;
    const availability = (value: Availability<unknown>): OutcomeField["status"] => value.state === "reported" ? "reported" : value.state === "not_requested" ? "not_captured" : "not_reported";
    return { nctId: capture.nctId, retrievedAt: capture.retrievedAt, registryLastUpdate: capture.record.provenance.registryLastUpdatePostedDate, rawSha256: capture.rawSha256, projectedSha256: capture.projectedSha256, requestUrl: capture.requestUrl, sourceUrl: capture.record.provenance.sourceUrl, status: availability(normalized), context: { conditions: [...context(capture.record.conditions, [])], interventions: context(capture.record.interventions, []).map(item => ({ ...item })), phases: [...context(capture.record.phases, [])] }, contextStatus: { conditions: availability(capture.record.conditions), interventions: availability(capture.record.interventions), phases: availability(capture.record.phases) }, entries };
  });
  return { version: "saved-primary-outcomes/v1", label: "Saved registry primary-outcome fields — not results.", limitation: "These measures and time frames show part of the registered study plan. They do not establish whether the studies are comparable.", studyCount: studies.length, entryCount: studies.reduce((sum, study) => sum + study.entries.length, 0), studies };
}
