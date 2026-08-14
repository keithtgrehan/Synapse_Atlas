import { readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import { sha256Bytes } from "../../src/lib/evidence/provenance";
import { searchClinicalTrials } from "../../src/lib/sources/clinicaltrials/client";

const fixtureUrl = new URL(
  "../../data/fixtures/clinicaltrials.gov/NCT03866174.json",
  import.meta.url,
);

describe("ClinicalTrials.gov vertical slice", () => {
  it("turns exact official fixture bytes into a source-linked trial record", async () => {
    const fixtureBytes = await readFile(fixtureUrl);
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      new Response(fixtureBytes, {
        headers: { "content-type": "application/json" },
      }),
    );
    const times = [
      "2026-08-14T20:00:00Z",
      "2026-08-14T20:01:00Z",
      "2026-08-14T20:02:00Z",
    ];
    const now = vi.fn(() => new Date(times.shift() ?? "invalid"));

    const result = await searchClinicalTrials(
      { term: "psilocybin depression" },
      { fetch: fetchImplementation, now },
    );
    const trial = result.trials[0];

    expect(trial).toBeDefined();
    expect(trial?.nctId).toBe("NCT03866174");
    expect(trial?.briefTitle).toContain("Psilocybin");
    expect(trial?.conditions).toMatchObject({ state: "reported" });
    expect(trial?.provenance.contentSha256).toBe(sha256Bytes(fixtureBytes));
    expect(trial?.provenance.evidenceClass).toBe("STRUCTURED_EXTRACTION");
    expect(trial?.provenance.retrievedAt).toBe("2026-08-14T20:01:00.000Z");
    expect(trial?.provenance.processedAt).toBe("2026-08-14T20:02:00.000Z");
    expect(trial?.provenance.registryLastUpdatePostedDate).toBe("2026-04-22");
    expect(trial?.provenance.sourceUrl).toBe(
      "https://clinicaltrials.gov/study/NCT03866174",
    );
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });
});
