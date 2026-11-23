import Link from "next/link";

export default function ProgrammeNotFound() {
  return (
    <main className="shell">
      <section className="state-panel">
        <p className="eyebrow">Programme record not found</p>
        <h1>We could not find that programme record</h1>
        <p>
          Check the link, or return to the saved programme list.
        </p>
        <Link className="button" href="/programs">Open Programmes</Link>
      </section>
    </main>
  );
}
