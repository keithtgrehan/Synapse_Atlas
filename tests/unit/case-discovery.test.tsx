import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import Home from "../../src/app/page";
import { CasePreview } from "../../src/app/case-preview";
import { researchCases } from "../../src/lib/cases/content";
import { loadResearchCases } from "../../src/lib/cases/load";
import { loadCatalogueManifest } from "../../src/lib/catalogue/load";
import { compareCaptures } from "../../src/lib/snapshots/compare";
import {
  loadReplayPair,
  loadSnapshotCatalogue,
} from "../../src/lib/snapshots/catalogue";

describe("case-led discovery", () => {
  it("makes every retained case and collection directly reachable without overstating the catalogue count", async () => {
    const [home, manifest, catalogue] = await Promise.all([
      Home(),
      loadCatalogueManifest(),
      loadSnapshotCatalogue(),
    ]);
    const html = renderToStaticMarkup(home);
    const memberships = manifest.groups.flatMap((group) => group.studyIds);

    expect(catalogue).toHaveLength(41);
    expect(new Set(catalogue.map((capture) => capture.nctId))).toHaveLength(41);
    expect(memberships).toHaveLength(44);
    expect(new Set(memberships)).toHaveLength(41);
    expect(html).toContain("41 retained NCT records");
    expect(html).toContain(
      "44 collection memberships cover 41 unique retained records",
    );
    expect(html).toContain('id="research-collections"');

    for (const researchCase of researchCases) {
      expect(html).toContain(`/studies?case=${researchCase.id}`);
      expect(html).toContain(researchCase.title);
    }
    for (const collection of manifest.groups) {
      expect(html).toContain(`/catalogue?collection=${collection.id}`);
      expect(html).toContain(collection.question);
    }

    const replayCase = researchCases.find(
      (item) => item.id === "registry-change-brief",
    )!;
    const retainedPairs = await Promise.all(
      replayCase.studyIds.map((nctId) => loadReplayPair(nctId)),
    );
    expect(retainedPairs.filter(Boolean)).toHaveLength(3);
    for (const pair of retainedPairs) {
      expect(pair).not.toBeNull();
      const diff = compareCaptures(pair!.baseline, pair!.current);
      const count = (states: string[]) =>
        diff.fields.filter((field) => states.includes(field.state)).length;
      expect(html).toContain(diff.nctId);
      expect(html).toContain(
        `${pair!.baseline.retrievedAt.slice(0, 10)} → ${pair!.current.retrievedAt.slice(0, 10)}`,
      );
      expect(html).toContain(
        `${count(["changed", "added", "removed"])} changed`,
      );
      expect(html).toContain(`${count(["unchanged"])} unchanged`);
      expect(html).toContain(
        `${count(["ambiguous", "not_compared"])} uncompared`,
      );
    }
  });

  it("renders source-verified measurement, timing and replay facts in the four distinct previews", async () => {
    const catalogue = await loadSnapshotCatalogue();
    const verified = new Map(
      (await loadResearchCases(catalogue)).map((item) => [item.content.id, item]),
    );
    const visibleDimensions: Record<string, string[]> = {
      "mdd-measurement-window": [
        "Registered primary outcome",
        "Primary-outcome time frame",
      ],
      "adjunctive-inadequate-response": [
        "MADRS baseline and primary window",
        "Registered adjunctive setting",
      ],
      "mdma-ptsd-design-context": [
        "Registered population wording",
        "Phase and registered enrolment",
      ],
      "registry-change-brief": [
        "Later-capture registered status",
        "Registered condition",
      ],
    };

    for (const [index, researchCase] of researchCases.entries()) {
      const html = renderToStaticMarkup(
        createElement(CasePreview, { caseStudy: researchCase, index }),
      );
      const caseEvidence = verified.get(researchCase.id)!;
      const selectedDimensions = researchCase.dimensions.filter((dimension) =>
        visibleDimensions[researchCase.id]!.includes(dimension.label),
      );

      expect(selectedDimensions.map((item) => item.label).sort()).toEqual(
        [...visibleDimensions[researchCase.id]!].sort(),
      );
      for (const dimension of selectedDimensions) {
        expect(html).toContain(dimension.label);
        for (const cell of dimension.cells) {
          expect(html).toContain(cell.nctId);
          expect(html).toContain(cell.value);
          for (const reference of cell.evidence) {
            const retained = caseEvidence.evidence.find(
              (item) =>
                item.nctId === reference.nctId &&
                item.sourcePath === reference.sourcePath &&
                item.locator === reference.locator,
            );
            expect(retained).toBeDefined();
            expect(retained!.expectedValue).toEqual(reference.expectedValue);
            expect(retained!.rawSha256).toMatch(/^[a-f0-9]{64}$/);
            expect(retained!.valueSha256).toMatch(/^[a-f0-9]{64}$/);
          }
        }
      }
    }

    const replayCase = researchCases.find(
      (item) => item.id === "registry-change-brief",
    )!;
    const retainedPairs = await Promise.all(
      replayCase.studyIds.map((nctId) => loadReplayPair(nctId)),
    );
    expect(retainedPairs.filter(Boolean)).toHaveLength(3);
    expect(
      retainedPairs.every(
        (pair) => pair?.baseline.nctId === pair?.current.nctId,
      ),
    ).toBe(true);
  });
});
