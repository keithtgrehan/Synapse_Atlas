import type { ComparisonResult } from "./comparisons";
import type { Availability, PartialDate, TrialRecord } from "./trials";
import { briefVersion } from "./brief-snapshots";

export type ResearchBrief = {
  version: string;
  mappingVersion: string;
  programmes: Array<{
    slug: string;
    label: string;
    mapping: ComparisonResult["programmes"][number]["mapping"];
    unknowns: string[];
    trials: TrialRecord[];
    studyContext?: { comparator: string; publicationUrl: string };
  }>;
};

export function buildResearchBrief(comparison: ComparisonResult, trials: readonly TrialRecord[], contexts: ReadonlyMap<string, { comparator: string; publicationUrl: string }> = new Map()): ResearchBrief {
  const byId = new Map(trials.map((trial) => [trial.nctId, trial]));
  if (byId.size !== trials.length) throw new Error("DUPLICATE_BRIEF_STUDY");
  return {
    version: briefVersion,
    mappingVersion: comparison.datasetVersion,
    programmes: comparison.programmes.map((programme) => ({
      studyContext: contexts.get(programme.registeredTrials[0].nctId),
      slug: programme.slug, label: programme.canonicalLabel, mapping: programme.mapping,
      unknowns: programme.explicitUnknowns.map((entry) => entry.statement),
      trials: programme.registeredTrials.map(({ nctId }) => {
        const trial = byId.get(nctId);
        if (!trial) throw new Error("MISSING_BRIEF_STUDY");
        return trial;
      }),
    })),
  };
}

export function humanizeRegistryValue(value: string): string {
  return value.toLowerCase().replaceAll("_", " ").replace(/^phase(\d)/, "phase $1").replace(/^./, (letter) => letter.toUpperCase());
}

function available<T>(value: Availability<T>, format: (reported: T) => string): string {
  return value.state === "reported" ? format(value.value) : value.state === "not_requested" ? "Not requested" : "Not reported";
}

export function briefDate(value: PartialDate): string {
  return `${value.value} (${value.type === null ? "type not reported" : humanizeRegistryValue(value.type).toLowerCase()}; ${value.precision.toLowerCase()} precision)`;
}

// Shared by the screen, print view and CSV: formatting cannot change the meaning between outputs.
export const researchBriefFields: ReadonlyArray<{ key: keyof TrialRecord; label: string; value: (trial: TrialRecord) => string }> = [
  { key: "conditions", label: "Registered conditions", value: (t) => available(t.conditions, (v) => v.join("; ")) },
  { key: "phases", label: "Trial phase", value: (t) => available(t.phases, (v) => v.map(humanizeRegistryValue).join("; ")) },
  { key: "overallStatus", label: "Trial status", value: (t) => available(t.overallStatus, humanizeRegistryValue) },
  { key: "enrollment", label: "Enrolment", value: (t) => available(t.enrollment, (v) => `${v.count.toLocaleString("en-GB")} (${v.type === null ? "type not reported" : humanizeRegistryValue(v.type).toLowerCase()})`) },
  { key: "primaryOutcomes", label: "Primary endpoint and time frame", value: (t) => available(t.primaryOutcomes, (v) => v.map((o) => `${o.measure} — ${o.timeFrame ?? "Time frame not reported"}`).join("\n")) },
  { key: "primaryCompletionDate", label: "Primary completion", value: (t) => available(t.primaryCompletionDate, briefDate) },
  { key: "completionDate", label: "Study completion", value: (t) => available(t.completionDate, briefDate) },
  { key: "leadSponsor", label: "Reported lead sponsor", value: (t) => available(t.leadSponsor, (v) => v.name) },
  { key: "interventions", label: "Registered interventions", value: (t) => available(t.interventions, (v) => v.map((i) => i.name).join("; ")) },
  { key: "registryLastUpdatePostedDate", label: "Registry last update", value: (t) => available(t.registryLastUpdatePostedDate, (v) => v.value) },
];

export const briefLimitations = "Selected registered studies only, not complete programme coverage. Registry descriptions and endpoints are not evidence of treatment benefit. Trial phase is not programme-wide maturity. Completion dates are not promised results-release dates. Different study populations and designs do not establish comparative efficacy. No medical or investment recommendation.";

export function briefQuery(brief: ResearchBrief): string {
  const query = new URLSearchParams({ snapshot: brief.version });
  for (const programme of brief.programmes) query.append("programme", programme.slug);
  return query.toString();
}

export function csvCell(value: string): string {
  // Quoting alone does not stop spreadsheet formulas, including leading whitespace/control characters.
  const safe = /^[\s\u0000-\u001f]*[=+@-]/u.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function researchBriefCsv(brief: ResearchBrief): string {
  const headers = ["Programme context (reviewed association)", "NCT ID", "Study title", ...researchBriefFields.map((f) => f.label), "Snapshot version", "Mapping dataset version", "Evidence class", "Source URL", "Retrieved at (UTC)", "Processed at (UTC)", "Source SHA-256", "Field locators (JSON)", "Limitations", "Mapping evidence class", "Inclusion decision", "Source caveats", "Comparator (source-based summary)", "Publication URL"];
  const rows = brief.programmes.flatMap((programme) => programme.trials.map((trial) => [
    programme.label, trial.nctId, trial.briefTitle, ...researchBriefFields.map((f) => f.value(trial)),
    brief.version, brief.mappingVersion, trial.provenance.evidenceClass, trial.provenance.sourceUrl,
    trial.provenance.retrievedAt, trial.provenance.processedAt, trial.provenance.contentSha256,
    JSON.stringify(trial.provenance.fieldLocators), briefLimitations, programme.mapping.evidenceClass, programme.mapping.reviewRationale ?? "See mapping evidence", (programme.mapping.caveats ?? []).join("\n"), programme.studyContext?.comparator ?? "See registered interventions", programme.studyContext?.publicationUrl ?? "Not included in this brief",
  ]));
  return "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export function researchBriefManifest(brief: ResearchBrief) {
  return {
    snapshotVersion: brief.version,
    mappingDatasetVersion: brief.mappingVersion,
    transformation: "comparison-brief/v1",
    limitations: briefLimitations,
    csvEncoding: "UTF-8 with BOM; all cells quoted; potentially executable spreadsheet cells prefixed with an apostrophe",
    sourceTerms: "https://clinicaltrials.gov/about-site/terms-conditions",
    programmes: brief.programmes.map((p) => ({
      slug: p.slug, label: p.label, mapping: p.mapping, unknowns: p.unknowns, studyContext: p.studyContext,
      studies: p.trials.map((t) => ({ nctId: t.nctId, title: t.briefTitle, provenance: t.provenance })),
    })),
  };
}
