import type { Capture } from "../../lib/snapshots/model";
import type { CapturedComparison } from "./session-export";
import { evidenceRows, evidenceSummary } from "./evidence-state-model";

function DateValue({ value }: { value: string | null }) {
  return value ? <time dateTime={value}>{value.includes("T") ? value.replace("T", " · ").replace(/\.\d+Z$/, " UTC").replace(/Z$/, " UTC") : value}</time> : <>Not reported</>;
}
export function EvidenceState({ saved, comparisons, title, activeId, busy, error, compact = false }: {
  saved: Capture[]; comparisons: CapturedComparison[]; title?: string; activeId?: string; busy?: string | null; error?: string; compact?: boolean;
}) {
  const rows = evidenceRows(saved, comparisons);
  return <section className={`evidence-state${compact ? " evidence-state-compact" : ""}`} aria-label={compact ? "Export evidence state" : "Research evidence state"}>
    <header><div><p className="eyebrow">{compact ? "Included in your export" : "Session evidence"}</p>{compact && <strong>{title ?? "Custom study selection"}</strong>}</div><span className="evidence-count">{saved.length} {saved.length === 1 ? "study" : "studies"}</span></header>
    <p className="state-summary">{evidenceSummary(saved, comparisons)}</p>
    {!compact && <><p className="state-note">Case interpretation uses saved evidence. A current check or replay updates the comparison only.</p>
      <details><summary>Capture dates and record state · {rows.map((row) => row.nctId).join(" / ") || "No studies selected"}</summary>
        <div className="evidence-state-rows">{rows.map((row) => <article key={row.nctId} data-active={row.nctId === activeId}>
          <h3>{row.nctId}{row.nctId === activeId && <span> · inspecting</span>}</h3><p className="state-mode">{row.mode === "saved" ? "Saved only · not checked in this session" : row.mode === "replay" ? "Retained replay · not a current check" : "Current session capture"}</p>
          <dl><div><dt>Saved capture</dt><dd><DateValue value={row.savedAt} /></dd></div><div><dt>Registry update in saved record</dt><dd><DateValue value={row.savedRegistryUpdate} /></dd></div>
          {row.comparisonAt && <><div><dt>{row.mode === "replay" ? "Replay baseline capture" : "Comparison baseline capture"}</dt><dd><DateValue value={row.comparisonBaselineAt} /></dd></div><div><dt>{row.mode === "replay" ? "Later retained capture" : "Current check captured"}</dt><dd><DateValue value={row.comparisonAt} /></dd></div><div><dt>Registry update in comparison record</dt><dd><DateValue value={row.comparisonRegistryUpdate} /></dd></div></>}</dl>
        </article>)}</div>
      </details>
      <p className="state-feedback" role="status">{busy ? `Checking ${busy.split(":")[0]} · saved evidence remains available.` : error ? "Latest check unavailable · displayed evidence remains available. Retry below." : activeId ? `Inspecting ${activeId}. Capture dates and registry update dates describe different events.` : "Choose a case or select studies to build your brief."}</p>
    </>}
  </section>;
}
