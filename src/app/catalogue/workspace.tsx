"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Capture } from "../../lib/snapshots/model";
import type { ResearchManifest } from "../../lib/catalogue/model";
import { summarizeCatalogue } from "../../lib/catalogue/analysis";
import { formatValue } from "../../lib/snapshots/compare";
import { sessionManifest } from "../studies/session-export";
import { catalogueCsv } from "./export";

function save(name: string, value: string, type: string) {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Distribution({ title, values }: { title: string; values: Record<string, number> }) {
  return <div><h3>{title}</h3><dl className="distribution">{Object.entries(values).map(([label, count]) => <div key={label}><dt>{label.replaceAll("_", " ")}</dt><dd>{count}</dd></div>)}</dl></div>;
}
export function CatalogueWorkspace({ catalogue, manifest }: { catalogue: Capture[]; manifest: ResearchManifest }) {
  const filters = useSearchParams();
  const query = (filters.get("q") ?? "").slice(0, 200);
  const groupId = filters.get("collection") ?? "";
  const status = filters.get("status") ?? "";
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(filters.toString());
    if (value) next.set(key, value); else next.delete(key);
    window.history.replaceState(null, "", next.size ? `/catalogue?${next}` : "/catalogue");
  }
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const group = manifest.groups.find((item) => item.id === groupId);
  const rows = catalogue.filter((item) => (!group || group.studyIds.includes(item.nctId)) && (!status || item.record.overallStatus.value === status) &&
    `${item.nctId} ${item.record.briefTitle} ${formatValue(item.record.conditions.value)} ${formatValue(item.record.interventions.value)} ${formatValue(item.record.primaryOutcomes.value)}`.toLowerCase().includes(query.trim().toLowerCase()));
  const analysis = summarizeCatalogue(rows);
  const params = new URLSearchParams(); selected.forEach((id) => params.append("nct", id));
  function toggle(id: string) {
    setMessage("");
    if (selected.includes(id)) setSelected(selected.filter((item) => item !== id));
    else if (selected.length < 4) setSelected([...selected, id]);
    else setMessage("Choose up to four studies. Remove one before adding another.");
  }
  function download(type: "csv" | "json") {
    const exportedAt = new Date().toISOString();
    const selection = { query, group: group ?? null, status: status || null };
    if (type === "json") save(`synapse-atlas-catalogue-${rows.length}-sources.json`, JSON.stringify({ ...sessionManifest(rows, [], exportedAt), catalogueAnalysis: analysis, selection, selectionMethod: manifest.selectionMethod, collections: manifest.groups, catalogueEntries: manifest.entries }, null, 2), "application/json");
    else {
      save(`synapse-atlas-catalogue-${rows.length}.csv`, catalogueCsv(rows, manifest, { query, groupId, status }, exportedAt), "text/csv;charset=utf-8");
    }
    setMessage(`${type.toUpperCase()} prepared for the ${rows.length} records currently shown. No registry refetch.`);
  }
  return <main id="main-content" tabIndex={-1} className="shell catalogue-page">
    <header className="workspace-context catalogue-context"><div><p className="workspace-context__label">Research catalogue</p><h1 className="workspace-context__title">Find the right comparison.</h1><p className="workspace-context__summary">A selected research collection. Explore registered endpoints and study contexts before drawing conclusions.</p></div><div className="workspace-context__aside"><p className="workspace-context__meta"><span>{group ? "Collection view" : "All retained records"}</span><span>{rows.length} of {catalogue.length} shown</span><span>Saved evidence</span></p><div className="workspace-context__next"><span>Next action</span><Link href="/#research-cases">Open a guided brief <span aria-hidden="true">→</span></Link></div><div className="catalogue-entry-links"><Link href="/#research-collections">Browse all {manifest.groups.length} collections</Link></div></div></header>
    <section className="catalogue-filter no-print" aria-label="Filter saved trials">
      <label htmlFor="catalogue-query">Search studies<input id="catalogue-query" name="q" autoComplete="off" maxLength={200} type="search" placeholder="NCT ID, treatment, condition or endpoint…" value={query} onChange={(event) => setFilter("q", event.target.value)} /></label>
      <label htmlFor="collection">Research collection<select id="collection" value={groupId} onChange={(event) => setFilter("collection", event.target.value)}><option value="">All retained records</option>{manifest.groups.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label htmlFor="registry-status">Registry status<select id="registry-status" value={status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{[...new Set(catalogue.map((item) => item.record.overallStatus.value).filter(Boolean))].sort().map((item) => <option key={item} value={item!}>{item!.replaceAll("_", " ")}</option>)}</select></label>
    </section>
    <section className="collection-context"><p className="eyebrow">{group ? "Curated research question" : "Selection scope"}</p><h2>{group?.question ?? "What does this saved catalogue cover?"}</h2><p>{group?.description ?? manifest.selectionMethod}</p><p className="quiet">{group?.limitations ?? analysis.limitations}</p>{group && <p className="quiet">Compare: {group.comparisonDimensions.join(" · ")}</p>}</section>
    <details className="catalogue-analysis"><summary>Describe the evidence · {analysis.count} records shown</summary><p>Counts describe this filtered set at its saved dates. They are not treatment outcomes or a complete landscape.</p><div className="analysis-grid"><Distribution title="Registered phase" values={analysis.phases} /><Distribution title="Registry status" values={analysis.statuses} /><Distribution title="Enrolment definition" values={analysis.enrollmentDefinitions} /></div><p className="quiet">Primary endpoints captured: {analysis.primaryEndpointReported} / {analysis.count} records. Captured dates: {analysis.retrievalDates.join(" · ") || "none"}. No patient totals are pooled.</p></details>
    <div className="catalogue-action-bar no-print"><span role="status">{rows.length} / {catalogue.length} records · {selected.length} of 4 selected</span>{selected.length > 0 && <Link className="button" href={`/studies?${params}`}>Compare selected studies →</Link>}<button className="button button-secondary" onClick={() => {setSelected([]); window.history.replaceState(null, "", "/catalogue"); setMessage("Filters and selection cleared.");}}>Reset</button></div>
    {selected.length > 0 && <div className="selection-tray no-print" aria-label="Selected studies"><strong>Your comparison</strong>{selected.map((id) => <button className="selection-chip" key={id} aria-label={`Remove ${id} from selection`} onClick={() => toggle(id)}>{id} <span aria-hidden="true">×</span></button>)}<span>Selection stays when filters change.</span></div>}
    <p className="quiet" role="status">{message}</p>
    {rows.length === 0 ? <p className="notice">No retained studies match these filters. Reset or broaden your search.</p> : <div className="catalogue-table-wrap"><table className="catalogue-table"><caption className="sr-only">Saved trial catalogue with selection, registered endpoints and capture dates</caption><thead><tr><th scope="col">Study</th><th scope="col">Phase / status</th><th scope="col">Primary endpoint</th><th scope="col">Enrolment / source</th></tr></thead><tbody>{rows.map((item) => <tr key={item.nctId}>
      <th scope="row"><label className="catalogue-select"><input type="checkbox" checked={selected.includes(item.nctId)} onChange={() => toggle(item.nctId)} aria-label={`Select ${item.nctId}`} /><span>{item.nctId}</span></label><Link href={`/studies?nct=${item.nctId}`}>{item.record.briefTitle}</Link><p className="quiet">{formatValue(item.record.conditions.value)}</p></th>
      <td data-column="Phase / status"><span className="small-tag">{formatValue(item.record.phases.value)}</span><p>{formatValue(item.record.overallStatus.value)}</p></td>
      <td data-column="Primary endpoint"><p>{formatValue(item.record.primaryOutcomes.value)}</p></td>
      <td data-column="Enrolment / source"><p>{formatValue(item.record.enrollment.value)}</p><p className="quiet">Saved {item.retrievedAt.slice(0, 10)}<br />Registry update {item.record.provenance.registryLastUpdatePostedDate ?? "not reported"}</p><a href={item.record.provenance.sourceUrl} target="_blank" rel="noreferrer">Official record ↗</a><details className="source-disclosure"><summary>Selection rationale</summary><p>{manifest.entries.find((entry) => entry.nctId === item.nctId)?.selectionRationale ?? "Retained original catalogue record, preserved with its earlier evidence context."}</p><code>{item.projectedSha256}</code></details></td>
    </tr>)}</tbody></table></div>}
    <section className="export-bar"><h2>Take this collection with you</h2><p>Exports contain all {rows.length} filtered records. The source bundle includes these counts, their inputs and the filter definition. Select up to four records above for a focused snapshot comparison.</p><div className="button-row no-print"><button className="button" disabled={!rows.length} onClick={() => download("csv")}>Download catalogue CSV</button><button className="button button-secondary" disabled={!rows.length} onClick={() => download("json")}>Download catalogue sources</button><button className="button button-secondary" onClick={() => window.print()}>Print catalogue</button></div></section>
  </main>;
}
