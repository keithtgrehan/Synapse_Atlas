import Link from "next/link";

import { CasePreview, FeaturedEvidence } from "./case-preview";
import { loadResearchManifest } from "../lib/catalogue/load";
import { researchCases } from "../lib/cases/content";
import { compareCaptures } from "../lib/snapshots/compare";
import { loadResearchCases } from "../lib/cases/load";
import { loadReplayPair } from "../lib/snapshots/catalogue";
import { loadSnapshotCatalogue } from "../lib/snapshots/catalogue";

export default async function Home() {
  const [catalogue, manifest] = await Promise.all([
    loadSnapshotCatalogue(),
    loadResearchManifest(),
  ]);
  await loadResearchCases(catalogue);
  const replayPairs = await Promise.all(researchCases[2]!.studyIds.map((id) => loadReplayPair(id)));
  const replays = replayPairs.filter((pair) => pair !== null).map((pair) => compareCaptures(pair!.baseline, pair!.current));
  const featured = researchCases[0]!;
  const memberships = manifest.groups.reduce(
    (total, collection) => total + collection.studyIds.length,
    0,
  );
  const uniqueIds = new Set(manifest.groups.flatMap((collection) => collection.studyIds));

  return (
    <main id="main-content" className="atlas-home-v2">
      <section className="atlas-intro shell">
        <div className="atlas-intro-copy">
          <p className="eyebrow">Traceable neuropsychiatry research.</p>
          <h1>Turn a narrow research question into a traceable study-design brief.</h1>
          <p className="atlas-intro-lede">
            Read measures, timing, capture dates and limits together before you
            compare a selected set of registered studies.
          </p>
          <Link className="button hero-primary" href={`/studies?case=${featured.id}`}>Open a guided brief <span aria-hidden="true">↗</span></Link>
          <div className="atlas-intro-meta" aria-label="Product scope">
            <span>{catalogue.length} retained NCT records</span>
            <span>{researchCases.length} guided cases</span>
            <span>{manifest.groups.length} research collections</span>
            <span>Public registry evidence</span>
          </div>
          <Link className="atlas-intro-link" href="#research-collections">
            Explore research collections <span aria-hidden="true">↓</span>
          </Link>
        </div>
        <FeaturedEvidence caseStudy={featured} />
      </section>

      <section id="research-cases" className="shell atlas-cases" aria-labelledby="case-title">
        <header className="atlas-section-heading">
          <p className="eyebrow">Guided research cases</p>
          <h2 id="case-title">Three routes through the evidence, with the limits intact.</h2>
          <p>Each brief states the question, useful registered fields, material mismatch and the boundary on any interpretation.</p>
        </header>
        <div className="case-preview-grid">
          {researchCases.map((caseStudy, index) => (
            <CasePreview caseStudy={caseStudy} index={index} replays={index === 2 ? replays : []} key={caseStudy.id} />
          ))}
        </div>
      </section>

      <section id="research-collections" className="atlas-collection-band" aria-labelledby="collection-title">
        <div className="shell">
          <header>
            <p className="eyebrow">Research starting points</p>
            <h2 id="collection-title">Seven collection questions for a more focused starting point.</h2>
            <p>The catalogue is a selected convenience inventory, not a complete landscape or a treatment ranking.</p>
          </header>
          <div className="collection-strip">
            {manifest.groups.map((collection, index) => (
              <article key={collection.id}>
                <span>0{index + 1}</span>
                <h3>{collection.title}</h3>
                <p>{collection.question}</p>
                <details><summary>Scope &amp; limits</summary><p>{collection.description}</p><p>{collection.limitations}</p></details>
                <small>{new Set(collection.studyIds).size} unique records</small>
                <Link href={`/catalogue?collection=${collection.id}`}>Explore collection →</Link>
              </article>
            ))}
          </div>
          <p className="collection-disclaimer">
            {memberships} collection memberships cover {uniqueIds.size} unique retained records; some records appear in more than one context. Open a collection to inspect its stated question and limits.
          </p>
        </div>
      </section>

      <section className="shell atlas-closing">
        <div>
          <p className="eyebrow">Build a focused comparison</p>
          <h2>Choose up to four saved studies, then compare the captured evidence.</h2>
          <p>Screen, CSV, source bundle and print output reuse the same saved or session-captured pair. Exports do not silently fetch another registry record.</p>
        </div>
        <div className="atlas-closing-actions">
          <Link className="button" href={`/studies?case=${featured.id}`}>Open a guided brief <span aria-hidden="true">→</span></Link>
          <Link href="/catalogue">Browse the catalogue <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </main>
  );
}
