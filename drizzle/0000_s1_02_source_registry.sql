CREATE TYPE "public"."claim_review_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');--> statement-breakpoint
CREATE TYPE "public"."evidence_class" AS ENUM('SOURCE_FACT', 'STRUCTURED_EXTRACTION', 'DERIVED_CALCULATION', 'HUMAN_INFERENCE', 'MODEL_INFERENCE', 'UNVERIFIED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."ingestion_run_status" AS ENUM('PENDING', 'RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."review_decision" AS ENUM('APPROVED', 'REJECTED', 'NEEDS_REVISION');--> statement-breakpoint
CREATE TYPE "public"."source_auth_mode" AS ENUM('FORBIDDEN', 'REQUIRED');--> statement-breakpoint
CREATE TYPE "public"."source_policy_status" AS ENUM('PROPOSED', 'APPROVED', 'BLOCKED', 'DISABLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."source_redirect_mode" AS ENUM('DENY', 'SAME_ORIGIN');--> statement-breakpoint
CREATE TABLE "claim_inputs" (
	"derived_claim_id" uuid NOT NULL,
	"input_claim_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claim_inputs_pk" PRIMARY KEY("derived_claim_id","input_claim_id"),
	CONSTRAINT "claim_inputs_position_unique" UNIQUE("derived_claim_id","position"),
	CONSTRAINT "claim_inputs_position_nonnegative" CHECK ("claim_inputs"."position" >= 0),
	CONSTRAINT "claim_inputs_no_self_reference" CHECK ("claim_inputs"."derived_claim_id" <> "claim_inputs"."input_claim_id")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" text NOT NULL,
	"predicate" text NOT NULL,
	"value_json" jsonb,
	"evidence_class" "evidence_class" NOT NULL,
	"source_id" uuid,
	"source_version_id" uuid,
	"external_id" text,
	"source_locator" text,
	"extraction_method" text,
	"formula_version" text,
	"model_version" text,
	"prompt_version" text,
	"schema_version" text,
	"confidence" real,
	"review_status" "claim_review_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "claims_source_version_requires_source" CHECK ("claims"."source_version_id" IS NULL OR "claims"."source_id" IS NOT NULL),
	CONSTRAINT "claims_fact_source_required" CHECK ("claims"."evidence_class" NOT IN ('SOURCE_FACT', 'STRUCTURED_EXTRACTION') OR "claims"."source_id" IS NOT NULL OR COALESCE(length(btrim("claims"."external_id")), 0) > 0),
	CONSTRAINT "claims_derived_formula_required" CHECK ("claims"."evidence_class" <> 'DERIVED_CALCULATION' OR COALESCE(length(btrim("claims"."formula_version")), 0) > 0),
	CONSTRAINT "claims_model_provenance_required" CHECK ("claims"."evidence_class" <> 'MODEL_INFERENCE' OR (COALESCE(length(btrim("claims"."model_version")), 0) > 0 AND COALESCE(length(btrim("claims"."prompt_version")), 0) > 0 AND COALESCE(length(btrim("claims"."schema_version")), 0) > 0 AND COALESCE(length(btrim("claims"."source_locator")), 0) > 0 AND "claims"."confidence" IS NOT NULL)),
	CONSTRAINT "claims_confidence_range" CHECK ("claims"."confidence" IS NULL OR ("claims"."confidence" >= 0 AND "claims"."confidence" <= 1)),
	CONSTRAINT "claims_unknown_value" CHECK (("claims"."evidence_class" = 'UNKNOWN' AND "claims"."value_json" IS NULL) OR ("claims"."evidence_class" <> 'UNKNOWN' AND "claims"."value_json" IS NOT NULL)),
	CONSTRAINT "claims_source_fact_not_model" CHECK ("claims"."evidence_class" <> 'SOURCE_FACT' OR ("claims"."model_version" IS NULL AND "claims"."prompt_version" IS NULL AND "claims"."schema_version" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_policy_id" text NOT NULL,
	"policy_version" text NOT NULL,
	"request_hash" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"request_count" integer DEFAULT 0 NOT NULL,
	"record_count" integer DEFAULT 0 NOT NULL,
	"status" "ingestion_run_status" NOT NULL,
	"redacted_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ingestion_runs_id_policy_unique" UNIQUE("id","source_policy_id","policy_version"),
	CONSTRAINT "ingestion_runs_request_hash_sha256" CHECK ("ingestion_runs"."request_hash" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "ingestion_runs_counts_nonnegative" CHECK ("ingestion_runs"."request_count" >= 0 AND "ingestion_runs"."record_count" >= 0),
	CONSTRAINT "ingestion_runs_completion_order" CHECK ("ingestion_runs"."completed_at" IS NULL OR "ingestion_runs"."completed_at" >= "ingestion_runs"."started_at"),
	CONSTRAINT "ingestion_runs_completion_state" CHECK ((("ingestion_runs"."status" IN ('PENDING', 'RUNNING')) AND "ingestion_runs"."completed_at" IS NULL) OR (("ingestion_runs"."status" IN ('SUCCEEDED', 'PARTIAL', 'FAILED')) AND "ingestion_runs"."completed_at" IS NOT NULL)),
	CONSTRAINT "ingestion_runs_redacted_error_length" CHECK ("ingestion_runs"."redacted_error" IS NULL OR length("ingestion_runs"."redacted_error") <= 2000)
);
--> statement-breakpoint
CREATE TABLE "review_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_id" uuid NOT NULL,
	"decision" "review_decision" NOT NULL,
	"reviewer_reference" text NOT NULL,
	"rationale" text NOT NULL,
	"decided_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_decisions_reviewer_nonempty" CHECK (length(btrim("review_decisions"."reviewer_reference")) > 0),
	CONSTRAINT "review_decisions_rationale_nonempty" CHECK (length(btrim("review_decisions"."rationale")) > 0)
);
--> statement-breakpoint
CREATE TABLE "source_policies" (
	"policy_id" text NOT NULL,
	"policy_version" text NOT NULL,
	"provider" text NOT NULL,
	"status" "source_policy_status" DEFAULT 'PROPOSED' NOT NULL,
	"allowed_origin" text NOT NULL,
	"allowed_host" text NOT NULL,
	"allowed_methods" text[] NOT NULL,
	"allowed_paths" text[] NOT NULL,
	"auth_mode" "source_auth_mode" NOT NULL,
	"redirect_mode" "source_redirect_mode" NOT NULL,
	"cookies_allowed" boolean DEFAULT false NOT NULL,
	"attribution" text NOT NULL,
	"terms_url" text NOT NULL,
	"api_docs_url" text NOT NULL,
	"allowed_use" text NOT NULL,
	"prohibited_use" text NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"approved_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_policies_pk" PRIMARY KEY("policy_id","policy_version"),
	CONSTRAINT "source_policies_methods_nonempty" CHECK (cardinality("source_policies"."allowed_methods") > 0),
	CONSTRAINT "source_policies_paths_nonempty" CHECK (cardinality("source_policies"."allowed_paths") > 0),
	CONSTRAINT "source_policies_approved_timestamp" CHECK ("source_policies"."status" <> 'APPROVED' OR "source_policies"."approved_at" IS NOT NULL),
	CONSTRAINT "source_policies_approval_order" CHECK ("source_policies"."approved_at" IS NULL OR "source_policies"."approved_at" >= "source_policies"."reviewed_at"),
	CONSTRAINT "source_policies_expiry_order" CHECK ("source_policies"."expires_at" IS NULL OR ("source_policies"."expires_at" > "source_policies"."reviewed_at" AND ("source_policies"."approved_at" IS NULL OR "source_policies"."expires_at" > "source_policies"."approved_at"))),
	CONSTRAINT "source_policies_cookies_forbidden" CHECK ("source_policies"."cookies_allowed" = false)
);
--> statement-breakpoint
INSERT INTO "source_policies" ("policy_id", "policy_version", "provider", "status", "allowed_origin", "allowed_host", "allowed_methods", "allowed_paths", "auth_mode", "redirect_mode", "cookies_allowed", "attribution", "terms_url", "api_docs_url", "allowed_use", "prohibited_use", "reviewed_at", "approved_at")
VALUES ('SRC-CTG', '1', 'ClinicalTrials.gov', 'APPROVED', 'https://clinicaltrials.gov', 'clinicaltrials.gov', ARRAY['GET']::text[], ARRAY['/api/v2/studies']::text[], 'FORBIDDEN', 'SAME_ORIGIN', false, 'ClinicalTrials.gov, U.S. National Library of Medicine', 'https://clinicaltrials.gov/about-site/terms-conditions', 'https://clinicaltrials.gov/data-api/about-api', 'Registered study data from the official API with attribution and processing date.', 'Authentication, email harvesting, access-control bypass, and unapproved hosts or paths.', '2026-08-14T00:00:00Z'::timestamptz, '2026-08-14T00:00:00Z'::timestamptz)
ON CONFLICT ("policy_id", "policy_version") DO NOTHING;
--> statement-breakpoint
CREATE TABLE "source_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"ingestion_run_id" uuid NOT NULL,
	"source_policy_id" text NOT NULL,
	"policy_version" text NOT NULL,
	"retrieved_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone NOT NULL,
	"content_sha256" text NOT NULL,
	"transformation" text NOT NULL,
	"transformation_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_versions_source_id_id_unique" UNIQUE("source_id","id"),
	CONSTRAINT "source_versions_content_sha256" CHECK ("source_versions"."content_sha256" ~ '^[a-f0-9]{64}$'),
	CONSTRAINT "source_versions_processing_order" CHECK ("source_versions"."processed_at" >= "source_versions"."retrieved_at")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" text NOT NULL,
	"policy_version" text NOT NULL,
	"provider" text NOT NULL,
	"external_id" text,
	"canonical_url" text NOT NULL,
	"title" text,
	"published_at" timestamp with time zone,
	"licence" text,
	"licence_url" text,
	"raw_retention_class" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sources_canonical_url_unique" UNIQUE("canonical_url"),
	CONSTRAINT "sources_id_policy_unique" UNIQUE("id","policy_id","policy_version"),
	CONSTRAINT "sources_canonical_url_nonempty" CHECK (length(btrim("sources"."canonical_url")) > 0)
);
--> statement-breakpoint
ALTER TABLE "claim_inputs" ADD CONSTRAINT "claim_inputs_derived_claim_id_claims_id_fk" FOREIGN KEY ("derived_claim_id") REFERENCES "public"."claims"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "claim_inputs" ADD CONSTRAINT "claim_inputs_input_claim_id_claims_id_fk" FOREIGN KEY ("input_claim_id") REFERENCES "public"."claims"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_source_version_fk" FOREIGN KEY ("source_id","source_version_id") REFERENCES "public"."source_versions"("source_id","id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "ingestion_runs" ADD CONSTRAINT "ingestion_runs_policy_fk" FOREIGN KEY ("source_policy_id","policy_version") REFERENCES "public"."source_policies"("policy_id","policy_version") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "review_decisions" ADD CONSTRAINT "review_decisions_claim_id_claims_id_fk" FOREIGN KEY ("claim_id") REFERENCES "public"."claims"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_source_policy_fk" FOREIGN KEY ("source_id","source_policy_id","policy_version") REFERENCES "public"."sources"("id","policy_id","policy_version") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "source_versions" ADD CONSTRAINT "source_versions_ingestion_policy_fk" FOREIGN KEY ("ingestion_run_id","source_policy_id","policy_version") REFERENCES "public"."ingestion_runs"("id","source_policy_id","policy_version") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_policy_fk" FOREIGN KEY ("policy_id","policy_version") REFERENCES "public"."source_policies"("policy_id","policy_version") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE INDEX "claim_inputs_input_claim_idx" ON "claim_inputs" USING btree ("input_claim_id");--> statement-breakpoint
CREATE INDEX "claims_subject_predicate_idx" ON "claims" USING btree ("subject_type","subject_id","predicate");--> statement-breakpoint
CREATE INDEX "claims_source_version_idx" ON "claims" USING btree ("source_id","source_version_id");--> statement-breakpoint
CREATE INDEX "claims_evidence_review_idx" ON "claims" USING btree ("evidence_class","review_status");--> statement-breakpoint
CREATE INDEX "ingestion_runs_policy_started_idx" ON "ingestion_runs" USING btree ("source_policy_id","policy_version","started_at");--> statement-breakpoint
CREATE INDEX "ingestion_runs_request_hash_idx" ON "ingestion_runs" USING btree ("request_hash");--> statement-breakpoint
CREATE INDEX "review_decisions_claim_decided_idx" ON "review_decisions" USING btree ("claim_id","decided_at");--> statement-breakpoint
CREATE INDEX "source_policies_status_provider_idx" ON "source_policies" USING btree ("status","provider");--> statement-breakpoint
CREATE INDEX "source_versions_source_retrieved_idx" ON "source_versions" USING btree ("source_id","retrieved_at");--> statement-breakpoint
CREATE INDEX "source_versions_ingestion_run_idx" ON "source_versions" USING btree ("ingestion_run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_provider_external_id_unique" ON "sources" USING btree ("provider","external_id") WHERE "sources"."external_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "sources_policy_idx" ON "sources" USING btree ("policy_id","policy_version");
