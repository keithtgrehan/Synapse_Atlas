export default function TrialsLoading() {
  return (
    <main className="shell">
      <section className="state-panel" role="status" aria-live="polite">
        <p className="eyebrow">Official registered evidence</p>
        <h1>Loading ClinicalTrials.gov</h1>
        <p>Fetching one bounded page from the approved official API.</p>
      </section>
    </main>
  );
}
