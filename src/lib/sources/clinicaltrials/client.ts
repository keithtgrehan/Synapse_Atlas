import { z } from "zod";

import {
  clinicalTrialsApiPageSchema,
  clinicalTrialsFieldValues,
  clinicalTrialsPageTokenSchema,
  nctIdSchema,
  normalizeClinicalTrial,
  type TrialRecord,
} from "../../domain/trials";
import { sha256Bytes } from "../../evidence/provenance";
import {
  clinicalTrialsPolicy,
  evaluateSourceRequest,
} from "../policies";

const API_URL = "https://clinicaltrials.gov/api/v2/studies";
const PAGE_SIZE = 10;
const MAX_RESPONSE_BYTES = 1_048_576;
const REQUEST_TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 250;
const MAX_ATTEMPTS = 2;
const MAX_URL_LENGTH = 4_096;

export const clinicalTrialsOverallStatusValues = [
  "ACTIVE_NOT_RECRUITING",
  "APPROVED_FOR_MARKETING",
  "AVAILABLE",
  "COMPLETED",
  "ENROLLING_BY_INVITATION",
  "NO_LONGER_AVAILABLE",
  "NOT_YET_RECRUITING",
  "RECRUITING",
  "SUSPENDED",
  "TEMPORARILY_NOT_AVAILABLE",
  "TERMINATED",
  "UNKNOWN",
  "WITHDRAWN",
  "WITHHELD",
] as const;

export type ClinicalTrialsOverallStatus =
  (typeof clinicalTrialsOverallStatusValues)[number];

const overallStatusSchema = z.enum(clinicalTrialsOverallStatusValues);
const queryTermSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value), {
    message: "Search terms cannot contain control characters",
  });

const searchInputSchema = z
  .object({
    term: queryTermSchema,
    overallStatus: overallStatusSchema.optional(),
    pageToken: clinicalTrialsPageTokenSchema.optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (!nctIdSchema.safeParse(input.term).success) {
      return;
    }

    if (input.overallStatus !== undefined) {
      context.addIssue({
        code: "custom",
        message: "Exact NCT searches cannot include a status filter",
        path: ["overallStatus"],
      });
    }

    if (input.pageToken !== undefined) {
      context.addIssue({
        code: "custom",
        message: "Exact NCT searches cannot include a page token",
        path: ["pageToken"],
      });
    }
  });

const detailInputSchema = z.object({ nctId: nctIdSchema }).strict();

export type ClinicalTrialsSearchInput = z.input<typeof searchInputSchema>;

export const clinicalTrialsClientErrorCodeValues = [
  "INVALID_INPUT",
  "POLICY_DENIED",
  "TIMEOUT",
  "NETWORK_ERROR",
  "REDIRECT_RESPONSE",
  "HTTP_ERROR",
  "UNEXPECTED_CONTENT_TYPE",
  "RESPONSE_TOO_LARGE",
  "INVALID_UTF8",
  "INVALID_JSON",
  "INVALID_RESPONSE",
  "INVALID_CLOCK",
  "PAGINATION_CYCLE",
] as const;

export type ClinicalTrialsClientErrorCode =
  (typeof clinicalTrialsClientErrorCodeValues)[number];

export class ClinicalTrialsClientError extends Error {
  readonly code: ClinicalTrialsClientErrorCode;
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(
    code: ClinicalTrialsClientErrorCode,
    options: { status?: number; retryable?: boolean } = {},
  ) {
    super(code);
    this.name = "ClinicalTrialsClientError";
    this.code = code;
    this.status = options.status ?? null;
    this.retryable = options.retryable ?? false;
  }

  toJSON() {
    return {
      code: this.code,
      status: this.status,
      retryable: this.retryable,
    };
  }
}

type ClientDependencies = {
  fetch: typeof fetch;
  now: () => Date;
  sleep: (milliseconds: number) => Promise<void>;
  timeoutMs: number;
  maxResponseBytes: number;
};

type ClientDependencyOverrides = Partial<ClientDependencies>;

export type ClinicalTrialsPage = {
  trials: readonly TrialRecord[];
  totalCount: number | null;
  nextPageToken: string | null;
  pageSize: number;
};

const defaultDependencies: ClientDependencies = {
  fetch: globalThis.fetch,
  now: () => new Date(),
  sleep: (milliseconds) =>
    new Promise((resolve) => setTimeout(resolve, milliseconds)),
  timeoutMs: REQUEST_TIMEOUT_MS,
  maxResponseBytes: MAX_RESPONSE_BYTES,
};

function invalidInput(): never {
  throw new ClinicalTrialsClientError("INVALID_INPUT");
}

