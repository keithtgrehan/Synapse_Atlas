import Link from "next/link";

import type { SnapshotDiff } from "../lib/snapshots/model";
import type { ResearchCase } from "../lib/cases/model";

function dimension(caseStudy: ResearchCase, key: string) {
  return caseStudy.dimensions.find((item) => item.key === key);
}

function previewDimensions(caseStudy: ResearchCase) {
  const preferred =
    caseStudy.id === "mdd-measurement-window"
      ? ["primary-outcome", "assessment-window"]
      : caseStudy.id === "adjunctive-inadequate-response"
        ? ["madrs-window", "setting"]
        : caseStudy.id === "mdma-ptsd-design-context"
          ? ["registered-population", "phase-enrollment"]
          : ["current-capture-status", "registered-condition"];
  return preferred
    .map((key) => dimension(caseStudy, key))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}

export function CasePreview({ caseStudy, index, replays = [] }: { caseStudy: ResearchCase; index: number; replays?: SnapshotDiff[] }) {
  const facts = previewDimensions(caseStudy);
  const boundary = (caseStudy.cannotEstablish.split(". ")[0] ?? caseStudy.cannotEstablish).replace(/\.+$/, "");
  const capturedAt = facts[0]?.cells[0]?.evidence[0]?.retrievedAt.slice(0, 10) ?? "saved capture";
  return (
    <article className={`case-preview case-preview--${index + 1} case-preview--${caseStudy.id}`}>
      <header>
        <p className="eyebrow">Example {String(index + 1).padStart(2, "0")}</p>
        <span>{caseStudy.studyIds.length} study records · saved {capturedAt}</span>
      </header>
      <h3>{caseStudy.title}</h3>
      <p className="case-preview-question">{caseStudy.question}</p>
      <div className="case-visual" role="group" aria-label={`${caseStudy.title}: evidence preview`}>
        {caseStudy.id === "mdd-measurement-window" ? <div className="measure-preview">{caseStudy.studyIds.map((id) => <div key={id}><span>{id}</span><strong>{dimension(caseStudy, "primary-outcome")?.cells.find((cell) => cell.nctId === id)?.value}</strong><time>{dimension(caseStudy, "assessment-window")?.cells.find((cell) => cell.nctId === id)?.value}</time></div>)}</div>
        : caseStudy.id === "adjunctive-inadequate-response" ? <div className="clock-preview"><p>Different study timelines · MADRS</p>{dimension(caseStudy, "madrs-window")?.cells.map((cell) => <div key={cell.nctId}><span>{cell.nctId}</span><div className="clock-track" aria-hidden="true"><i />→<i /></div><strong>{cell.value}</strong></div>)}<small>The starting points differ. This is not a comparison of treatment effects.</small></div>
        : caseStudy.id === "registry-change-brief" ? <div className="replay-preview"><p>Two saved versions · record changes</p>{replays.map((diff) => <div key={diff.nctId}><strong>{diff.nctId}</strong><span>{diff.baseline.retrievedAt.slice(0,10)} → {diff.current.retrievedAt.slice(0,10)}</span><div className="replay-counts"><b>{diff.fields.filter(f => ["changed","added","removed"].includes(f.state)).length} changed</b><b>{diff.fields.filter(f => f.state === "unchanged").length} unchanged</b><b>{diff.fields.filter(f => ["ambiguous","not_compared"].includes(f.state)).length} not compared</b></div></div>)}<small>These are record dates, not signs of clinical progress. Information missing from an older copy cannot be compared.</small></div>
        : <div className="measure-preview"><p>PTSD · study design details</p>{dimension(caseStudy, "phase-enrollment")?.cells.map(cell => <div key={cell.nctId}><span>{cell.nctId}</span><strong>{cell.value}</strong></div>)}<small>The recorded enrolment count may differ from the number assigned to groups or included in the analysis. Results are not combined here.</small></div>}
      </div>
      <details className="preview-source-values"><summary>See the saved source details</summary><dl>
        {facts.map((fact) => (
          <div key={fact.key}>
            <dt>{fact.label}</dt>
            <dd>
              {fact.cells.map((cell) => (
                <span key={cell.nctId}>
                  <b>{cell.nctId}</b> {cell.value}
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl></details>
      <p className="case-preview-boundary">
        <b>What this comparison cannot tell you</b> {boundary}.
      </p>
      <footer>
        <Link href={`/studies?case=${caseStudy.id}`} aria-label={`Open example: ${caseStudy.title}`}>Open example <span aria-hidden="true">→</span></Link>
        <span>{caseStudy.kicker}</span>
      </footer>
    </article>
  );
}

export function FeaturedEvidence({ caseStudy }: { caseStudy: ResearchCase }) {
  const endpoint = dimension(caseStudy, "primary-outcome");
  const window = dimension(caseStudy, "assessment-window");
  return (
    <section className="featured-evidence" aria-labelledby="featured-evidence-title">
      <div className="featured-evidence-head">
        <p className="eyebrow">An example / 01</p>
        <span>From saved study records</span>
      </div>
      <h2 id="featured-evidence-title">{caseStudy.title}</h2>
      <p className="featured-capture">ClinicalTrials.gov · saved {endpoint?.cells[0]?.evidence[0]?.retrievedAt.slice(0, 10) ?? "capture"}</p>
      <p>{caseStudy.summary}</p>
      <div className="evidence-ribbon" role="table" aria-label="Registered endpoint and assessment window by study">
        <div className="evidence-column-labels" role="row">
          <span role="columnheader">Record</span>
          <span role="columnheader">Main planned measurement</span>
          <span role="columnheader">Planned timing</span>
        </div>
        {caseStudy.studyIds.map((nctId, index) => {
          const measure = endpoint?.cells.find((cell) => cell.nctId === nctId)?.value ?? "Not reported";
          const time = window?.cells.find((cell) => cell.nctId === nctId)?.value ?? "Not reported";
          return (
            <div className="evidence-marker" role="row" key={nctId}>
              <span className="evidence-index" aria-hidden="true">0{index + 1}</span>
              <a href={`https://clinicaltrials.gov/study/${nctId}`} target="_blank" rel="noreferrer" role="cell">{nctId}<span className="sr-only">, official ClinicalTrials.gov record</span></a>
              <p role="cell">{measure}</p>
              <small role="cell">{time}</small>
            </div>
          );
        })}
      </div>
      <p className="featured-boundary">Planned measurements are not study results. Open the example to see the exact source details and what they can tell you.</p>

    </section>
  );
}
