import { readFile } from "node:fs/promises";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import original from "../../data/program-mappings/v1.json";
import expanded from "../../data/program-mappings/v2.json";
import { programmeMappingDatasetSchema } from "../../src/lib/domain/programs";
import { buildComparison } from "../../src/lib/domain/comparisons";
import { researchBriefCsv, researchBriefManifest } from "../../src/lib/domain/research-brief";
import { loadComparisonCatalog } from "../../src/lib/programs/comparison-dataset";
import { loadResearchBrief } from "../../src/lib/programs/research-brief";
import { readAndValidateProgrammeFixture, validateProgrammeFixture } from "../../src/lib/fixtures/programs";
import ProgrammePage from "../../src/app/programs/[slug]/page";
import { ResearchBriefView } from "../../src/app/compare/brief-ui";

const dataset = programmeMappingDatasetSchema.parse(expanded);

describe("ten scoped model-proposed mapping additions", () => {
  it("preserves original associations and ten unique accepted model proposals with packet provenance", async () => {
    for (const key of ["programmes", "sourceSnapshots", "compounds", "sponsorOrganisations", "mappingAssertions"] as const) {
      expect(dataset[key].slice(0, original[key].length)).toEqual(original[key]);
    }
    const catalog = await loadComparisonCatalog();
    expect(await loadComparisonCatalog()).toEqual(catalog);
    expect(catalog.candidates).toHaveLength(13);
    expect(new Set(dataset.sourceSnapshots.map((s) => s.externalId)).size).toBe(13);
    for (const mapping of dataset.mappingAssertions.slice(3)) {
      expect(mapping.evidenceClass).toBe("MODEL_INFERENCE");
      expect(mapping.approvalBasis).toBe("OWNER_ACCEPTED_UNATTRIBUTED_PACKET");
      expect(mapping.reviewRationale).toContain("not a named, credentialed or human scientific review");
    }
  });

  it("rejects automatic human promotion, missing owner acceptance, duplicates and lost dose-arm evidence", () => {
    const human = structuredClone(expanded);
    human.mappingAssertions[3].evidenceClass = "HUMAN_INFERENCE";
    expect(programmeMappingDatasetSchema.safeParse(human).success).toBe(false);
    const noAcceptance = structuredClone(dataset);
    delete noAcceptance.mappingAssertions[3].approvalBasis;
    expect(programmeMappingDatasetSchema.safeParse(noAcceptance).success).toBe(false);
    const duplicate = structuredClone(dataset);
    duplicate.programmes[3].id = duplicate.programmes[0].id;
    expect(programmeMappingDatasetSchema.safeParse(duplicate).success).toBe(false);
    const lostDose = structuredClone(dataset);
    lostDose.mappingAssertions.find((m) => m.nctIds.includes("NCT01422213"))!.evidence[0].locators.pop();
    expect(programmeMappingDatasetSchema.safeParse(lostDose).success).toBe(false);
  });

  it("validates original full-module bytes and rejects tampering and mismatched request shape", async () => {
    const snapshot = dataset.sourceSnapshots[3];
    const validated = await readAndValidateProgrammeFixture(snapshot);
    const damaged = new Uint8Array(validated.fixtureBytes);
    damaged[12] ^= 1;
    expect(() => validateProgrammeFixture(snapshot, damaged, validated.metadata)).toThrow("HASH_MISMATCH");
    const wrong = { ...snapshot, captureFormat: undefined };
    expect(programmeMappingDatasetSchema.safeParse({ ...dataset, sourceSnapshots: [wrong, ...dataset.sourceSnapshots.slice(1)] }).success).toBe(false);
    expect(await readFile(snapshot.fixturePath)).toEqual(Buffer.from(validated.fixtureBytes));
    for (const nctId of ["NCT01422213", "NCT02942004"]) {
      const mapping = dataset.mappingAssertions.find((m) => m.nctIds.includes(nctId))!;
      expect(dataset.compounds.find((c) => c.id === mapping.compoundId)!.rawAliases).toHaveLength(2);
    }
  });

  it("renders all ten mapping details with honest evidence labels, duplicate dose rows and source links", async () => {
    for (const programme of dataset.programmes.slice(3)) {
      const mapping = dataset.mappingAssertions.find((m) => m.programmeId === programme.id)!;
      const html = renderToStaticMarkup(await ProgrammePage({ params: Promise.resolve({ slug: programme.slug }) }));
      expect(html).toContain("Approved for inclusion");
      expect(html).toContain("not independent human scientific review");
      expect(html).not.toContain("explicit human approval");
      for (const text of [mapping.nctIds[0], "Comparator", "Enrollment", "Primary outcomes", "retained", "pubmed.ncbi.nlm.nih.gov"]) expect(html).toContain(text);
      expect(html).toContain(`href="/compare?programme=${programme.slug}"`);
    }
  });

  it("carries all ten trials and caveats consistently through comparison, CSV, manifest and print", async () => {
    const catalog = await loadComparisonCatalog();
    const additions = catalog.candidates.slice(3);
    for (let i = 0; i < additions.length; i += 2) {
      const brief = await loadResearchBrief(buildComparison(catalog, additions.slice(i, i + 2).map((p) => p.slug)));
      const csv = researchBriefCsv(brief);
      const manifest = researchBriefManifest(brief);
      const html = renderToStaticMarkup(<ResearchBriefView brief={brief} />);
      for (const p of brief.programmes) {
        expect(csv).toContain(p.trials[0].provenance.contentSha256);
        expect(csv).toContain("MODEL_INFERENCE");
        expect(csv).toContain(p.studyContext!.publicationUrl);
        expect(manifest.programmes.find((m) => m.slug === p.slug)!.mapping.caveats).toEqual(p.mapping.caveats);
        expect(html).toContain("no independent human scientific review");
        expect(html).toContain(p.studyContext!.publicationUrl);
        expect(html).not.toContain("Programme association: reviewed human inference");
      }
    }
    const missingDate = await loadResearchBrief(buildComparison(catalog, ["study-nct01422213", "study-nct02750306"]));
    expect(missingDate.programmes[0].trials[0].completionDate.state).toBe("not_reported");
    expect(missingDate.programmes[1].trials[0].primaryOutcomes.value).toHaveLength(3);
    const mixed = buildComparison(catalog, [catalog.candidates[0].slug, additions[0].slug]);
    expect(mixed.programmes.map((p) => p.mapping.evidenceClass)).toEqual(["HUMAN_INFERENCE", "MODEL_INFERENCE"]);
  });
});
