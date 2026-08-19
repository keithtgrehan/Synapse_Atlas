import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import {
  programmeSourceSnapshotSchema,
  type ProgrammeSourceSnapshot,
} from "../domain/programs";
import { nctIdSchema, partialDateValueSchema } from "../domain/trials";
import { sha256Bytes } from "../evidence/provenance";
import { clinicalTrialsFixtureMetadataSchema } from "./clinicaltrials";

const nonBlankTextSchema = z.string().trim().min(1).max(5_000);

export const programmeFixturePageSchema = z
  .object({
    totalCount: z.literal(1),
    studies: z
      .array(
        z
          .object({
            protocolSection: z
              .object({
                identificationModule: z
                  .object({
                    nctId: nctIdSchema,
                    briefTitle: nonBlankTextSchema,
                  })
                  .strict(),
                statusModule: z
                  .object({
                    overallStatus: nonBlankTextSchema,
                    startDateStruct: z
                      .object({ date: partialDateValueSchema })
                      .strict(),
                    lastUpdatePostDateStruct: z
                      .object({ date: z.iso.date() })
                      .strict(),
                  })
                  .strict(),
                sponsorCollaboratorsModule: z
                  .object({
                    leadSponsor: z
                      .object({ name: nonBlankTextSchema })
                      .strict(),
                  })
                  .strict(),
                conditionsModule: z
                  .object({
                    conditions: z.array(nonBlankTextSchema).min(1).max(100),
                  })
                  .strict(),
                armsInterventionsModule: z
                  .object({
                    interventions: z
                      .array(
                        z.object({ name: nonBlankTextSchema }).strict(),
                      )
                      .min(1)
                      .max(200),
                  })
                  .strict(),
              })
              .strict(),
          })
          .strict(),
      )
      .length(1),
    nextPageToken: nonBlankTextSchema.optional(),
  })
  .strict();

export type ValidatedProgrammeFixture = {
  snapshot: ProgrammeSourceSnapshot;
  fixtureBytes: Uint8Array;
  fixture: z.infer<typeof programmeFixturePageSchema>;
  metadata: z.infer<typeof clinicalTrialsFixtureMetadataSchema>;
};

export function validateProgrammeFixture(
  snapshotInput: ProgrammeSourceSnapshot,
  fixtureBytes: Uint8Array,
  metadataInput: unknown,
): ValidatedProgrammeFixture {
  const snapshot = programmeSourceSnapshotSchema.parse(snapshotInput);
  const metadata = clinicalTrialsFixtureMetadataSchema.parse(metadataInput);
  const actualHash = sha256Bytes(fixtureBytes);

  if (
    actualHash !== snapshot.responseSha256 ||
    actualHash !== metadata.contentSha256
  ) {
    throw new Error("PROGRAMME_FIXTURE_HASH_MISMATCH");
  }

  let decoded: unknown;

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(fixtureBytes);
    decoded = JSON.parse(text) as unknown;
  } catch {
    throw new Error("INVALID_PROGRAMME_FIXTURE_ENCODING");
  }

  const fixture = programmeFixturePageSchema.parse(decoded);
  const study = fixture.studies[0];
  const protocol = study.protocolSection;
  const observed = snapshot.observedRegistryFacts;

  if (
    metadata.externalId !== snapshot.externalId ||
    metadata.sourceId !== snapshot.sourceId ||
    metadata.provider !== snapshot.provider ||
    metadata.sourceUrl !== snapshot.apiRequestUrl ||
    metadata.retrievedAt !== snapshot.retrievedAt ||
    metadata.processedAt !== snapshot.processedAt ||
    metadata.registryLastUpdatePostedDate !==
      snapshot.registryLastUpdatePostedDate ||
    metadata.attribution !== snapshot.attribution
  ) {
    throw new Error("PROGRAMME_FIXTURE_METADATA_MISMATCH");
  }

  if (
    protocol.identificationModule.nctId !== observed.nctId ||
    protocol.identificationModule.briefTitle !== observed.briefTitle ||
    protocol.sponsorCollaboratorsModule.leadSponsor.name !==
      observed.reportedSponsorOrganisation ||
    !sameStrings(
      protocol.conditionsModule.conditions,
      observed.reportedConditions,
    ) ||
    !sameStrings(
      protocol.armsInterventionsModule.interventions.map(
        (intervention) => intervention.name,
      ),
      observed.reportedInterventions,
    ) ||
    protocol.statusModule.overallStatus !== observed.overallStatus ||
    protocol.statusModule.startDateStruct.date !==
      observed.registeredStartDate ||
    protocol.statusModule.lastUpdatePostDateStruct.date !==
      observed.registryLastUpdatePostedDate
  ) {
    throw new Error("PROGRAMME_FIXTURE_OBSERVATION_MISMATCH");
  }

  const locatorExpectations: Readonly<Record<string, unknown>> = {
    nctId: observed.nctId,
    briefTitle: observed.briefTitle,
    reportedSponsorOrganisation: observed.reportedSponsorOrganisation,
    reportedConditions: observed.reportedConditions,
    reportedInterventions:
      protocol.armsInterventionsModule.interventions,
    overallStatus: observed.overallStatus,
    registeredStartDate: observed.registeredStartDate,
    registryLastUpdatePostedDate:
      observed.registryLastUpdatePostedDate,
  };

  for (const [field, locator] of Object.entries(snapshot.fieldLocators)) {
    if (
      JSON.stringify(resolveJsonPointer(fixture, locator)) !==
      JSON.stringify(locatorExpectations[field])
    ) {
      throw new Error("PROGRAMME_FIXTURE_LOCATOR_MISMATCH");
    }
  }

  return { snapshot, fixtureBytes, fixture, metadata };
}

export async function readAndValidateProgrammeFixture(
  snapshot: ProgrammeSourceSnapshot,
  repositoryRoot = process.cwd(),
): Promise<ValidatedProgrammeFixture> {
  const [fixtureBytes, metadataText] = await Promise.all([
    readFile(path.join(repositoryRoot, snapshot.fixturePath)),
    readFile(path.join(repositoryRoot, snapshot.metadataPath), "utf8"),
  ]);

  return validateProgrammeFixture(
    snapshot,
    fixtureBytes,
    JSON.parse(metadataText) as unknown,
  );
}

function sameStrings(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function resolveJsonPointer(value: unknown, pointer: string): unknown {
  if (!pointer.startsWith("/")) {
    throw new Error("INVALID_JSON_POINTER");
  }

  return pointer
    .slice(1)
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((current, segment) => {
      if (Array.isArray(current)) {
        const index = Number(segment);

        if (!Number.isInteger(index) || current[index] === undefined) {
          throw new Error("INVALID_JSON_POINTER");
        }

        return current[index];
      }

      if (
        current === null ||
        typeof current !== "object" ||
        !(segment in current)
      ) {
        throw new Error("INVALID_JSON_POINTER");
      }

      return (current as Record<string, unknown>)[segment];
    }, value);
}
