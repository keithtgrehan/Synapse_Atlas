import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { loadSnapshotCatalogue, loadReplayPair } from "../../src/lib/snapshots/catalogue";
import { compareCaptures } from "../../src/lib/snapshots/compare";
import { evidenceRows, evidenceSummary } from "../../src/app/studies/evidence-state-model";
import { EvidenceState } from "../../src/app/studies/evidence-state";
import { sessionManifest } from "../../src/app/studies/session-export";

describe("capture state shared by screen and export", () => {
  it("distinguishes saved evidence from a historical comparison and its older baseline", async () => {
    const pair = (await loadReplayPair("NCT03866174"))!;
    const comparisons = [{ mode: "replay" as const, diff: compareCaptures(pair.baseline, pair.current) }];
    const selected = [pair.current];
    const state = evidenceRows(selected, comparisons);
    expect(state[0].savedAt).toBe(pair.current.retrievedAt);
    expect(state[0].comparisonBaselineAt).toBe(pair.baseline.retrievedAt);
    expect(state[0].comparisonAt).toBe(pair.current.retrievedAt);
    expect(state[0].savedRegistryUpdate).toBe(pair.current.record.provenance.registryLastUpdatePostedDate);
    expect(sessionManifest(selected, comparisons, "2026-11-20T10:00:00Z").evidenceState).toEqual(state);
    const html = renderToStaticMarkup(<EvidenceState saved={selected} comparisons={comparisons} activeId={pair.current.nctId} />);
    expect(html).toContain("Retained replay · not a current check");
    expect(html).toContain("Replay baseline capture");
    expect(html).toContain("Case interpretation uses saved evidence");
    expect(evidenceSummary(selected, comparisons)).toBe("0 saved only · 0 current captures · 1 retained replay");
  });
  it("keeps failed and pending requests distinct from completed current captures", async () => {
    const saved = (await loadSnapshotCatalogue()).slice(0, 2);
    const html = renderToStaticMarkup(<EvidenceState saved={saved} comparisons={[]} activeId={saved[0].nctId} error="Unavailable" />);
    expect(html).toContain("2 saved only · 0 current captures · 0 retained replays");
    expect(html).toContain("Latest check unavailable");
    expect(evidenceRows(saved, []).every((row) => row.comparisonAt === null)).toBe(true);
    const loading = renderToStaticMarkup(<EvidenceState saved={saved} comparisons={[]} busy={`${saved[0].nctId}:current`} />);
    expect(loading).toContain(`Checking ${saved[0].nctId}`);
    expect(loading).not.toContain("Current session capture");
  });
});
