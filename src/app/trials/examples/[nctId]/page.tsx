import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadStudyExamples, studyExampleCatalog } from "../../../../lib/studies/examples";
import { TrialFacts } from "../../trial-facts";
import { Fact, ProvenancePanel, formatUtcDateTime, humanizeCode } from "../../trial-ui";

export const metadata: Metadata = { title: "Retained study example · Synapse Atlas" };
export const dynamicParams = false;
export function generateStaticParams() {
  return studyExampleCatalog.studies.map(({ nctId }) => ({ nctId }));
}

export default async function StudyExamplePage({ params }: { params: Promise<{ nctId: string }> }) {
  const { nctId } = await params;
  if (!studyExampleCatalog.studies.some((entry) => entry.nctId === nctId)) notFound();
  const study = (await loadStudyExamples()).find((entry) => entry.nctId === nctId);
  if (!study) notFound();
  const { trial, publication, supplement } = study;
  const arms = supplement.protocolSection.armsInterventionsModule.armGroups;
  const resultsPosted = supplement.protocolSection.statusModule.resultsFirstPostDateStruct;

  return (
    <main className="shell">
      <header className="page-header detail-header">
        <Link className="back-link" href="/trials/examples">← All 10 study examples</Link>
        <div className="detail-kicker"><p className="nct-id">{nctId}</p><span className="status-label">Retained snapshot</span></div>
        <h1>{study.label}</h1>
        <p className="lede">{trial.briefTitle}</p>
        <p>Registry facts retrieved <time dateTime={trial.provenance.retrievedAt}>{formatUtcDateTime(trial.provenance.retrievedAt)}</time>.
          {" "}This page does not refresh automatically. Source records may have changed.</p>
        <div className="source-link-row">
          <a href={trial.provenance.sourceUrl}>Open official registry record</a>
          <a href={study.publicationUrl}>Open original publication record</a>
          <Link href={`/trials/${nctId}`}>Retrieve live registry data</Link>
        </div>
      </header>

      <section className="detail-section" aria-labelledby="overview-heading">
        <h2 id="overview-heading">Study overview</h2>
        <p className="boundary-note">Concise source-based summaries; see the registered arm descriptions below.</p>
        <dl className="stacked-facts">
          <Fact label="Indication">{study.indication}</Fact>
          <Fact label="Intervention">{study.intervention}</Fact>
          <Fact label="Comparator">{study.comparator}</Fact>
          <Fact label="Results availability">{supplement.hasResults === true ? "Results posted on ClinicalTrials.gov" : "Unknown"}
            {resultsPosted ? ` · First posted ${resultsPosted.date} · ${resultsPosted.type ? humanizeCode(resultsPosted.type) : "Type not reported"}` : " · Posting date unknown"}
          </Fact>
          <Fact label="Effect sizes">Unknown / not evaluated in this example.</Fact>
          <Fact label="Programme mapping"><Link href={`/programs/study-${nctId.toLowerCase()}`}>Inspect the model-proposed association and inclusion decision</Link></Fact>
        </dl>
        <p className="boundary-note">Different studies do not establish comparative efficacy. No treatment recommendation is implied.</p>
      </section>

      <TrialFacts trial={trial} retained />

      <section className="detail-section" aria-labelledby="arms-heading">
        <h2 id="arms-heading">Registered arms and comparator</h2>
        {arms ? <ul className="snapshot-list plain-list">{arms.map((arm, index) => (
          <li key={`${arm.label}-${index}`}>
            <h3>{arm.label}</h3>
            <p>{arm.type ? humanizeCode(arm.type) : "Arm type not reported"}</p>
            <p>{arm.description ?? "Description not reported"}</p>
            <p>{arm.interventionNames?.join("; ") ?? "Linked interventions not reported"}</p>
          </li>
        ))}</ul> : <p>Arm descriptions not reported.</p>}
        <p>Source: <a href={trial.provenance.sourceUrl}>ClinicalTrials.gov</a>, capture retrieved {formatUtcDateTime(study.registry.retrievedAt)}.</p>
      </section>

      <section className="detail-section" aria-labelledby="publication-heading">
        <h2 id="publication-heading">Publication and source differences</h2>
        <p><a href={study.publicationUrl}>{publication.title}</a></p>
        <p>{publication.authorString} {publication.journalTitle}, {publication.pubYear}.</p>
        <p>PMID {study.pmid} · {publication.doi ? <a href={`https://doi.org/${publication.doi}`}>DOI: {publication.doi}</a> : "DOI unknown"}</p>
        <p className="boundary-note">Bibliographic metadata only; full text is not hosted here.</p>
        <h3>Source review notes</h3>
        <p>{study.caution}</p>
        <p>Sources: <a href={trial.provenance.sourceUrl}>Registry record</a> and <a href={study.publicationUrl}>original publication</a>.
          {" "}{study.linkedInRegistry ? "Publication linked in the retained registry references." : <a href={study.publicationLinkEvidence}>Trial identifier confirmed in the original paper’s study design section.</a>}</p>
        <p className="boundary-note">Original synthesis · Model inference · Human scientific review pending · Checked {study.researchCheckedDate}.
          Registry extraction and publication reports retain their separate denominators and dates.</p>
      </section>

      <ProvenancePanel trial={trial} />
      <section className="provenance" aria-labelledby="supplemental-heading">
        <h2 id="supplemental-heading">Additional source provenance</h2>
        <p>Arms and results availability: <a href={study.registry.requestUrl}>official registry API query</a>.
          {" "}Retrieved {formatUtcDateTime(study.registry.retrievedAt)}; processed {formatUtcDateTime(study.registry.processedAt)}.
          {" "}Attribution: ClinicalTrials.gov, U.S. National Library of Medicine.</p>
        <div className="hash-row"><span>Registry response SHA-256</span><code>{study.registry.contentSha256}</code></div>
        <p>Field locations: <code>/studies/0/protocolSection/armsInterventionsModule/armGroups</code>, <code>/studies/0/hasResults</code> and <code>/studies/0/protocolSection/statusModule/resultsFirstPostDateStruct</code>.</p>
        <p>Publication metadata: <a href={studyExampleCatalog.publicationSource.requestUrl}>Europe PMC metadata query</a>, retrieved {formatUtcDateTime(studyExampleCatalog.publicationSource.retrievedAt)};
          {" "}processed {formatUtcDateTime(studyExampleCatalog.publicationSource.processedAt)}. Located by PMID {study.pmid} in <code>/resultList/result</code>. Attribution: Europe PMC.</p>
        <div className="hash-row"><span>Metadata SHA-256</span><code>{studyExampleCatalog.publicationSource.contentSha256}</code></div>
      </section>
    </main>
  );
}
