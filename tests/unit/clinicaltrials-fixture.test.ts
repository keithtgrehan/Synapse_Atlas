import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  clinicalTrialsFixtureMetadataSchema,
  clinicalTrialsFixtureSchema,
  evaluateClinicalTrialsFixtureSource,
} from "../../src/lib/fixtures/clinicaltrials";
import { sha256Bytes } from "../../src/lib/evidence/provenance";
import {
  clinicalTrialsPolicy,
  sourcePolicySchema,
} from "../../src/lib/sources/policies";

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
    const [fixtureBytes, metadataText] = await Promise.all([
      readFile(fixtureUrl),
      readFile(metadataUrl, "utf8"),
    ]);
    const fixtureText = fixtureBytes.toString("utf8");
    const fixture = clinicalTrialsFixtureSchema.parse(JSON.parse(fixtureText));
    const metadata = clinicalTrialsFixtureMetadataSchema.parse(
      JSON.parse(metadataText),
    );
    const sha256 = sha256Bytes(fixtureBytes);
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
    expect(sha256Bytes(Buffer.concat([fixtureBytes, Buffer.from(" ")])))
      .not.toBe(metadata.contentSha256);
    expect(metadata.registryLastUpdatePostedDate).not.toBe(
      metadata.retrievedAt.slice(0, 10),
    );
    expect(metadata.registryLastUpdatePostedDate).not.toBe(
      metadata.processedAt.slice(0, 10),
    );
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

  it("rejects malformed metadata and processing before retrieval", async () => {
    const metadata = JSON.parse(await readFile(metadataUrl, "utf8")) as Record<
      string,
      unknown
    >;

    expect(() =>
      clinicalTrialsFixtureMetadataSchema.parse({
        ...metadata,
        contentSha256: "A".repeat(64),
      }),
    ).toThrow(ZodError);
    expect(() =>
      clinicalTrialsFixtureMetadataSchema.parse({
        ...metadata,
        processedAt: "2026-08-14T13:00:00Z",
      }),
    ).toThrow(ZodError);

    for (const sourceUrl of [
      "https://clinicaltrials.gov/api/v2/studies/NCT03866174?query.id=NCT03866174",
      "https://user:secret@clinicaltrials.gov/api/v2/studies?query.id=NCT03866174",
      "https://clinicaltrials.gov:444/api/v2/studies?query.id=NCT03866174",
      "https://clinicaltrials.gov/api/v2/studies?query.id=NCT00000000",
    ]) {
      expect(() =>
        clinicalTrialsFixtureMetadataSchema.parse({ ...metadata, sourceUrl }),
      ).toThrow(ZodError);
    }
  });

  it("evaluates historical fixture access at retrieval time", async () => {
    const metadata = JSON.parse(await readFile(metadataUrl, "utf8")) as {
      sourceId: string;
      sourceUrl: string;
      retrievedAt: string;
    };
    const expiringPolicy = sourcePolicySchema.parse({
      ...clinicalTrialsPolicy,
      expiresAt: "2026-08-15T00:00:00Z",
    });

    expect(
      evaluateClinicalTrialsFixtureSource(metadata, expiringPolicy),
    ).toMatchObject({ allowed: true });
    expect(
      evaluateClinicalTrialsFixtureSource(
        { ...metadata, retrievedAt: "2026-08-15T00:00:00Z" },
        expiringPolicy,
      ),
    ).toEqual({ allowed: false, code: "POLICY_EXPIRED" });
  });
});
