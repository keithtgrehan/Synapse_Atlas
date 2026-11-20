import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  buildComparison,
  parseComparisonSelection,
  type ComparisonResult,
} from "../../lib/domain/comparisons";
import { ResearchBriefView } from "./brief-ui";
import { loadResearchBrief } from "../../lib/programs/research-brief";
import { loadComparisonCatalog } from "../../lib/programs/comparison-dataset";
import {
  ComparisonSelectionForm,
  ComparisonView,
} from "./comparison-ui";

export const metadata: Metadata = {
  title: "Compare study contexts · Synapse Atlas",
  description:
    "Compare two to four retained ClinicalTrials.gov study snapshots with their evidence-bound contexts.",
};

type ComparePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  let catalog;

  try {
    catalog = await loadComparisonCatalog();
  } catch {
    return <ComparisonUnavailable />;
  }

  const parameters = await searchParams;
  const selection = parseComparisonSelection(parameters, catalog);

  if (
    selection.state === "invalid" &&
    !isSanitizedInvalidSelection(parameters)
  ) {
    redirect("/compare?selectionState=invalid");
  }

  let comparison: ComparisonResult | null = null;
  let brief = null;

  if (selection.state === "ready") {
    try {
      comparison = buildComparison(catalog, selection.selectedSlugs);
      brief = await loadResearchBrief(comparison);
    } catch {
      return <ComparisonUnavailable />;
    }
  }

  return (
    <main id="main-content" className="shell brief-page">
      <header className="page-header">
        <Link className="back-link" href="/">← Synapse Atlas</Link>
        <p className="eyebrow">Saved registry snapshot comparison</p>
        <h1>Compare studies</h1>
        <p className="lede">
          Compare selected registered studies, inspect the evidence behind each
          contextual grouping, and take away a dated research brief.
        </p>
      </header>

      {brief ? <details className="selection-disclosure"><summary>Change programmes</summary><ComparisonSelectionForm catalog={catalog} selection={selection} /></details> : <ComparisonSelectionForm catalog={catalog} selection={selection} />}

      {selection.state === "too_few" ? (
        <section className="state-panel comparison-state" role="status" aria-live="polite">
          <h2>Select at least two study contexts</h2>
          <p>
            Your valid selection has been preserved. Choose one to three more
            study contexts, then submit the form again.
          </p>
        </section>
      ) : selection.state === "invalid" ? (
        <section className="state-panel state-error comparison-state" role="alert">
          <h2>The comparison selection could not be used</h2>
          <p>
            Empty, repeated, unknown, malformed, unexpected, control-character,
            or more-than-four values are rejected without displaying the
            submitted content.
          </p>
          <Link className="button button-secondary" href="/compare">
            Clear invalid selection
          </Link>
        </section>
      ) : comparison === null ? (
        <section className="state-panel comparison-state" aria-labelledby="comparison-start-heading">
          <h2 id="comparison-start-heading">Choose study contexts to compare</h2>
          <p>
            All {catalog.candidates.length} available contexts are included in this
            bounded set. Select two to four; each retains its own evidence class and
            decision scope.
          </p>
        </section>
      ) : (
        <>
          {brief && <ResearchBriefView brief={brief} />}
          <details className="mapping-audit"><summary>Programme mapping evidence and inclusion decisions</summary>
            <p>Each association retains its own evidence and decision scope. The original three use August mapping evidence; the ten additional model-proposed associations use retained October snapshots and owner-approved inclusion, not independent human scientific review.</p>
            <ComparisonView result={comparison} />
          </details>
        </>
      )}
    </main>
  );
}

function isSanitizedInvalidSelection(
  parameters: Record<string, string | string[] | undefined>,
): boolean {
  const keys = Object.keys(parameters);

  return (
    keys.length === 1 &&
    keys[0] === "selectionState" &&
    parameters.selectionState === "invalid"
  );
}

function ComparisonUnavailable() {
  return (
    <main id="main-content" className="shell brief-page">
      <header className="page-header">
        <Link className="back-link" href="/">← Synapse Atlas</Link>
        <p className="eyebrow">Deterministic comparison</p>
        <h1>Comparison unavailable</h1>
        <p className="lede">
          The checked-in comparison evidence could not be validated. No live
          data or fallback values were substituted.
        </p>
      </header>
      <section className="state-panel state-error" role="alert">
        <h2>The retained evidence needs review</h2>
        <p>Return to the programme list while the local evidence is checked.</p>
        <Link className="button button-secondary" href="/programs">
          Open Programmes
        </Link>
      </section>
    </main>
  );
}
