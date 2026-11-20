import { presentCollection } from "../lib/catalogue/presentation";
import Link from "next/link";

import { CasePreview, FeaturedEvidence } from "./case-preview";
import { loadCatalogueManifest } from "../lib/catalogue/load";
import { researchCases } from "../lib/cases/content";
import { compareCaptures } from "../lib/snapshots/compare";
import { loadResearchCases } from "../lib/cases/load";
import { loadReplayPair } from "../lib/snapshots/catalogue";
import { loadSnapshotCatalogue } from "../lib/snapshots/catalogue";

export default async function Home() {
  const [catalogue, manifest] = await Promise.all([
    loadSnapshotCatalogue(),
    loadCatalogueManifest(),
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
    <main id="main-content" tabIndex={-1} className="atlas-home-v2">
      <section className="atlas-hero-band" aria-labelledby="home-title">
      <div className="atlas-intro shell">
        <div className="atlas-intro-copy">
          <p className="eyebrow">Explore public study records</p>
          <h1 id="home-title">Trial design, in focus.</h1>
          <p className="atlas-intro-lede">
            Explore how selected studies were designed, compare their public records,
            and download a summary with sources.
          </p>
          <div className="hero-actions">
            <Link className="button hero-primary" href={`/studies?case=${featured.id}`}>Explore an example <span aria-hidden="true">↗</span></Link>
            <Link className="atlas-intro-link" href="/catalogue">Browse {catalogue.length} studies <span aria-hidden="true">→</span></Link>
          </div>
          <p className="atlas-intro-scope">{catalogue.length} saved study records · {researchCases.length} guided examples · {manifest.groups.length} collections</p>
          <p className="atlas-intro-qualifier">Dated copies from ClinicalTrials.gov, a public database of clinical study records. A selected set, not a complete list.</p>
        </div>
        <div className="atlas-evidence-preview">
          <FeaturedEvidence caseStudy={featured} />
        </div>
      </div>
      </section>

      <section id="research-cases" className="shell atlas-cases" aria-labelledby="case-title">
        <header className="atlas-section-heading">
          <p className="eyebrow">01 / Guided examples</p>
          <h2 id="case-title">Start with a question. See what the records show.</h2>
          <p>Compare the saved study records, then see what they can and cannot tell you.</p>
        </header>
        <div className="case-preview-grid">
          {researchCases.map((caseStudy, index) => (
            <CasePreview caseStudy={caseStudy} index={index} replays={caseStudy.id === "registry-change-brief" ? replays : []} key={caseStudy.id} />
          ))}
        </div>
      </section>

      <section id="research-collections" className="atlas-collection-band" aria-labelledby="collection-title">
        <div className="shell">
          <header>
            <p className="eyebrow">02 / Study collections</p>
            <h2 id="collection-title">Browse studies by question.</h2>
            <p>These collections group selected records by question. They are not a complete or representative list of studies, or a ranking of treatments.</p>
          </header>
          <div className="collection-strip">
            {manifest.groups.map((collection, index) => (
              <article key={collection.id}>
                <span>0{index + 1}</span>
                <h3>{presentCollection(collection).title}</h3>
                <p>{presentCollection(collection).question}</p>
                <details><summary>About this collection</summary><p><strong>Original collection name:</strong> {collection.title}</p><p>{collection.question}</p><p>{collection.description}</p><p>Compare: {collection.comparisonDimensions.join(" · ")}</p><p>{collection.limitations}</p></details>
                <small>{new Set(collection.studyIds).size} study records</small>
                <Link href={`/catalogue?collection=${collection.id}`}>Browse studies →</Link>
              </article>
            ))}
          </div>
          <p className="collection-disclaimer">
            {memberships} collection entries cover {uniqueIds.size} different study records. Some studies appear in more than one collection. Each collection explains its question and limits.
          </p>
        </div>
      </section>

      <section className="shell atlas-closing">
        <div>
          <p className="eyebrow">03 / Your study summary</p>
          <h2>Choose up to four studies. Keep the sources with your summary.</h2>
          <p>Download a PDF summary, a CSV table or the source data as JSON. Each uses the records you reviewed.</p>
        </div>
        <div className="atlas-closing-actions">
          <Link className="button" href={`/studies?case=${featured.id}`}>Open an example <span aria-hidden="true">→</span></Link>
          <Link href="/catalogue">Browse all studies <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </main>
  );
}
