import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CaseView } from "../../src/app/studies/case-view";
import { researchCases } from "../../src/lib/cases/content";
import { loadResearchCases } from "../../src/lib/cases/load";
import type { CaseEvidence, ResearchCase } from "../../src/lib/cases/model";
import { loadSnapshotCatalogue } from "../../src/lib/snapshots/catalogue";
import {
  sessionCsv,
  sessionManifest,
} from "../../src/app/studies/session-export";

function atPointer(document: unknown, pointer: string): unknown {
  expect(pointer.startsWith("/")).toBe(true);
  return pointer
    .slice(1)
    .split("/")
    .reduce<unknown>((cursor, segment) => {
      expect(cursor).not.toBeNull();
      expect(typeof cursor).toBe("object");
      return (cursor as Record<string, unknown>)[
        segment.replaceAll("~1", "/").replaceAll("~0", "~")
      ];
    }, document);
}

function allEvidence(researchCase: ResearchCase): CaseEvidence[] {
  return [
    ...researchCase.dimensions.flatMap((dimension) =>
      dimension.cells.flatMap((cell) => cell.evidence),
    ),
    ...researchCase.takeaways.flatMap((claim) => claim.evidence),
  ];
}

describe("research cases", () => {
  it("keeps three bounded, distinct cases on retained studies", async () => {
    const catalogue = await loadSnapshotCatalogue();
    const retainedIds = new Set(catalogue.map((capture) => capture.nctId));

    expect(researchCases).toHaveLength(3);
    expect(new Set(researchCases.map((researchCase) => researchCase.id)).size).toBe(3);
    for (const researchCase of researchCases) {
      expect(researchCase.studyIds.length).toBeGreaterThanOrEqual(2);
      expect(researchCase.studyIds.length).toBeLessThanOrEqual(4);
      expect(new Set(researchCase.studyIds).size).toBe(researchCase.studyIds.length);
      expect(researchCase.studyIds.every((id) => retainedIds.has(id))).toBe(true);
      expect(researchCase.cannotEstablish).toMatch(/cannot establish/i);
      expect(researchCase.nextQuestions.length).toBeGreaterThan(0);
    }
  });

  it("verifies and deduplicates only the exact public fields included in each case bundle", async () => {
    const catalogue = await loadSnapshotCatalogue();
    const verified = await loadResearchCases(catalogue);

    expect(verified).toHaveLength(3);
    for (const researchCase of verified) {
      expect(researchCase.verificationVersion).toBe("research-case-evidence/v1");
      expect(researchCase.evidence.length).toBeGreaterThan(0);
      expect(
        new Set(
          researchCase.evidence.map(
            (item) => `${item.sourcePath}:${item.locator}`,
          ),
        ).size,
      ).toBe(researchCase.evidence.length);
      expect(
        researchCase.evidence.every(
          (item) => /^[a-f0-9]{64}$/.test(item.rawSha256) && /^[a-f0-9]{64}$/.test(item.valueSha256),
        ),
      ).toBe(true);
    }
  });

  it("carries the verified deep-case evidence into both session export formats", async () => {
    const catalogue = await loadSnapshotCatalogue();
    const researchCase = (await loadResearchCases(catalogue))[0]!;
    const exportedAt = "2026-11-19T12:00:00Z";
    const manifest = sessionManifest([], [], exportedAt, researchCase);
    const csv = sessionCsv([], [], exportedAt, researchCase);

    expect(manifest.researchCase).toEqual(researchCase);
    expect(csv).toContain(researchCase.content.question);
    expect(csv).toContain(researchCase.contentSha256);
    expect(csv).toContain(researchCase.evidence[0]!.valueSha256);
  });

  it("renders the verified question, source facts and limits, while escaping case CSV formulas", async () => {
    const catalogue = await loadSnapshotCatalogue();
    const researchCase = (await loadResearchCases(catalogue))[0]!;
    const html = renderToStaticMarkup(
      createElement(CaseView, { researchCase }),
    );

    expect(html).toContain(researchCase.content.title);
    expect(html).toContain(researchCase.content.question);
    expect(html).toContain(researchCase.content.cannotEstablish);
    expect(html).toContain(researchCase.content.takeaways[0]!.text.slice(13));
    expect(html).toContain(researchCase.content.takeaways[0]!.evidence[0]!.locator);

    const hostile = structuredClone(researchCase);
    hostile.content.question = "=HYPERLINK(\"https://example.test\")";
    expect(sessionCsv([], [], "2026-11-19T12:00:00Z", hostile)).toContain(
      "'=HYPERLINK",
    );
  });

  it("resolves every displayed case citation against immutable retained registry bytes", async () => {
    const captures = new Map(
      (await loadSnapshotCatalogue()).map((capture) => [capture.nctId, capture]),
    );
    const documents = new Map<string, { json: unknown; sha256: string }>();
    for (const item of researchCases.flatMap(allEvidence)) {
      expect(item.sourcePath).toMatch(/^data\/(comparison\/2026-10-13|study-examples\/v1)\/NCT\d{8}\.json$/);
      expect(path.basename(item.sourcePath, ".json")).toBe(item.nctId);
      expect(item.sourceUrl).toBe(`https://clinicaltrials.gov/study/${item.nctId}`);
      if (!documents.has(item.sourcePath)) {
        const bytes = await readFile(path.join(process.cwd(), item.sourcePath));
        documents.set(item.sourcePath, {
          json: JSON.parse(bytes.toString("utf8")),
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
      }
      const document = documents.get(item.sourcePath)!;
      expect(document.sha256).toMatch(/^[a-f0-9]{64}$/);
      const capture = captures.get(item.nctId);
      expect(capture).toBeDefined();
      expect(capture!.retainedSourcePath).toBe(item.sourcePath);
      expect(capture!.rawSha256).toBe(document.sha256);
      expect(capture!.retrievedAt).toBe(item.retrievedAt);
      expect(atPointer(document.json, item.locator)).toEqual(item.expectedValue);
    }
  });

  it("labels source facts and bounded inferences without turning registry data into outcomes", () => {
    for (const researchCase of researchCases) {
      for (const claim of researchCase.takeaways) {
        expect(claim.text.startsWith(`${claim.evidenceClass}:`)).toBe(true);
        expect(claim.evidence.length).toBeGreaterThan(0);
        expect(claim.text).not.toMatch(/(superior|better treatment|efficacy result|safe and effective)/i);
      }
    }
    const replay = researchCases.find(
      (researchCase) => researchCase.id === "registry-change-brief",
    )!;
    expect(replay.summary).toMatch(/does not pre-state a change/i);
    expect(replay.cannotEstablish).toMatch(/why a record changed/i);
  });
});
