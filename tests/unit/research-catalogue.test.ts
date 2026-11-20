import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  loadResearchManifest,
  validateCollectionMembership,
} from "../../src/lib/catalogue/load";
import { summarizeCatalogue } from "../../src/lib/catalogue/analysis";
import { loadSnapshotCatalogue } from "../../src/lib/snapshots/catalogue";
import { evaluateSourceRequest } from "../../src/lib/sources/policies";
import { catalogueCsv } from "../../src/app/catalogue/export";

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

describe("retained research catalogue", () => {
  it("has exactly 26 new, exact-ID, source-policy-valid immutable captures", async () => {
    const manifest = await loadResearchManifest();
    expect(manifest.entries).toHaveLength(26);
    expect(new Set(manifest.entries.map((entry) => entry.nctId)).size).toBe(26);

    for (const entry of manifest.entries) {
      expect(entry.sourcePath).toBe(
        `data/research-catalogue/v1/${entry.nctId}.json`,
      );
      expect(
        evaluateSourceRequest(
          {
            sourceId: "SRC-CTG",
            policyVersion: "1",
            method: "GET",
            url: entry.requestUrl,
          },
          undefined,
          new Date(entry.retrievedAt),
        ).allowed,
      ).toBe(true);
      const url = new URL(entry.requestUrl);
      expect(url.searchParams.getAll("query.id")).toEqual([entry.nctId]);
      expect(url.searchParams.get("pageSize")).toBe("1");
      expect(url.searchParams.get("countTotal")).toBe("true");
      const requested = url.searchParams.get("fields")!.split(",");
      expect(requested).toContain("NCTId");
      expect(
        requested.some((field) =>
          /(?:Contact|Location|Eligibility|Reference|ResponsibleParty)/i.test(
            field,
          ),
        ),
      ).toBe(false);
      const bytes = await readFile(path.join(process.cwd(), entry.sourcePath));
      expect(sha256(bytes)).toBe(entry.rawSha256);
      const response = JSON.parse(bytes.toString("utf8"));
      expect(response.totalCount).toBe(1);
      expect(response.studies).toHaveLength(1);
      expect(response.studies[0].protocolSection.identificationModule.nctId).toBe(
        entry.nctId,
      );
    }
  });

  it("places every one of the 39 retained records in an honest analysis group", async () => {
    const [manifest, catalogue] = await Promise.all([
      loadResearchManifest(),
      loadSnapshotCatalogue(),
    ]);
    expect(catalogue).toHaveLength(39);
    expect(new Set(catalogue.map((capture) => capture.nctId)).size).toBe(39);
    expect(() => validateCollectionMembership(manifest, catalogue)).not.toThrow();

    const assigned = new Set(manifest.groups.flatMap((group) => group.studyIds));
    expect(assigned).toEqual(new Set(catalogue.map((capture) => capture.nctId)));
    for (const group of manifest.groups) {
      expect(group.comparisonDimensions.length).toBeGreaterThan(0);
      expect(group.limitations).toMatch(
        /(not|cannot|do not|different|unknown|no pooled)/i,
      );
    }

    const cognitive = manifest.groups.find(
      (group) => group.id === "cognition-and-measurement",
    )!;
    const context = manifest.groups.find(
      (group) => group.id === "adjunctive-or-resistant-setting",
    )!;
    expect(cognitive.studyIds).toContain("NCT01691092");
    expect(cognitive.description).toMatch(/PTSD.*not an MDD-only population/i);
    expect(context.studyIds).toContain("NCT02522377");
    expect(context.description).toMatch(/electroconvulsive-treatment context/i);
  });

  it("derives descriptive, non-pooled counts from the same 39 retained captures", async () => {
    const summary = summarizeCatalogue(await loadSnapshotCatalogue());
    const sum = (items: Record<string, number>) =>
      Object.values(items).reduce((total, count) => total + count, 0);

    expect(summary.evidenceClass).toBe("DERIVED_CALCULATION");
    expect(summary.count).toBe(39);
    expect(sum(summary.statuses)).toBe(39);
    expect(sum(summary.phases)).toBe(39);
    expect(sum(summary.enrollmentDefinitions)).toBe(39);
    expect(summary.primaryEndpointReported).toBeLessThanOrEqual(39);
    expect(summary.inputs).toHaveLength(39);
    expect(summary.method).toMatch(/No enrolment totals or clinical outcomes are pooled/i);
    expect(summary.limitations).toMatch(/not a systematic review/i);
  });

  it("exports one formula-safe evidence row per retained record with the same summary inputs", async () => {
    const [manifest, catalogue] = await Promise.all([
      loadResearchManifest(),
      loadSnapshotCatalogue(),
    ]);
    const summary = summarizeCatalogue(catalogue);
    const csv = catalogueCsv(
      catalogue,
      manifest,
      { query: "", groupId: "", status: "" },
      "2026-11-19T23:00:00Z",
    );
    const rows = csv.trimEnd().split("\r\n");

    expect(rows).toHaveLength(40);
    expect(
      new Set(
        catalogue.filter((capture) => csv.includes(`\"${capture.nctId}\"`)).map(
          (capture) => capture.nctId,
        ),
      ).size,
    ).toBe(39);
    const sample = catalogue.find((capture) => capture.nctId === "NCT03866174")!;
    expect(csv).toContain(sample.record.briefTitle.replaceAll('"', '""'));
    expect(csv).toContain(sample.rawSha256);
    expect(csv).toContain(sample.projectedSha256);
    expect(csv).toContain(`""count"":${summary.count}`);
    expect(csv).toContain(summary.method);
    expect(csv).toContain(summary.limitations);

    const hostile = structuredClone(catalogue);
    hostile[0]!.record.briefTitle = "=HYPERLINK(\"https://example.test\")";
    expect(
      catalogueCsv(
        hostile,
        manifest,
        { query: "", groupId: "", status: "" },
        "2026-11-19T23:00:00Z",
      ),
    ).toContain("'=HYPERLINK");
  });
});
