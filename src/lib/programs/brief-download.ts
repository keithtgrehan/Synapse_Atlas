import { buildComparison, parseComparisonSelection } from "../domain/comparisons";
import { briefVersion } from "../domain/brief-snapshots";
import { researchBriefCsv, researchBriefManifest } from "../domain/research-brief";
import { loadComparisonCatalog } from "./comparison-dataset";
import { loadResearchBrief } from "./research-brief";

export async function downloadBrief(request: Request, format: "csv" | "json"): Promise<Response> {
  const query = new URL(request.url).searchParams;
  if (Array.from(query.keys()).some((key) => key !== "programme" && key !== "snapshot") || query.getAll("snapshot").length !== 1 || query.get("snapshot") !== briefVersion) {
    return new Response("This snapshot is unavailable. Reopen the comparison to download its current snapshot.", { status: 400 });
  }
  try {
    const catalog = await loadComparisonCatalog();
    const selection = parseComparisonSelection({ programme: query.getAll("programme") }, catalog);
    if (selection.state !== "ready") return new Response("Select two to four available programmes.", { status: 400 });
    const brief = await loadResearchBrief(buildComparison(catalog, selection.selectedSlugs));
    const body = format === "csv" ? researchBriefCsv(brief) : JSON.stringify(researchBriefManifest(brief), null, 2) + "\n";
    return new Response(body, { headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="synapse-atlas-${briefVersion}.${format}"`,
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return new Response("The retained evidence could not be validated. Return to the comparison and try again later.", { status: 503 });
  }
}
