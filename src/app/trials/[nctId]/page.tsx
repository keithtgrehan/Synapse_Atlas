import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { nctIdSchema } from "../../../lib/domain/trials";
import { getClinicalTrial } from "../../../lib/sources/clinicaltrials/client";
import {
  Fact,
  Freshness,
  ProvenancePanel,
  availabilityText,
  formatPartialDate,
  humanizeCode,
} from "../trial-ui";

export const metadata: Metadata = {
  title: "Trial detail · Synapse Atlas",
};

export const dynamic = "force-dynamic";

type TrialDetailPageProps = {
  params: Promise<{ nctId: string }>;
};

export default async function TrialDetailPage({ params }: TrialDetailPageProps) {
  const { nctId } = await params;

  if (!nctIdSchema.safeParse(nctId).success) {
    notFound();
  }

  const trial = await getClinicalTrial(nctId);

  if (trial === null) {
    notFound();
  }

  const asOf = new Date();

  return (
    <main className="shell">
      <header className="page-header detail-header">
        <Link className="back-link" href="/trials">← Back to trial search</Link>
        <div className="detail-kicker">
          <p className="nct-id">{trial.nctId}</p>
          <Freshness retrievedAt={trial.provenance.retrievedAt} asOf={asOf} />
        </div>
        <h1>{trial.briefTitle}</h1>
        <p className="lede">
          {availabilityText(trial.officialTitle)}
        </p>
      </header>

      <section className="detail-section" aria-labelledby="registered-facts-heading">
        <p className="eyebrow">Structured registry fields</p>
        <h2 id="registered-facts-heading">Registered study facts</h2>
        <dl className="facts-grid">
          <Fact label="Overall status">
            {availabilityText(trial.overallStatus, humanizeCode)}
          </Fact>
          <Fact label="Study type">
            {availabilityText(trial.studyType, humanizeCode)}
          </Fact>
          <Fact label="Phase">
            {availabilityText(trial.phases, (phases) =>
              phases.map(humanizeCode).join(", "),
            )}
          </Fact>
          <Fact label="Lead sponsor">
            {availabilityText(trial.leadSponsor, (sponsor) =>
              sponsor.class === null
                ? sponsor.name
                : `${sponsor.name} · ${humanizeCode(sponsor.class)}`,
            )}
          </Fact>
          <Fact label="Enrollment">
            {availabilityText(trial.enrollment, (enrollment) =>
              enrollment.type === null
                ? enrollment.count.toLocaleString("en-GB")
                : `${enrollment.count.toLocaleString("en-GB")} · ${humanizeCode(enrollment.type)}`,
            )}
          </Fact>
          <Fact label="Start date">
            {availabilityText(trial.startDate, formatPartialDate)}
          </Fact>
          <Fact label="Primary completion">
            {availabilityText(trial.primaryCompletionDate, formatPartialDate)}
          </Fact>
          <Fact label="Completion">
            {availabilityText(trial.completionDate, formatPartialDate)}
          </Fact>
          <Fact label="Registry last update">
            {availabilityText(
              trial.registryLastUpdatePostedDate,
              formatPartialDate,
            )}
          </Fact>
        </dl>
      </section>

      <section className="detail-section" aria-labelledby="study-content-heading">
        <p className="eyebrow">Study content</p>
        <h2 id="study-content-heading">Conditions, interventions, and outcomes</h2>
        <dl className="stacked-facts">
          <Fact label="Conditions">
            {availabilityText(trial.conditions, (conditions) => conditions.join(", "))}
          </Fact>
          <Fact label="Interventions">
            {availabilityText(trial.interventions, (interventions) => (
              <ul className="plain-list">
                {interventions.map((intervention) => (
                  <li key={`${intervention.type ?? "UNKNOWN"}-${intervention.name}`}>
                    {intervention.name}
                    {intervention.type === null ? "" : ` · ${humanizeCode(intervention.type)}`}
                  </li>
                ))}
              </ul>
            ))}
          </Fact>
          <Fact label="Primary outcomes">
            {availabilityText(trial.primaryOutcomes, (outcomes) => (
              <ul className="plain-list">
                {outcomes.map((outcome) => (
                  <li key={`${outcome.measure}-${outcome.timeFrame ?? "UNKNOWN"}`}>
                    {outcome.measure}
                    {outcome.timeFrame === null ? "" : ` · ${outcome.timeFrame}`}
                  </li>
                ))}
              </ul>
            ))}
          </Fact>
          <Fact label="Brief summary">
            {availabilityText(trial.briefSummary)}
          </Fact>
        </dl>
      </section>

      <ProvenancePanel trial={trial} />
    </main>
  );
}
