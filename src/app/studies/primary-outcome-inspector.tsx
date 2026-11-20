import { outcomeFieldText, type SavedPrimaryOutcomes } from "../../lib/snapshots/primary-outcomes";

const absent = (status: string) => status === "not_captured" ? "Not captured" : "Not reported in this captured response";

export function PrimaryOutcomeInspector({ view }: { view: SavedPrimaryOutcomes }) {
  return <section className="outcome-inspector" aria-labelledby="outcome-heading">
    <div className="section-title">
      <h2 id="outcome-heading">Primary measures &amp; timing</h2>
      <span className="quiet">{view.studyCount} {view.studyCount === 1 ? "study" : "studies"} / {view.entryCount} registered primary-outcome {view.entryCount === 1 ? "entry" : "entries"}</span>
    </div>
    <p className="outcome-boundary">{view.label}</p>
    <p className="quiet">{view.limitation} Current checks and replays do not change this saved view.</p>
    {view.studies.map(study => <div className="outcome-study" key={study.nctId}>
      <div className="outcome-study-heading">
        <h3>{study.nctId}</h3>
        <p className="quiet">Saved {study.retrievedAt.slice(0, 10)} · registry updated {study.registryLastUpdate ?? "Not reported"}</p>
      </div>
      <dl className="outcome-context">
        <div><dt>Registered conditions</dt><dd>{study.context.conditions.join("; ") || absent(study.contextStatus.conditions)}</dd></div>
        <div><dt>Interventions</dt><dd>{study.context.interventions.map(item => `${item.name}${item.type ? ` (${item.type})` : ""}`).join("; ") || absent(study.contextStatus.interventions)}</dd></div>
        <div><dt>Phase</dt><dd>{study.context.phases.join("; ") || absent(study.contextStatus.phases)}</dd></div>
      </dl>
      {study.entries.length ? <table className="outcome-table" role="table">
        <caption className="sr-only">Saved primary measures and time frames for {study.nctId}, in capture order</caption>
        <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Registered primary measure</th><th scope="col" role="columnheader">Registered time frame</th></tr></thead>
        <tbody role="rowgroup">{study.entries.map(entry => <tr role="row" key={entry.index}>
          <td role="cell" data-label="Registered primary measure">
            <span className="outcome-entry-label">Entry {entry.index + 1}</span>
            <p>{outcomeFieldText(entry.measure)}</p>
            <details className="outcome-source">
              <summary>Inspect saved capture fields<span className="sr-only"> for {study.nctId}, entry {entry.index + 1}</span></summary>
              <p>{entry.evidenceClass} · retained values shown below</p>
              <pre>{JSON.stringify(entry.sourceValue, null, 2)}</pre>
              <dl>
                <div><dt>Saved capture</dt><dd>{study.retrievedAt}</dd></div>
                <div><dt>Parent source locator</dt><dd><code>{entry.parentLocator}</code></dd></div>
                <div><dt>Derived measure pointer</dt><dd><code>{entry.measureLocator ?? outcomeFieldText(entry.measure)}</code></dd></div>
                <div><dt>Derived time-frame pointer</dt><dd><code>{entry.timeFrameLocator ?? outcomeFieldText(entry.timeFrame)}</code></dd></div>
                <div><dt>Original response SHA-256</dt><dd><code>{study.rawSha256}</code></dd></div>
                <div><dt>Saved projection SHA-256</dt><dd><code>{study.projectedSha256}</code></dd></div>
              </dl>
              <p className="quiet">Child pointers are derived and verified within this capture. Entry numbers are positions in this saved array, not identities across registry versions.</p>
            </details>
          </td>
          <td role="cell" data-label="Registered time frame"><p>{outcomeFieldText(entry.timeFrame)}</p></td>
        </tr>)}</tbody>
      </table> : <p>{absent(study.status)}</p>}
      <p className="outcome-official-link"><a href={study.sourceUrl} target="_blank" rel="noreferrer">Open current official record ↗</a><span className="quiet"> May contain newer information.</span></p>
    </div>)}
  </section>;
}
