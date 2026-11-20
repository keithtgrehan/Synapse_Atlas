import type { CaseEvidence, VerifiedCase } from "../../lib/cases/model";

function Evidence({ evidence }: { evidence: CaseEvidence[] }) {
  return <details className="source-disclosure"><summary>Inspect supporting fields ({evidence.length})</summary>
    {evidence.map((item) => <div key={`${item.nctId}:${item.locator}`}>
      <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.nctId} · official record ↗</a>
      <p>Captured {item.retrievedAt.slice(0, 10)} · <code>{item.locator}</code></p>
      <pre>{typeof item.expectedValue === "string" ? item.expectedValue : JSON.stringify(item.expectedValue, null, 2)}</pre>
    </div>)}
    <p>These values come from the retained capture. The official link may show newer data.</p>
  </details>;
}

export function CaseView({ researchCase }: { researchCase: VerifiedCase }) {
  const { content } = researchCase;
  return <section className="case-analysis" aria-labelledby="case-question">
    <div className="case-opening"><div><p className="eyebrow">Research question</p>
      <h2 id="case-question" className="case-question">{content.question}</h2>
      <p>{content.summary}</p></div><aside><h3>Why these studies?</h3><p>{content.whyTogether}</p>
      <p className="quiet">Registry facts with AI-assisted interpretation. No clinical outcome comparison.</p></aside></div>
    <aside className="case-reading-context" aria-label="Comparison boundary"><p><strong>Read this comparison within its limits</strong></p><p>{content.cannotEstablish}</p></aside>
    <details className="case-matrix" open>
      <summary>Compare the evidence · {content.dimensions.length} dimensions</summary>
      <div className="case-matrix-wrap" role="region" aria-label={`${content.title}: registered study characteristics`} tabIndex={0}>
      <table><caption className="sr-only">{content.title}: registered study characteristics</caption>
        <thead><tr><th scope="col">Research dimension</th>{content.studyIds.map((id) => <th scope="col" key={id}><a href={`https://clinicaltrials.gov/study/${id}`} target="_blank" rel="noreferrer">{id} ↗</a></th>)}</tr></thead>
        <tbody>{content.dimensions.map((row) => <tr key={row.key}><th scope="row">{row.label}<p className="quiet">{row.interpretation}</p><small>Interpretation</small></th>
          {content.studyIds.map((id) => { const cell = row.cells.find((entry) => entry.nctId === id); return <td key={id} data-study={id}><p>{cell?.value ?? "Not evaluated"}</p>{cell && cell.evidence.length > 0 && <Evidence evidence={cell.evidence} />}</td>; })}
        </tr>)}</tbody>
      </table>
      </div>
    </details>
    <div className="case-conclusions"><div><h3>What to take into the discussion</h3>{content.takeaways.map((claim, index) => <article className="case-takeaway" key={index}>
      <span className="eyebrow">{claim.evidenceClass === "SOURCE_FACT" ? "Registry fact" : "AI-assisted interpretation"}</span>
      <p>{claim.text.replace(/^(SOURCE_FACT|MODEL_INFERENCE):\s*/, "")}</p><Evidence evidence={claim.evidence} />
    </article>)}</div><aside><div className="case-limits"><h3>What this cannot establish</h3><p>{content.cannotEstablish}</p></div><h3>Next research questions</h3><ul>{content.nextQuestions.map((question) => <li key={question}>{question}</li>)}</ul></aside></div>
    <p className="quiet">This analysis stays tied to the saved records. A current capture below does not silently rewrite it.</p>
    <p className="print-only quiet">Case content SHA-256: {researchCase.contentSha256}. Field values, source locators and hashes are included in the source bundle.</p>
  </section>;
}
