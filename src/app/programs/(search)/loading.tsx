export default function ProgrammesLoading() {
  return (
    <main className="shell">
      <section className="state-panel" role="status" aria-live="polite">
        <p className="eyebrow">Saved programme context</p>
        <h1>Opening programme records…</h1>
        <p>Checking the saved programme records without requesting new data.</p>
      </section>
    </main>
  );
}
