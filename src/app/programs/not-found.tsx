import Link from "next/link";

export default function ProgrammeNotFound() {
  return (
    <main className="shell">
      <section className="state-panel">
        <p className="eyebrow">Mapping candidate not found</p>
        <h1>No exact programme snapshot exists</h1>
        <p>
          Check the candidate slug or return to the bounded version-controlled dataset.
        </p>
        <Link className="button" href="/programs">Open Programmes</Link>
      </section>
    </main>
  );
}
