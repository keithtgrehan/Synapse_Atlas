import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  claimReviewStatusValues,
  evidenceClassValues,
  reviewDecisionValues,
} from "../evidence/provenance";
import {
  sourceAuthModeValues,
  sourcePolicyStatusValues,
  sourceRedirectModeValues,
} from "../sources/policies";

const ingestionRunStatusValues = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "PARTIAL",
  "FAILED",
] as const;

export const sourcePolicyStatusEnum = pgEnum(
  "source_policy_status",
  sourcePolicyStatusValues,
);
export const sourceAuthModeEnum = pgEnum(
  "source_auth_mode",
  sourceAuthModeValues,
);
export const sourceRedirectModeEnum = pgEnum(
  "source_redirect_mode",
  sourceRedirectModeValues,
);
export const ingestionRunStatusEnum = pgEnum(
  "ingestion_run_status",
  ingestionRunStatusValues,
);
export const evidenceClassEnum = pgEnum(
  "evidence_class",
  evidenceClassValues,
);
export const claimReviewStatusEnum = pgEnum(
  "claim_review_status",
  claimReviewStatusValues,
);
export const reviewDecisionEnum = pgEnum(
  "review_decision",
  reviewDecisionValues,
);

export const sourcePoliciesTable = pgTable(
  "source_policies",
  {
    policyId: text("policy_id").notNull(),
    policyVersion: text("policy_version").notNull(),
    provider: text("provider").notNull(),
    status: sourcePolicyStatusEnum("status").notNull().default("PROPOSED"),
    allowedOrigin: text("allowed_origin").notNull(),
    allowedHost: text("allowed_host").notNull(),
    allowedMethods: text("allowed_methods").array().notNull(),
    allowedPaths: text("allowed_paths").array().notNull(),
    authMode: sourceAuthModeEnum("auth_mode").notNull(),
    redirectMode: sourceRedirectModeEnum("redirect_mode").notNull(),
    cookiesAllowed: boolean("cookies_allowed").notNull().default(false),
    attribution: text("attribution").notNull(),
    termsUrl: text("terms_url").notNull(),
    apiDocsUrl: text("api_docs_url").notNull(),
    allowedUse: text("allowed_use").notNull(),
    prohibitedUse: text("prohibited_use").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "source_policies_pk",
      columns: [table.policyId, table.policyVersion],
    }),
    index("source_policies_status_provider_idx").on(
      table.status,
      table.provider,
    ),
    check(
      "source_policies_methods_nonempty",
      sql`cardinality(${table.allowedMethods}) > 0`,
    ),
    check(
      "source_policies_paths_nonempty",
      sql`cardinality(${table.allowedPaths}) > 0`,
    ),
    check(
      "source_policies_approved_timestamp",
      sql`${table.status} <> 'APPROVED' OR ${table.approvedAt} IS NOT NULL`,
    ),
    check(
      "source_policies_approval_order",
      sql`${table.approvedAt} IS NULL OR ${table.approvedAt} >= ${table.reviewedAt}`,
    ),
    check(
      "source_policies_expiry_order",
      sql`${table.expiresAt} IS NULL OR (${table.expiresAt} > ${table.reviewedAt} AND (${table.approvedAt} IS NULL OR ${table.expiresAt} > ${table.approvedAt}))`,
    ),
    check(
      "source_policies_cookies_forbidden",
      sql`${table.cookiesAllowed} = false`,
    ),
  ],
);

export const sourcesTable = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    policyId: text("policy_id").notNull(),
    policyVersion: text("policy_version").notNull(),
    provider: text("provider").notNull(),
    externalId: text("external_id"),
    canonicalUrl: text("canonical_url").notNull(),
    title: text("title"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    licence: text("licence"),
    licenceUrl: text("licence_url"),
    rawRetentionClass: text("raw_retention_class").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "sources_policy_fk",
      columns: [table.policyId, table.policyVersion],
      foreignColumns: [
        sourcePoliciesTable.policyId,
        sourcePoliciesTable.policyVersion,
      ],
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    unique("sources_canonical_url_unique").on(table.canonicalUrl),
    unique("sources_id_policy_unique").on(
      table.id,
      table.policyId,
      table.policyVersion,
    ),
    uniqueIndex("sources_provider_external_id_unique")
      .on(table.provider, table.externalId)
      .where(sql`${table.externalId} IS NOT NULL`),
    index("sources_policy_idx").on(table.policyId, table.policyVersion),
    check(
      "sources_canonical_url_nonempty",
      sql`length(btrim(${table.canonicalUrl})) > 0`,
    ),
  ],
);

