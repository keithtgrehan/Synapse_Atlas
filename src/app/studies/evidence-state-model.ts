import type { Capture } from "../../lib/snapshots/model";
import type { CapturedComparison } from "./session-export";

export function evidenceRows(saved: Capture[], comparisons: CapturedComparison[]) {
  return saved.map((capture) => {
    const pair = comparisons.find((item) => item.diff.nctId === capture.nctId);
    return {
      nctId: capture.nctId,
      mode: pair?.mode ?? "saved",
      savedAt: capture.retrievedAt,
      savedRegistryUpdate: capture.record.provenance.registryLastUpdatePostedDate ?? null,
      comparisonBaselineAt: pair?.diff.baseline.retrievedAt ?? null,
      comparisonAt: pair?.diff.current.retrievedAt ?? null,
      comparisonRegistryUpdate: pair?.diff.current.record.provenance.registryLastUpdatePostedDate ?? null,
    };
  });
}
export function evidenceSummary(saved: Capture[], comparisons: CapturedComparison[]) {
  const rows = evidenceRows(saved, comparisons);
  return `${rows.filter((row) => row.mode === "saved").length} saved only · ${rows.filter((row) => row.mode === "current").length} current captures · ${rows.filter((row) => row.mode === "replay").length} retained replays`;
}
