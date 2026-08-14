import Link from "next/link";

export default function TrialNotFound() {
  return (
    <main className="shell">
      <section className="state-panel">
        <p className="eyebrow">Record not found</p>
        <h1>No exact registered trial was returned</h1>
        <p>
          Check the NCT identifier or search ClinicalTrials.gov through the
          bounded explorer.
        </p>
        <Link className="button" href="/trials">Open trial search</Link>
      </section>
    </main>
  );
}
