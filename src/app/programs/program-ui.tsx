import Link from "next/link";
import type { ReactNode } from "react";

import {
  resolutionStateLabel,
  reviewStatusLabel,
  type ProgrammeMappingAssertion,
  type ProgrammeSourceSnapshot,
  type ProgrammeView,
} from "../../lib/domain/programs";

type MappingReviewStatus = ProgrammeMappingAssertion["reviewStatus"];
type MappingResolutionState = ProgrammeMappingAssertion["resolutionState"];

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
        <li><strong>Approved</strong> — the review decision accepted the bounded mapping.</li>
        <li><strong>Rejected</strong> — the review decision did not accept the mapping.</li>
        <li><strong>Needs revision</strong> — the mapping must be amended before another decision.</li>
        <li><strong>Resolved</strong> — an approved mapping can resolve deterministically in its programme namespace.</li>
        <li><strong>Conflicting</strong> — multiple approved candidates; no winner is selected.</li>
        <li><strong>Unknown</strong> — the mapping is unresolved because no approved candidate is available.</li>
      </ul>
    </aside>
  );
}

export function reviewStatusClassName(status: MappingReviewStatus): string {
  switch (status) {
    case "PENDING":
      return "status-pending";
    case "APPROVED":
      return "status-approved";
    case "REJECTED":
      return "status-rejected";
    case "NEEDS_REVISION":
      return "status-needs-revision";
  }
}

export function resolutionStateClassName(
  state: MappingResolutionState,
): string {
  switch (state) {
    case "RESOLVED":
      return "status-resolved";
    case "CONFLICTING":
      return "status-conflicting";
    case "UNRESOLVED":
      return "status-unresolved";
  }
}

export function mappingStateSummary(
  reviewStatus: MappingReviewStatus,
  resolutionState: MappingResolutionState,
): string {
  const reviewSummary = {
    PENDING: "It awaits a human review decision.",
    APPROVED: "It has an explicit human approval.",
    REJECTED: "It was rejected during human review.",
    NEEDS_REVISION: "It requires revision following human review.",
  }[reviewStatus];
  const resolutionSummary = {
    RESOLVED: "Its namespace-scoped programme mapping is resolved within this dataset.",
    CONFLICTING: "Approved candidates conflict, so the resolver selects no winner.",
    UNRESOLVED: "It remains unresolved, and the resolver selects no winner.",
  }[resolutionState];

  return `This version-controlled human-inferred mapping candidate is backed by checked-in ClinicalTrials.gov observations. ${reviewSummary} ${resolutionSummary} It is not live programme data.`;
}

export function noRecordedConflictDescription(
  resolutionState: MappingResolutionState,
): string {
  switch (resolutionState) {
    case "RESOLVED":
      return "No explicit conflict is recorded in this bounded dataset. Resolution applies only to the approved namespace-scoped grouping.";
    case "CONFLICTING":
      return "No row-level conflict note is recorded. Resolver candidate conflicts remain visible, and no winner is selected.";
    case "UNRESOLVED":
      return "No explicit conflict is recorded in this bounded dataset. The mapping remains unresolved.";
  }
}

export function MappingStateBadges({
  reviewStatus,
  resolutionState,
  className,
}: {
  reviewStatus: MappingReviewStatus;
  resolutionState: MappingResolutionState;
  className?: string;
}) {
  const groupClassName = ["status-group", className].filter(Boolean).join(" ");

  return (
    <div className={groupClassName} aria-label="Mapping states">
      <ReviewStatusBadge status={reviewStatus} />
      <ResolutionStateBadge state={resolutionState} />
    </div>
  );
}

export function ReviewStatusBadge({ status }: { status: MappingReviewStatus }) {
  return (
    <span
      className={`status-label ${reviewStatusClassName(status)}`}
      data-mapping-state={`review-${status.toLowerCase()}`}
    >
      {reviewStatusLabel(status)}
    </span>
  );
}

export function ResolutionStateBadge({
  state,
}: {
  state: MappingResolutionState;
}) {
  return (
    <span
      className={`status-label ${resolutionStateClassName(state)}`}
      data-mapping-state={`resolution-${state.toLowerCase()}`}
    >
      {resolutionStateLabel(state)}
    </span>
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
          <p className="nct-id">
            {reviewStatusLabel(view.mapping.reviewStatus)} mapping
          </p>
          <h2>
            <Link href={`/programs/${view.programme.slug}`}>
              {view.programme.canonicalLabel}
            </Link>
          </h2>
        </div>
        <MappingStateBadges
          reviewStatus={view.mapping.reviewStatus}
          resolutionState={view.mapping.resolutionState}
        />
      </div>
      <dl className="card-facts">
        <div>
          <dt>Reported sponsor organisation</dt>
          <dd>{view.sponsorOrganisation.canonicalLabel}</dd>
        </div>
        <div>
          <dt>Candidate compound association</dt>
          <dd>{view.compound.canonicalLabel} · registry-reported intervention</dd>
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