function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    return invalidInput();
  }

  return result.data;
}

function baseUrl(): URL {
  const url = new URL(API_URL);
  url.searchParams.set("format", "json");
  url.searchParams.set("fields", clinicalTrialsFieldValues.join(","));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  return url;
}

function searchUrl(input: z.infer<typeof searchInputSchema>): URL {
  const url = baseUrl();
  const isExactNctSearch = nctIdSchema.safeParse(input.term).success;

  if (isExactNctSearch) {
    url.searchParams.set("query.id", input.term);
  } else {
    url.searchParams.set("query.term", input.term);
    url.searchParams.set("sort", "@relevance");
  }

  if (input.overallStatus !== undefined) {
    url.searchParams.set("filter.overallStatus", input.overallStatus);
  }

  if (input.pageToken === undefined) {
    url.searchParams.set("countTotal", "true");
  } else {
    url.searchParams.set("pageToken", input.pageToken);
  }

  return url;
}

function detailUrl(nctId: string): URL {
  const url = baseUrl();
  url.searchParams.set("query.id", nctId);
  url.searchParams.set("countTotal", "true");
  url.searchParams.set("pageSize", "1");
  return url;
}

function validateConstructedUrl(url: URL, evaluatedAt: Date): void {
  if (url.href.length > MAX_URL_LENGTH) {
    invalidInput();
  }

  const decision = evaluateSourceRequest(
    {
      sourceId: clinicalTrialsPolicy.policyId,
      policyVersion: clinicalTrialsPolicy.policyVersion,
      method: "GET",
      url: url.href,
    },
    undefined,
    evaluatedAt,
  );

  if (!decision.allowed) {
    throw new ClinicalTrialsClientError("POLICY_DENIED");
  }
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

function cancelBody(response: Response): void {
  if (response.body !== null) {
    void response.body.cancel().catch(() => undefined);
  }
}

function exactMediaType(response: Response): string {
  return response.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase() ?? "";
}

async function readChunk(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  signal: AbortSignal,
): Promise<ReadableStreamReadResult<Uint8Array>> {
  if (signal.aborted) {
    throw new ClinicalTrialsClientError("TIMEOUT");
  }

  let abortHandler: (() => void) | undefined;

  try {
    return await Promise.race([
      reader.read(),
      new Promise<never>((_resolve, reject) => {
        abortHandler = () => reject(new ClinicalTrialsClientError("TIMEOUT"));
        signal.addEventListener("abort", abortHandler, { once: true });
      }),
    ]);
  } finally {
    if (abortHandler !== undefined) {
      signal.removeEventListener("abort", abortHandler);
    }
  }
}

async function readBoundedBody(
  response: Response,
  maximumBytes: number,
  signal: AbortSignal,
): Promise<Uint8Array> {
  const contentLengthText = response.headers.get("content-length");
  const contentLength = contentLengthText === null
    ? null
    : Number(contentLengthText);

  if (
    contentLength !== null &&
    Number.isFinite(contentLength) &&
    contentLength > maximumBytes
  ) {
    cancelBody(response);
    throw new ClinicalTrialsClientError("RESPONSE_TOO_LARGE");
  }

  if (response.body === null) {
    return new Uint8Array();
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await readChunk(reader, signal);

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maximumBytes) {
        void reader.cancel().catch(() => undefined);
        throw new ClinicalTrialsClientError("RESPONSE_TOO_LARGE");
      }

      chunks.push(value);
    }
  } catch (error) {
    void reader.cancel().catch(() => undefined);
    throw error;
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return bytes;
}

