import { describe, expect, it, vi } from "vitest";

import {
  ClinicalTrialsClientError,
  getClinicalTrial,
  searchClinicalTrials,
} from "../../src/lib/sources/clinicaltrials/client";

const fixedNow = () => new Date("2026-08-14T21:00:00Z");

const validStudy = {
  protocolSection: {
    identificationModule: {
      nctId: "NCT03866174",
      briefTitle: "A Study of Psilocybin for Major Depressive Disorder (MDD)",
      officialTitle: "A registered study",
    },
    statusModule: {
      overallStatus: "COMPLETED",
      startDateStruct: { date: "2020-01", type: "ACTUAL" },
      lastUpdatePostDateStruct: { date: "2026-04-22" },
    },
    sponsorCollaboratorsModule: {
      leadSponsor: { name: "Usona Institute", class: "OTHER" },
    },
    conditionsModule: { conditions: ["Depressive Disorder, Major"] },
    armsInterventionsModule: {
      interventions: [{ name: "Psilocybin", type: "DRUG" }],
    },
    designModule: {
      studyType: "INTERVENTIONAL",
      phases: ["PHASE2"],
      enrollmentInfo: { count: 104, type: "ACTUAL" },
    },
  },
};

function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(body), { ...init, headers });
}

function deps(fetchImplementation: typeof fetch) {
  return {
    fetch: fetchImplementation,
    now: fixedNow,
    sleep: vi.fn(async () => undefined),
  };
}

