import Link from "next/link";
import type { ReactNode } from "react";

import type {
  ComparisonCatalog,
  ComparisonProgramme,
  ComparisonResult,
  ComparisonSelection,
} from "../../lib/domain/comparisons";
import { formatUtcDateTime } from "../programs/program-ui";

export function ComparisonSelectionForm({
  catalog,
  selection,
}: {
  catalog: ComparisonCatalog;
  selection: ComparisonSelection;
}) {
  const selected = new Set(selection.selectedSlugs);

  return (
    <form
      id="comparison-selection"
      className="comparison-selection"
      action="/compare"
      method="get"
    >
      <fieldset>
        <legend>Select two to four reviewed programmes</legend>
        <p>
          Choose the programme contexts you want to explore. Each includes a
          selected study with a reviewed association.
        </p>
        <div className="comparison-options">
          {catalog.candidates.map((candidate) => (
            <label
              key={`${candidate.slug}:${selected.has(candidate.slug) ? "selected" : "clear"}`}
            >
              <input
                type="checkbox"
                name="programme"
                value={candidate.slug}
                defaultChecked={selected.has(candidate.slug)}
              />
              <span>
                <strong>{candidate.canonicalLabel}</strong>
                <small>{candidate.mapping.evidenceClass === "MODEL_INFERENCE" ? "Owner-approved inclusion · Model inference" : "Approved · Resolved"}</small>
              </span>
            </label>
          ))}
        </div>
        <div className="button-row comparison-form-actions">
          <button className="button" type="submit">
            Compare selected programmes
          </button>
          <Link className="button button-secondary" href="/compare">
            Clear selection
          </Link>
        </div>
      </fieldset>
    </form>
  );
}

