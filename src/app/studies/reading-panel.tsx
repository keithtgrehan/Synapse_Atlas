import { readingAvailability, readingBoundary, readingMetadata, type ExternalReadingReference } from "../../lib/cases/reading-references";

export function ReadingPanel({ references }: { references: ExternalReadingReference[] }) {
  return <section aria-labelledby="external-reading-title" className="external-reading"><h3 id="external-reading-title">Further reading</h3><details>
    <summary>Open links and notes · {references.length} references</summary>
    <p className="quiet">{readingBoundary}</p>
    <ol>{references.map(reference => <li key={reference.id}>
      <p className="eyebrow">{reference.documentType}</p>
      <h4>{reference.url ? <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a> : reference.title}</h4>
      <p className="quiet">{readingMetadata(reference)}</p>
      <p>{reference.citation}{reference.doi ? ` · DOI ${reference.doi}` : ""}</p>
      <p>{reference.note}</p>
      <p className="quiet">{readingAvailability[reference.availability]}: {reference.availabilityNote}</p>
      {reference.notice && <aside className="reading-notice"><strong>{reference.notice.kind === "correction" ? "Author correction" : "Retraction notice"} · {reference.notice.date}</strong><p>{reference.notice.note}</p><a href={reference.notice.url} target="_blank" rel="noopener noreferrer">{reference.notice.title} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a></aside>}
    </li>)}</ol>
  </details></section>;
}
