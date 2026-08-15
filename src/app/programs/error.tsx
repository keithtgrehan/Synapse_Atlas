"use client";

import Link from "next/link";

export default function ProgrammesError({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <section className="state-panel state-error" role="alert">
        <p className="eyebrow">Mapping data unavailable</p>
        <h1>The programme candidates could not be loaded</h1>
        <p>
          No generated or unvalidated substitute is shown. Retry the checked-in
          dataset or return to the programme search.
        </p>
        <div className="button-row">
          <button className="button" type="button" onClick={reset}>Try again</button>
          <Link className="button button-secondary" href="/programs">Programme search</Link>
        </div>
      </section>
    </main>
  );
}
