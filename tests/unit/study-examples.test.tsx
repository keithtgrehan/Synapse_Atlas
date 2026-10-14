import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../../src/app/page";
import StudyExamplesPage from "../../src/app/trials/examples/page";
import StudyExamplePage, { generateStaticParams } from "../../src/app/trials/examples/[nctId]/page";
import { clinicalTrialsApiPageSchema, clinicalTrialsFieldValues, normalizeClinicalTrial } from "../../src/lib/domain/trials";
import { decodeRetainedSource, loadStudyExamples, studyExampleCatalog, studyExampleCatalogSchema } from "../../src/lib/studies/examples";
import { programmeMappingDataset } from "../../src/lib/programs/dataset";

describe("retained non-psychedelic study examples", () => {
  it("validates exact bytes, ten stable identifiers, repeat reads and one programme per study", async () => {
    const first = await loadStudyExamples();
    expect(await loadStudyExamples()).toEqual(first);
    expect(new Set(first.map((entry) => entry.nctId)).size).toBe(10);
    expect(generateStaticParams()).toEqual(first.map(({ nctId }) => ({ nctId })));
    for (const entry of first) {
      expect(programmeMappingDataset.mappingAssertions.filter((mapping) => mapping.nctIds.includes(entry.nctId))).toHaveLength(1);
      expect(entry.supplement.hasResults).toBe(true);
      // Full-module retained capture is normalized by the unchanged trial adapter.
      const full = clinicalTrialsApiPageSchema.parse(JSON.parse(await readFile(`data/study-examples/v1/${entry.nctId}.json`, "utf8")));
      const normalized = normalizeClinicalTrial(full.studies[0], {
        ...entry.registry, apiRequestUrl: entry.registry.requestUrl,
        requestedFields: new Set(clinicalTrialsFieldValues), studyIndex: 0,
      });
      expect(normalized).toEqual(entry.trial);
    }
  });

  it("rejects duplicates, tampered bytes, incorrect publication IDs and source IDs", async () => {
    const duplicate = structuredClone(studyExampleCatalog);
    duplicate.studies[1] = duplicate.studies[0];
    expect(studyExampleCatalogSchema.safeParse(duplicate).success).toBe(false);
    const wrongPaper = structuredClone(studyExampleCatalog);
    wrongPaper.studies[0].pmid = "123";
    expect(studyExampleCatalogSchema.safeParse(wrongPaper).success).toBe(false);
    const wrongSource = structuredClone(studyExampleCatalog);
    wrongSource.studies[0].registry.requestUrl = wrongSource.studies[1].registry.requestUrl;
    expect(studyExampleCatalogSchema.safeParse(wrongSource).success).toBe(false);
    const bytes = await readFile("data/study-examples/v1/NCT03672175.json");
    bytes[10] ^= 1;
    expect(() => decodeRetainedSource(bytes, studyExampleCatalog.studies[0].registry.contentSha256)).toThrow("HASH_MISMATCH");
  });

  it("preserves missing values, multiple endpoints and source discrepancies", async () => {
    const entries = await loadStudyExamples();
    const vortioxetine = entries.find((entry) => entry.nctId === "NCT01422213")!;
    expect(vortioxetine.trial.completionDate).toEqual({ state: "not_reported", value: null });
    expect(vortioxetine.trial.startDate.value?.type).toBeNull();
    expect(vortioxetine.caution).toContain("602");
    expect(vortioxetine.caution).toContain("598");
    expect(entries.find((entry) => entry.nctId === "NCT02750306")!.trial.primaryOutcomes.value).toHaveLength(3);
    expect(entries.find((entry) => entry.nctId === "NCT03559192")!.caution).toContain("184");
    expect(entries.find((entry) => entry.nctId === "NCT00532493")!.caution).toContain("healthy");
  });

  it("renders all ten discovery-to-detail journeys with captured facts and source links", async () => {
    expect(renderToStaticMarkup(<Home />)).toContain('href="/trials/examples"');
    const index = renderToStaticMarkup(await StudyExamplesPage());
    expect(index).toContain("not live registry data");
    for (const entry of await loadStudyExamples()) {
      expect(index).toContain(`href="/trials/examples/${entry.nctId}"`);
      const html = renderToStaticMarkup(await StudyExamplePage({ params: Promise.resolve({ nctId: entry.nctId }) }));
      for (const value of [entry.nctId, "Retained snapshot", "Enrollment", "Primary completion", "Primary outcomes", "Comparator", "Source review notes", "Human scientific review pending", entry.trial.provenance.contentSha256]) {
        expect(html).toContain(value);
      }
      expect(html).toContain(`href="${entry.trial.provenance.sourceUrl}"`);
      expect(html).toContain(`href="${entry.publicationUrl}"`);
      expect(html).not.toContain("Fresh API retrieval");
    }
  });

  it("rejects unknown study routes", async () => {
    await expect(StudyExamplePage({ params: Promise.resolve({ nctId: "NCT00000000" }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
