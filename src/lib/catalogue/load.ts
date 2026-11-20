import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Capture } from "../snapshots/model";
import {
  catalogueManifestSchema,
  mappCollectionId,
  mappManifestSchema,
  mappNctIds,
  researchManifestSchema,
  type ResearchManifest,
} from "./model";

export async function loadResearchManifest(root = process.cwd()) {
  return researchManifestSchema.parse(JSON.parse(await readFile(path.join(root, "data/research-catalogue/v1/manifest.json"), "utf8")));
}

export async function loadMappManifest(root = process.cwd()) {
  return mappManifestSchema.parse(JSON.parse(await readFile(path.join(root, "data/research-cases/mdma-ptsd/v1/manifest.json"), "utf8")));
}

/** The aggregate is a view only: neither retained source manifest is rewritten. */
export async function loadCatalogueManifest(root = process.cwd()): Promise<ResearchManifest> {
  const [research, mapp] = await Promise.all([
    loadResearchManifest(root),
    loadMappManifest(root),
  ]);
  return catalogueManifestSchema.parse({
    version: "1",
    capturedAt: mapp.capturedAt,
    selectionMethod: `${research.selectionMethod} ${mapp.selectionMethod}`,
    fields: research.fields,
    entries: [...research.entries, ...mapp.entries],
    groups: [...research.groups, ...mapp.groups],
  });
}
export function validateCollectionMembership(manifest: ResearchManifest, catalogue: Capture[]) {
  const ids = new Set(catalogue.map((item) => item.nctId));
  const groupIds = new Set(manifest.groups.map((group) => group.id));
  const assigned = new Set(manifest.groups.flatMap((group) => group.studyIds));
  const entryIds = new Set(manifest.entries.map((entry) => entry.nctId));
  if (ids.size !== catalogue.length || entryIds.size !== manifest.entries.length || groupIds.size !== manifest.groups.length || assigned.size !== ids.size ||
      [...assigned].some((id) => !ids.has(id)) || manifest.groups.some((group) => new Set(group.studyIds).size !== group.studyIds.length)) throw new Error("CATALOGUE_GROUP_MEMBERSHIP_INVALID");
  if (manifest.groups.some((group) => group.id !== mappCollectionId && group.studyIds.some((id) => mappNctIds.includes(id as typeof mappNctIds[number]))))
    throw new Error("CATALOGUE_MAPP_CONTEXT_MIXED");
  for (const entry of manifest.entries) {
    if (!ids.has(entry.nctId) || entry.groupIds.some((id) => !manifest.groups.find((group) => group.id === id)?.studyIds.includes(entry.nctId)) ||
        manifest.groups.some((group) => group.studyIds.includes(entry.nctId) && !entry.groupIds.includes(group.id))) throw new Error("CATALOGUE_ENTRY_GROUP_MISMATCH");
  }
}
