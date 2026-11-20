import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { compareCaptures } from "../../src/lib/snapshots/compare";
import { loadReplayPair, loadSnapshotCatalogue } from "../../src/lib/snapshots/catalogue";
import { sessionPdf } from "../../src/app/studies/session-pdf";
import { loadResearchCases } from "../../src/lib/cases/load";
import { sessionCsv, sessionManifest } from "../../src/app/studies/session-export";

async function fonts<T>(run: (calls: string[]) => Promise<T>) {
  const original = globalThis.fetch, calls: string[] = [];
  globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = String(input); calls.push(url);
    const name = url.endsWith("NotoSans-Bold.ttf") ? "NotoSans-Bold.ttf" : "NotoSans-Regular.ttf";
    return new Response(await readFile(path.join(process.cwd(), "public/fonts", name)));
  }) as typeof fetch;
  try { return await run(calls); } finally { globalThis.fetch = original; }
}
const pages = (pdf: Uint8Array) => (new TextDecoder("latin1").decode(pdf).match(/\/Type \/Page\b/g) ?? []).length;

describe("session PDF", () => {
  it("exports the MAPP case and its external reading without retrieving linked documents", async () => fonts(async calls => {
    const catalogue = await loadSnapshotCatalogue();
    const researchCase = (await loadResearchCases(catalogue)).find(item => item.content.id === "mdma-ptsd-design-context")!;
    const selected = catalogue.filter(item => researchCase.content.studyIds.includes(item.nctId));
    const exportedAt = "2026-11-20T12:00:00Z";
    const pdf = await sessionPdf(selected, [], exportedAt, researchCase);
    expect(calls).toEqual(["/fonts/NotoSans-Regular.ttf", "/fonts/NotoSans-Bold.ttf"]);
    expect(pages(pdf)).toBeGreaterThan(3);
    if (process.env.SYNAPSE_PDF_MAPP_OUTPUT) {
      const output = process.env.SYNAPSE_PDF_MAPP_OUTPUT;
      await writeFile(output, pdf);
      await writeFile(`${output}.json`, JSON.stringify(sessionManifest(selected, [], exportedAt, researchCase)));
      await writeFile(`${output}.csv`, sessionCsv(selected, [], exportedAt, researchCase));
    }
  }));
  it("renders a complete guided case with all selected saved evidence", async () => fonts(async () => {
    const catalogue = await loadSnapshotCatalogue();
    const researchCase = (await loadResearchCases(catalogue))[0]!;
    const selected = catalogue.filter((capture) => researchCase.content.studyIds.includes(capture.nctId));
    const pdf = await sessionPdf(selected, [], "2026-11-20T12:00:00Z", researchCase);
    expect(selected).toHaveLength(3);
    expect(pages(pdf)).toBeGreaterThan(3);
    if (process.env.SYNAPSE_PDF_GUIDED_OUTPUT) await writeFile(process.env.SYNAPSE_PDF_GUIDED_OUTPUT, pdf);
  }));
  it("uses exactly the two local font assets and never a registry request", async () => fonts(async calls => {
    const pair = (await loadReplayPair("NCT03866174"))!;
    const pdf = await sessionPdf([pair.current], [{ mode: "replay", diff: compareCaptures(pair.baseline, pair.current) }], "2026-11-20T12:00:00Z");
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
    expect(calls).toEqual(["/fonts/NotoSans-Regular.ttf", "/fonts/NotoSans-Bold.ttf"]);
  }));
  it("fails clearly when a local font cannot load", async () => {
    const original = globalThis.fetch; globalThis.fetch = vi.fn(async () => new Response("", { status: 404 })) as typeof fetch;
    try { await expect(sessionPdf([], [], "2026-11-20T12:00:00Z")).rejects.toThrow("PDF_FONT_UNAVAILABLE"); } finally { globalThis.fetch = original; }
  });
  it("rejects unsupported glyphs rather than omitting them", async () => fonts(async () => {
    const catalogue = await loadSnapshotCatalogue(); const hostile = structuredClone(catalogue[0]!); hostile.record.briefTitle = "漢";
    await expect(sessionPdf([hostile], [], "2026-11-20T12:00:00Z")).rejects.toThrow("PDF_UNSUPPORTED_GLYPH");
  }));
  it("paginates a genuinely long retained field", async () => fonts(async () => {
    const catalogue = await loadSnapshotCatalogue(); const short = await sessionPdf([catalogue[0]!], [], "2026-11-20T12:00:00Z");
    const long = structuredClone(catalogue[0]!); long.record.briefTitle = `${"long retained evidence ".repeat(500)}END_MARKER_927`;
    const longPdf = await sessionPdf([long], [], "2026-11-20T12:00:00Z");
    expect(pages(longPdf)).toBeGreaterThan(pages(short));
    if (process.env.SYNAPSE_PDF_LONG_OUTPUT) await writeFile(process.env.SYNAPSE_PDF_LONG_OUTPUT, longPdf);
  }));
  it("keeps the original multi-entry selection when font loading is asynchronous", async () => {
    const all = await loadSnapshotCatalogue();
    const selected = all.filter(c => ["NCT03559192", "NCT01360645"].includes(c.nctId));
    const before = structuredClone(selected);
    const regular = await readFile(path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf"));
    const bold = await readFile(path.join(process.cwd(), "public/fonts/NotoSans-Bold.ttf"));
    const original = globalThis.fetch;
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    const requests: string[] = [];
    globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
      requests.push(String(input)); await pending;
      return new Response(String(input).includes("Bold") ? bold : regular);
    }) as typeof fetch;
    try {
      const output = sessionPdf(selected, [], "2026-11-20T12:00:00Z");
      selected.splice(0, selected.length, all.find(c => c.nctId === "NCT04581902")!);
      release();
      const pdf = await output;
      expect(requests).toEqual(["/fonts/NotoSans-Regular.ttf", "/fonts/NotoSans-Bold.ttf"]);
      expect(pages(pdf)).toBeGreaterThan(1);
      if (process.env.SYNAPSE_PDF_OUTCOME_OUTPUT) {
        const outputPath = process.env.SYNAPSE_PDF_OUTCOME_OUTPUT;
        await writeFile(outputPath, pdf);
        await writeFile(`${outputPath}.json`, JSON.stringify(sessionManifest(before, [], "2026-11-20T12:00:00Z")));
        await writeFile(`${outputPath}.csv`, sessionCsv(before, [], "2026-11-20T12:00:00Z"));
      }
    } finally { release(); globalThis.fetch = original; }
  });
  it("renders saved, replay, current and custom-selection states", async () => fonts(async () => {
    const [catalogue, pair] = await Promise.all([loadSnapshotCatalogue(), loadReplayPair("NCT03866174")]); const diff = compareCaptures(pair!.baseline, pair!.current);
    const modes = [sessionPdf([catalogue[0]!], [], "2026-11-20T12:00:00Z"), sessionPdf([pair!.current], [{ mode: "replay", diff }], "2026-11-20T12:00:00Z"), sessionPdf([pair!.current], [{ mode: "current", diff }], "2026-11-20T12:00:00Z"), sessionPdf([catalogue[1]!, catalogue[2]!], [], "2026-11-20T12:00:00Z")];
    for (const pdf of await Promise.all(modes)) expect(pages(pdf)).toBeGreaterThan(0);
  }));
});
