import { loadSnapshotCatalogue } from "../../lib/snapshots/catalogue";
import { StudyWorkspace } from "./workspace";
import { loadResearchCases } from "../../lib/cases/load";
export const metadata = { title: "Research brief · Synapse Atlas" };
export default async function StudiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [catalogue, params] = await Promise.all([
    loadSnapshotCatalogue(),
    searchParams,
  ]);
  const requested =
    params.nct === undefined
      ? []
      : Array.isArray(params.nct)
        ? params.nct
        : [params.nct];
  const cases = await loadResearchCases(catalogue);
  const selectedCase = typeof params.case === "string" ? cases.find((item) => item.content.id === params.case) : undefined;
  const valid =
    requested.length <= 4 &&
    new Set(requested).size === requested.length &&
    requested.every((id) => catalogue.some((c) => c.nctId === id));
  return (
    <StudyWorkspace
      key={selectedCase?.content.id ?? "custom"}
      catalogue={catalogue}
      initialIds={selectedCase ? selectedCase.content.studyIds : valid ? requested : []}
      selectionError={!valid || (params.case !== undefined && !selectedCase)}
      researchCases={cases}
      initialCaseId={selectedCase?.content.id}
    />
  );
}
