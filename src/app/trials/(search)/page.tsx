import type { Metadata } from "next";
import Link from "next/link";

import type { TrialRecord } from "../../../lib/domain/trials";
import {
  ClinicalTrialsClientError,
  clinicalTrialsOverallStatusValues,
  searchClinicalTrials,
  type ClinicalTrialsOverallStatus,
} from "../../../lib/sources/clinicaltrials/client";
import {
  Freshness,
  availabilityText,
  formatPartialDate,
  humanizeCode,
} from "../trial-ui";

export const metadata: Metadata = {
  title: "Registered trials · Synapse Atlas",
  description: "Search source-linked ClinicalTrials.gov records.",
};

export const dynamic = "force-dynamic";

const DEFAULT_QUERY = "psilocybin depression";

type TrialsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function singleParameter(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function statusValue(value: string | undefined): ClinicalTrialsOverallStatus | undefined {
  return clinicalTrialsOverallStatusValues.find((status) => status === value);
}

function searchHref(
  query: string,
  overallStatus: ClinicalTrialsOverallStatus | undefined,
  pageToken: string,
): string {
  const parameters = new URLSearchParams({ q: query, page: pageToken });

  if (overallStatus !== undefined) {
    parameters.set("status", overallStatus);
  }

  return `/trials?${parameters.toString()}`;
}

function TrialCard({ trial, asOf }: { trial: TrialRecord; asOf: Date }) {
  return (
    <li className="trial-card">
      <div className="trial-card-heading">
        <div>
          <p className="nct-id">{trial.nctId}</p>
          <h2>
            <Link href={`/trials/${trial.nctId}`}>{trial.briefTitle}</Link>
          </h2>
        </div>
        <span className="status-label">
          {availabilityText(trial.overallStatus, humanizeCode)}
        </span>
      </div>
      <dl className="card-facts">
        <div>
          <dt>Lead sponsor</dt>
          <dd>
            {availabilityText(trial.leadSponsor, (sponsor) => sponsor.name)}
          </dd>
        </div>
        <div>
          <dt>Conditions</dt>
          <dd>
            {availabilityText(trial.conditions, (conditions) => conditions.join(", "))}
          </dd>
        </div>
        <div>
          <dt>Interventions</dt>
          <dd>
            {availabilityText(trial.interventions, (interventions) =>
              interventions.map((intervention) => intervention.name).join(", "),
            )}
          </dd>
        </div>
        <div>
          <dt>Registry last update</dt>
          <dd>
            {availabilityText(
              trial.registryLastUpdatePostedDate,
              formatPartialDate,
            )}
          </dd>
        </div>
      </dl>
      <div className="card-footer">
        <Freshness retrievedAt={trial.provenance.retrievedAt} asOf={asOf} />
        <a href={trial.provenance.sourceUrl}>Open official registry record</a>
      </div>
    </li>
  );
}

function RequestError() {
  return (
    <section className="state-panel state-error" role="alert">
      <h2>The registry request is unavailable</h2>
      <p>
        Synapse Atlas did not substitute cached or generated data. Check the
        search and try the official API again.
      </p>
      <Link className="button button-secondary" href="/trials">
        Retry the default search
      </Link>
    </section>
  );
}

export default async function TrialsPage({ searchParams }: TrialsPageProps) {
  const parameters = await searchParams;
  const repeatedParameter = Object.values(parameters).some(Array.isArray);
  const query = singleParameter(parameters.q) ?? DEFAULT_QUERY;
  const rawStatus = singleParameter(parameters.status);
  const overallStatus = statusValue(rawStatus);
  const pageToken = singleParameter(parameters.page);
  const invalidStatus = rawStatus !== undefined && overallStatus === undefined;
  let result: Awaited<ReturnType<typeof searchClinicalTrials>> | null = null;
  let requestFailed = repeatedParameter || invalidStatus;

  if (!requestFailed) {
    try {
      result = await searchClinicalTrials({
        term: query,
        overallStatus,
        pageToken,
      });
    } catch (error) {
      if (error instanceof ClinicalTrialsClientError) {
        requestFailed = true;
      } else {
        throw error;
      }
    }
  }

  const asOf = new Date();

  return (
    <main className="shell">
      <header className="page-header">
        <Link className="back-link" href="/">← Synapse Atlas</Link>
        <p className="eyebrow">Official registered evidence</p>
        <h1>Clinical trial explorer</h1>
        <p className="lede">
          Search a bounded live view of ClinicalTrials.gov. Every result keeps
          its source link, retrieval time, registry update date, and response hash.
        </p>
      </header>

      <p className="boundary-note">
        <Link href="/trials/examples">Browse 10 non-psychedelic study examples</Link>
        {" — retained snapshots retrieved 13 October 2026, with publications and source notes."}
      </p>

      <form className="search-panel" action="/trials" method="get" role="search">
        <div className="search-field search-field-wide">
          <label htmlFor="trial-query">Condition, intervention, sponsor, or NCT ID</label>
          <input
            id="trial-query"
            name="q"
            type="search"
            minLength={2}
            maxLength={120}
            defaultValue={query}
            required
          />
        </div>
        <div className="search-field">
          <label htmlFor="trial-status">Overall status</label>
          <select id="trial-status" name="status" defaultValue={overallStatus ?? ""}>
            <option value="">All statuses</option>
            {clinicalTrialsOverallStatusValues.map((status) => (
              <option key={status} value={status}>{humanizeCode(status)}</option>
            ))}
          </select>
        </div>
        <button className="button" type="submit">Search official API</button>
      </form>

      <p className="boundary-note">
        One request returns at most 10 records. For an exact NCT ID, leave status
        set to All statuses. No login, tracking, AI, or silent fallback.
      </p>

      {requestFailed || result === null ? (
        <RequestError />
      ) : result.trials.length === 0 ? (
        <section className="state-panel">
          <h2>No registered studies matched</h2>
          <p>Try a broader scientific term or remove the status filter.</p>
          <Link href="/trials">Clear search</Link>
        </section>
      ) : (
        <section aria-labelledby="results-heading">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Live results</p>
              <h2 id="results-heading">
                {result.totalCount === null
                  ? "Current bounded page"
                  : `${result.totalCount.toLocaleString("en-GB")} matching studies`}
              </h2>
            </div>
            <p>Showing {result.trials.length} of at most 10 on this page</p>
          </div>
          <ul className="trial-list">
            {result.trials.map((trial) => (
              <TrialCard key={trial.nctId} trial={trial} asOf={asOf} />
            ))}
          </ul>
          <nav className="pagination" aria-label="Trial result pages">
            {pageToken === undefined ? null : (
              <Link className="button button-secondary" href="/trials">
                Start a new search
              </Link>
            )}
            {result.nextPageToken === null ? (
              <span>End of available results</span>
            ) : (
              <Link
                className="button"
                href={searchHref(query, overallStatus, result.nextPageToken)}
              >
                Next 10 results
              </Link>
            )}
          </nav>
        </section>
      )}
    </main>
  );
}
