import Link from "next/link";
import type { ReactNode } from "react";

import {
  resolutionStateLabel,
  reviewStatusLabel,
  type ProgrammeSourceSnapshot,
  type ProgrammeView,
} from "../../lib/domain/programs";

export function ProgrammeFact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function formatUtcDateTime(value: string): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

export function StatusKey() {
  return (
    <aside className="status-key" aria-labelledby="status-key-heading">
      <h2 id="status-key-heading">Mapping status key</h2>
      <ul>
        <li><strong>Pending review</strong> — a proposed human mapping with no review decision.</li>
        <li><strong>Approved</strong> — a reviewed mapping eligible for deterministic resolution.</li>
        <li><strong>Conflicting</strong> — multiple approved candidates; no winner is selected.</li>
        <li><strong>Unknown</strong> — no approved mapping is available.</li>
      </ul>
    </aside>
  );
}

export function ProgrammeCard({ view }: { view: ProgrammeView }) {
  const conditions = Array.from(
    new Set(
      view.sourceSnapshots.flatMap(
        (snapshot) => snapshot.observedRegistryFacts.reportedConditions,
      ),
    ),
  );

  return (
    <li className="programme-card">
      <div className="programme-card-heading">
        <div>
          <p className="nct-id">Mapping candidate</p>
          <h2>
            <Link href={`/programs/${view.programme.slug}`}>
              {view.programme.canonicalLabel}
            </Link>
          </h2>
        </div>
        <div className="status-group" aria-label="Mapping states">
          <span className="status-label status-pending">
            {reviewStatusLabel(view.mapping.reviewStatus)}
          </span>
          <span className="status-label status-unknown">
            {resolutionStateLabel(view.mapping.resolutionState)}
          </span>
        </div>
      </div>
      <dl className="card-facts">
        <div>
          <dt>Reported sponsor organisation</dt>
          <dd>{view.sponsorOrganisation.canonicalLabel}</dd>
        </div>
        <div>
          <dt>Candidate compound</dt>
          <dd>{view.compound.canonicalLabel}</dd>
        </div>
        <div>
          <dt>Source-reported conditions</dt>
          <dd>{conditions.join(", ")}</dd>
        </div>
        <div>
          <dt>Registered trial</dt>
          <dd>{view.mapping.nctIds.join(", ")}</dd>
        </div>
      </dl>
      <div className="card-footer">
        <span>Version-controlled snapshot · Human inference</span>
        <Link href={`/programs/${view.programme.slug}`}>Inspect mapping evidence</Link>
      </div>
    </li>
  );
}

export function SnapshotProvenance({
  snapshot,
}: {
  snapshot: ProgrammeSourceSnapshot;
}) {
  return (
    <article className="snapshot-card" aria-labelledby={`snapshot-${snapshot.externalId}`}>
      <div>
        <p className="nct-id">{snapshot.externalId}</p>
        <h3 id={`snapshot-${snapshot.externalId}`}>
          {snapshot.observedRegistryFacts.briefTitle}
        </h3>
      </div>
      <dl className="facts-grid">
        <ProgrammeFact label="Source policy">
          {snapshot.sourceId} · version {snapshot.policyVersion}
        </ProgrammeFact>
        <ProgrammeFact label="Evidence class">Structured extraction</ProgrammeFact>
        <ProgrammeFact label="Retrieved from API">
          <time dateTime={snapshot.retrievedAt}>
            {formatUtcDateTime(snapshot.retrievedAt)}
          </time>
        </ProgrammeFact>
        <ProgrammeFact label="Processed locally">
          <time dateTime={snapshot.processedAt}>
            {formatUtcDateTime(snapshot.processedAt)}
          </time>
        </ProgrammeFact>
        <ProgrammeFact label="Registry-reported update">
          <time dateTime={snapshot.registryLastUpdatePostedDate}>
            {snapshot.registryLastUpdatePostedDate}
          </time>
        </ProgrammeFact>
        <ProgrammeFact label="Attribution">{snapshot.attribution}</ProgrammeFact>
      </dl>
      <div className="source-link-row">
        <a href={snapshot.humanStudyUrl}>
          Open {snapshot.externalId} on ClinicalTrials.gov
        </a>
        <a href={snapshot.apiRequestUrl}>Open exact official API request</a>
      </div>
      <div className="hash-row">
        <span>Exact retained response SHA-256</span>
        <code>{snapshot.responseSha256}</code>
      </div>
      <details>
        <summary>View exact source locators</summary>
        <dl className="locator-list">
          {Object.entries(snapshot.fieldLocators).map(([field, locator]) => (
            <div key={field}>
              <dt>{humanizeLabel(field)}</dt>
              <dd><code>{locator}</code></dd>
            </div>
          ))}
        </dl>
      </details>
    </article>
  );
}

function humanizeLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}
