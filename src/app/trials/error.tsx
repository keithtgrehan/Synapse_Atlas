"use client";

import Link from "next/link";

export default function TrialsError({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <section className="state-panel state-error" role="alert">
        <p className="eyebrow">Source unavailable</p>
        <h1>The official trial record could not be loaded</h1>
        <p>
          No generated or unverified substitute is shown. Retry the approved
          source or return to the bounded search.
        </p>
        <div className="button-row">
          <button className="button" type="button" onClick={reset}>Try again</button>
          <Link className="button button-secondary" href="/trials">Trial search</Link>
        </div>
      </section>
    </main>
  );
}
