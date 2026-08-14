import type { Metadata } from "next";
import Link from "next/link";

import {
  parseProgrammeSearchParameters,
  searchProgrammes,
} from "../../../lib/domain/programs";
import { programmeMappingDataset } from "../../../lib/programs/dataset";
import { ProgrammeCard, StatusKey } from "../program-ui";

export const metadata: Metadata = {
  title: "Programme candidates · Synapse Atlas",
  description: "Search version-controlled, evidence-linked programme mapping candidates.",
};

type ProgrammesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProgrammesPage({
  searchParams,
}: ProgrammesPageProps) {
  const parsedParameters = parseProgrammeSearchParameters(await searchParams);
  const results = parsedParameters.valid
    ? searchProgrammes(programmeMappingDataset, parsedParameters.query)
    : [];

  return (
    <main className="shell">
      <header className="page-header">
        <Link className="back-link" href="/">← Synapse Atlas</Link>
        <p className="eyebrow">Version-controlled mapping candidates</p>
        <h1>Programmes</h1>
        <p className="lede">
          Search checked-in ClinicalTrials.gov snapshots and proposed programme,
          reported sponsor-organisation, and compound relationships. These are
          review candidates, not live programme data.
        </p>
      </header>

      <form className="search-panel programme-search-panel" action="/programs" method="get" role="search">
        <div className="search-field search-field-wide">
          <label htmlFor="programme-query">
            Programme, alias, reported sponsor, compound, condition, or NCT ID
          </label>
          <input
            id="programme-query"
            name="q"
            type="search"
            maxLength={120}
            defaultValue={parsedParameters.valid ? parsedParameters.query : ""}
          />
        </div>
        <button className="button" type="submit">Search candidates</button>
      </form>

      <p className="boundary-note">
        Search is deterministic and offline. Punctuation and diacritics are
        preserved; no fuzzy matching, AI, or automatic entity creation is used.
      </p>

      <StatusKey />

      {!parsedParameters.valid ? (
        <section className="state-panel state-error" role="alert">
          <h2>The search parameters could not be used</h2>
          <p>
            Repeated, unexpected, control-character, or overlong values are
            rejected without displaying the submitted content.
          </p>
          <Link className="button button-secondary" href="/programs">Clear search</Link>
        </section>
      ) : results.length === 0 ? (
        <section className="state-panel">
          <h2>No programme candidates matched</h2>
          <p>
            Try a programme label, alias, reported sponsor organisation,
            compound, condition, or exact NCT identifier.
          </p>
          <Link href="/programs">Clear search</Link>
        </section>
      ) : (
        <section aria-labelledby="programme-results-heading">
          <div className="results-heading">
            <div>
              <p className="eyebrow">Checked-in candidates</p>
              <h2 id="programme-results-heading">
                {results.length} programme {results.length === 1 ? "candidate" : "candidates"}
              </h2>
            </div>
            <p>Dataset version {programmeMappingDataset.datasetVersion}</p>
          </div>
          <ul className="programme-list">
            {results.map((view) => (
              <ProgrammeCard key={view.programme.id} view={view} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
