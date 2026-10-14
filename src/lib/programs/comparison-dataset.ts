import { readFile } from "node:fs/promises";
import path from "node:path";
import { sha256Bytes } from "../evidence/provenance";
import {
  buildComparisonCatalog,
  comparisonFixtureRecordFromValidatedFixture,
  type ComparisonCatalog,
} from "../domain/comparisons";
import { readAndValidateProgrammeFixture } from "../fixtures/programs";
import { programmeMappingDataset } from "./dataset";

export async function loadComparisonCatalog(
  repositoryRoot = process.cwd(),
): Promise<ComparisonCatalog> {
  const packetHash = sha256Bytes(await readFile(path.join(repositoryRoot, "data/program-mappings/review-2026-10-13.md")));
  if (programmeMappingDataset.mappingAssertions.some((mapping) => mapping.evidenceClass === "MODEL_INFERENCE" && mapping.reviewPacketSha256 !== packetHash)) throw new Error("MAPPING_REVIEW_PACKET_MISMATCH");
  const validatedFixtures = await Promise.all(
    programmeMappingDataset.sourceSnapshots.map((snapshot) =>
      readAndValidateProgrammeFixture(snapshot, repositoryRoot),
    ),
  );

  return buildComparisonCatalog(
    programmeMappingDataset,
    validatedFixtures.map(comparisonFixtureRecordFromValidatedFixture),
  );
}
