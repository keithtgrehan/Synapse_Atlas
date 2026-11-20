import type { Capture } from "../../lib/snapshots/model";
import type { CapturedComparison } from "./session-export";
import { evidenceModeLabels, evidenceRows, evidenceSummary } from "./evidence-state-model";

function DateValue({ value }: { value: string | null }) {
  return value ? <time dateTime={value}>{value.includes("T") ? value.replace("T", " · ").replace(/\.\d+Z$/, " UTC").replace(/Z$/, " UTC") : value}</time> : <>Not reported</>;
}
export function EvidenceState({ saved, comparisons, title, activeId, busy, error, compact = false }: {
  saved: Capture[]; comparisons: CapturedComparison[]; title?: string; activeId?: string; busy?: string | null; error?: string; compact?: boolean;
}) {
  const rows = evidenceRows(saved, comparisons);
  return <section className={`evidence-state${compact ? " evidence-state-compact" : ""}`} aria-label={compact ? "Export evidence state" : "Research evidence state"}>
    <header><div><p className="eyebrow">{compact ? "Included in your export" : "Evidence in this brief"}</p>{compact && <strong>{title ?? "Your selected studies"}</strong>}</div><span className="evidence-count">{saved.length} {saved.length === 1 ? "study" : "studies"}</span></header>
    <p className="state-summary">{evidenceSummary(saved, comparisons)}</p>
    {!compact && <><p className="state-note">The example explanation uses the saved records. Checking for updates or comparing saved versions changes only the comparison below.</p>
      <details><summary>Dates and versions · {rows.map((row) => row.nctId).join(" / ") || "No studies selected"}</summary>
        <div className="evidence-state-rows">{rows.map((row) => <article key={row.nctId} data-active={row.nctId === activeId}>
          <h3>{row.nctId}{row.nctId === activeId && <span> · selected</span>}</h3><p className="state-mode">{evidenceModeLabels[row.mode]}</p>
          <dl><div><dt>Saved copy made</dt><dd><DateValue value={row.savedAt} /></dd></div><div><dt>Public record last updated</dt><dd><DateValue value={row.savedRegistryUpdate} /></dd></div>
          {row.comparisonAt && <><div><dt>{row.mode === "replay" ? "Earlier saved version" : "Saved copy used for comparison"}</dt><dd><DateValue value={row.comparisonBaselineAt} /></dd></div><div><dt>{row.mode === "replay" ? "Later saved version" : "New check made"}</dt><dd><DateValue value={row.comparisonAt} /></dd></div><div><dt>Public record update date in this version</dt><dd><DateValue value={row.comparisonRegistryUpdate} /></dd></div></>}</dl>
        </article>)}</div>
      </details>
      <p className="state-feedback" role="status">{busy ? `Checking ${busy.split(":")[0]} · your saved copy is still available.` : error ? "We could not complete the check. Your saved records are still available. Try again below." : activeId ? `Selected ${activeId}. The date we saved a copy can differ from the date the public record was updated.` : "Choose an example or select studies to build your brief."}</p>
    </>}
  </section>;
}
