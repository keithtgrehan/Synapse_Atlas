import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ComparisonFocus, resolveComparisonFocus } from "../../src/app/studies/comparison-focus";
import { loadResearchCases } from "../../src/lib/cases/load";
import { loadSnapshotCatalogue } from "../../src/lib/snapshots/catalogue";

async function cases() {
  return loadResearchCases(await loadSnapshotCatalogue());
}

describe("focused case comparison", () => {
  it("uses a presentation-only default for every guided case and safely falls back", async () => {
    const expected = new Map([
      ["mdd-measurement-window", "primary-outcome"],
      ["adjunctive-inadequate-response", "madrs-window"],
      ["registry-change-brief", "current-capture-status"],
      ["mdma-ptsd-design-context", "registered-population"],
    ]);

    for (const researchCase of await cases()) {
      expect(resolveComparisonFocus(researchCase.content)?.key).toBe(expected.get(researchCase.content.id));
      expect(resolveComparisonFocus(researchCase.content, "missing-key")?.key).toBe(expected.get(researchCase.content.id));
      const withoutDefault = {
        ...researchCase.content,
        dimensions: researchCase.content.dimensions.filter((dimension) => dimension.key !== expected.get(researchCase.content.id)),
      };
      expect(resolveComparisonFocus(withoutDefault)).toBe(withoutDefault.dimensions[0]);
      const emptyContent = { ...researchCase.content, dimensions: [] };
      expect(resolveComparisonFocus(emptyContent)).toBeUndefined();
      expect(renderToStaticMarkup(createElement(ComparisonFocus, {
        researchCase: { ...researchCase, content: emptyContent },
        onOpenMatrix: () => undefined,
      }))).toBe("");
    }
  });

  it("shows the existing summary values with exact saved source details without changing content identity", async () => {
    const researchCase = (await cases()).find((item) => item.content.id === "mdd-measurement-window")!;
    const before = JSON.stringify(researchCase.content);
    const html = renderToStaticMarkup(createElement(ComparisonFocus, {
      researchCase,
      onOpenMatrix: () => undefined,
    }));
    const dimension = resolveComparisonFocus(researchCase.content)!;

    expect(html).toContain("Explore the comparison");
    expect(html).toContain("Atlas summary of saved fields");
    expect(html).toContain("AI-assisted reading note");
    expect(html).toContain("This does not compare treatment results or change this brief.");
    for (const cell of dimension.cells) {
      expect(html).toContain(cell.nctId);
      expect(html).toContain(cell.value);
      for (const source of cell.evidence) {
        expect(html).toContain(`<time dateTime="${source.retrievedAt.slice(0, 10)}">${source.retrievedAt.slice(0, 10)}</time>`);
        expect(html).toContain(source.locator);
        expect(html).toContain(String(source.expectedValue));
      }
    }
    expect(JSON.stringify(researchCase.content)).toBe(before);
  });

  it("states the saved-version boundary instead of presenting it as a live check", async () => {
    const researchCase = (await cases()).find((item) => item.content.id === "registry-change-brief")!;
    const html = renderToStaticMarkup(createElement(ComparisonFocus, {
      researchCase,
      onOpenMatrix: () => undefined,
    }));

    expect(html).toContain("later saved version, not a live check or the complete record history");
  });
});
