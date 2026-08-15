import Link from "next/link";

export default function Home() {
  return (
    <main className="shell home">
      <section className="hero">
        <p className="eyebrow">Private evidence workspace</p>
        <h1>Synapse Atlas</h1>
        <p className="lede">
          Traceable intelligence for neuropsychiatric drug-development programmes,
          starting with registered study facts from the official source.
        </p>
        <div className="button-row">
          <Link className="button" href="/programs">Explore Programmes</Link>
          <Link className="button" href="/compare">Compare programmes</Link>
          <Link className="button" href="/trials">Explore registered trials</Link>
          <a className="button button-secondary" href="/api/health">Check system health</a>
        </div>
      </section>
      <section className="principles" aria-labelledby="principles-heading">
        <p className="eyebrow">Trust boundary</p>
        <h2 id="principles-heading">Facts stay attached to evidence</h2>
        <ul>
          <li>Official ClinicalTrials.gov API only</li>
          <li>Unknown and missing fields remain visible</li>
          <li>Every trial links back to its registry record</li>
        </ul>
      </section>
    </main>
  );
}
