import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  clinicalTrialsApiPageSchema,
  normalizeClinicalTrial,
} from "../../src/lib/domain/trials";
import { compareCaptures } from "../../src/lib/snapshots/compare";
import { loadReplayPair } from "../../src/lib/snapshots/catalogue";
import { sessionManifest } from "../../src/app/studies/session-export";
import type { Capture } from "../../src/lib/snapshots/model";
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
function reconstruct(input: Omit<Capture, "record">): Capture {
  expect(hash(input.sourceProjectionJson)).toBe(input.projectedSha256);
  if (input.rawResponseJson !== undefined)
    expect(hash(input.rawResponseJson)).toBe(input.rawSha256);
  const page = clinicalTrialsApiPageSchema.parse(
    JSON.parse(input.sourceProjectionJson),
  );
  const record = normalizeClinicalTrial(page.studies[0], {
    apiRequestUrl: input.requestUrl,
    retrievedAt: input.retrievedAt,
    processedAt: input.processedAt,
    contentSha256: input.rawSha256,
    requestedFields: new Set(input.requestedFields),
    studyIndex: 0,
  });
  expect(hash(JSON.stringify(record))).toBe(input.normalizedSha256);
  return { ...input, record };
}
describe("replay a downloaded research brief", () => {
  it("reconstructs values and semantic changes exclusively from exported evidence", async () => {
    const retained = (await loadReplayPair("NCT03866174"))!;
    const fallback = sessionManifest(
      [retained.current],
      [
        {
          mode: "replay",
          diff: compareCaptures(retained.baseline, retained.current),
        },
      ],
      "2026-11-19T00:00:00Z",
    );
    // Optional local path lets a reviewer verify a real downloaded bundle with this same test.
    const bundle = process.env.SYNAPSE_BUNDLE_PATH
      ? (JSON.parse(
          await readFile(process.env.SYNAPSE_BUNDLE_PATH, "utf8"),
        ) as typeof fallback)
      : (JSON.parse(JSON.stringify(fallback)) as typeof fallback);
    expect(bundle.format).toBe("synapse-atlas-research-session/v1");
    for (const saved of bundle.savedStudies)
      expect(reconstruct(saved).record).toEqual(saved.record);
    for (const pair of bundle.comparisons) {
      const baseline = reconstruct(pair.baseline as Omit<Capture, "record">);
      const current = reconstruct(pair.current as Omit<Capture, "record">);
      const diff = compareCaptures(baseline, current);
      expect(diff.comparatorVersion).toBe(pair.comparatorVersion);
      expect(diff.fields).toEqual(pair.fields);
    }
  });
});
