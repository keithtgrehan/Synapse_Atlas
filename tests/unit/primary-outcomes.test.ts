import { describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { clinicalTrialsApiPageSchema, normalizeClinicalTrial } from "../../src/lib/domain/trials";
import type { Capture } from "../../src/lib/snapshots/model";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrimaryOutcomeInspector } from "../../src/app/studies/primary-outcome-inspector";
import { sessionCsv } from "../../src/app/studies/session-export";
import { loadSnapshotCatalogue } from "../../src/lib/snapshots/catalogue";
import { savedPrimaryOutcomes } from "../../src/lib/snapshots/primary-outcomes";

// Synthetic source projections exercise missingness that is absent from the retained catalogue.
export function syntheticOutcomes(base: Capture, outcomes: Array<{ measure: string; timeFrame?: string }> | undefined, fields = ["PrimaryOutcomeMeasure", "PrimaryOutcomeTimeFrame"]): Capture {
  const capture = structuredClone(base);
  const source = JSON.parse(capture.sourceProjectionJson);
  source.studies[0].protocolSection.outcomesModule = outcomes ? { primaryOutcomes: outcomes } : {};
  capture.sourceProjectionJson = JSON.stringify(source);
  capture.projectedSha256 = createHash("sha256").update(capture.sourceProjectionJson).digest("hex");
  capture.requestedFields = [...capture.requestedFields.filter(key => !key.startsWith("PrimaryOutcome")), ...fields];
  const parsed = clinicalTrialsApiPageSchema.parse(source);
  capture.record = normalizeClinicalTrial(parsed.studies[0], { apiRequestUrl: capture.requestUrl, retrievedAt: capture.retrievedAt, processedAt: capture.processedAt, contentSha256: capture.rawSha256, requestedFields: new Set(capture.requestedFields), studyIndex: 0 });
  return capture;
}

describe("saved primary outcomes", () => {
  it("preserves real multi-entry records in source order with verified child locators", async () => {
    const all = await loadSnapshotCatalogue();
    const selected = all.filter((c) => ["NCT03559192", "NCT01360645"].includes(c.nctId));
    const model = savedPrimaryOutcomes(selected);
    expect(model.studyCount).toBe(2); expect(model.entryCount).toBe(3);
    expect(model.studies.find((s) => s.nctId === "NCT01360645")!.entries).toHaveLength(2);
    expect(model.studies.find((s) => s.nctId === "NCT01360645")!.entries[1]!.measure.value).toContain("Final Protocol");
    expect(model.studies.every((s) => s.entries.every((e) => e.measureLocator === `${e.parentLocator}/${e.index}/measure` && e.derivedLocators))).toBe(true);
  });
  it("keeps four entries, raw strings and capture isolation", async () => {
    const capture = (await loadSnapshotCatalogue()).find((c) => c.nctId === "NCT04581902")!;
    const model = savedPrimaryOutcomes([capture]);
    expect(model.entryCount).toBe(4); expect(model.studies[0]!.entries[0]!.timeFrame.value).toContain("~ 8 weeks");
    const hostile = syntheticOutcomes(capture, undefined, []);
    const missing = savedPrimaryOutcomes([hostile]);
    expect(missing.studies[0]!.status).toBe("not_captured"); expect(missing.entryCount).toBe(0);
    expect(capture.record.primaryOutcomes.state).toBe("reported");
  });
  it("rejects a normalized/source mismatch", async () => {
    const capture = structuredClone((await loadSnapshotCatalogue()).find((c) => c.nctId === "NCT04581902")!);
    capture.record.primaryOutcomes = { state: "reported", value: [{ measure: "<img src=x>", timeFrame: "x" }] };
    expect(() => savedPrimaryOutcomes([capture])).toThrow("PRIMARY_OUTCOMES_NORMALIZED_SOURCE_MISMATCH");
  });
  it("distinguishes absent and unrequested outcomes and individual time frames", async () => {
    const base = (await loadSnapshotCatalogue())[0];
    const absent = savedPrimaryOutcomes([syntheticOutcomes(base, undefined)]).studies[0];
    expect(absent.status).toBe("not_reported");
    const missingTime = savedPrimaryOutcomes([syntheticOutcomes(base, [{ measure: "Registered measure" }])]).studies[0].entries[0];
    expect(missingTime.timeFrame).toEqual({ status: "not_reported", value: "Not reported in this captured response" });
    expect(missingTime.timeFrameLocator).toBeNull();
    const unrequestedTime = savedPrimaryOutcomes([syntheticOutcomes(base, [{ measure: "Registered measure", timeFrame: "Do not present this unrequested value" }], ["PrimaryOutcomeMeasure"])]).studies[0].entries[0];
    expect(unrequestedTime.timeFrame).toEqual({ status: "not_captured", value: "Not captured" });
    expect(unrequestedTime.timeFrameLocator).toBeNull();
    expect(unrequestedTime.sourceValue.timeFrame).toBeNull();
    const unrequestedMeasure = savedPrimaryOutcomes([syntheticOutcomes(base, [{ measure: "Unrequested measure", timeFrame: "Week 6" }], ["PrimaryOutcomeTimeFrame"])]).studies[0].entries[0];
    expect(unrequestedMeasure.measure.status).toBe("not_captured");
    expect(unrequestedMeasure.measureLocator).toBeNull();
    expect(unrequestedMeasure.timeFrame.value).toBe("Week 6");
  });
  it("preserves raw strings without fetching, mutating or sharing context arrays", async () => {
    const catalogue = await loadSnapshotCatalogue();
    const capture = syntheticOutcomes(catalogue[0], [{ measure: ' =HYPERLINK("evil")_<img src=x> ', timeFrame: "  Week_6  " }]);
    const before = JSON.stringify(capture);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No request permitted"));
    try {
      const view = savedPrimaryOutcomes([capture, ...catalogue.slice(1, 4)]);
      expect(view.studyCount).toBe(4);
      expect(view.studies[0].entries[0].measure.value).toBe(' =HYPERLINK("evil")_<img src=x> ');
      expect(view.studies[0].entries[0].timeFrame.value).toBe("  Week_6  ");
      expect(sessionCsv([capture], [], "2026-11-20T12:00:00Z")).toContain('"\' =HYPERLINK(""evil"")_<img src=x> "');
      const html = renderToStaticMarkup(createElement(PrimaryOutcomeInspector, { view }));
      expect(html).toContain("&lt;img src=x&gt;");
      expect(html).not.toContain("<img src=x>");
      expect(view.studies[0].context.conditions).not.toBe(capture.record.conditions.value);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(JSON.stringify(capture)).toBe(before);
    } finally { fetchSpy.mockRestore(); }
  });
  it("rejects identity, parent-pointer and omitted-entry mismatches", async () => {
    const base = (await loadSnapshotCatalogue()).find(c => c.nctId === "NCT01360645")!;
    for (const kind of ["identity", "parent", "length"]) {
      const capture = structuredClone(base);
      if (kind === "identity") capture.nctId = "NCT00000000";
      if (kind === "parent") capture.record.provenance.fieldLocators = { ...capture.record.provenance.fieldLocators, primaryOutcomes: "/studies/0/protocolSection/conditionsModule/conditions" };
      if (kind === "length" && capture.record.primaryOutcomes.state === "reported") capture.record.primaryOutcomes.value = capture.record.primaryOutcomes.value.slice(0, 1);
      expect(() => savedPrimaryOutcomes([capture])).toThrow("PRIMARY_OUTCOMES_NORMALIZED_SOURCE_MISMATCH");
    }
  });
});
