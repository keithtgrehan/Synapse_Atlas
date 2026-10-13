import Link from "next/link";
import { briefLimitations, briefQuery, researchBriefFields, type ResearchBrief } from "../../lib/domain/research-brief";
import { getTrialFreshness, type TrialRecord } from "../../lib/domain/trials";
import { formatUtcDateTime } from "../programs/program-ui";
import { PrintButton } from "./print-button";

export function ResearchBriefView({ brief, asOf = new Date() }: { brief: ResearchBrief; asOf?: Date }) {
  const columns = brief.programmes.flatMap((p) => p.trials.map((trial) => ({ programme: p, trial })));
  const query = briefQuery(brief);
  const stale = columns.some(({ trial }) => getTrialFreshness(trial.provenance.retrievedAt, asOf).state !== "fresh");
  return <section className="research-brief" aria-labelledby="brief-heading">
    <div className="brief-overview">
      <p className="eyebrow">Depression research · selected studies</p>
      <h2 id="brief-heading">Selected trial comparison</h2>
      <p>One selected study per programme. Open a registry source to check the evidence, or export this comparison.</p>
      <p className="snapshot-notice"><strong>Saved snapshot {brief.version}.</strong> {stale ? "The saved records are more than 48 hours old or their age cannot be verified. Check the live registry before relying on current status." : "These are saved records, not a live feed."} A recent retrieval does not mean the registry was recently updated.</p>
      <div className="button-row brief-actions" aria-label="Export comparison">
        <a className="button" href={`/compare/export.csv?${query}`} download>Download CSV</a>
        <PrintButton />
        <a className="button button-secondary" href={`/compare/sources.json?${query}`} download>Download source manifest</a>
      </div>
      <p className="boundary-note">PDF uses your browser’s print dialog. The source manifest includes exact field references and original mapping evidence. <Link href="/methodology">How to read this comparison</Link></p>
      <details className="brief-limitations"><summary>Selected studies, not an efficacy comparison · coverage and limitations</summary><p>{briefLimitations} Programme mechanisms, ownership and commercial rights remain unestablished here.</p></details>
    </div>

    <div className="comparison-table-wrap brief-table-wrap" tabIndex={0} role="region" aria-label="Selected study comparison; scroll horizontally if needed">
      <table className="comparison-table brief-table">
        <caption>Registered study facts · {columns.length} selected trials · snapshot {brief.version}</caption>
        <thead><tr><th scope="col">Study detail</th>{columns.map(({ programme, trial }) => <th scope="col" key={`${programme.slug}-${trial.nctId}`}>
          <Link href={`/programs/${programme.slug}`}>{programme.label}</Link>
          <p className="brief-nct">{trial.nctId}</p>
          <a href={trial.provenance.sourceUrl}>View registry source<span className="sr-only"> for {trial.nctId}</span></a>
        </th>)}</tr></thead>
        <tbody>
          <tr><th scope="row">Study title</th>{columns.map(({ programme, trial }) => <td key={`${programme.slug}-${trial.nctId}`}>{trial.briefTitle}</td>)}</tr>
          {researchBriefFields.map((field) => <tr key={field.key}><th scope="row">{field.label}</th>{columns.map(({ programme, trial }) => <td key={`${programme.slug}-${trial.nctId}`} data-evidence-class="STRUCTURED_EXTRACTION">{field.value(trial)}</td>)}</tr>)}
          <tr><th scope="row">Snapshot retrieved (UTC)</th>{columns.map(({ programme, trial }) => <td key={`${programme.slug}-${trial.nctId}`}><time dateTime={trial.provenance.retrievedAt}>{formatUtcDateTime(trial.provenance.retrievedAt)}</time></td>)}</tr>
        </tbody>
      </table>
    </div>

    <div className="brief-cards" aria-label="Selected study briefs">
      {columns.map(({ programme, trial }) => <article className="brief-card" key={`${programme.slug}-${trial.nctId}`}>
        <p className="eyebrow">Synapse Atlas · snapshot {brief.version}</p>
        <h3>{programme.label}</h3>
        <p><strong>{trial.nctId}</strong> · {trial.briefTitle}</p>
        <dl className="brief-card-facts">{researchBriefFields.map((field) => <div key={field.key}><dt>{field.label}</dt><dd data-evidence-class="STRUCTURED_EXTRACTION">{field.value(trial)}</dd></div>)}</dl>
        <p className="brief-card-source"><a href={trial.provenance.sourceUrl}>View registry source for {trial.nctId}</a><br /><span className="print-source-url">{trial.provenance.sourceUrl}</span></p>
        <p className="brief-card-meta">Saved snapshot; not a live feed. {stale ? "Snapshot older than 48 hours or age unverified; check the registry for updates. " : ""}Retrieved {formatUtcDateTime(trial.provenance.retrievedAt)}. Processed {formatUtcDateTime(trial.provenance.processedAt)}.<br />Source: {trial.provenance.attribution}. Registry fields: structured extraction. Programme association: reviewed human inference, dataset {brief.mappingVersion}.</p>
        <p className="brief-card-meta">Exact response SHA-256: <code>{trial.provenance.contentSha256}</code></p>
        <p className="brief-card-meta">{briefLimitations}</p>
      </article>)}
    </div>

    <details className="brief-source-details">
      <summary>Inspect snapshot evidence and field references</summary>
      <p>Each registry field above is a structured extraction. An absent field stays “Not reported”; it is not inferred. These snapshots are separate from the older evidence used to review programme associations.</p>
      {columns.map(({ programme, trial }) => <SnapshotEvidence key={`${programme.slug}-${trial.nctId}`} trial={trial} />)}
    </details>
  </section>;
}

function SnapshotEvidence({ trial }: { trial: TrialRecord }) {
  return <section className="snapshot-card">
    <h3>{trial.nctId}</h3>
    <p>{trial.provenance.attribution}. <a href={trial.provenance.apiRequestUrl}>Open official API request for {trial.nctId}</a> (may return newer data).</p>
    <p>Retrieved {formatUtcDateTime(trial.provenance.retrievedAt)}; processed {formatUtcDateTime(trial.provenance.processedAt)}. Source policy {trial.provenance.sourcePolicyId}/{trial.provenance.policyVersion}.</p>
    <p>Exact response SHA-256: <code>{trial.provenance.contentSha256}</code></p>
    <dl className="locator-list">{Object.entries(trial.provenance.fieldLocators).map(([field, locator]) => <div key={field}><dt>{field}</dt><dd><code>{locator}</code></dd></div>)}</dl>
  </section>;
}
