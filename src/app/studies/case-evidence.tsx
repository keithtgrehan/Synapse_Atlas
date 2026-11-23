import type { CaseEvidence } from "../../lib/cases/model";

export function CaseEvidenceDisclosure({ evidence }: { evidence: CaseEvidence[] }) {
  return <>
    <p className="print-only quiet case-evidence-print">
      Saved source: {evidence.map((item) => `${item.nctId} · ${item.retrievedAt.slice(0, 10)} · ${item.locator}`).join("; ")}
    </p>
    <details className="source-disclosure"><summary>See the saved source details ({evidence.length})</summary>
      {evidence.map((item) => <div key={`${item.nctId}:${item.locator}`}>
        <a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.nctId} · official record ↗</a>
        <p>Captured {item.retrievedAt.slice(0, 10)} · <code>{item.locator}</code></p>
        <pre>{typeof item.expectedValue === "string" ? item.expectedValue : JSON.stringify(item.expectedValue, null, 2)}</pre>
      </div>)}
      <p>These values come from the saved copy. The public record linked above may have changed since it was saved.</p>
    </details>
  </>;
}
