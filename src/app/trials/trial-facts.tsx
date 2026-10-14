import type { PartialDate, TrialRecord } from "../../lib/domain/trials";
import { Fact, availabilityText, formatPartialDate, humanizeCode } from "./trial-ui";

export function TrialFacts({ trial, retained = false }: { trial: TrialRecord; retained?: boolean }) {
  const dateText = (date: PartialDate) => `${formatPartialDate(date)}${retained && date.type === null ? " · Type not reported" : ""}`;
  return <>
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
            {availabilityText(trial.startDate, dateText)}
          </Fact>
          <Fact label="Primary completion">
            {availabilityText(trial.primaryCompletionDate, dateText)}
          </Fact>
          <Fact label="Completion">
            {availabilityText(trial.completionDate, dateText)}
          </Fact>
          <Fact label="Registry last update">
            {availabilityText(
              trial.registryLastUpdatePostedDate,
              dateText,
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
                {interventions.map((intervention, index) => (
                  <li key={`${intervention.type ?? "UNKNOWN"}-${intervention.name}-${index}`}>
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

  </>;
}
