import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CaseView } from "../../src/app/studies/case-view";
import { sessionCsv, sessionManifest } from "../../src/app/studies/session-export";
import { loadResearchCases } from "../../src/lib/cases/load";
import { researchCases } from "../../src/lib/cases/content";
import { readingBoundary, validateReadingReferences } from "../../src/lib/cases/reading-references";
import { loadSnapshotCatalogue } from "../../src/lib/snapshots/catalogue";
import { savedPrimaryOutcomes } from "../../src/lib/snapshots/primary-outcomes";

async function fixture() {
  const catalogue = await loadSnapshotCatalogue();
  const researchCase = (await loadResearchCases(catalogue)).find(item => item.content.id === "mdma-ptsd-design-context")!;
  return { catalogue, researchCase, selected: catalogue.filter(item => researchCase.content.studyIds.includes(item.nctId)) };
}

describe("MAPP design reading boundary", () => {
  it("preserves both registered outcome pairs and keeps linked documents out of registry evidence", async () => {
    const { researchCase, selected } = await fixture();
    const manifest = sessionManifest(selected, [], "2026-11-20T12:00:00Z", researchCase);
    expect(manifest.savedPrimaryOutcomes).toEqual(savedPrimaryOutcomes(selected));
    expect(manifest.savedPrimaryOutcomes?.entryCount).toBe(2);
    expect(manifest.savedPrimaryOutcomes?.studies[1]!.entries[0]!.timeFrame.value).toBe("Baseline to 18 weeks post baseline post enrollment confirmation");
    expect(researchCase.content.readingReferences).toHaveLength(6);
    expect(researchCase.evidence.every(item => item.sourcePath.startsWith("data/research-cases/mdma-ptsd/v1/") && item.locator.startsWith("/studies/0/protocolSection/"))).toBe(true);
    const csv = sessionCsv(selected, [], manifest.exportedAt, researchCase);
    for (const reference of researchCase.content.readingReferences!) {
      expect(manifest.researchCase?.content.readingReferences).toContainEqual(reference);
      expect(csv).toContain(JSON.stringify(reference).replaceAll('"', '""'));
    }
    expect(csv).toContain("external reading reference");
    expect(csv).toContain(readingBoundary);
    expect(csv).toContain("Baseline to 18 weeks post baseline post enrollment confirmation");
  });

  it("renders the paper-specific correction and no active unavailable-protocol link", async () => {
    const { researchCase } = await fixture();
    const html = renderToStaticMarkup(createElement(CaseView, { researchCase }));
    expect(html).toContain(readingBoundary);
    expect(html).toContain("Author correction");
    expect(html).toContain("2024-10-07");
    expect(html).toContain("Unavailable at checked link");
    const unavailable = researchCase.content.readingReferences!.find(item => item.availability === "unavailable")!;
    expect(unavailable.url).toBeNull();
    expect(html).not.toContain(`href="${unavailable.checkedUrl}`);
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("rejects unsafe reading URLs, duplicate entries and notices attached to the wrong article", async () => {
    const { researchCase } = await fixture();
    const base = researchCase.content.readingReferences![0]!;
    for (const url of ["javascript:alert(1)", "data:text/html,x", "http://www.nature.com/a", "https://user:password@www.nature.com/a", "https://www.nature.com.evil.test/a", "https://www.nature.com:8443/a"]) {
      expect(() => validateReadingReferences([{ ...base, url }])).toThrow();
    }
    expect(() => validateReadingReferences([base, base])).toThrow("DUPLICATE_READING_REFERENCE");
    expect(() => validateReadingReferences([{ ...base, availability: "unavailable" }])).toThrow();
    const corrected = researchCase.content.readingReferences!.find(item => item.notice)!;
    expect(() => validateReadingReferences([{ ...corrected, notice: { ...corrected.notice!, appliesTo: "different-article" } }])).toThrow();
    expect(() => validateReadingReferences([{ ...corrected, status: "retracted" }])).toThrow();
  });

  it("fails closed when case wording no longer matches the saved field", async () => {
    const { catalogue } = await fixture();
    const content = researchCases.find(item => item.id === "mdma-ptsd-design-context")!;
    const evidence = content.dimensions[0]!.cells[0]!.evidence[0]!;
    const original = evidence.expectedValue;
    try {
      evidence.expectedValue = "Unverified changed wording";
      await expect(loadResearchCases(catalogue)).rejects.toThrow("CASE_FIELD_MISMATCH");
    } finally { evidence.expectedValue = original; }
  });
});
