import Link from "next/link";

import { researchCases } from "../lib/cases/content";
import { loadSnapshotCatalogue } from "../lib/snapshots/catalogue";
import type { Capture } from "../lib/snapshots/model";

function reported<T>(value: { state: string; value: T | null }): T | null {
  return value.state === "reported" ? value.value : null;
}

function featuredEndpoint(nctId: string) {
  const featured = researchCases[0]!;
  const value = (key: string) =>
    featured.dimensions
      .find((dimension) => dimension.key === key)
      ?.cells.find((cell) => cell.nctId === nctId)?.value;
  const measure = value("primary-outcome");
  const window = value("assessment-window");
  return [measure, window].filter(Boolean).join(" · ") || "Not reported";
}

function displayDate(capture: Capture) {
  const date = reported(capture.record.registryLastUpdatePostedDate);
  return date?.value ?? "Not reported";
}

export default async function Home() {
  const catalogue = await loadSnapshotCatalogue();
  const featured = researchCases[0]!;
  const featuredRecords = featured.studyIds
    .map((nctId) => catalogue.find((item) => item.nctId === nctId))
    .filter((item): item is Capture => Boolean(item));

  return (
    <main id="main-content" className="shell atlas-home">
      <section className="atlas-hero atlas-hero--evidence">
        <div className="hero-copy">
          <p className="eyebrow">Evidence-led neuropsychiatric research</p>
          <h1>See the study design before you compare the story.</h1>
          <p className="lede">
            Synapse Atlas keeps registered endpoints, assessment windows and
            source dates beside the research question — then makes the same
            captured evidence reusable in a brief.
          </p>
          <div className="button-row">
            <Link className="button" href={`/studies?case=${featured.id}`}>
              Open the MDD endpoint case <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-action" href="#research-cases">
              Browse 3 research cases <span aria-hidden="true">↓</span>
            </Link>
          </div>
          <p className="hero-caption">
            {catalogue.length} retained registry records · no account · public
            ClinicalTrials.gov evidence
          </p>
        </div>
        <section className="hero-evidence" aria-labelledby="featured-case-title">
          <header className="evidence-head">
            <div>
              <p className="eyebrow">Featured case / 01</p>
              <h2 id="featured-case-title">{featured.title}</h2>
            </div>
            <span className="small-tag">3 saved records</span>
          </header>
          <p className="evidence-question">{featured.question}</p>
          <div
            className="evidence-table-wrap"
            role="region"
            aria-label="Featured registered endpoint comparison"
            tabIndex={0}
          >
            <table className="evidence-table">
              <caption className="sr-only">
                Registered primary endpoints in the featured MDD case
              </caption>
              <thead>
                <tr>
                  <th scope="col">Study</th>
                  <th scope="col">Registered primary endpoint</th>
                  <th scope="col">Record update</th>
                </tr>
              </thead>
              <tbody>
                {featuredRecords.map((capture) => (
                  <tr key={capture.nctId}>
                    <th scope="row">
                      <a href={capture.record.provenance.sourceUrl}>
                        {capture.nctId}
                      </a>
                      <span>{capture.record.briefTitle}</span>
                    </th>
                    <td>{featuredEndpoint(capture.nctId)}</td>
                    <td>{displayDate(capture)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="evidence-footnote">
            Saved ClinicalTrials.gov captures. Registered endpoints are not
            reported outcomes.
          </p>
        </section>
      </section>

      <section className="home-path" aria-label="Research workflow">
        <div>
          <span className="step-number">01</span>
          <h2>Choose a scoped question</h2>
          <p>Start with a case whose shared context and material differences are explicit.</p>
        </div>
        <div>
          <span className="step-number">02</span>
          <h2>Inspect the registry evidence</h2>
          <p>Open exact study identities, field locators and a dated retained capture.</p>
        </div>
        <div>
          <span className="step-number">03</span>
          <h2>Take a reproducible brief</h2>
          <p>Use the same captured pair on screen, in CSV, print and the source bundle.</p>
        </div>
      </section>

      <section id="research-cases" className="home-lenses" aria-labelledby="research-lenses-title">
        <div className="section-kicker">
          <p className="eyebrow">Research cases</p>
          <h2 id="research-lenses-title">Three ways to read the same registry evidence with more care.</h2>
        </div>
        <div className="case-study-grid">
          {researchCases.map((researchCase, index) => (
            <article className={`case-card case-card--${index + 1}`} key={researchCase.id}>
              <p className="case-index">{String(index + 1).padStart(2, "0")} / {researchCase.kicker}</p>
              <h3>{researchCase.title}</h3>
              <p>{researchCase.summary}</p>
              <div className="case-meta" aria-label="Case scope">
                <span>{researchCase.studyIds.length} studies</span>
                <span>Registry evidence</span>
              </div>
              <Link href={`/studies?case=${researchCase.id}`}>Open the case <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-bottom">
        <div>
          <h2>Build your own selection</h2>
          <p>{catalogue.length} retained registry records. NCT identity comes first; programme associations are optional context.</p>
          <Link href="/catalogue">Browse the saved study catalogue →</Link>
        </div>
        <div>
          <h2>Useful evidence. Clear limits.</h2>
          <p>Registry changes do not establish clinical progress or treatment benefit. This is a research tool, built with AI assistance.</p>
          <Link href="/how-it-works">How it works →</Link>
        </div>
      </section>
    </main>
  );
}
