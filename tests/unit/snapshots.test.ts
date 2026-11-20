import { describe, expect, it } from "vitest";
import { compareCaptures, formatValue } from "../../src/lib/snapshots/compare";
import {
  loadReplayPair,
  loadSnapshotCatalogue,
} from "../../src/lib/snapshots/catalogue";
import {
  createSnapshotBrief,
  snapshotDiffCsv,
} from "../../src/lib/snapshots/export";
import { getClinicalTrialCapture } from "../../src/lib/sources/clinicaltrials/client";
import { sha256Bytes } from "../../src/lib/evidence/provenance";

describe("NCT-first retained snapshot catalogue", () => {
  it("loads 39 standalone captures without consulting programme mappings", async () => {
    const captures = await loadSnapshotCatalogue();
    expect(captures).toHaveLength(39);
    expect(new Set(captures.map((capture) => capture.nctId)).size).toBe(39);
    expect(
      captures.every(
        (capture) => capture.rawSha256 !== capture.projectedSha256,
      ),
    ).toBe(true);
    expect(
      captures.every(
        (capture) =>
          !capture.sourceProjectionJson.includes("contactsLocationsModule"),
      ),
    ).toBe(true);
    expect(
      captures.every(
        (capture) => !capture.sourceProjectionJson.includes("briefSummary"),
      ),
    ).toBe(true);
  });

  it("replays the two retained NCT03866174 captures with semantic, source-linked changes", async () => {
    const pair = await loadReplayPair("NCT03866174");
    expect(pair).not.toBeNull();
    const diff = compareCaptures(pair!.baseline, pair!.current);
    expect(diff.fields.find((field) => field.key === "enrollment")?.state).toBe(
      "not_compared",
    );
    expect(
      diff.fields.find((field) => field.key === "primaryOutcomes")?.state,
    ).toBe("not_compared");
    expect(
      diff.fields.find((field) => field.key === "interventions")?.state,
    ).toBe("not_compared");
    const brief = createSnapshotBrief(diff);
    expect(brief.baseline.rawSha256).toBe(pair!.baseline.rawSha256);
    expect(brief.current.rawSha256).toBe(pair!.current.rawSha256);
    expect(snapshotDiffCsv(diff)).toContain("NCT03866174");
  });

  it("treats reordered unique endpoints as unchanged and duplicates as ambiguous", async () => {
    const pair = await loadReplayPair("NCT03866174");
    const baseline = pair!.current;
    const reordered = structuredClone(baseline);
    const endpoints = reordered.record.primaryOutcomes;
    if (endpoints.state === "reported")
      reordered.record.primaryOutcomes = {
        state: "reported",
        value: [...endpoints.value].reverse(),
      };
    expect(
      compareCaptures(baseline, reordered).fields.find(
        (field) => field.key === "primaryOutcomes",
      )?.state,
    ).toBe("unchanged");
    const duplicate = structuredClone(baseline);
    if (duplicate.record.interventions.state === "reported")
      duplicate.record.interventions = {
        state: "reported",
        value: [
          duplicate.record.interventions.value[0]!,
          duplicate.record.interventions.value[0]!,
        ],
      };
    expect(
      compareCaptures(baseline, duplicate).fields.find(
        (field) => field.key === "interventions",
      )?.state,
    ).toBe("ambiguous");
    expect(
      formatValue({ value: "2026-12", precision: "MONTH", type: "ESTIMATED" }),
    ).toContain("month precision");
  });

  it("keeps missing distinct from removed and preserves partial-date type changes", async () => {
    const pair = await loadReplayPair("NCT03866174");
    const baseline = structuredClone(pair!.current);
    const removed = structuredClone(pair!.current);
    removed.record.leadSponsor = { state: "not_reported", value: null };
    expect(
      compareCaptures(baseline, removed).fields.find(
        (field) => field.key === "leadSponsor",
      )?.state,
    ).toBe("removed");
    const noEarlierSponsor = structuredClone(pair!.current);
    noEarlierSponsor.record.leadSponsor = {
      state: "not_reported",
      value: null,
    };
    expect(
      compareCaptures(noEarlierSponsor, baseline).fields.find(
        (field) => field.key === "leadSponsor",
      )?.state,
    ).toBe("added");
    const changedDate = structuredClone(pair!.current);
    changedDate.record.completionDate = {
      state: "reported",
      value: { value: "2022-06", precision: "MONTH", type: "ESTIMATED" },
    };
    expect(
      compareCaptures(pair!.current, changedDate).fields.find(
        (field) => field.key === "completionDate",
      )?.state,
    ).toBe("changed");
    const futureStatus = structuredClone(pair!.current);
    futureStatus.record.overallStatus = {
      state: "reported",
      value: "FUTURE_STATUS",
    };
    expect(
      compareCaptures(pair!.current, futureStatus).fields.find(
        (field) => field.key === "overallStatus",
      )?.state,
    ).toBe("not_compared");
    expect(pair!.current.record.leadSponsor.state).toBe("reported");
  });

  it("rejects an exact-ID response that returns a different record", async () => {
    const fetch = async () =>
      new Response(
        JSON.stringify({
          totalCount: 1,
          studies: [
            {
              protocolSection: {
                identificationModule: {
                  nctId: "NCT00000000",
                  briefTitle: "Wrong record",
                },
              },
            },
          ],
        }),
        { headers: { "content-type": "application/json" } },
      );
    await expect(
      getClinicalTrialCapture("NCT03866174", {
        fetch,
        now: () => new Date("2026-11-19T12:00:00Z"),
        sleep: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("retains exact live evidence with optional API pagination metadata only after the public-field allowlist passes", async () => {
    const body = JSON.stringify({
      totalCount: 1,
      nextPageToken: "synthetic-opaque-token",
      studies: [
        {
          protocolSection: {
            identificationModule: {
              nctId: "NCT03866174",
              briefTitle: "Safe record",
            },
            statusModule: { overallStatus: "RECRUITING" },
          },
        },
      ],
    });
    const capture = await getClinicalTrialCapture("NCT03866174", {
      fetch: async () =>
        new Response(body, { headers: { "content-type": "application/json" } }),
      now: () => new Date("2026-11-19T12:00:00Z"),
      sleep: async () => undefined,
    });
    expect(capture?.sourceEvidenceMode).toBe("exact-response");
    expect(capture?.rawResponseJson).toBe(body);
    expect(capture?.rawSha256).toBe(sha256Bytes(body));
    const unsafeBody = JSON.stringify({
      totalCount: 1,
      studies: [
        {
          protocolSection: {
            identificationModule: {
              nctId: "NCT03866174",
              briefTitle: "Unsafe",
            },
            contactsLocationsModule: {},
          },
        },
      ],
    });
    await expect(
      getClinicalTrialCapture("NCT03866174", {
        fetch: async () =>
          new Response(unsafeBody, {
            headers: { "content-type": "application/json" },
          }),
        now: () => new Date("2026-11-19T12:00:00Z"),
        sleep: async () => undefined,
      }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});
