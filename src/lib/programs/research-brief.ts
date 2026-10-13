import { readFile } from "node:fs/promises";
import path from "node:path";
import manifestInput from "../../../data/comparison/2026-10-13/manifest.json";
import { briefManifestSchema, validateBriefSnapshot } from "../domain/brief-snapshots";
import { buildResearchBrief } from "../domain/research-brief";
import type { ComparisonResult } from "../domain/comparisons";
import { programmeMappingDataset } from "./dataset";

export async function loadResearchBrief(comparison: ComparisonResult, repositoryRoot = process.cwd()) {
  const manifest = briefManifestSchema.parse(manifestInput);
  const expectedIds = new Set(programmeMappingDataset.sourceSnapshots.map((s) => s.externalId));
  if (manifest.snapshots.some((s) => !expectedIds.has(s.nctId))) throw new Error("UNEXPECTED_BRIEF_COVERAGE");
  const trials = await Promise.all(manifest.snapshots.map(async (snapshot) => {
    const bytes = await readFile(path.join(repositoryRoot, "data/comparison", manifest.version, `${snapshot.nctId}.json`));
    return validateBriefSnapshot(snapshot, bytes);
  }));
  return buildResearchBrief(comparison, trials);
}
