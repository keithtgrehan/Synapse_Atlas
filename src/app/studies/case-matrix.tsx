import type { VerifiedCase } from "../../lib/cases/model";
import { CaseEvidenceDisclosure } from "./case-evidence";

export function CaseMatrixTable({ content }: { content: VerifiedCase["content"] }) {
  return <div className="case-matrix-wrap" role="region" aria-label={`${content.title}: registered study characteristics`} tabIndex={0}>
    <table><caption className="sr-only">{content.title}: registered study characteristics</caption>
      <thead><tr><th scope="col">Research dimension</th>{content.studyIds.map((id) => <th scope="col" key={id}><a href={`https://clinicaltrials.gov/study/${id}`} target="_blank" rel="noreferrer">{id} ↗</a></th>)}</tr></thead>
      <tbody>{content.dimensions.map((row) => <tr key={row.key}><th scope="row">{row.label}<p className="quiet">{row.interpretation}</p><small>Interpretation</small></th>
        {content.studyIds.map((id) => { const cell = row.cells.find((entry) => entry.nctId === id); return <td key={id} data-study={id}><p>{cell?.value ?? "Not evaluated"}</p>{cell && cell.evidence.length > 0 && <CaseEvidenceDisclosure evidence={cell.evidence} />}</td>; })}
      </tr>)}</tbody>
    </table>
  </div>;
}
