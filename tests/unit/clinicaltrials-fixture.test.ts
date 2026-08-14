import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  clinicalTrialsFixtureMetadataSchema,
  clinicalTrialsFixtureSchema,
} from "../../src/lib/fixtures/clinicaltrials";

const fixtureUrl = new URL(
  "../../data/fixtures/clinicaltrials.gov/NCT03866174.json",
  import.meta.url,
);
const metadataUrl = new URL(
  "../../data/fixtures/clinicaltrials.gov/NCT03866174.metadata.json",
  import.meta.url,
);

describe("ClinicalTrials.gov fixture", () => {
  it("preserves a traceable, byte-verified official API response", async () => {
    const [fixtureText, metadataText] = await Promise.all([
      readFile(fixtureUrl, "utf8"),
      readFile(metadataUrl, "utf8"),
    ]);
    const fixture = clinicalTrialsFixtureSchema.parse(JSON.parse(fixtureText));
    const metadata = clinicalTrialsFixtureMetadataSchema.parse(
      JSON.parse(metadataText),
    );
    const sha256 = createHash("sha256").update(fixtureText).digest("hex");
    const study = fixture.studies[0];

    expect(study).toBeDefined();
    expect(study?.protocolSection.identificationModule.nctId).toBe(
      metadata.externalId,
    );
    expect(
      study?.protocolSection.statusModule.lastUpdatePostDateStruct.date,
    ).toBe(metadata.registryLastUpdatePostedDate);
    expect(metadata.sourceUrl).toMatch(
      /^https:\/\/clinicaltrials\.gov\/api\/v2\/studies\?/,
    );
    expect(sha256).toBe(metadata.contentSha256);
  });

  it("rejects a malformed fixture with missing required study data", () => {
    expect(() =>
      clinicalTrialsFixtureSchema.parse({
        totalCount: 1,
        studies: [
          {
            protocolSection: {
              identificationModule: {
                nctId: "NCT03866174",
              },
            },
          },
        ],
      }),
    ).toThrow(ZodError);
  });
});
