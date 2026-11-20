import { jsPDF } from "jspdf";
import { compareCaptures } from "../../lib/snapshots/compare";
import type { Capture } from "../../lib/snapshots/model";
import type { CaseEvidence, VerifiedCase } from "../../lib/cases/model";
import { sessionManifest, type CapturedComparison } from "./session-export";
import { evidenceModeLabels as stateLabel } from "./evidence-state-model";
import { outcomeFieldText } from "../../lib/snapshots/primary-outcomes";
import { readingBoundary, readingMetadata } from "../../lib/cases/reading-references";

type Block = { text: string; kind: "title" | "heading" | "body" | "meta" | "boundary" | "link"; url?: string; keepWithNext?: number };
type Manifest = ReturnType<typeof sessionManifest>;
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const CONTENT_BOTTOM = PAGE_HEIGHT - 58;
const present = (value: string | null | undefined) => value ?? "Not reported";

function documentBlocks(manifest: Manifest): Block[] {
  const blocks: Block[] = [];
  const add = (text: string, kind: Block["kind"] = "body") => blocks.push({ text, kind });
  const link = (label: string, url: string) => blocks.push({ text: `${label}: ${url}`, kind: "link", url });
  const researchCase = manifest.researchCase;
  const evidence = researchCase?.evidence ?? [];
  const reference = (item: CaseEvidence) => {
    const index = evidence.findIndex((entry) => entry.nctId === item.nctId && entry.sourcePath === item.sourcePath && entry.locator === item.locator);
    return index < 0 ? "Source reference unavailable" : `E${index + 1}`;
  };

  add(researchCase?.content.title ?? "Custom research brief", "title");
  add(`Exported ${manifest.exportedAt}`, "meta");
  add(`${manifest.savedStudies.length} selected studies / ${manifest.comparisons.length} displayed comparisons`, "meta");
  add(`Selected records: ${manifest.savedStudies.map((capture) => capture.nctId).join(", ")}`);
  if (researchCase) {
    add("The question", "heading");
    add(researchCase.content.question);
    add(researchCase.content.summary);
    add(`AI-assisted interpretation (MODEL_INFERENCE) / Why these studies: ${researchCase.content.whyTogether}`);
    add(researchCase.content.cannotEstablish, "boundary");
  }
  add("Evidence in this brief", "heading");
  add("The example explanation uses the saved records. Checking for updates or comparing saved versions changes only the comparison below.", "boundary");
  for (const row of manifest.evidenceState) {
    add(`${row.nctId} / ${stateLabel[row.mode]}`);
    add(`Saved copy: ${row.savedAt}\nRegistry update in saved record: ${present(row.savedRegistryUpdate)}`, "meta");
    if (row.comparisonAt) add(`Saved copy used for comparison: ${present(row.comparisonBaselineAt)}\n${row.mode === "replay" ? "Later saved copy" : "New check made"}: ${row.comparisonAt}\nRegistry update in comparison: ${present(row.comparisonRegistryUpdate)}`, "meta");
  }
  add(manifest.limitations, "boundary");
  if (researchCase) {
    add("Example notes / saved study records", "heading");
    for (const dimension of researchCase.content.dimensions) {
      add(dimension.label, "heading");
      for (const cell of dimension.cells) {
        add(`${cell.nctId}: ${cell.value}`);
        add(`${cell.evidence.length ? "STRUCTURED_EXTRACTION" : "UNVERIFIED"} / ${cell.evidence.map(reference).join(", ") || "No supporting field supplied"}`, "meta");
      }
      add(`AI-assisted interpretation (MODEL_INFERENCE): ${dimension.interpretation}`, "boundary");
    }
    add("What the records suggest", "heading");
    for (const claim of researchCase.content.takeaways) {
      add(`${claim.evidenceClass}: ${claim.text.replace(/^(SOURCE_FACT|MODEL_INFERENCE):\s*/, "")}`);
      if (claim.evidence.length) add(`Supporting fields: ${claim.evidence.map(reference).join(", ")}`, "meta");
    }
    add("Limits and next questions", "heading");
    add(researchCase.content.cannotEstablish, "boundary");
    researchCase.content.nextQuestions.forEach((question, index) => add(`${index + 1}. ${question}`));
    add(`MODEL_INFERENCE / Case selection: ${researchCase.content.selectionRationale}`, "meta");
    if (researchCase.content.readingReferences?.length) {
      add("Further reading / separate from the saved study records", "heading");
      add(readingBoundary, "boundary");
      for (const reference of researchCase.content.readingReferences) {
        add(reference.title, "heading");
        add(readingMetadata(reference), "meta");
        add(`${reference.citation}${reference.doi ? ` / DOI ${reference.doi}` : ""}`);
        add(reference.note);
        add(`Availability: ${reference.availabilityNote}`, "meta");
        if (reference.url) link("External document", reference.url);
        else if (reference.checkedUrl) add(`Unavailable checked link (not an active document link): ${reference.checkedUrl}`, "meta");
        if (reference.notice) {
          add(`${reference.notice.kind === "correction" ? "Author correction" : "Retraction notice"} / ${reference.notice.date}`, "heading");
          add(reference.notice.note, "boundary");
          link(reference.notice.title, reference.notice.url);
        }
      }
    }
  }
  add("Saved study records", "heading");
  add("These values come from the saved study records. They are not a new check of the public record.");
  for (const capture of manifest.savedStudies) {
    add(`${capture.nctId} / saved record`, "heading");
    add(capture.record.briefTitle);
    add(`Captured: ${capture.retrievedAt} / registry update: ${present(capture.record.provenance.registryLastUpdatePostedDate)}`, "meta");
    for (const field of compareCaptures(capture, capture).fields) {
      add(`${field.label}: ${field.before}`);
      add(`Saved copy / not checked again. Source field: ${field.baselineLocators.join("; ") || "Not captured"}`, "meta");
    }
  }
  if (manifest.savedPrimaryOutcomes) {
    const view = manifest.savedPrimaryOutcomes;
    add("What each study planned to measure", "heading");
    add(`${view.studyCount} studies / ${view.entryCount} registered primary-outcome entries`);
    add(view.label, "boundary");
    add(`${view.limitation} Checking for updates or comparing saved versions does not change this saved view.`, "boundary");
    for (const study of view.studies) {
      add(`${study.nctId} / saved outcome fields`, "heading");
      add(`Saved copy: ${study.retrievedAt}\nRegistry update: ${present(study.registryLastUpdate)}`, "meta");
      const missing = (status: string) => status === "not_captured" ? "Not captured" : "Not reported in this captured response";
      add(`Registered conditions: ${study.context.conditions.join("; ") || missing(study.contextStatus.conditions)}`);
      add(`Interventions: ${study.context.interventions.map(item => `${item.name}${item.type ? ` (${item.type})` : ""}`).join("; ") || missing(study.contextStatus.interventions)}`);
      add(`Phase: ${study.context.phases.join("; ") || missing(study.contextStatus.phases)}`);
      if (!study.entries.length) add(missing(study.status));
      for (const entry of study.entries) {
        add(`Entry ${entry.index + 1} / ${entry.evidenceClass}`, "heading");
        add(`Registered primary measure: ${outcomeFieldText(entry.measure)}`);
        add(`Registered time frame: ${outcomeFieldText(entry.timeFrame)}`);
        add(`Measure availability: ${entry.measure.status}\nTime-frame availability: ${entry.timeFrame.status}\nParent source locator: ${entry.parentLocator}\nDerived measure pointer: ${entry.measureLocator ?? outcomeFieldText(entry.measure)}\nDerived time-frame pointer: ${entry.timeFrameLocator ?? outcomeFieldText(entry.timeFrame)}`, "meta");
      }
      add(`Original response SHA-256: ${study.rawSha256}\nSaved projection SHA-256: ${study.projectedSha256}`, "meta");
      link("Open current official record (may contain newer information)", study.sourceUrl);
    }
    add("Child pointers are derived and verified within each saved capture. Entry numbers identify array positions, not identities across registry versions.", "meta");
  }
  add("Displayed comparisons", "heading");
  if (!manifest.comparisons.length) add("No new check or comparison of saved versions has been added to this brief.");
  for (const pair of manifest.comparisons) {
    add(`${pair.nctId} / ${stateLabel[pair.mode]}`, "heading");
    add(`Baseline capture: ${pair.baseline.retrievedAt}\nComparison capture: ${pair.current.retrievedAt}\nComparator: ${pair.comparatorVersion}`, "meta");
    for (const field of pair.fields) {
      add(`${field.label} / ${field.state.replaceAll("_", " ")}`, "heading");
      add(`Baseline: ${field.before}`);
      add(`Comparison: ${field.after}`);
      if (field.note) add(field.note, "boundary");
      add(`Baseline locator: ${field.baselineLocators.join("; ") || "Not captured"}\nComparison locator: ${field.currentLocators.join("; ") || "Not captured"}`, "meta");
    }
  }
  add("Source details and technical checks", "heading");
  add(manifest.source);
  link("Source terms", manifest.sourceTerms);
  add(manifest.scope);
  const captures = new Map<string, Capture | Manifest["comparisons"][number]["baseline"]>();
  const retain = (capture: Capture | Manifest["comparisons"][number]["baseline"]) => captures.set(`${capture.nctId}:${capture.retrievedAt}:${capture.projectedSha256}`, capture);
  manifest.savedStudies.forEach(retain);
  manifest.comparisons.forEach((pair) => { retain(pair.baseline); retain(pair.current); });
  for (const capture of captures.values()) {
    add(`${capture.nctId} / capture ${capture.retrievedAt}`, "heading");
    add(`Processed: ${capture.processedAt}\nTransformation: ${capture.transformationVersion}\nRequested fields: ${capture.requestedFields.join(", ")}\nOriginal response SHA-256: ${capture.rawSha256}\nExported projection SHA-256: ${capture.projectedSha256}\nNormalized record SHA-256: ${capture.normalizedSha256}`, "meta");
    link("Official record", `https://clinicaltrials.gov/study/${capture.nctId}`);
    link("Registry API request", capture.requestUrl);
  }
  if (researchCase) {
    add("Case evidence references / saved sources", "heading");
    add(`Case: ${researchCase.content.id}\nCase content SHA-256: ${researchCase.contentSha256}\nVerification: ${researchCase.verificationVersion}`, "meta");
    evidence.forEach((item, index) => {
      add(`E${index + 1} / ${item.nctId}`, "heading");
      add(`Captured: ${item.retrievedAt}\nRetained source: ${item.sourcePath}\nField: ${item.locator}`, "meta");
      add(typeof item.expectedValue === "string" ? item.expectedValue : JSON.stringify(item.expectedValue));
      add(`Original response SHA-256: ${item.rawSha256}\nField value SHA-256: ${item.valueSha256}`, "meta");
      link("Official source", item.sourceUrl);
    });
  }
  blocks.push({ text: "Reproducibility and limitations", kind: "heading", keepWithNext: 2 });
  add(manifest.replayInstructions);
  add(manifest.limitations, "boundary");
  return blocks;
}

