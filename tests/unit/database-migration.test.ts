import { readdir, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { clinicalTrialsPolicy } from "../../src/lib/sources/policies";

const migrationsDirectory = new URL("../../drizzle/", import.meta.url);

describe("S1-02 database migration", () => {
  it("creates only the bounded source and evidence schema", async () => {
    const migrationNames = (await readdir(migrationsDirectory)).filter((name) =>
      name.endsWith(".sql"),
    );
    const migrations = await Promise.all(
      migrationNames.map(async (name) => ({
        name,
        sql: await readFile(new URL(name, migrationsDirectory), "utf8"),
      })),
    );
    const candidates = migrations.filter(({ sql }) =>
      sql.includes('CREATE TABLE "source_policies"'),
    );

    expect(candidates).toHaveLength(1);

    const migration = candidates[0];
    expect(migration).toBeDefined();

    const createdTables = Array.from(
      migration?.sql.matchAll(/CREATE TABLE "([a-z_]+)"/g) ?? [],
      (match) => match[1],
    ).sort();

    expect(createdTables).toEqual(
      [
        "claim_inputs",
        "claims",
        "ingestion_runs",
        "review_decisions",
        "source_policies",
        "source_versions",
        "sources",
      ].sort(),
    );
    expect(migration?.sql).toContain("source_versions_content_sha256");
    expect(migration?.sql).toContain("source_versions_processing_order");
    expect(migration?.sql).toContain("source_versions_source_policy_fk");
    expect(migration?.sql).toContain("source_versions_ingestion_policy_fk");
    expect(migration?.sql).toContain("claims_fact_source_required");
    expect(migration?.sql).toContain("claims_model_provenance_required");
    expect(migration?.sql).toContain(
      'INSERT INTO "source_policies" ("policy_id", "policy_version"',
    );
    expect(migration?.sql).toContain("'SRC-CTG', '1', 'ClinicalTrials.gov'");
    for (const policyValue of [
      clinicalTrialsPolicy.allowedOrigin,
      clinicalTrialsPolicy.allowedHost,
      ...clinicalTrialsPolicy.allowedMethods,
      ...clinicalTrialsPolicy.allowedPaths,
      clinicalTrialsPolicy.authMode,
      clinicalTrialsPolicy.redirectMode,
      clinicalTrialsPolicy.attribution,
      clinicalTrialsPolicy.termsUrl,
      clinicalTrialsPolicy.apiDocsUrl,
      clinicalTrialsPolicy.allowedUse,
      clinicalTrialsPolicy.prohibitedUse,
      clinicalTrialsPolicy.reviewedAt,
      clinicalTrialsPolicy.approvedAt,
    ]) {
      expect(migration?.sql).toContain(policyValue);
    }
    expect(migration?.sql).not.toMatch(
      /(?:^|\n)\s*(?:DROP\b|DELETE\s+FROM\b|TRUNCATE\b)/i,
    );
  });
});
