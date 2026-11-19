import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Capture } from "../snapshots/model";
import { researchManifestSchema, type ResearchManifest } from "./model";

export async function loadResearchManifest(root = process.cwd()) {
  return researchManifestSchema.parse(JSON.parse(await readFile(path.join(root, "data/research-catalogue/v1/manifest.json"), "utf8")));
}
export function validateCollectionMembership(manifest: ResearchManifest, catalogue: Capture[]) {
  const ids = new Set(catalogue.map((item) => item.nctId));
  const groupIds = new Set(manifest.groups.map((group) => group.id));
  const assigned = new Set(manifest.groups.flatMap((group) => group.studyIds));
  if (ids.size !== 39 || groupIds.size !== manifest.groups.length || assigned.size !== ids.size ||
      [...assigned].some((id) => !ids.has(id)) || manifest.groups.some((group) => new Set(group.studyIds).size !== group.studyIds.length)) throw new Error("CATALOGUE_GROUP_MEMBERSHIP_INVALID");
  for (const entry of manifest.entries) {
    if (entry.groupIds.some((id) => !manifest.groups.find((group) => group.id === id)?.studyIds.includes(entry.nctId)) ||
        manifest.groups.some((group) => group.studyIds.includes(entry.nctId) && !entry.groupIds.includes(group.id))) throw new Error("CATALOGUE_ENTRY_GROUP_MISMATCH");
  }
}
