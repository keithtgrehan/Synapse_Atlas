import type { Metadata } from "next";
import Link from "next/link";
import { loadStudyExamples } from "../../../lib/studies/examples";
import { availabilityText, humanizeCode } from "../trial-ui";

export const metadata: Metadata = { title: "Study examples · Synapse Atlas" };

export default async function StudyExamplesPage() {
  const studies = await loadStudyExamples();
  return (
    <main className="shell">
      <header className="page-header">
        <Link className="back-link" href="/">← Synapse Atlas</Link>
        <p className="eyebrow">Retained registry snapshots · 13 October 2026</p>
        <h1>10 non-psychedelic study examples</h1>
        <p className="lede">Explore completed Phase 2 and Phase 3 trials across depression,
          schizophrenia, PTSD and sleep. Each study has posted registry results and a linked publication.</p>
        <p>These are dated examples, not live registry data. Study designs and populations differ;
          this collection does not rank treatments or establish comparative efficacy.</p>
        <p><Link href="/trials">Search the live registry</Link> · <Link href="/programs">Explore all 13 programme mappings</Link></p>
      </header>
      <ul className="trial-list" aria-label="Retained study examples">
        {studies.map(({ nctId, label, indication, intervention, trial }) => (
          <li className="trial-card" key={nctId}>
            <div className="trial-card-heading">
              <div>
                <p className="nct-id">{nctId}</p>
                <h2><Link href={`/trials/examples/${nctId}`}>{label}</Link></h2>
              </div>
              <span className="status-label">{availabilityText(trial.overallStatus, humanizeCode)}</span>
            </div>
            <dl className="card-facts">
              <div><dt>Indication</dt><dd>{indication}</dd></div>
              <div><dt>Intervention overview</dt><dd>{intervention}</dd></div>
              <div><dt>Phase</dt><dd>{availabilityText(trial.phases, (phases) => phases.map(humanizeCode).join(", "))}</dd></div>
              <div><dt>Registry lead sponsor</dt><dd>{availabilityText(trial.leadSponsor, (sponsor) => sponsor.name)}</dd></div>
            </dl>
            <p className="boundary-note">Retained 13 October 2026 · Posted results and publication · Source notes on detail page</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