async function readFont(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) throw new Error("PDF_FONT_UNAVAILABLE");
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** Renders the selected session without registry requests. Only local font assets are loaded. */
export async function sessionPdf(savedStudies: Capture[], comparisons: CapturedComparison[], exportedAt: string, researchCase?: VerifiedCase): Promise<Uint8Array> {
  const manifest = sessionManifest(savedStudies, comparisons, exportedAt, researchCase);
  const blocks = documentBlocks(manifest);
  const [regular, bold] = await Promise.all([readFont("/fonts/NotoSans-Regular.ttf"), readFont("/fonts/NotoSans-Bold.ttf")]);
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true, putOnlyUsedFonts: true });
  for (const [style, bytes] of [["normal", regular], ["bold", bold]] as const) {
    doc.addFileToVFS(`${style}.ttf`, bytes);
    doc.addFont(`${style}.ttf`, "NotoSans", style);
  }
  doc.setProperties({ title: researchCase?.content.title ?? "Synapse Atlas research brief", author: "Synapse Atlas", subject: "Saved public study records and labelled interpretation" });

  // jsPDF uses the font's cmap for Unicode encoding. Reject absent glyphs before
  // producing a misleading document; the CSV/JSON remain available in the UI.
  for (const style of ["normal", "bold"]) {
    doc.setFont("NotoSans", style);
    const font = doc.getFont().metadata as { characterToGlyph: (point: number) => number };
    for (const char of new Set(blocks.map((block) => block.text).join(""))) {
      const point = char.codePointAt(0)!;
      if (char !== "\n" && char !== "\r" && char !== "\t" && (point > 0xffff || !font.characterToGlyph(point))) throw new Error(`PDF_UNSUPPORTED_GLYPH: U+${point.toString(16).toUpperCase()}`);
    }
  }
  let y = MARGIN;
  function pageHeader() {
    doc.setFont("NotoSans", "bold"); doc.setFontSize(8); doc.setTextColor(54, 82, 71);
    doc.text("SYNAPSE ATLAS / RESEARCH BRIEF", MARGIN, MARGIN);
    doc.setDrawColor(210, 220, 215); doc.line(MARGIN, MARGIN + 10, PAGE_WIDTH - MARGIN, MARGIN + 10);
    y = MARGIN + 32;
  }
  pageHeader();
  const fontSize = (block: Block) => block.kind === "title" ? 21 : block.kind === "heading" ? 12 : block.kind === "meta" || block.kind === "link" ? 8 : 10;
  function measuredHeight(block: Block) {
    const size = fontSize(block);
    doc.setFont("NotoSans", block.kind === "title" || block.kind === "heading" ? "bold" : "normal");
    doc.setFontSize(size);
    return (doc.splitTextToSize(block.text, PAGE_WIDTH - MARGIN * 2) as string[]).length * size * 1.45 + 8;
  }
  for (const [index, block] of blocks.entries()) {
    const size = fontSize(block);
    const weight = block.kind === "title" || block.kind === "heading" ? "bold" : "normal";
    const color: [number, number, number] = block.kind === "link" ? [29, 83, 124] : block.kind === "boundary" ? [119, 76, 22] : block.kind === "meta" ? [79, 92, 85] : [28, 43, 35];
    const style = () => { doc.setFont("NotoSans", weight); doc.setFontSize(size); doc.setTextColor(...color); };
    style();
    const lines = doc.splitTextToSize(block.text.replace(/\t/g, "    "), PAGE_WIDTH - MARGIN * 2) as string[];
    const lineHeight = size * 1.45;
    const height = lines.length * lineHeight + 8;
    // Keep ordinary paragraphs and citation URLs whole. Truly long fields still
    // stream over as many pages as needed, without discarding any lines.
    let reserve = height <= 220 ? height : lineHeight * 2;
    if (block.kind === "heading") {
      for (let next = index + 1; next < blocks.length; next++) {
        reserve += Math.min(measuredHeight(blocks[next]), 160) + (blocks[next].kind === "heading" ? 10 : 0);
        if (blocks[next].kind !== "heading" && next - index >= (block.keepWithNext ?? 1)) break;
      }
      style();
    }
    if (block.kind === "heading") y += 10;
    if (y + reserve > CONTENT_BOTTOM) { doc.addPage(); pageHeader(); style(); }
    for (const line of lines) {
      if (y + lineHeight > CONTENT_BOTTOM) { doc.addPage(); pageHeader(); style(); }
      doc.text(line, MARGIN, y);
      if (block.url) {
        const destination = new URL(block.url);
        if (destination.protocol !== "https:") throw new Error("PDF_UNSAFE_LINK");
        doc.link(MARGIN, y - size, Math.min(PAGE_WIDTH - MARGIN * 2, doc.getTextWidth(line)), lineHeight, { url: block.url });
      }
      y += lineHeight;
    }
    y += block.kind === "title" ? 12 : block.kind === "meta" ? 5 : 8;
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFont("NotoSans", "normal"); doc.setFontSize(7.5); doc.setTextColor(79, 92, 85);
    doc.setDrawColor(210, 220, 215); doc.line(MARGIN, PAGE_HEIGHT - 37, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 37);
    doc.text("Research use only / registered endpoints are not results", MARGIN, PAGE_HEIGHT - 24);
    doc.text(`${page} / ${pages}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 24, { align: "right" });
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