export const ingestionRunsTable = pgTable(
  "ingestion_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourcePolicyId: text("source_policy_id").notNull(),
    policyVersion: text("policy_version").notNull(),
    requestHash: text("request_hash").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    requestCount: integer("request_count").notNull().default(0),
    recordCount: integer("record_count").notNull().default(0),
    status: ingestionRunStatusEnum("status").notNull(),
    redactedError: text("redacted_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "ingestion_runs_policy_fk",
      columns: [table.sourcePolicyId, table.policyVersion],
      foreignColumns: [
        sourcePoliciesTable.policyId,
        sourcePoliciesTable.policyVersion,
      ],
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    index("ingestion_runs_policy_started_idx").on(
      table.sourcePolicyId,
      table.policyVersion,
      table.startedAt,
    ),
    index("ingestion_runs_request_hash_idx").on(table.requestHash),
    unique("ingestion_runs_id_policy_unique").on(
      table.id,
      table.sourcePolicyId,
      table.policyVersion,
    ),
    check(
      "ingestion_runs_request_hash_sha256",
      sql`${table.requestHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "ingestion_runs_counts_nonnegative",
      sql`${table.requestCount} >= 0 AND ${table.recordCount} >= 0`,
    ),
    check(
      "ingestion_runs_completion_order",
      sql`${table.completedAt} IS NULL OR ${table.completedAt} >= ${table.startedAt}`,
    ),
    check(
      "ingestion_runs_completion_state",
      sql`((${table.status} IN ('PENDING', 'RUNNING')) AND ${table.completedAt} IS NULL) OR ((${table.status} IN ('SUCCEEDED', 'PARTIAL', 'FAILED')) AND ${table.completedAt} IS NOT NULL)`,
    ),
    check(
      "ingestion_runs_redacted_error_length",
      sql`${table.redactedError} IS NULL OR length(${table.redactedError}) <= 2000`,
    ),
  ],
);

export const sourceVersionsTable = pgTable(
  "source_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id").notNull(),
    ingestionRunId: uuid("ingestion_run_id").notNull(),
    sourcePolicyId: text("source_policy_id").notNull(),
    policyVersion: text("policy_version").notNull(),
    retrievedAt: timestamp("retrieved_at", { withTimezone: true }).notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull(),
    contentSha256: text("content_sha256").notNull(),
    transformation: text("transformation").notNull(),
    transformationVersion: text("transformation_version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "source_versions_source_policy_fk",
      columns: [table.sourceId, table.sourcePolicyId, table.policyVersion],
      foreignColumns: [
        sourcesTable.id,
        sourcesTable.policyId,
        sourcesTable.policyVersion,
      ],
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    foreignKey({
      name: "source_versions_ingestion_policy_fk",
      columns: [
        table.ingestionRunId,
        table.sourcePolicyId,
        table.policyVersion,
      ],
      foreignColumns: [
        ingestionRunsTable.id,
        ingestionRunsTable.sourcePolicyId,
        ingestionRunsTable.policyVersion,
      ],
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    unique("source_versions_source_id_id_unique").on(table.sourceId, table.id),
    index("source_versions_source_retrieved_idx").on(
      table.sourceId,
      table.retrievedAt,
    ),
    index("source_versions_ingestion_run_idx").on(table.ingestionRunId),
    check(
      "source_versions_content_sha256",
      sql`${table.contentSha256} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "source_versions_processing_order",
      sql`${table.processedAt} >= ${table.retrievedAt}`,
    ),
  ],
);

