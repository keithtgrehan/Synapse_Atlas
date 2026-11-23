"use client";

import { useState } from "react";
import type { VerifiedCase } from "../../lib/cases/model";
import { ReadingPanel } from "./reading-panel";
import { CaseEvidenceDisclosure } from "./case-evidence";
import { ComparisonFocus } from "./comparison-focus";
import { CaseMatrixTable } from "./case-matrix";

export function CaseView({ researchCase }: { researchCase: VerifiedCase }) {
  const { content } = researchCase;
  const [matrixOpen, setMatrixOpen] = useState(false);
  return <section className="case-analysis" aria-labelledby="case-question">
    <div className="case-opening"><div><p className="eyebrow">The question</p>
      <h2 id="case-question" className="case-question">{content.question}</h2>
      <p>{content.summary}</p></div><aside><h3>Why these studies?</h3><p>{content.whyTogether}</p>
      <p className="quiet">The reading notes below are written with AI assistance. They are not study findings or a comparison of treatment results.</p></aside></div>
    <aside className="case-reading-context" aria-label="Comparison boundary"><p><strong>What this comparison cannot tell you</strong></p><p>{content.cannotEstablish}</p></aside>
    <ComparisonFocus key={content.id} researchCase={researchCase} onOpenMatrix={() => setMatrixOpen(true)} />
    <details id="full-evidence" className="case-matrix case-matrix-screen" open={matrixOpen} onToggle={(event) => setMatrixOpen(event.currentTarget.open)}>
      <summary>View all study details · {content.dimensions.length} topics</summary>
      <CaseMatrixTable content={content} />
    </details>
    <div className="case-matrix case-matrix-print print-only" aria-hidden="true"><CaseMatrixTable content={content} /></div>
    <div className="case-conclusions"><div><h3>What the records suggest</h3>{content.takeaways.map((claim, index) => <article className="case-takeaway" key={index}>
      <span className="eyebrow">{claim.evidenceClass === "SOURCE_FACT" ? "From the saved study record" : "AI-assisted interpretation"}</span>
      <p>{claim.text.replace(/^(SOURCE_FACT|MODEL_INFERENCE):\s*/, "")}</p><CaseEvidenceDisclosure evidence={claim.evidence} />
    </article>)}</div><aside><h3>Questions to explore next</h3><ul>{content.nextQuestions.map((question) => <li key={question}>{question}</li>)}</ul></aside></div>
    {content.readingReferences?.length ? <ReadingPanel references={content.readingReferences} /> : null}
    <p className="quiet">These notes use the saved records. Checking for updates below does not change the notes.</p>
    <p className="print-only quiet">Case content SHA-256: {researchCase.contentSha256}. Field values, source locators and hashes are included in the source bundle.</p>
  </section>;
}
