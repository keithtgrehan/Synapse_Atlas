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
          <p className="eyebrow">Registered study evidence</p>
          <h1 id="home-title">Trial design, in focus.</h1>
          <p className="atlas-intro-lede">
            Explore registered measures, timing and record changes in source-linked
            research briefs.
          </p>
          <div className="hero-actions">
            <Link className="button hero-primary" href={`/studies?case=${featured.id}`}>Explore the MDD case <span aria-hidden="true">↗</span></Link>
            <Link className="atlas-intro-link" href="/catalogue">Browse {catalogue.length} studies <span aria-hidden="true">→</span></Link>
          </div>
          <p className="atlas-intro-scope">{catalogue.length} retained NCT records · {researchCases.length} guided cases · {manifest.groups.length} collections</p>
          <p className="atlas-intro-qualifier">A selected research inventory. Every brief keeps its sources and limits in view.</p>
        </div>
        <div className="atlas-evidence-preview">
          <FeaturedEvidence caseStudy={featured} />
        </div>
      </div>
      </section>

      <section id="research-cases" className="shell atlas-cases" aria-labelledby="case-title">
        <header className="atlas-section-heading">
          <p className="eyebrow">01 / Guided research cases</p>
          <h2 id="case-title">Start with a question. Follow the evidence.</h2>
          <p>Inspect the registered fields, see the differences, and keep the limits in view.</p>
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
            <p className="eyebrow">02 / Research collections</p>
            <h2 id="collection-title">Choose a research lens.</h2>
            <p>The catalogue is a selected convenience inventory, not a complete landscape or a treatment ranking.</p>
          </header>
          <div className="collection-strip">
            {manifest.groups.map((collection, index) => (
              <article key={collection.id}>
                <span>0{index + 1}</span>
                <h3>{collection.title}</h3>
                <p>{collection.question}</p>
                <details><summary>Scope &amp; limits</summary><p>{collection.description}</p><p>Compare: {collection.comparisonDimensions.join(" · ")}</p><p>{collection.limitations}</p></details>
                <small>{new Set(collection.studyIds).size} unique records</small>
                <Link href={`/catalogue?collection=${collection.id}`}>Open collection →</Link>
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
          <p className="eyebrow">03 / Your research brief</p>
          <h2>Choose up to four saved studies, then compare the captured evidence.</h2>
          <p>Download the same captured evidence as a PDF brief, CSV or source bundle.</p>
        </div>
        <div className="atlas-closing-actions">
          <Link className="button" href={`/studies?case=${featured.id}`}>Open a guided brief <span aria-hidden="true">→</span></Link>
          <Link href="/catalogue">Browse the catalogue <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </main>
  );
}