export const claimsTable = pgTable(
  "claims",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    subjectType: text("subject_type").notNull(),
    subjectId: text("subject_id").notNull(),
    predicate: text("predicate").notNull(),
    valueJson: jsonb("value_json"),
    evidenceClass: evidenceClassEnum("evidence_class").notNull(),
    sourceId: uuid("source_id").references(() => sourcesTable.id, {
      onUpdate: "restrict",
      onDelete: "restrict",
    }),
    sourceVersionId: uuid("source_version_id"),
    externalId: text("external_id"),
    sourceLocator: text("source_locator"),
    extractionMethod: text("extraction_method"),
    formulaVersion: text("formula_version"),
    modelVersion: text("model_version"),
    promptVersion: text("prompt_version"),
    schemaVersion: text("schema_version"),
    confidence: real("confidence"),
    reviewStatus: claimReviewStatusEnum("review_status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "claims_source_version_fk",
      columns: [table.sourceId, table.sourceVersionId],
      foreignColumns: [
        sourceVersionsTable.sourceId,
        sourceVersionsTable.id,
      ],
    })
      .onUpdate("restrict")
      .onDelete("restrict"),
    index("claims_subject_predicate_idx").on(
      table.subjectType,
      table.subjectId,
      table.predicate,
    ),
    index("claims_source_version_idx").on(
      table.sourceId,
      table.sourceVersionId,
    ),
    index("claims_evidence_review_idx").on(
      table.evidenceClass,
      table.reviewStatus,
    ),
    check(
      "claims_source_version_requires_source",
      sql`${table.sourceVersionId} IS NULL OR ${table.sourceId} IS NOT NULL`,
    ),
    check(
      "claims_fact_source_required",
      sql`${table.evidenceClass} NOT IN ('SOURCE_FACT', 'STRUCTURED_EXTRACTION') OR ${table.sourceId} IS NOT NULL OR COALESCE(length(btrim(${table.externalId})), 0) > 0`,
    ),
    check(
      "claims_derived_formula_required",
      sql`${table.evidenceClass} <> 'DERIVED_CALCULATION' OR COALESCE(length(btrim(${table.formulaVersion})), 0) > 0`,
    ),
    check(
      "claims_model_provenance_required",
      sql`${table.evidenceClass} <> 'MODEL_INFERENCE' OR (COALESCE(length(btrim(${table.modelVersion})), 0) > 0 AND COALESCE(length(btrim(${table.promptVersion})), 0) > 0 AND COALESCE(length(btrim(${table.schemaVersion})), 0) > 0 AND COALESCE(length(btrim(${table.sourceLocator})), 0) > 0 AND ${table.confidence} IS NOT NULL)`,
    ),
    check(
      "claims_confidence_range",
      sql`${table.confidence} IS NULL OR (${table.confidence} >= 0 AND ${table.confidence} <= 1)`,
    ),
    check(
      "claims_unknown_value",
      sql`(${table.evidenceClass} = 'UNKNOWN' AND ${table.valueJson} IS NULL) OR (${table.evidenceClass} <> 'UNKNOWN' AND ${table.valueJson} IS NOT NULL)`,
    ),
    check(
      "claims_source_fact_not_model",
      sql`${table.evidenceClass} <> 'SOURCE_FACT' OR (${table.modelVersion} IS NULL AND ${table.promptVersion} IS NULL AND ${table.schemaVersion} IS NULL)`,
    ),
  ],
);

export const claimInputsTable = pgTable(
  "claim_inputs",
  {
    derivedClaimId: uuid("derived_claim_id")
      .notNull()
      .references(() => claimsTable.id, {
        onUpdate: "restrict",
        onDelete: "restrict",
      }),
    inputClaimId: uuid("input_claim_id")
      .notNull()
      .references(() => claimsTable.id, {
        onUpdate: "restrict",
        onDelete: "restrict",
      }),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "claim_inputs_pk",
      columns: [table.derivedClaimId, table.inputClaimId],
    }),
    unique("claim_inputs_position_unique").on(
      table.derivedClaimId,
      table.position,
    ),
    index("claim_inputs_input_claim_idx").on(table.inputClaimId),
    check("claim_inputs_position_nonnegative", sql`${table.position} >= 0`),
    check(
      "claim_inputs_no_self_reference",
      sql`${table.derivedClaimId} <> ${table.inputClaimId}`,
    ),
  ],
);

export const reviewDecisionsTable = pgTable(
  "review_decisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claimsTable.id, {
        onUpdate: "restrict",
        onDelete: "restrict",
      }),
    decision: reviewDecisionEnum("decision").notNull(),
    reviewerReference: text("reviewer_reference").notNull(),
    rationale: text("rationale").notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("review_decisions_claim_decided_idx").on(
      table.claimId,
      table.decidedAt,
    ),
    check(
      "review_decisions_reviewer_nonempty",
      sql`length(btrim(${table.reviewerReference})) > 0`,
    ),
    check(
      "review_decisions_rationale_nonempty",
      sql`length(btrim(${table.rationale})) > 0`,
    ),
  ],
);

export const databaseSchema = {
  sourcePolicies: sourcePoliciesTable,
  sources: sourcesTable,
  ingestionRuns: ingestionRunsTable,
  sourceVersions: sourceVersionsTable,
  claims: claimsTable,
  claimInputs: claimInputsTable,
  reviewDecisions: reviewDecisionsTable,
} as const;
