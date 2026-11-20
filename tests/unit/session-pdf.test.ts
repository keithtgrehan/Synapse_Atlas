import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { compareCaptures } from "../../src/lib/snapshots/compare";
import { loadReplayPair, loadSnapshotCatalogue } from "../../src/lib/snapshots/catalogue";
import { sessionPdf } from "../../src/app/studies/session-pdf";
import { loadResearchCases } from "../../src/lib/cases/load";

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
    expect(pages(longPdf)).toBeGreaterThanOrEqual(pages(short) + 3);
    if (process.env.SYNAPSE_PDF_LONG_OUTPUT) await writeFile(process.env.SYNAPSE_PDF_LONG_OUTPUT, longPdf);
  }));
  it("renders saved, replay, current and custom-selection states", async () => fonts(async () => {
    const [catalogue, pair] = await Promise.all([loadSnapshotCatalogue(), loadReplayPair("NCT03866174")]); const diff = compareCaptures(pair!.baseline, pair!.current);
    const modes = [sessionPdf([catalogue[0]!], [], "2026-11-20T12:00:00Z"), sessionPdf([pair!.current], [{ mode: "replay", diff }], "2026-11-20T12:00:00Z"), sessionPdf([pair!.current], [{ mode: "current", diff }], "2026-11-20T12:00:00Z"), sessionPdf([catalogue[1]!, catalogue[2]!], [], "2026-11-20T12:00:00Z")];
    for (const pdf of await Promise.all(modes)) expect(pages(pdf)).toBeGreaterThan(0);
  }));
});
