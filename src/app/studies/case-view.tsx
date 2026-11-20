import type { CaseEvidence, VerifiedCase } from "../../lib/cases/model";
import { ReadingPanel } from "./reading-panel";

function Evidence({ evidence }: { evidence: CaseEvidence[] }) {
  return <details className="source-disclosure"><summary>See the saved source details ({evidence.length})</summary>
    {evidence.map((item) => <div key={`${item.nctId}:${item.locator}`}>
      <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.nctId} · official record ↗</a>
      <p>Captured {item.retrievedAt.slice(0, 10)} · <code>{item.locator}</code></p>
      <pre>{typeof item.expectedValue === "string" ? item.expectedValue : JSON.stringify(item.expectedValue, null, 2)}</pre>
    </div>)}
    <p>These values come from the saved copy. The public record linked above may have changed since it was saved.</p>
  </details>;
}

export function CaseView({ researchCase }: { researchCase: VerifiedCase }) {
  const { content } = researchCase;
  return <section className="case-analysis" aria-labelledby="case-question">
    <div className="case-opening"><div><p className="eyebrow">The question</p>
      <h2 id="case-question" className="case-question">{content.question}</h2>
      <p>{content.summary}</p></div><aside><h3>Why these studies?</h3><p>{content.whyTogether}</p>
      <p className="quiet">The reading notes below are written with AI assistance. They are not study findings or a comparison of treatment results.</p></aside></div>
    <aside className="case-reading-context" aria-label="Comparison boundary"><p><strong>What this comparison cannot tell you</strong></p><p>{content.cannotEstablish}</p></aside>
    <details className="case-matrix" open>
      <summary>Compare the study details · {content.dimensions.length} topics</summary>
      <div className="case-matrix-wrap" role="region" aria-label={`${content.title}: registered study characteristics`} tabIndex={0}>
      <table><caption className="sr-only">{content.title}: registered study characteristics</caption>
        <thead><tr><th scope="col">Research dimension</th>{content.studyIds.map((id) => <th scope="col" key={id}><a href={`https://clinicaltrials.gov/study/${id}`} target="_blank" rel="noreferrer">{id} ↗</a></th>)}</tr></thead>
        <tbody>{content.dimensions.map((row) => <tr key={row.key}><th scope="row">{row.label}<p className="quiet">{row.interpretation}</p><small>Interpretation</small></th>
          {content.studyIds.map((id) => { const cell = row.cells.find((entry) => entry.nctId === id); return <td key={id} data-study={id}><p>{cell?.value ?? "Not evaluated"}</p>{cell && cell.evidence.length > 0 && <Evidence evidence={cell.evidence} />}</td>; })}
        </tr>)}</tbody>
      </table>
      </div>
    </details>
    <div className="case-conclusions"><div><h3>What the records suggest</h3>{content.takeaways.map((claim, index) => <article className="case-takeaway" key={index}>
      <span className="eyebrow">{claim.evidenceClass === "SOURCE_FACT" ? "From the saved study record" : "AI-assisted interpretation"}</span>
      <p>{claim.text.replace(/^(SOURCE_FACT|MODEL_INFERENCE):\s*/, "")}</p><Evidence evidence={claim.evidence} />
    </article>)}</div><aside><div className="case-limits"><h3>What this comparison cannot tell you</h3><p>{content.cannotEstablish}</p></div><h3>Questions to explore next</h3><ul>{content.nextQuestions.map((question) => <li key={question}>{question}</li>)}</ul></aside></div>
    {content.readingReferences?.length ? <ReadingPanel references={content.readingReferences} /> : null}
    <p className="quiet">These notes use the saved records. Checking for updates below does not change the notes.</p>
    <p className="print-only quiet">Case content SHA-256: {researchCase.contentSha256}. Field values, source locators and hashes are included in the source bundle.</p>
  </section>;
}
