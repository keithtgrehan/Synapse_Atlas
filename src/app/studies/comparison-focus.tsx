"use client";

import { useId, useState } from "react";
import type { CaseDimension, VerifiedCase } from "../../lib/cases/model";
import { CaseEvidenceDisclosure } from "./case-evidence";

const defaultFocusKey: Record<string, string> = {
  "mdd-measurement-window": "primary-outcome",
  "adjunctive-inadequate-response": "madrs-window",
  "registry-change-brief": "current-capture-status",
  "mdma-ptsd-design-context": "registered-population",
};

export function resolveComparisonFocus(
  researchCase: VerifiedCase["content"],
  requestedKey?: string,
): CaseDimension | undefined {
  const fallback = defaultFocusKey[researchCase.id];
  return researchCase.dimensions.find((dimension) => dimension.key === requestedKey)
    ?? researchCase.dimensions.find((dimension) => dimension.key === fallback)
    ?? researchCase.dimensions[0];
}

export function ComparisonFocus({ researchCase, onOpenMatrix }: {
  researchCase: VerifiedCase;
  onOpenMatrix: () => void;
}) {
  const { content } = researchCase;
  const groupId = useId();
  const [selectedKey, setSelectedKey] = useState(() => resolveComparisonFocus(content)?.key ?? "");
  const active = resolveComparisonFocus(content, selectedKey);

  if (!active) return null;

  return <section className="comparison-focus no-print" aria-labelledby="comparison-focus-title">
    <div className="comparison-focus__heading">
      <div><p className="eyebrow">Explore the comparison</p><h3 id="comparison-focus-title">Focus on a study detail</h3></div>
      <a href="#full-evidence" onClick={onOpenMatrix}>View all study details ↓</a>
    </div>
    <p className="comparison-focus__boundary">Choose a study detail to compare. Cards summarise saved fields; open the source details for the exact wording. This does not compare treatment results or change this brief.</p>
    {content.id === "registry-change-brief" && <p className="comparison-focus__boundary">The selected values are from the later saved version, not a live check or the complete record history.</p>}
    <fieldset className="comparison-focus__controls">
      <legend>Study detail</legend>
      <div>{content.dimensions.map((dimension) => <label key={dimension.key} className="comparison-focus__control">
        <input type="radio" name={groupId} value={dimension.key} checked={active.key === dimension.key} onChange={() => setSelectedKey(dimension.key)} />
        <span>{dimension.label}</span>
      </label>)}</div>
    </fieldset>
    <div className="comparison-focus__interpretation"><span>AI-assisted reading note</span><p>{active.interpretation}</p></div>
    <section className="comparison-focus__summary" aria-labelledby="comparison-focus-summary">
      <p id="comparison-focus-summary">Atlas summary of saved fields</p>
      <div className="comparison-focus__cards">
      {content.studyIds.map((nctId) => {
        const cell = active.cells.find((item) => item.nctId === nctId);
        const savedDates = [...new Set(cell?.evidence
          .filter((item) => item.nctId === nctId)
          .map((item) => item.retrievedAt.slice(0, 10)) ?? [])].sort();
        return <article key={nctId} className="comparison-focus__card">
          <header><span>{nctId}</span><p className="comparison-focus__saved">{savedDates.length ? <>Saved {savedDates.map((date, index) => <span key={date}>{index > 0 ? ", " : ""}<time dateTime={date}>{date}</time></span>)}</> : "Saved date unavailable"}</p></header>
          <h4>{active.label}</h4><p className="comparison-focus__value">{cell?.value ?? "Not evaluated"}</p>
          {cell?.evidence.length ? <CaseEvidenceDisclosure evidence={cell.evidence} /> : null}
        </article>;
      })}
      </div>
    </section>
  </section>;
}
