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
