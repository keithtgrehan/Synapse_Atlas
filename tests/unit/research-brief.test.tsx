import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import manifest from "../../data/comparison/2026-10-13/manifest.json";
import { briefManifestSchema, validateBriefSnapshot } from "../../src/lib/domain/brief-snapshots";
import { sha256Bytes } from "../../src/lib/evidence/provenance";
import { buildComparison } from "../../src/lib/domain/comparisons";
import { briefDate, briefQuery, buildResearchBrief, csvCell, researchBriefCsv, researchBriefFields, researchBriefManifest } from "../../src/lib/domain/research-brief";
import { loadComparisonCatalog } from "../../src/lib/programs/comparison-dataset";
import { loadResearchBrief } from "../../src/lib/programs/research-brief";
import * as briefLoader from "../../src/lib/programs/research-brief";
import { GET as csvGet } from "../../src/app/compare/export.csv/route";
import { GET as manifestGet } from "../../src/app/compare/sources.json/route";
import { ResearchBriefView } from "../../src/app/compare/brief-ui";

async function comparison() {
  const catalog = await loadComparisonCatalog();
  return buildComparison(catalog, catalog.candidates.map((c) => c.slug));
}
async function source() {
  const metadata = manifest.snapshots[0]!;
  const bytes = await readFile(`data/comparison/${manifest.version}/${metadata.nctId}.json`);
  return { metadata, bytes };
}

