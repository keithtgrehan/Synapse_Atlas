"use client";

import Link from "next/link";

export default function TrialsError({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <section className="state-panel state-error" role="alert">
        <p className="eyebrow">Source unavailable</p>
        <h1>We could not open the public study record</h1>
        <p>
          We have not replaced the record with generated or unchecked information.
          Try again, or return to the study search.
        </p>
        <div className="button-row">
          <button className="button" type="button" onClick={reset}>Try again</button>
          <Link className="button button-secondary" href="/trials">Trial search</Link>
        </div>
      </section>
    </main>
  );
}
