import Link from "next/link";
import {
  howItWorks,
  snapshotLimitations,
} from "../../lib/product/how-it-works";
export const metadata = { title: "How it works · Synapse Atlas" };
export default function HowItWorks() {
  return (
    <main id="main-content" className="shell how-page">
      <header className="page-header">
        <p className="eyebrow">Behind the brief</p>
        <h1>How Synapse Atlas works</h1>
        <p className="lede">
          Explore saved public study records, check for updates and download a
          summary that keeps its sources.
        </p>
        <Link
          className="button"
          href="/studies?nct=NCT03866174&nct=NCT05711940&nct=NCT06605105"
        >
          Try the three-study example
        </Link>
      </header>
      {howItWorks.map((section) => (
        <section className="how-section" key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <section className="how-section">
        <h2>Sources and scope</h2>
        <p>{snapshotLimitations}</p>
        <p>
          ClinicalTrials.gov, U.S. National Library of Medicine. See the{" "}
          <a href="https://clinicaltrials.gov/study-basics/how-to-read-study-record">
            official record guide
          </a>
          ,{" "}
          <a href="https://clinicaltrials.gov/about-site/terms-conditions">
            source terms
          </a>{" "}
          and <Link href="/methodology">source and technical details</Link>.
        </p>
      </section>
    </main>
  );
}