async function fetchBytes(
  url: URL,
  dependencies: ClientDependencies,
): Promise<Uint8Array> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    validateConstructedUrl(url, dependencies.now());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), dependencies.timeoutMs);

    try {
      const response = await dependencies.fetch(url, {
        method: "GET",
        headers: { accept: "application/json" },
        credentials: "omit",
        redirect: "manual",
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.status >= 300 && response.status < 400) {
        cancelBody(response);
        throw new ClinicalTrialsClientError("REDIRECT_RESPONSE", {
          status: response.status,
        });
      }

      if (!response.ok) {
        cancelBody(response);
        throw new ClinicalTrialsClientError("HTTP_ERROR", {
          status: response.status,
          retryable: isRetryableStatus(response.status),
        });
      }

      if (exactMediaType(response) !== "application/json") {
        cancelBody(response);
        throw new ClinicalTrialsClientError("UNEXPECTED_CONTENT_TYPE", {
          status: response.status,
        });
      }

      return await readBoundedBody(
        response,
        dependencies.maxResponseBytes,
        controller.signal,
      );
    } catch (error) {
      const clientError = error instanceof ClinicalTrialsClientError
        ? error
        : controller.signal.aborted
          ? new ClinicalTrialsClientError("TIMEOUT")
          : new ClinicalTrialsClientError("NETWORK_ERROR", {
              retryable: true,
            });

      if (clientError.retryable && attempt < MAX_ATTEMPTS) {
        await dependencies.sleep(RETRY_DELAY_MS);
        continue;
      }

      throw clientError;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new ClinicalTrialsClientError("NETWORK_ERROR", { retryable: true });
}

function resolveDependencies(
  overrides: ClientDependencyOverrides,
): ClientDependencies {
  const dependencies = { ...defaultDependencies, ...overrides };

  if (
    !Number.isFinite(dependencies.timeoutMs) ||
    dependencies.timeoutMs <= 0 ||
    dependencies.timeoutMs > REQUEST_TIMEOUT_MS ||
    !Number.isFinite(dependencies.maxResponseBytes) ||
    dependencies.maxResponseBytes <= 0 ||
    dependencies.maxResponseBytes > MAX_RESPONSE_BYTES
  ) {
    invalidInput();
  }

  return dependencies;
}

function decodeJson(bytes: Uint8Array): unknown {
  let text: string;

  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ClinicalTrialsClientError("INVALID_UTF8");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ClinicalTrialsClientError("INVALID_JSON");
  }
}

async function requestPage(
  url: URL,
  dependencyOverrides: ClientDependencyOverrides,
): Promise<ClinicalTrialsPage> {
  const dependencies = resolveDependencies(dependencyOverrides);
  const bytes = await fetchBytes(url, dependencies);
  const retrievedAtDate = dependencies.now();
  const decoded = decodeJson(bytes);
  const parsed = clinicalTrialsApiPageSchema.safeParse(decoded);

  if (!parsed.success) {
    throw new ClinicalTrialsClientError("INVALID_RESPONSE");
  }

  const expectedPageSize = url.searchParams.get("pageSize") === "1"
    ? 1
    : PAGE_SIZE;

  if (parsed.data.studies.length > expectedPageSize) {
    throw new ClinicalTrialsClientError("INVALID_RESPONSE");
  }

  const nctIds = parsed.data.studies.map(
    (study) => study.protocolSection.identificationModule.nctId,
  );

  if (new Set(nctIds).size !== nctIds.length) {
    throw new ClinicalTrialsClientError("INVALID_RESPONSE");
  }

  if (
    parsed.data.nextPageToken !== undefined &&
    parsed.data.nextPageToken === url.searchParams.get("pageToken")
  ) {
    throw new ClinicalTrialsClientError("PAGINATION_CYCLE");
  }

  const processedAtDate = dependencies.now();

  if (
    !Number.isFinite(retrievedAtDate.getTime()) ||
    !Number.isFinite(processedAtDate.getTime()) ||
    processedAtDate.getTime() < retrievedAtDate.getTime()
  ) {
    throw new ClinicalTrialsClientError("INVALID_CLOCK");
  }

  const requestedFields = new Set<string>(clinicalTrialsFieldValues);
  const contentSha256 = sha256Bytes(bytes);
  const retrievedAt = retrievedAtDate.toISOString();
  const processedAt = processedAtDate.toISOString();

  return {
    trials: parsed.data.studies.map((study, studyIndex) =>
      normalizeClinicalTrial(study, {
        apiRequestUrl: url.href,
        retrievedAt,
        processedAt,
        contentSha256,
        requestedFields,
        studyIndex,
      }),
    ),
    totalCount: parsed.data.totalCount ?? null,
    nextPageToken: parsed.data.nextPageToken ?? null,
    pageSize: expectedPageSize,
  };
}

export async function searchClinicalTrials(
  input: ClinicalTrialsSearchInput,
  dependencies: ClientDependencyOverrides = {},
): Promise<ClinicalTrialsPage> {
  const parsed = parseInput(searchInputSchema, input);
  return requestPage(searchUrl(parsed), dependencies);
}

export async function getClinicalTrial(
  nctId: string,
  dependencies: ClientDependencyOverrides = {},
): Promise<TrialRecord | null> {
  const parsed = parseInput(detailInputSchema, { nctId });
  const page = await requestPage(detailUrl(parsed.nctId), dependencies);

  if (page.trials.length === 0) {
    return null;
  }

  const trial = page.trials[0];

  if (trial?.nctId !== parsed.nctId) {
    throw new ClinicalTrialsClientError("INVALID_RESPONSE");
  }

  return trial;
}
