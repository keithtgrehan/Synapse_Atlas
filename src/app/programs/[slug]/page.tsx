import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getProgrammeBySlug,
  programmeSlugSchema,
  resolutionStateLabel,
  reviewStatusLabel,
} from "../../../lib/domain/programs";
import { programmeMappingDataset } from "../../../lib/programs/dataset";
import {
  formatUtcDateTime,
  mappingEvidenceLabel,
  MappingStateBadges,
  mappingStateSummary,
  noRecordedConflictDescription,
  ProgrammeFact,
  SnapshotProvenance,
} from "../program-ui";

import { loadStudyExamples } from "../../../lib/studies/examples";
import { TrialFacts } from "../../trials/trial-facts";

export const metadata: Metadata = {
  title: "Programme mapping candidate · Synapse Atlas",
};

type ProgrammeDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProgrammeDetailPage({
  params,
}: ProgrammeDetailPageProps) {
  const { slug } = await params;

  if (!programmeSlugSchema.safeParse(slug).success) {
    notFound();
  }

  const view = getProgrammeBySlug(programmeMappingDataset, slug);

  if (view === null) {
    notFound();
  }

  const { programme, mapping, sponsorOrganisation, compound, sourceSnapshots } = view;
  const conditions = Array.from(
    new Set(
      sourceSnapshots.flatMap(
        (snapshot) => snapshot.observedRegistryFacts.reportedConditions,
      ),
    ),
  );
  const interventions = sourceSnapshots.flatMap((snapshot) => snapshot.observedRegistryFacts.reportedInterventions);
  const study = mapping.evidenceClass === "MODEL_INFERENCE" ? (await loadStudyExamples()).find((entry) => mapping.nctIds.includes(entry.nctId)) : undefined;

  return (
    <main className="shell">
      <header className="page-header detail-header">
        <Link className="back-link" href="/programs">← Back to Programmes</Link>
        <p className="eyebrow">Version-controlled registry snapshot</p>
        <h1>{programme.canonicalLabel}</h1>
        <p className="lede">
          {mappingStateSummary(mapping.reviewStatus, mapping.resolutionState, mapping.evidenceClass)}
        </p>
        <MappingStateBadges
          evidenceClass={mapping.evidenceClass}
          reviewStatus={mapping.reviewStatus}
          resolutionState={mapping.resolutionState}
          className="detail-status"
        />
      </header>

      <section className="detail-section" aria-labelledby="mapping-facts-heading">
        <p className="eyebrow">Candidate relationships</p>
        <h2 id="mapping-facts-heading">Mapping state</h2>
        <dl className="facts-grid">
          <ProgrammeFact label="Review state">
            {reviewStatusLabel(mapping.reviewStatus)}
          </ProgrammeFact>
          <ProgrammeFact label="Resolution state">
            {resolutionStateLabel(mapping.resolutionState)}
          </ProgrammeFact>
          <ProgrammeFact label="Relationship evidence">{mappingEvidenceLabel(mapping.evidenceClass)}</ProgrammeFact>
          <ProgrammeFact label="Reported sponsor organisation">
            {sponsorOrganisation.canonicalLabel}
          </ProgrammeFact>
          <ProgrammeFact label="Company identity">
            Unknown — {programme.companyIdentity.rationale}
          </ProgrammeFact>
          <ProgrammeFact label="Candidate compound association">
            {compound.canonicalLabel} · {reviewStatusLabel(mapping.reviewStatus)} · {resolutionStateLabel(mapping.resolutionState)}
          </ProgrammeFact>
          <ProgrammeFact label="Registry observations">Structured extraction</ProgrammeFact>
          <ProgrammeFact label="Dataset version">
            {programmeMappingDataset.datasetVersion}
          </ProgrammeFact>
          <ProgrammeFact label="Dataset processed">
            <time dateTime={programmeMappingDataset.updatedAt}>
              {formatUtcDateTime(programmeMappingDataset.updatedAt)}
            </time>
          </ProgrammeFact>
        </dl>
      </section>

      <section className="detail-section" aria-labelledby="registered-evidence-heading">
        <p className="eyebrow">Source-reported study facts</p>
        <h2 id="registered-evidence-heading">Conditions and registered trials</h2>
        <dl className="stacked-facts">
          <ProgrammeFact label="Source-reported conditions">
            {conditions.join(", ")}
          </ProgrammeFact>
          <ProgrammeFact label="Source-reported interventions">
            <ul className="plain-list">
              {interventions.map((intervention, index) => (
                <li key={`${index}-${intervention}`}>{intervention}</li>
              ))}
            </ul>
          </ProgrammeFact>
          <ProgrammeFact label="Linked registered trials">
            <ul className="plain-list">
              {sourceSnapshots.map((snapshot) => (
                <li key={snapshot.externalId}>
                  <Link href={`/trials/${snapshot.externalId}`}>
                    {snapshot.externalId} · open the live registered-trial view
                  </Link>
                  <span> — {snapshot.observedRegistryFacts.briefTitle}</span>
                </li>
              ))}
            </ul>
          </ProgrammeFact>
        </dl>
      </section>

      <p className="source-link-row"><Link href={`/compare?programme=${programme.slug}`}>Compare this programme with another</Link></p>
      {study && <>
        <section className="detail-section" aria-labelledby="selected-study-heading">
          <h2 id="selected-study-heading">Selected study · retained 13 October 2026</h2>
          <dl className="stacked-facts">
            <ProgrammeFact label="Indication">{study.indication}</ProgrammeFact>
            <ProgrammeFact label="Intervention">{study.intervention}</ProgrammeFact>
            <ProgrammeFact label="Comparator">{study.comparator}</ProgrammeFact>
          </dl>
          <p><Link href={`/trials/examples/${study.nctId}`}>Inspect retained study, dose arms and source discrepancies</Link></p>
          <p><a href={study.publicationUrl}>{study.publication.title}</a> · {study.publication.pubYear}</p>
          <p>{study.caution}</p>
        </section>
        <TrialFacts trial={study.trial} retained />
      </>}

      <section className="detail-section" aria-labelledby="review-packet-heading">
        <p className="eyebrow">{mapping.evidenceClass === "MODEL_INFERENCE" ? "Site inclusion decision · unattributed packet" : "Human review record"}</p>
        <h2 id="review-packet-heading">Decision, aliases, and uncertainty</h2>
        <dl className="stacked-facts">
          <ProgrammeFact label="Mapping rationale">{mapping.rationale}</ProgrammeFact>
          <ProgrammeFact label={mapping.evidenceClass === "MODEL_INFERENCE" ? "Inclusion rationale" : "Human review rationale"}>
            {mapping.reviewRationale ?? "No human review rationale is recorded."}
          </ProgrammeFact>
          <ProgrammeFact label="Reviewer reference">
            {mapping.reviewerReference ?? "No reviewer reference is recorded."}
          </ProgrammeFact>
          <ProgrammeFact label={mapping.evidenceClass === "MODEL_INFERENCE" ? "Inclusion decision recorded" : "Reviewed at"}>
            {mapping.reviewedAt === undefined ? (
              "No review timestamp is recorded."
            ) : (
              <time dateTime={mapping.reviewedAt}>
                {formatUtcDateTime(mapping.reviewedAt)}
              </time>
            )}
          </ProgrammeFact>
          {mapping.reviewPacketSha256 && <ProgrammeFact label="Unattributed packet SHA-256"><code>{mapping.reviewPacketSha256}</code></ProgrammeFact>}
          <ProgrammeFact label="Namespace-scoped programme aliases">
            <p>
              These aliases apply only to this internal programme grouping;
              they do not assert chemical synonyms or cross-entity equivalence.
            </p>
            <ul className="plain-list">
              {mapping.aliases.map((alias) => <li key={alias}>{alias}</li>)}
            </ul>
          </ProgrammeFact>
          <ProgrammeFact label="Explicit unknowns">
            <ul className="plain-list unknown-list">
              {programme.explicitUnknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}
            </ul>
          </ProgrammeFact>
          <ProgrammeFact label="Conflicts">
            {programme.conflicts.length === 0 ? (
              noRecordedConflictDescription(mapping.resolutionState)
            ) : (
              <ul className="plain-list">
                {programme.conflicts.map((conflict) => <li key={conflict}>{conflict}</li>)}
              </ul>
            )}
          </ProgrammeFact>
        </dl>
      </section>

      <section className="provenance" aria-labelledby="programme-provenance-heading">
        <div>
          <p className="eyebrow">Evidence</p>
          <h2 id="programme-provenance-heading">Official snapshots and source locators</h2>
          <p>
            The mapping assertion cites exact registry fields. Retrieval time,
            local processing time, and the registry-reported update date remain separate.
          </p>
        </div>
        <div className="snapshot-list">
          {sourceSnapshots.map((snapshot) => (
            <SnapshotProvenance key={snapshot.id} snapshot={snapshot} />
          ))}
        </div>
      </section>
    </main>
  );
}
