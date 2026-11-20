import { describe, expect, it } from "vitest";
import { loadSnapshotCatalogue } from "../../src/lib/snapshots/catalogue";
import { savedPrimaryOutcomes } from "../../src/lib/snapshots/primary-outcomes";

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
    const hostile = structuredClone(capture); hostile.record.primaryOutcomes = { state: "not_requested", value: null };
    const missing = savedPrimaryOutcomes([hostile]);
    expect(missing.studies[0]!.status).toBe("not_captured"); expect(missing.entryCount).toBe(0);
    expect(capture.record.primaryOutcomes.state).toBe("reported");
  });
  it("rejects a normalized/source mismatch", async () => {
    const capture = structuredClone((await loadSnapshotCatalogue()).find((c) => c.nctId === "NCT04581902")!);
    capture.record.primaryOutcomes = { state: "reported", value: [{ measure: "<img src=x>", timeFrame: "x" }] };
    expect(() => savedPrimaryOutcomes([capture])).toThrow("PRIMARY_OUTCOMES_NORMALIZED_SOURCE_MISMATCH");
  });
});
