import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StudyWorkspace } from "../../src/app/studies/workspace";
import Home from "../../src/app/page";
import {
  loadSnapshotCatalogue,
  loadReplayPair,
} from "../../src/lib/snapshots/catalogue";
import { compareCaptures } from "../../src/lib/snapshots/compare";
import {
  sessionCsv,
  sessionManifest,
} from "../../src/app/studies/session-export";
import { GET } from "../../src/app/api/snapshots/[nctId]/route";

describe("NCT-first workspace", () => {
  it("leads with a sourced case and keeps programme context optional", async () => {
    const html = renderToStaticMarkup(await Home());
    expect(html).toContain("Open a guided brief");
    expect(html).toContain("/studies?case=mdd-measurement-window");
    expect(html).not.toContain("reviewed programmes");
  });
  it("renders the NCT catalogue and saved facts without programme metadata", async () => {
    const catalogue = await loadSnapshotCatalogue();
    const html = renderToStaticMarkup(
      <StudyWorkspace
        catalogue={catalogue}
        initialIds={["NCT03866174", "NCT01422213"]}
        selectionError={false}
      />,
    );
    expect(html).toContain("Check current registry");
    expect(html).toContain("Download source bundle");
    expect(html).toContain("39 saved records");
    expect(html).toContain("No new lookup yet");
    expect(html).not.toContain("MODEL_INFERENCE");
    expect(html).not.toContain("Not captured</dd>");
  });
  it("escapes hostile registry strings on screen and in spreadsheet exports", async () => {
    const catalogue = structuredClone(await loadSnapshotCatalogue());
    catalogue[0].record.briefTitle = "<img src=x onerror=alert(1)>";
    catalogue[0].record.overallStatus = {
      state: "reported",
      value: ' =HYPERLINK("evil")',
    };
    const html = renderToStaticMarkup(
      <StudyWorkspace
        catalogue={catalogue}
        initialIds={[catalogue[0].nctId]}
        selectionError={false}
      />,
    );
    expect(html).toContain("&lt;img");
    expect(html).not.toContain("<img src=x");
    expect(sessionCsv([catalogue[0]], [], "2026-11-19T12:00:00Z")).toContain(
      "' =HYPERLINK",
    );
  });
  it("uses the same pair for values, CSV and replayable evidence without retrieval", async () => {
    const pair = (await loadReplayPair("NCT03866174"))!;
    const diff = compareCaptures(pair.baseline, pair.current);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("Must not fetch during export"));
    try {
      const selected = [pair.current];
      const comparisons = [{ mode: "replay" as const, diff }];
      const csv = sessionCsv(selected, comparisons, "2026-11-19T12:00:00Z");
      const manifest = sessionManifest(
        selected,
        comparisons,
        "2026-11-19T12:00:00Z",
      );
      expect(manifest.comparisons[0].fields).toEqual(diff.fields);
      expect(csv).toContain(pair.baseline.projectedSha256);
      expect(csv).toContain(pair.current.projectedSha256);
      expect(manifest.comparisons[0].baseline.sourceProjectionJson).toBe(
        pair.baseline.sourceProjectionJson,
      );
      expect(csv).toContain("retained-record replay");
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
  it("rejects invalid/uncatalogued IDs before making a source request", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("No network"));
    try {
      expect(
        (
          await GET(new Request("http://localhost/api/snapshots/bad"), {
            params: Promise.resolve({ nctId: "bad" }),
          })
        ).status,
      ).toBe(400);
      expect(
        (
          await GET(new Request("http://localhost/api/snapshots/NCT99999999"), {
            params: Promise.resolve({ nctId: "NCT99999999" }),
          })
        ).status,
      ).toBe(404);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });
  it("returns retained replay without network and prevents HTTP caching", async () => {
    const response = await GET(
      new Request("http://localhost/api/snapshots/NCT03866174?mode=replay"),
      { params: Promise.resolve({ nctId: "NCT03866174" }) },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const pair = await response.json();
    expect(pair.baseline.nctId).toBe(pair.current.nctId);
  });
});
