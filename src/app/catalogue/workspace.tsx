"use client";
import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Capture } from "../../lib/snapshots/model";
import type { ResearchManifest } from "../../lib/catalogue/model";
import { presentCollection } from "../../lib/catalogue/presentation";
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
    setMessage(`${type.toUpperCase()} prepared for the ${rows.length} records currently shown. Uses the saved records without another registry check.`);
  }
  return <main id="main-content" tabIndex={-1} className="shell catalogue-page">
    <header className="workspace-context catalogue-context"><div><p className="workspace-context__label">Browse saved studies</p><h1 className="workspace-context__title">Find studies to compare.</h1><p className="workspace-context__summary">Explore a selected set of public study records. Choose up to four to compare their design and planned measurements.</p></div><div className="workspace-context__aside"><p className="workspace-context__meta"><span>{group ? "Collection view" : "All saved records"}</span><span>{rows.length} of {catalogue.length} shown</span><span>Saved study records</span></p><div className="workspace-context__next"><span>Try an example</span><Link href="/#research-cases">Open a guided example <span aria-hidden="true">→</span></Link></div><div className="catalogue-entry-links"><Link href="/#research-collections">Browse all {manifest.groups.length} collections</Link></div></div></header>
    <section className="catalogue-filter no-print" aria-label="Filter saved studies">
      <label htmlFor="catalogue-query">Search studies<input id="catalogue-query" name="q" autoComplete="off" maxLength={200} type="search" placeholder="Study ID, treatment, condition or measurement…" value={query} onChange={(event) => setFilter("q", event.target.value)} /></label>
      <label htmlFor="collection">Study collection<select id="collection" value={groupId} onChange={(event) => setFilter("collection", event.target.value)}><option value="">All saved records</option>{manifest.groups.map((item) => <option key={item.id} value={item.id}>{presentCollection(item).title}</option>)}</select></label>
      <label htmlFor="registry-status">Study status<select id="registry-status" value={status} onChange={(event) => setFilter("status", event.target.value)}><option value="">All statuses</option>{[...new Set(catalogue.map((item) => item.record.overallStatus.value).filter(Boolean))].sort().map((item) => <option key={item} value={item!}>{item!.replaceAll("_", " ")}</option>)}</select></label>
    </section>
    <section className="collection-context"><p className="eyebrow">{group ? "This collection’s question" : "About this list"}</p><h2>{group ? presentCollection(group).question : "What is included here?"}</h2><p>{group?.description ?? "This list brings together saved records selected for the examples and collections. It is not a complete or representative list of studies."}</p>{!group && <details><summary>How these records were selected</summary><p>{manifest.selectionMethod}</p></details>}<p className="quiet">{group?.limitations ?? analysis.limitations}</p>{group && <details><summary>Original collection details</summary><p><strong>{group.title}</strong></p><p>{group.question}</p></details>}{group && <p className="quiet">Compare: {group.comparisonDimensions.join(" · ")}</p>}</section>
    <details className="catalogue-analysis"><summary>See what is in this list · {analysis.count} records shown</summary><p>These counts describe the records shown and the dates they were saved. They do not describe treatment results or all studies in this field.</p><div className="analysis-grid"><Distribution title="Study phase" values={analysis.phases} /><Distribution title="Study status" values={analysis.statuses} /><Distribution title="Reported enrolment type" values={analysis.enrollmentDefinitions} /></div><p className="quiet">Records with main planned measurements: {analysis.primaryEndpointReported} / {analysis.count} records. Copies saved: {analysis.retrievalDates.join(" · ") || "none"}. Participant counts are not added together.</p></details>
    <div className="catalogue-action-bar no-print"><span role="status">{rows.length} / {catalogue.length} records · {selected.length} of 4 selected</span>{selected.length > 0 && <Link className="button" href={`/studies?${params}`}>Compare selected studies →</Link>}<button className="button button-secondary" onClick={() => {setSelected([]); window.history.replaceState(null, "", "/catalogue"); setMessage("Filters and selection cleared.");}}>Reset</button></div>
    {selected.length > 0 && <div className="selection-tray no-print" aria-label="Selected studies"><strong>Your comparison</strong>{selected.map((id) => <button className="selection-chip" key={id} aria-label={`Remove ${id} from selection`} onClick={() => toggle(id)}>{id} <span aria-hidden="true">×</span></button>)}<span>Selection stays when filters change.</span></div>}
    <p className="quiet" role="status">{message}</p>
    {rows.length === 0 ? <p className="notice">No saved studies match these filters. Reset the filters or try a broader search.</p> : <div className="catalogue-table-wrap"><table className="catalogue-table"><caption className="sr-only">Saved study list with selection, planned measurements and dates</caption><thead><tr><th scope="col">Study</th><th scope="col">Phase / status</th><th scope="col">Main planned measurement</th><th scope="col">Enrolment / source</th></tr></thead><tbody>{rows.map((item) => <tr key={item.nctId}>
      <th scope="row"><label className="catalogue-select"><input type="checkbox" checked={selected.includes(item.nctId)} onChange={() => toggle(item.nctId)} aria-label={`Select ${item.nctId}`} /><span>{item.nctId}</span></label><Link href={`/studies?nct=${item.nctId}`}>{item.record.briefTitle}</Link><p className="quiet">{formatValue(item.record.conditions.value)}</p></th>
      <td data-column="Phase / status"><span className="small-tag">{formatValue(item.record.phases.value)}</span><p>{formatValue(item.record.overallStatus.value)}</p></td>
      <td data-column="Main planned measurement"><p>{formatValue(item.record.primaryOutcomes.value)}</p></td>
      <td data-column="Enrolment / source"><p>{formatValue(item.record.enrollment.value)}</p><p className="quiet">Saved {item.retrievedAt.slice(0, 10)}<br />Registry update {item.record.provenance.registryLastUpdatePostedDate ?? "not reported"}</p><a href={item.record.provenance.sourceUrl} target="_blank" rel="noreferrer">Official record ↗</a><details className="source-disclosure"><summary>Why this study is included</summary><p>{manifest.entries.find((entry) => entry.nctId === item.nctId)?.selectionRationale ?? "This study was included in the original saved collection. Its earlier source context is preserved."}</p><code>{item.projectedSha256}</code></details></td>
    </tr>)}</tbody></table></div>}
    <section className="export-bar"><h2>Download this list</h2><p>Downloads include all {rows.length} records currently shown. The JSON source data includes the counts and filters used for this list. To make a shorter comparison, select up to four studies above.</p><div className="button-row no-print"><button className="button" disabled={!rows.length} onClick={() => download("csv")}>Download list (CSV)</button><button className="button button-secondary" disabled={!rows.length} onClick={() => download("json")}>Download source data (JSON)</button><button className="button button-secondary" onClick={() => window.print()}>Print this list</button></div></section>
  </main>;
}
