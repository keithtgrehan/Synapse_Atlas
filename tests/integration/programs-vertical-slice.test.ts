import { describe, expect, it, vi } from "vitest";

import {
  getProgrammeBySlug,
  listProgrammes,
  resolveProgrammeAlias,
  searchProgrammes,
} from "../../src/lib/domain/programs";
import { programmeMappingDataset } from "../../src/lib/programs/dataset";

describe("programme-resolution vertical slice", () => {
  it("loads, searches, resolves, and opens details without network access", () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(new Error("NETWORK_MUST_NOT_BE_USED"));

    try {
      const programmes = listProgrammes(programmeMappingDataset);
      const results = searchProgrammes(programmeMappingDataset, "COMP360");
      const detail = getProgrammeBySlug(
        programmeMappingDataset,
        "comp360-treatment-resistant-depression",
      );
      const resolution = resolveProgrammeAlias(
        "COMP360",
        programmeMappingDataset.mappingAssertions,
      );

      expect(programmes).toHaveLength(13);
      expect(results).toHaveLength(1);
      expect(detail?.programme.canonicalLabel).toBe(
        "COMP360 for treatment-resistant depression",
      );
      expect(detail?.mapping.nctIds.map((nctId) => `/trials/${nctId}`)).toEqual([
        "/trials/NCT05711940",
      ]);
      expect(detail?.sourceSnapshots[0]?.apiRequestUrl).toContain(
        "query.id=NCT05711940",
      );
      expect(resolution).toMatchObject({
        state: "RESOLVED",
        winnerProgrammeId: "programme-comp360-trd",
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
