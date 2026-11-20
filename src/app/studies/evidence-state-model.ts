import type { Capture } from "../../lib/snapshots/model";
import type { CapturedComparison } from "./session-export";

export const evidenceModeLabels = {
  saved: "Saved copy · not checked in this visit",
  current: "New check in this visit",
  replay: "Two saved versions · not a live update",
} as const;

export function evidenceRows(saved: Capture[], comparisons: CapturedComparison[]) {
  return saved.map((capture) => {
    const pair = comparisons.find((item) => item.diff.nctId === capture.nctId);
    return {
      nctId: capture.nctId,
      mode: pair?.mode ?? ("saved" as const),
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
  const current = rows.filter((row) => row.mode === "current").length;
  const replay = rows.filter((row) => row.mode === "replay").length;
  const savedCount = rows.filter((row) => row.mode === "saved").length;
  return `${savedCount} saved ${savedCount === 1 ? "copy" : "copies"} · ${current} new ${current === 1 ? "check" : "checks"} · ${replay} ${replay === 1 ? "comparison" : "comparisons"} of saved versions`;
}
