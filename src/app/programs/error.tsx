"use client";

import Link from "next/link";

export default function ProgrammesError({ reset }: { reset: () => void }) {
  return (
    <main className="shell">
      <section className="state-panel state-error" role="alert">
        <p className="eyebrow">Programme records unavailable</p>
        <h1>We could not open the programme records</h1>
        <p>
          We have not replaced the records with generated or unchecked information.
          Try again, or return to the programme search.
        </p>
        <div className="button-row">
          <button className="button" type="button" onClick={reset}>Try again</button>
          <Link className="button button-secondary" href="/programs">Programme search</Link>
        </div>
      </section>
    </main>
  );
}
