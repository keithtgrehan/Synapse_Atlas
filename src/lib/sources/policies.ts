import { z } from "zod";

export const sourcePolicyStatusValues = [
  "PROPOSED",
  "APPROVED",
  "BLOCKED",
  "DISABLED",
  "EXPIRED",
] as const;

export const sourceAuthModeValues = ["FORBIDDEN", "REQUIRED"] as const;
export const sourceRedirectModeValues = ["DENY", "SAME_ORIGIN"] as const;

export const sourcePolicyStatusSchema = z.enum(sourcePolicyStatusValues);
export const sourceAuthModeSchema = z.enum(sourceAuthModeValues);
export const sourceRedirectModeSchema = z.enum(sourceRedirectModeValues);

export type SourcePolicyStatus = z.infer<typeof sourcePolicyStatusSchema>;

const nonBlankTextSchema = z.string().trim().min(1);
const exactOriginSchema = z.url().superRefine((value, context) => {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.username !== "" ||
    url.password !== "" ||
    url.port !== "" ||
    url.pathname !== "/" ||
    url.search !== "" ||
    url.hash !== ""
  ) {
    context.addIssue({
      code: "custom",
      message: "Allowed origins must be credential-free HTTPS origins",
    });
  }
});

export const sourcePolicySchema = z
  .object({
    policyId: nonBlankTextSchema,
    policyVersion: nonBlankTextSchema,
    provider: nonBlankTextSchema,
    status: sourcePolicyStatusSchema,
    allowedOrigin: exactOriginSchema,
    allowedHost: z.string().regex(/^[a-z0-9.-]+$/),
    allowedMethods: z.array(nonBlankTextSchema).min(1).readonly(),
    allowedPaths: z
      .array(z.string().regex(/^\/(?!\/)[^?#]*$/))
      .min(1)
      .readonly(),
    authMode: sourceAuthModeSchema,
    redirectMode: sourceRedirectModeSchema,
    attribution: nonBlankTextSchema,
    termsUrl: z.url(),
    apiDocsUrl: z.url(),
    allowedUse: nonBlankTextSchema,
    prohibitedUse: nonBlankTextSchema,
    reviewedAt: z.iso.datetime({ offset: true }),
    approvedAt: z.iso.datetime({ offset: true }).optional(),
    expiresAt: z.iso.datetime({ offset: true }).optional(),
  })
  .strict()
  .superRefine((policy, context) => {
    const origin = new URL(policy.allowedOrigin);

    if (origin.hostname !== policy.allowedHost) {
      context.addIssue({
        code: "custom",
        message: "Allowed origin and host must agree",
        path: ["allowedHost"],
      });
    }

    if (policy.status === "APPROVED" && policy.approvedAt === undefined) {
      context.addIssue({
        code: "custom",
        message: "Approved policies require an approval timestamp",
        path: ["approvedAt"],
      });
    }

    if (
      policy.approvedAt !== undefined &&
      Date.parse(policy.approvedAt) < Date.parse(policy.reviewedAt)
    ) {
      context.addIssue({
        code: "custom",
        message: "Approval cannot precede policy review",
        path: ["approvedAt"],
      });
    }

    const latestGovernanceEvent = Math.max(
      Date.parse(policy.reviewedAt),
      policy.approvedAt === undefined
        ? Number.NEGATIVE_INFINITY
        : Date.parse(policy.approvedAt),
    );

    if (
      policy.expiresAt !== undefined &&
      Date.parse(policy.expiresAt) <= latestGovernanceEvent
    ) {
      context.addIssue({
        code: "custom",
        message: "Expiry must follow policy review and approval",
        path: ["expiresAt"],
      });
    }
  })
  .readonly();

export type SourcePolicy = z.infer<typeof sourcePolicySchema>;

export const clinicalTrialsPolicy = sourcePolicySchema.parse({
  policyId: "SRC-CTG",
  policyVersion: "1",
  provider: "ClinicalTrials.gov",
  status: "APPROVED",
  allowedOrigin: "https://clinicaltrials.gov",
  allowedHost: "clinicaltrials.gov",
  allowedMethods: ["GET"],
  allowedPaths: ["/api/v2/studies"],
  authMode: "FORBIDDEN",
  redirectMode: "SAME_ORIGIN",
  attribution: "ClinicalTrials.gov, U.S. National Library of Medicine",
  termsUrl: "https://clinicaltrials.gov/about-site/terms-conditions",
  apiDocsUrl: "https://clinicaltrials.gov/data-api/about-api",
  allowedUse: "Registered study data from the official API with attribution and processing date.",
  prohibitedUse: "Authentication, email harvesting, access-control bypass, and unapproved hosts or paths.",
  reviewedAt: "2026-08-14T00:00:00Z",
  approvedAt: "2026-08-14T00:00:00Z",
});

export const sourcePolicies: readonly SourcePolicy[] = Object.freeze([
  clinicalTrialsPolicy,
]);

export const sourcePolicyDenialCodeValues = [
  "UNKNOWN_SOURCE",
  "POLICY_VERSION_MISMATCH",
  "POLICY_NOT_APPROVED",
  "POLICY_NOT_YET_APPROVED",
  "POLICY_EXPIRED",
  "INVALID_EVALUATION_TIME",
  "INVALID_URL",
  "METHOD_NOT_ALLOWED",
  "CREDENTIALS_NOT_ALLOWED",
  "SCHEME_NOT_ALLOWED",
  "HOST_NOT_ALLOWED",
  "PORT_NOT_ALLOWED",
  "PATH_NOT_ALLOWED",
  "FRAGMENT_NOT_ALLOWED",
  "REDIRECT_NOT_ALLOWED",
] as const;

export type SourcePolicyDenialCode =
  (typeof sourcePolicyDenialCodeValues)[number];

export type SourcePolicyRequest = {
  sourceId: string;
  policyVersion: string;
  method: string;
  url: string;
  redirectLocations?: readonly string[];
};

export type SourcePolicyDecision =
  | {
      allowed: true;
      policyId: string;
      policyVersion: string;
      normalizedUrl: string;
    }
  | { allowed: false; code: SourcePolicyDenialCode };

function deny(code: SourcePolicyDenialCode): SourcePolicyDecision {
  return { allowed: false, code };
}

function validateUrl(
  rawUrl: string,
  policy: SourcePolicy,
): URL | SourcePolicyDecision {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return deny("INVALID_URL");
  }

  if (url.username !== "" || url.password !== "") {
    return deny("CREDENTIALS_NOT_ALLOWED");
  }

  const allowedOrigin = new URL(policy.allowedOrigin);

  if (url.protocol !== allowedOrigin.protocol) {
    return deny("SCHEME_NOT_ALLOWED");
  }

  if (url.hostname !== policy.allowedHost) {
    return deny("HOST_NOT_ALLOWED");
  }

  if (url.port !== "") {
    return deny("PORT_NOT_ALLOWED");
  }

  if (!policy.allowedPaths.includes(url.pathname)) {
    return deny("PATH_NOT_ALLOWED");
  }

  if (url.hash !== "") {
    return deny("FRAGMENT_NOT_ALLOWED");
  }

  return url;
}

export function evaluateSourceRequest(
  request: SourcePolicyRequest,
  registry: readonly SourcePolicy[] = sourcePolicies,
  evaluatedAt: Date = new Date(),
): SourcePolicyDecision {
  const versions = registry.filter(
    (policy) => policy.policyId === request.sourceId,
  );

  if (versions.length === 0) {
    return deny("UNKNOWN_SOURCE");
  }

  const policy = versions.find(
    (candidate) => candidate.policyVersion === request.policyVersion,
  );

  if (policy === undefined) {
    return deny("POLICY_VERSION_MISMATCH");
  }

  if (policy.status !== "APPROVED") {
    return deny("POLICY_NOT_APPROVED");
  }

  if (!Number.isFinite(evaluatedAt.getTime())) {
    return deny("INVALID_EVALUATION_TIME");
  }

  if (
    policy.approvedAt !== undefined &&
    evaluatedAt.getTime() < Date.parse(policy.approvedAt)
  ) {
    return deny("POLICY_NOT_YET_APPROVED");
  }

  if (
    policy.expiresAt !== undefined &&
    evaluatedAt.getTime() >= Date.parse(policy.expiresAt)
  ) {
    return deny("POLICY_EXPIRED");
  }

  if (!policy.allowedMethods.includes(request.method)) {
    return deny("METHOD_NOT_ALLOWED");
  }

  const initialUrl = validateUrl(request.url, policy);

  if (!(initialUrl instanceof URL)) {
    return initialUrl;
  }

  let currentUrl = initialUrl;

  for (const location of request.redirectLocations ?? []) {
    if (policy.redirectMode === "DENY") {
      return deny("REDIRECT_NOT_ALLOWED");
    }

    let redirectedUrl: URL;

    try {
      redirectedUrl = new URL(location, currentUrl);
    } catch {
      return deny("REDIRECT_NOT_ALLOWED");
    }

    const validatedRedirect = validateUrl(redirectedUrl.href, policy);

    if (!(validatedRedirect instanceof URL)) {
      return deny("REDIRECT_NOT_ALLOWED");
    }

    currentUrl = validatedRedirect;
  }

  return {
    allowed: true,
    policyId: policy.policyId,
    policyVersion: policy.policyVersion,
    normalizedUrl: currentUrl.href,
  };
}
