import Link from "next/link";

export default function Home() {
  return (
    <main className="shell home">
      <section className="hero">
        <p className="eyebrow">Neuropsychiatric research workspace</p>
        <h1>Synapse Atlas</h1>
        <p className="lede">
          Compare selected depression studies. Understand their registered endpoints
          and timelines, inspect the evidence and export a dated research brief.
        </p>
        <div className="button-row">
          <Link className="button" href="/compare?programme=usona-psilocybin-mdd&programme=comp360-treatment-resistant-depression&programme=cyb003-major-depressive-disorder">Explore the depression study comparison</Link>
          <Link className="button button-secondary" href="/compare?programme=study-nct03672175&programme=study-nct03559192&programme=study-nct01360645&programme=study-nct01422213">Explore the non-psychedelic depression comparison</Link>
          <Link className="button button-secondary" href="/trials/examples">Explore 10 study examples</Link>
          <Link className="button button-secondary" href="/programs">Explore programmes</Link>
          <Link className="button button-secondary" href="/trials">Search registered trials</Link>
        </div>
      </section>
      <section className="principles" aria-labelledby="principles-heading">
        <p className="eyebrow">Trust boundary</p>
        <h2 id="principles-heading">Facts stay attached to evidence</h2>
        <ul>
          <li>13 programme contexts: three human-reviewed associations and ten model-proposed mappings approved for inclusion</li>
          <li>Unknown and missing fields remain visible</li>
          <li>Every trial links back to its registry record</li>
          <li>CSV, source manifest and a printable brief use the same saved evidence</li>
        </ul>
        <Link href="/methodology">Sources, methodology and limitations</Link>
      </section>
    </main>
  );
}
