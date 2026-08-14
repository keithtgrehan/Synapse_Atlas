import type { ReactNode } from "react";

import {
  getTrialFreshness,
  type Availability,
  type PartialDate,
  type TrialRecord,
} from "../../lib/domain/trials";

export function availabilityText<T>(
  fact: Availability<T>,
  render: (value: T) => ReactNode = String,
): ReactNode {
  if (fact.state === "reported") {
    return render(fact.value);
  }

  return fact.state === "not_requested"
    ? "Not requested from the registry"
    : "Not reported by the registry";
}

export function formatPartialDate(value: PartialDate): string {
  const precision = value.precision.toLowerCase();
  const dateType = value.type === null
    ? ""
    : ` · ${humanizeCode(value.type)}`;
  return `${value.value} · ${precision} precision${dateType}`;
}

export function formatUtcDateTime(value: string): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value))} UTC`;
}

export function humanizeCode(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function Freshness({
  retrievedAt,
  asOf,
}: {
  retrievedAt: string;
  asOf: Date;
}) {
  const freshness = getTrialFreshness(retrievedAt, asOf);
  const label = freshness.state === "fresh"
    ? "Fresh API retrieval"
    : freshness.state === "stale"
      ? "Stale local retrieval"
      : "Retrieval clock needs review";

  return (
    <span className={`freshness freshness-${freshness.state}`}>
      {label}
    </span>
  );
}

export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function ProvenancePanel({ trial }: { trial: TrialRecord }) {
  const provenance = trial.provenance;

  return (
    <section className="provenance" aria-labelledby="provenance-heading">
      <div>
        <p className="eyebrow">Evidence</p>
        <h2 id="provenance-heading">Official source and provenance</h2>
      </div>
      <dl className="facts-grid">
        <Fact label="Source">
          <a href={provenance.sourceUrl}>Open {trial.nctId} on ClinicalTrials.gov</a>
        </Fact>
        <Fact label="Evidence class">Structured extraction</Fact>
        <Fact label="Retrieved from API">
          <time dateTime={provenance.retrievedAt}>
            {formatUtcDateTime(provenance.retrievedAt)}
          </time>
        </Fact>
        <Fact label="Processed locally">
          <time dateTime={provenance.processedAt}>
            {formatUtcDateTime(provenance.processedAt)}
          </time>
        </Fact>
        <Fact label="Registry last update">
          {provenance.registryLastUpdatePostedDate ?? "Not reported by the registry"}
        </Fact>
        <Fact label="Attribution">{provenance.attribution}</Fact>
      </dl>
      <div className="hash-row">
        <span>Exact response SHA-256</span>
        <code>{provenance.contentSha256}</code>
      </div>
      <details>
        <summary>View retained field locators</summary>
        <dl className="locator-list">
          {Object.entries(provenance.fieldLocators).map(([field, locator]) => (
            <div key={field}>
              <dt>{humanizeCode(field)}</dt>
              <dd><code>{locator}</code></dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