describe("ClinicalTrials.gov official API client", () => {
  it("constructs one bounded credential-free official request", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      jsonResponse({ totalCount: 1, studies: [validStudy] }),
    );

    const result = await searchClinicalTrials(
      { term: "  psilocybin depression  ", overallStatus: "RECRUITING" },
      deps(fetchImplementation),
    );

    expect(fetchImplementation).toHaveBeenCalledOnce();
    const [input, init] = fetchImplementation.mock.calls[0]!;
    const url = new URL(String(input));
    expect(url.origin + url.pathname).toBe(
      "https://clinicaltrials.gov/api/v2/studies",
    );
    expect(url.searchParams.get("query.term")).toBe("psilocybin depression");
    expect(url.searchParams.get("filter.overallStatus")).toBe("RECRUITING");
    expect(url.searchParams.get("pageSize")).toBe("10");
    expect(url.searchParams.get("countTotal")).toBe("true");
    expect(url.searchParams.get("sort")).toBe("@relevance");
    expect(url.searchParams.get("fields")?.split(",")).toContain("NCTId");
    expect(url.searchParams.get("fields")?.split(",")).toContain("Phase");
    expect(init?.method).toBe("GET");
    expect(init?.credentials).toBe("omit");
    expect(init?.redirect).toBe("manual");
    expect(new Headers(init?.headers).get("authorization")).toBeNull();
    expect(new Headers(init?.headers).get("cookie")).toBeNull();
    expect(result.trials).toHaveLength(1);
    expect(result.trials[0]?.startDate).toMatchObject({
      state: "reported",
      value: { value: "2020-01", precision: "MONTH" },
    });
  });

  it("uses only an opaque page token on a bounded subsequent page", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      jsonResponse({ studies: [], nextPageToken: "next-token" }),
    );

    await searchClinicalTrials(
      { term: "psilocybin depression", pageToken: "opaque-token" },
      deps(fetchImplementation),
    );

    const url = new URL(String(fetchImplementation.mock.calls[0]?.[0]));
    expect(url.searchParams.get("pageToken")).toBe("opaque-token");
    expect(url.searchParams.has("countTotal")).toBe(false);
    expect(url.searchParams.get("query.term")).toBe("psilocybin depression");
  });

  it("uses exact query.id semantics for an NCT-only search", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      jsonResponse({ totalCount: 1, studies: [validStudy] }),
    );

    await searchClinicalTrials(
      { term: "NCT03866174" },
      deps(fetchImplementation),
    );

    const url = new URL(String(fetchImplementation.mock.calls[0]?.[0]));
    expect(url.searchParams.get("query.id")).toBe("NCT03866174");
    expect(url.searchParams.has("query.term")).toBe(false);
    expect(url.searchParams.has("sort")).toBe(false);
  });

  it("rejects invalid input and pre-approval policy time before fetch", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();

    for (const term of ["", "x", "x".repeat(121), "valid\u0000invalid"]) {
      await expect(
        searchClinicalTrials({ term }, deps(fetchImplementation)),
      ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    }

    await expect(
      searchClinicalTrials(
        { term: "psilocybin", pageToken: "x".repeat(2_049) },
        deps(fetchImplementation),
      ),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

    await expect(
      searchClinicalTrials(
        { term: "psilocybin" },
        {
          ...deps(fetchImplementation),
          now: () => new Date("2026-08-13T23:59:59Z"),
        },
      ),
    ).rejects.toMatchObject({ code: "POLICY_DENIED" });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("rejects misleading status or pagination on an exact NCT search", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();

    await expect(
      searchClinicalTrials(
        { term: "NCT03866174", overallStatus: "RECRUITING" },
        deps(fetchImplementation),
      ),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(
      searchClinicalTrials(
        { term: "NCT03866174", pageToken: "opaque-token" },
        deps(fetchImplementation),
      ),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("does not permit dependency overrides to raise or disable hard bounds", async () => {
    const fetchImplementation = vi.fn<typeof fetch>();
    const invalidOverrides = [
      { timeoutMs: 0 },
      { timeoutMs: 10_001 },
      { timeoutMs: Number.POSITIVE_INFINITY },
      { maxResponseBytes: 0 },
      { maxResponseBytes: 1_048_577 },
      { maxResponseBytes: Number.POSITIVE_INFINITY },
    ];

    for (const override of invalidOverrides) {
      await expect(
        searchClinicalTrials(
          { term: "psilocybin" },
          { ...deps(fetchImplementation), ...override },
        ),
      ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    }

    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  it("rejects manual redirects without issuing a second request", async () => {
    for (const location of [
      "/api/v2/studies?query.term=safe",
      "https://evil.test/collect",
    ]) {
      const fetchImplementation = vi.fn<typeof fetch>(async () =>
        new Response(null, {
          status: 302,
          headers: { location },
        }),
      );

      await expect(
        searchClinicalTrials(
          { term: "credential-sentinel" },
          deps(fetchImplementation),
        ),
      ).rejects.toMatchObject({ code: "REDIRECT_RESPONSE", status: 302 });
      expect(fetchImplementation).toHaveBeenCalledOnce();
    }
  });

  it("retries one transient failure with a fixed bounded delay", async () => {
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: "redacted" }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({ studies: [] }));
    const sleep = vi.fn(async () => undefined);

    await expect(
      searchClinicalTrials(
        { term: "psilocybin" },
        { ...deps(fetchImplementation), sleep },
      ),
    ).resolves.toMatchObject({ trials: [] });
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledExactlyOnceWith(250);
  });

  it("does not retry redirects, ordinary 4xx responses, or invalid JSON", async () => {
    const cases = [
      new Response(null, { status: 302 }),
      jsonResponse({ error: "secret upstream body" }, { status: 400 }),
      new Response("{", {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ];

    for (const response of cases) {
      const fetchImplementation = vi.fn<typeof fetch>(async () => response);

      await expect(
        searchClinicalTrials({ term: "psilocybin" }, deps(fetchImplementation)),
      ).rejects.toBeInstanceOf(ClinicalTrialsClientError);
      expect(fetchImplementation).toHaveBeenCalledOnce();
    }
  });

  it("redacts query, token, URL, and upstream content from errors", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      jsonResponse({ detail: "private-upstream-sentinel" }, { status: 400 }),
    );

    try {
      await searchClinicalTrials(
        {
          term: "private-query-sentinel",
          pageToken: "private-token-sentinel",
        },
        deps(fetchImplementation),
      );
      throw new Error("Expected request to fail");
    } catch (error) {
      expect(JSON.stringify(error)).toBe(
        '{"code":"HTTP_ERROR","status":400,"retryable":false}',
      );
      expect(String(error)).not.toContain("private-query-sentinel");
      expect(String(error)).not.toContain("private-token-sentinel");
      expect(String(error)).not.toContain("private-upstream-sentinel");
      expect(String(error)).not.toContain("clinicaltrials.gov");
    }
  });

  it("rejects wrong content types, invalid UTF-8, and oversized bodies", async () => {
    const wrongType = vi.fn<typeof fetch>(async () =>
      new Response("<html>not json</html>", {
        headers: { "content-type": "text/html" },
      }),
    );
    await expect(
      searchClinicalTrials({ term: "psilocybin" }, deps(wrongType)),
    ).rejects.toMatchObject({ code: "UNEXPECTED_CONTENT_TYPE" });

    const jsonpType = vi.fn<typeof fetch>(async () =>
      new Response("{}", {
        headers: { "content-type": "text/application/jsonp" },
      }),
    );
    await expect(
      searchClinicalTrials({ term: "psilocybin" }, deps(jsonpType)),
    ).rejects.toMatchObject({ code: "UNEXPECTED_CONTENT_TYPE" });

    const invalidUtf8 = vi.fn<typeof fetch>(async () =>
      new Response(new Uint8Array([0xff]), {
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(
      searchClinicalTrials({ term: "psilocybin" }, deps(invalidUtf8)),
    ).rejects.toMatchObject({ code: "INVALID_UTF8" });

    const oversized = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ studies: [], padding: "x".repeat(100) }), {
        headers: { "content-type": "application/json" },
      }),
    );
    await expect(
      searchClinicalTrials(
        { term: "psilocybin" },
        { ...deps(oversized), maxResponseBytes: 20 },
      ),
    ).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });
  });

  it("times out a stalled request and does not retry it", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(
      async (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );

    await expect(
      searchClinicalTrials(
        { term: "psilocybin" },
        { ...deps(fetchImplementation), timeoutMs: 5 },
      ),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(fetchImplementation).toHaveBeenCalledOnce();
  });

  it("keeps the timeout active after headers and cancels a stalled body", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"studies":['));
      },
      cancel() {
        cancelled = true;
      },
    });
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      new Response(stream, {
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(
      searchClinicalTrials(
        { term: "psilocybin" },
        { ...deps(fetchImplementation), timeoutMs: 5 },
      ),
    ).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(fetchImplementation).toHaveBeenCalledOnce();
    expect(cancelled).toBe(true);
  });

  it("maps a body-stream failure to a redacted network error and retries once", async () => {
    const brokenStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("private-body-stream-sentinel"));
      },
    });
    const fetchImplementation = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(brokenStream, {
          headers: { "content-type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ studies: [] }));

    await expect(
      searchClinicalTrials(
        { term: "psilocybin" },
        deps(fetchImplementation),
      ),
    ).resolves.toMatchObject({ trials: [] });
    expect(fetchImplementation).toHaveBeenCalledTimes(2);
  });

  it("looks up details through the approved studies path and exact NCT query", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      jsonResponse({ totalCount: 1, studies: [validStudy] }),
    );

    await expect(
      getClinicalTrial("NCT03866174", deps(fetchImplementation)),
    ).resolves.toMatchObject({ nctId: "NCT03866174" });
    const url = new URL(String(fetchImplementation.mock.calls[0]?.[0]));
    expect(url.pathname).toBe("/api/v2/studies");
    expect(url.searchParams.get("query.id")).toBe("NCT03866174");
    expect(url.searchParams.get("pageSize")).toBe("1");
    expect(url.pathname).not.toContain("NCT03866174");

    await expect(
      getClinicalTrial("nct03866174", deps(fetchImplementation)),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("returns null when an exact detail record is absent", async () => {
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      jsonResponse({ totalCount: 0, studies: [] }),
    );

    await expect(
      getClinicalTrial("NCT00000001", deps(fetchImplementation)),
    ).resolves.toBeNull();
  });

  it("rejects a mismatched record returned for an exact detail lookup", async () => {
    const mismatchedStudy = structuredClone(validStudy);
    mismatchedStudy.protocolSection.identificationModule.nctId = "NCT00000002";
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      jsonResponse({ totalCount: 1, studies: [mismatchedStudy] }),
    );

    await expect(
      getClinicalTrial("NCT03866174", deps(fetchImplementation)),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects oversized pages, duplicate records, and repeated page tokens", async () => {
    const oversizedPage = vi.fn<typeof fetch>(async () =>
      jsonResponse({ studies: Array.from({ length: 11 }, () => validStudy) }),
    );
    await expect(
      searchClinicalTrials({ term: "psilocybin" }, deps(oversizedPage)),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });

    const duplicatePage = vi.fn<typeof fetch>(async () =>
      jsonResponse({ studies: [validStudy, validStudy] }),
    );
    await expect(
      searchClinicalTrials({ term: "psilocybin" }, deps(duplicatePage)),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });

    const repeatedToken = vi.fn<typeof fetch>(async () =>
      jsonResponse({ studies: [], nextPageToken: "same-token" }),
    );
    await expect(
      searchClinicalTrials(
        { term: "psilocybin", pageToken: "same-token" },
        deps(repeatedToken),
      ),
    ).rejects.toMatchObject({ code: "PAGINATION_CYCLE" });
  });

  it("rejects more records than an exact detail request permits", async () => {
    const secondStudy = structuredClone(validStudy);
    secondStudy.protocolSection.identificationModule.nctId = "NCT00000002";
    const fetchImplementation = vi.fn<typeof fetch>(async () =>
      jsonResponse({ studies: [validStudy, secondStudy] }),
    );

    await expect(
      getClinicalTrial("NCT03866174", deps(fetchImplementation)),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });
});