describe("source-bound research brief", () => {
  it("validates all retained snapshots offline, preserving source values, dates, classes and original mappings", async () => {
    const fetch = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unexpected network"));
    try {
      const original = await comparison();
      const brief = await loadResearchBrief(original);
      expect(brief.programmes).toHaveLength(3);
      expect(brief.programmes[1]!.mapping).toEqual(original.programmes[1]!.mapping);
      const trial = brief.programmes[1]!.trials[0]!;
      expect(trial.phases).toEqual({ state: "reported", value: ["PHASE3"] });
      expect(trial.enrollment).toEqual({ state: "reported", value: { count: 572, type: "ACTUAL" } });
      expect(trial.completionDate).toEqual({ state: "reported", value: { value: "2026-12", precision: "MONTH", type: "ESTIMATED" } });
      expect(trial.provenance.fieldLocators.primaryOutcomes).toBe("/studies/0/protocolSection/outcomesModule/primaryOutcomes");
      expect(trial.provenance.evidenceClass).toBe("STRUCTURED_EXTRACTION");
      expect(trial.provenance.retrievedAt).toBe(manifest.snapshots[1]!.retrievedAt);
      expect(original.programmes[1]!.registeredTrials[0]!.retrievedAt).not.toBe(trial.provenance.retrievedAt);
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });

  it("rejects altered bytes, source host, field query, study identity and reversed timestamps", async () => {
    const { metadata, bytes } = await source();
    expect(() => validateBriefSnapshot(metadata, Buffer.concat([bytes, Buffer.from(" ")]))).toThrow();
    for (const change of [
      { requestUrl: metadata.requestUrl.replace("clinicaltrials.gov", "example.com") },
      { requestUrl: metadata.requestUrl + "&pageToken=other" },
      { nctId: "NCT00000000" },
      { processedAt: "2026-01-01T00:00:00Z" },
    ]) expect(() => validateBriefSnapshot({ ...metadata, ...change }, bytes)).toThrow();
    const wrongStudy = JSON.parse(bytes.toString());
    wrongStudy.studies[0].protocolSection.identificationModule.nctId = "NCT00000000";
    const altered = Buffer.from(JSON.stringify(wrongStudy));
    expect(() => validateBriefSnapshot({ ...metadata, sha256: sha256Bytes(altered) }, altered)).toThrow("INVALID_BRIEF_STUDY");
    expect(() => briefManifestSchema.parse({ ...manifest, snapshots: Array(3).fill(metadata) })).toThrow();
  });

  it("preserves missing fields, missing date type, zero enrolment and partial date precision", async () => {
    const { metadata, bytes } = await source();
    const raw = JSON.parse(bytes.toString());
    delete raw.studies[0].protocolSection.outcomesModule;
    raw.studies[0].protocolSection.designModule.enrollmentInfo = { count: 0 };
    raw.studies[0].protocolSection.statusModule.completionDateStruct = { date: "2027" };
    const changed = Buffer.from(JSON.stringify(raw));
    const trial = validateBriefSnapshot({ ...metadata, sha256: sha256Bytes(changed) }, changed);
    const field = (key: string) => researchBriefFields.find((f) => f.key === key)!.value(trial);
    expect(field("primaryOutcomes")).toBe("Not reported");
    expect(trial.provenance.fieldLocators.primaryOutcomes).toBeUndefined();
    expect(field("enrollment")).toBe("0 (type not reported)");
    expect(field("completionDate")).toBe("2027 (type not reported; year precision)");
    expect(briefDate({ value: "2026-12", precision: "MONTH", type: "ESTIMATED" })).toBe("2026-12 (estimated; month precision)");
  });

  it("fails closed when a selected study is absent or duplicated", async () => {
    const original = await comparison();
    const { metadata, bytes } = await source();
    const trial = validateBriefSnapshot(metadata, bytes);
    expect(() => buildResearchBrief(original, [trial])).toThrow("MISSING_BRIEF_STUDY");
    expect(() => buildResearchBrief(original, [trial, trial])).toThrow("DUPLICATE_BRIEF_STUDY");
  });

  it("quotes multiline CSV and neutralises spreadsheet formulas, including whitespace prefixes", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    for (const value of ["=1+1", "+SUM(1,2)", "-1+2", "@SUM(1)", "  =1", "\t=1", "\r=1", "\ntext"]) expect(csvCell(value)).toBe(`"'${value}"`);
    expect(csvCell("2026-10-13")).toBe('"2026-10-13"');
  });

  it("exports the same fields, hashes and source references as the visible and printable brief", async () => {
    const brief = await loadResearchBrief(await comparison());
    const csv = researchBriefCsv(brief);
    const output = researchBriefManifest(brief);
    const html = renderToStaticMarkup(<ResearchBriefView brief={brief} asOf={new Date("2026-10-14T00:00:00Z")} />);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    for (const programme of brief.programmes) for (const trial of programme.trials) {
      for (const field of researchBriefFields) expect(csv).toContain(csvCell(field.value(trial)));
      expect(csv).toContain(trial.provenance.contentSha256);
      expect(html).toContain(trial.nctId);
      expect(html).toContain(trial.provenance.contentSha256);
    }
    expect(output.programmes[0]!.studies[0]!.provenance).toEqual(brief.programmes[0]!.trials[0]!.provenance);
    expect(html).toContain("Print / save as PDF");
    expect(html).toContain("Registered study facts");
    expect(html).toContain("not promised results-release dates");
    const stale = renderToStaticMarkup(<ResearchBriefView brief={brief} asOf={new Date("2026-11-01T00:00:00Z")} />);
    expect(stale).toContain("more than 48 hours old");
  });

  it("downloads only selected studies, pins the snapshot and rejects invalid input without echo", async () => {
    const catalog = await loadComparisonCatalog();
    const brief = await loadResearchBrief(buildComparison(catalog, catalog.candidates.slice(1).map((p) => p.slug)));
    const request = new Request(`http://localhost/compare/export.csv?${briefQuery(brief)}`);
    const response = await csvGet(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(await response.text()).not.toContain("NCT03866174");
    expect((await (await manifestGet(request)).json()).programmes).toHaveLength(2);
    for (const query of ["", "snapshot=other", `${briefQuery(brief)}&snapshot=${brief.version}`, `${briefQuery(brief)}&unexpected=secret-value`, `snapshot=${brief.version}&programme=bad%3Cvalue`, `snapshot=${brief.version}&programme=usona-psilocybin-mdd&programme=usona-psilocybin-mdd`]) {
      const rejected = await csvGet(new Request(`http://localhost/compare/export.csv?${query}`));
      expect(rejected.status).toBe(400);
      expect(await rejected.text()).not.toMatch(/secret-value|bad<value/);
    }
  });

  it("returns a bounded unavailable response when snapshot validation fails", async () => {
    const brief = await loadResearchBrief(await comparison());
    const load = vi.spyOn(briefLoader, "loadResearchBrief").mockRejectedValueOnce(new Error("sensitive-internal-path"));
    try {
      const response = await csvGet(new Request(`http://localhost/compare/export.csv?${briefQuery(brief)}`));
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain("sensitive-internal-path");
    } finally { load.mockRestore(); }
  });
});