export function ComparisonView({ result }: { result: ComparisonResult }) {
  return (
    <section className="comparison-results" aria-labelledby="comparison-heading">
      <div className="results-heading comparison-results-heading">
        <div>
          <p className="eyebrow">Deterministic snapshot comparison</p>
          <h2 id="comparison-heading">
            {result.programmes.length} reviewed programmes
          </h2>
        </div>
        <div className="comparison-actions" aria-label="Comparison actions">
          <a href="#comparison-selection">Change selection</a>
          <Link href="/compare">Clear selection</Link>
        </div>
      </div>
      <p className="boundary-note comparison-boundary">
        Dataset {result.datasetVersion}, processed {" "}
        <time dateTime={result.datasetUpdatedAt}>
          {formatUtcDateTime(result.datasetUpdatedAt)}
        </time>. This view compares retained registry snapshots; it does not
        score, recommend, or declare one programme preferable.
      </p>

      <div
        className="comparison-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Programme comparison table; scroll horizontally if needed"
      >
        <table className="comparison-table">
          <caption>
            Evidence-bounded fields for the selected reviewed programmes
          </caption>
          <thead>
            <tr>
              <th scope="col">Comparison field</th>
              {result.programmes.map((programme) => (
                <th scope="col" key={programme.slug}>
                  <Link href={programme.programmeHref}>
                    {programme.canonicalLabel}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <ComparisonRow label="Mapping review status" programmes={result.programmes}>
              {(programme) => (
                <FactWithEvidence evidenceClass={programme.mapping.evidenceClass}>
                  {programme.mapping.evidenceClass === "MODEL_INFERENCE" ? "Approved for inclusion; no independent human scientific review" : "Approved"}
                </FactWithEvidence>
              )}
            </ComparisonRow>
            <ComparisonRow label="Resolution status" programmes={result.programmes}>
              {(programme) => (
                <FactWithEvidence evidenceClass={programme.mapping.evidenceClass}>
                  Resolved within the reviewed programme namespace
                </FactWithEvidence>
              )}
            </ComparisonRow>
            <ComparisonRow label="Reviewed sponsor-organisation association" programmes={result.programmes}>
              {(programme) => (
                <FactWithEvidence evidenceClass={programme.mapping.evidenceClass}>
                  {programme.mapping.reportedSponsorOrganisation}
                </FactWithEvidence>
              )}
            </ComparisonRow>
            <ComparisonRow label="Source-reported sponsor organisation" programmes={result.programmes}>
              {(programme) => (
                <RegistryValues
                  programme={programme}
                  select={(trial) => [trial.reportedSponsorOrganisation]}
                />
              )}
            </ComparisonRow>
            <ComparisonRow label="Candidate compound association" programmes={result.programmes}>
              {(programme) => (
                <FactWithEvidence evidenceClass={programme.mapping.evidenceClass}>
                  {programme.mapping.candidateCompound}
                </FactWithEvidence>
              )}
            </ComparisonRow>
            <ComparisonRow label="Source-reported conditions" programmes={result.programmes}>
              {(programme) => (
                <RegistryValues
                  programme={programme}
                  select={(trial) => trial.reportedConditions}
                />
              )}
            </ComparisonRow>
            <ComparisonRow label="Source-reported interventions" programmes={result.programmes}>
              {(programme) => (
                <RegistryValues
                  programme={programme}
                  select={(trial) => trial.reportedInterventions}
                />
              )}
            </ComparisonRow>
            <ComparisonRow label="Registered NCT identifiers" programmes={result.programmes}>
              {(programme) => <RegisteredTrialLinks programme={programme} />}
            </ComparisonRow>
            <ComparisonRow label="Deterministic registered-trial count" programmes={result.programmes}>
              {(programme) => <RegisteredTrialCount programme={programme} />}
            </ComparisonRow>
            <ComparisonRow label="ClinicalTrials.gov overall status" programmes={result.programmes}>
              {(programme) => (
                <TrialValueList programme={programme}>
                  {(trial) => <code>{trial.overallStatus}</code>}
                </TrialValueList>
              )}
            </ComparisonRow>
            <ComparisonRow label="Registered start date" programmes={result.programmes}>
              {(programme) => (
                <TrialValueList programme={programme}>
                  {(trial) => (
                    <span>
                      <time dateTime={trial.registeredStartDate.value}>
                        {trial.registeredStartDate.value}
                      </time>{" "}
                      ({trial.registeredStartDate.precision.toLowerCase()} precision)
                    </span>
                  )}
                </TrialValueList>
              )}
            </ComparisonRow>
            <ComparisonRow label="Registry last-update-posted date" programmes={result.programmes}>
              {(programme) => (
                <TrialValueList programme={programme}>
                  {(trial) => (
                    <time dateTime={trial.registryLastUpdatePostedDate.value}>
                      {trial.registryLastUpdatePostedDate.value}
                    </time>
                  )}
                </TrialValueList>
              )}
            </ComparisonRow>
            <ComparisonRow label="Source retrieval and local processing" programmes={result.programmes}>
              {(programme) => <SnapshotTimes programme={programme} />}
            </ComparisonRow>
            <ComparisonRow label="Evidence and provenance references" programmes={result.programmes}>
              {(programme) => <ProgrammeEvidence programme={programme} />}
            </ComparisonRow>
            <ComparisonRow label="Explicit unknowns and unsupported assertions" programmes={result.programmes}>
              {(programme) => <Unknowns programme={programme} />}
            </ComparisonRow>
          </tbody>
        </table>
      </div>

      <div className="comparison-mobile" aria-label="Programme comparison cards">
        {result.programmes.map((programme) => (
          <MobileComparisonCard key={programme.slug} programme={programme} />
        ))}
      </div>
    </section>
  );
}

function ComparisonRow({
  label,
  programmes,
  children,
}: {
  label: string;
  programmes: readonly ComparisonProgramme[];
  children: (programme: ComparisonProgramme) => ReactNode;
}) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {programmes.map((programme) => (
        <td key={programme.slug}>{children(programme)}</td>
      ))}
    </tr>
  );
}

function FactWithEvidence({
  evidenceClass,
  children,
}: {
  evidenceClass: "HUMAN_INFERENCE" | "MODEL_INFERENCE" | "STRUCTURED_EXTRACTION" | "DERIVED_CALCULATION" | "UNKNOWN";
  children: ReactNode;
}) {
  return (
    <div className="comparison-fact">
      <EvidenceTag evidenceClass={evidenceClass} />
      <div>{children}</div>
    </div>
  );
}

function EvidenceTag({
  evidenceClass,
}: {
  evidenceClass: "HUMAN_INFERENCE" | "MODEL_INFERENCE" | "STRUCTURED_EXTRACTION" | "DERIVED_CALCULATION" | "UNKNOWN";
}) {
  return (
    <span
      className={`evidence-label evidence-${evidenceClass.toLowerCase().replace("_", "-")}`}
      data-evidence-class={evidenceClass}
    >
      {evidenceClass.replaceAll("_", " ").toLowerCase()}
    </span>
  );
}

function RegistryValues({
  programme,
  select,
}: {
  programme: ComparisonProgramme;
  select: (trial: ComparisonProgramme["registeredTrials"][number]) => readonly string[];
}) {
  const values = Array.from(
    new Set(programme.registeredTrials.flatMap((trial) => select(trial))),
  );

  return (
    <FactWithEvidence evidenceClass="STRUCTURED_EXTRACTION">
      <ul className="plain-list">
        {values.map((value) => <li key={value}>{value}</li>)}
      </ul>
    </FactWithEvidence>
  );
}

function RegisteredTrialLinks({ programme }: { programme: ComparisonProgramme }) {
  return (
    <FactWithEvidence evidenceClass="STRUCTURED_EXTRACTION">
      <ul className="plain-list">
        {programme.registeredTrials.map((trial) => (
          <li key={trial.nctId}>
            <Link href={trial.trialHref}>
              {trial.nctId} registered-trial detail
            </Link>
          </li>
        ))}
      </ul>
    </FactWithEvidence>
  );
}

function RegisteredTrialCount({ programme }: { programme: ComparisonProgramme }) {
  const count = programme.registeredTrialCount;

  return (
    <FactWithEvidence evidenceClass="DERIVED_CALCULATION">
      <strong>{count.value}</strong>
      <small>{count.formula}</small>
      <details>
        <summary>Formula and exact inputs</summary>
        <p>Version: <code>{count.formulaVersion}</code></p>
        <ul className="plain-list">
          {count.inputReferences.map((reference) => (
            <li key={`${reference.sourceSnapshotId}-${reference.locator}`}>
              {reference.nctId} · <code>{reference.sourceSnapshotId}</code> · {" "}
              <code>{reference.locator}</code>
            </li>
          ))}
        </ul>
      </details>
    </FactWithEvidence>
  );
}

function TrialValueList({
  programme,
  children,
}: {
  programme: ComparisonProgramme;
  children: (trial: ComparisonProgramme["registeredTrials"][number]) => ReactNode;
}) {
  return (
    <FactWithEvidence evidenceClass="STRUCTURED_EXTRACTION">
      <ul className="plain-list">
        {programme.registeredTrials.map((trial) => (
          <li key={trial.nctId}>{trial.nctId}: {children(trial)}</li>
        ))}
      </ul>
    </FactWithEvidence>
  );
}

function SnapshotTimes({ programme }: { programme: ComparisonProgramme }) {
  return (
    <FactWithEvidence evidenceClass="STRUCTURED_EXTRACTION">
      <ul className="plain-list comparison-time-list">
        {programme.registeredTrials.map((trial) => (
          <li key={trial.nctId}>
            <strong>{trial.nctId}</strong>
            <span>
              Retrieved <time dateTime={trial.retrievedAt}>{formatUtcDateTime(trial.retrievedAt)}</time>
            </span>
            <span>
              Processed <time dateTime={trial.processedAt}>{formatUtcDateTime(trial.processedAt)}</time>
            </span>
          </li>
        ))}
      </ul>
    </FactWithEvidence>
  );
}

function ProgrammeEvidence({ programme }: { programme: ComparisonProgramme }) {
  return (
    <div className="comparison-evidence-list">
      <p>
        <EvidenceTag evidenceClass={programme.mapping.evidenceClass} /> Mapping assertion {" "}
        <code>{programme.mapping.assertionId}</code>
      </p>
      <details>
        <summary>Exact mapping provenance references</summary>
        <ul className="plain-list">
          {programme.mapping.provenanceReferences.map((reference) => (
            <li key={`${reference.sourceSnapshotId}-${reference.locator}`}>
              {reference.nctId} · <code>{reference.sourceSnapshotId}</code> · {" "}
              <code>{reference.locator}</code>
            </li>
          ))}
        </ul>
      </details>
      {programme.registeredTrials.map((trial) => (
        <article key={trial.nctId} className="comparison-evidence">
          <EvidenceTag evidenceClass="STRUCTURED_EXTRACTION" />
          <h3>{trial.nctId}</h3>
          <ul className="plain-list">
            <li>
              <a href={trial.officialSourceUrl}>
                Open the official ClinicalTrials.gov record for {trial.nctId}
              </a>
            </li>
            <li><a href={trial.apiRequestUrl}>Open the exact official API request</a></li>
            <li>Source policy: {trial.provenance.sourceId} · version {trial.provenance.policyVersion}</li>
            <li>Snapshot: <code>{trial.provenance.sourceSnapshotId}</code></li>
            <li>Exact retained response SHA-256: <code>{trial.provenance.responseSha256}</code></li>
          </ul>
          <details>
            <summary>Exact JSON-pointer locators</summary>
            <dl className="locator-list">
              {Object.entries(trial.provenance.fieldLocators).map(([field, locator]) => (
                <div key={field}>
                  <dt>{humanize(field)}</dt>
                  <dd><code>{locator}</code></dd>
                </div>
              ))}
            </dl>
          </details>
        </article>
      ))}
    </div>
  );
}

function Unknowns({ programme }: { programme: ComparisonProgramme }) {
  return (
    <FactWithEvidence evidenceClass="UNKNOWN">
      <ul className="plain-list unknown-list">
        {programme.explicitUnknowns.map((unknown) => (
          <li key={unknown.statement}>
            <strong>{unknown.displayValue}</strong> {unknown.statement}
          </li>
        ))}
      </ul>
    </FactWithEvidence>
  );
}

function MobileComparisonCard({ programme }: { programme: ComparisonProgramme }) {
  return (
    <article className="comparison-card">
      <p className="eyebrow">Reviewed programme</p>
      <h3><Link href={programme.programmeHref}>{programme.canonicalLabel}</Link></h3>
      <dl className="stacked-facts">
        <MobileFact label="Mapping state">
          <FactWithEvidence evidenceClass={programme.mapping.evidenceClass}>{programme.mapping.evidenceClass === "MODEL_INFERENCE" ? "Owner-approved inclusion · Resolved grouping" : "Approved · Resolved"}</FactWithEvidence>
        </MobileFact>
        <MobileFact label="Reviewed sponsor-organisation association">
          <FactWithEvidence evidenceClass={programme.mapping.evidenceClass}>{programme.mapping.reportedSponsorOrganisation}</FactWithEvidence>
        </MobileFact>
        <MobileFact label="Source-reported sponsor organisation">
          <RegistryValues programme={programme} select={(trial) => [trial.reportedSponsorOrganisation]} />
        </MobileFact>
        <MobileFact label="Candidate compound association">
          <FactWithEvidence evidenceClass={programme.mapping.evidenceClass}>{programme.mapping.candidateCompound}</FactWithEvidence>
        </MobileFact>
        <MobileFact label="Source-reported conditions">
          <RegistryValues programme={programme} select={(trial) => trial.reportedConditions} />
        </MobileFact>
        <MobileFact label="Source-reported interventions">
          <RegistryValues programme={programme} select={(trial) => trial.reportedInterventions} />
        </MobileFact>
        <MobileFact label="Registered trials"><RegisteredTrialLinks programme={programme} /></MobileFact>
        <MobileFact label="Registered-trial count"><RegisteredTrialCount programme={programme} /></MobileFact>
        <MobileFact label="Overall status">
          <TrialValueList programme={programme}>{(trial) => <code>{trial.overallStatus}</code>}</TrialValueList>
        </MobileFact>
        <MobileFact label="Registered start date">
          <TrialValueList programme={programme}>{(trial) => `${trial.registeredStartDate.value} (${trial.registeredStartDate.precision.toLowerCase()} precision)`}</TrialValueList>
        </MobileFact>
        <MobileFact label="Registry last update">
          <TrialValueList programme={programme}>{(trial) => trial.registryLastUpdatePostedDate.value}</TrialValueList>
        </MobileFact>
        <MobileFact label="Retrieval and processing"><SnapshotTimes programme={programme} /></MobileFact>
        <MobileFact label="Evidence and provenance"><ProgrammeEvidence programme={programme} /></MobileFact>
        <MobileFact label="Explicit unknowns"><Unknowns programme={programme} /></MobileFact>
      </dl>
    </article>
  );
}

function MobileFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}
