import Link from "next/link";

export default function TrialNotFound() {
  return (
    <main className="shell">
      <section className="state-panel">
        <p className="eyebrow">Record not found</p>
        <h1>We could not find that study record</h1>
        <p>
          Check the study’s NCT ID, or search the public ClinicalTrials.gov
          records.
        </p>
        <Link className="button" href="/trials">Open trial search</Link>
      </section>
    </main>
  );
}
