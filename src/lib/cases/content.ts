import type { CaseEvidence, ResearchCase } from "./model";
import { mappCase } from "./mapp-case";

type Source = {
  nctId: string;
  sourcePath: string;
  retrievedAt: string;
};

const october = (nctId: string, retrievedAt: string): Source => ({
  nctId,
  sourcePath: `data/comparison/2026-10-13/${nctId}.json`,
  retrievedAt,
});
const examples = (nctId: string, retrievedAt: string): Source => ({
  nctId,
  sourcePath: `data/study-examples/v1/${nctId}.json`,
  retrievedAt,
});

const sources = {
  nct038: october("NCT03866174", "2026-10-13T17:40:49.778Z"),
  nct057: october("NCT05711940", "2026-10-13T17:40:49.933Z"),
  nct066: october("NCT06605105", "2026-10-13T17:40:50.089Z"),
  nct036: examples("NCT03672175", "2026-10-13T19:07:39.147828+00:00"),
  nct035: examples("NCT03559192", "2026-10-13T19:07:39.817754+00:00"),
  nct013: examples("NCT01360645", "2026-10-13T19:07:40.429124+00:00"),
  nct014: examples("NCT01422213", "2026-10-13T19:07:41.007770+00:00"),
} as const;

function evidence(source: Source, locator: string, expectedValue: unknown): CaseEvidence {
  return {
    nctId: source.nctId,
    locator,
    sourcePath: source.sourcePath,
    sourceUrl: `https://clinicaltrials.gov/study/${source.nctId}`,
    retrievedAt: source.retrievedAt,
    expectedValue,
  };
}

const protocol = "/studies/0/protocolSection";
const id = `${protocol}/identificationModule`;
const status = `${protocol}/statusModule`;
const design = `${protocol}/designModule`;
const outcomes = `${protocol}/outcomesModule/primaryOutcomes`;
const conditions = `${protocol}/conditionsModule/conditions`;

/**
 * Case framing is an evidence-governed reading aid. It deliberately contains no
 * effect estimates, ranking, clinical advice, or claims of treatment superiority.
 */
export const researchCases: ResearchCase[] = [
  {
    id: "mdd-measurement-window",
    title: "Depression studies: why the measure and timing matter",
    kicker: "Why the measure and timing matter",
    question:
      "These depression studies planned to measure different things at different times. What should we check before comparing them?",
    summary:
      "The three records describe completed studies of major depressive disorder (MDD). Their main planned measurements differ, as does the timing: Day 15, Week 8 and Day 43 after dosing.",
    studyIds: ["NCT03866174", "NCT03672175", "NCT01422213"],
    whyTogether:
      "All three saved records describe completed studies of MDD that involved an intervention. This example compares what they planned to measure. It does not compare treatment results.",
    dimensions: [
      {
        key: "registered-status-design",
        label: "Registered status and study type",
        cells: [
          { nctId: "NCT03866174", value: "Completed; interventional", evidence: [evidence(sources.nct038, `${status}/overallStatus`, "COMPLETED"), evidence(sources.nct038, `${design}/studyType`, "INTERVENTIONAL")] },
          { nctId: "NCT03672175", value: "Completed; interventional, randomised parallel treatment", evidence: [evidence(sources.nct036, `${status}/overallStatus`, "COMPLETED"), evidence(sources.nct036, `${design}/studyType`, "INTERVENTIONAL"), evidence(sources.nct036, `${design}/designInfo/allocation`, "RANDOMIZED"), evidence(sources.nct036, `${design}/designInfo/interventionModel`, "PARALLEL"), evidence(sources.nct036, `${design}/designInfo/primaryPurpose`, "TREATMENT")] },
          { nctId: "NCT01422213", value: "Completed; interventional, randomised parallel treatment", evidence: [evidence(sources.nct014, `${status}/overallStatus`, "COMPLETED"), evidence(sources.nct014, `${design}/studyType`, "INTERVENTIONAL"), evidence(sources.nct014, `${design}/designInfo/allocation`, "RANDOMIZED"), evidence(sources.nct014, `${design}/designInfo/interventionModel`, "PARALLEL"), evidence(sources.nct014, `${design}/designInfo/primaryPurpose`, "TREATMENT")] },
        ],
        interpretation: "The selected NCT03866174 capture does not retain allocation, model or primary purpose. They are left unknown here rather than assumed from the other records.",
      },
      {
        key: "population-label",
        label: "Registered condition / population label",
        cells: [
          { nctId: "NCT03866174", value: "Depressive Disorder, Major", evidence: [evidence(sources.nct038, conditions, ["Depressive Disorder, Major"])] },
          { nctId: "NCT03672175", value: "Major Depressive Disorder", evidence: [evidence(sources.nct036, conditions, ["Major Depressive Disorder"])] },
          { nctId: "NCT01422213", value: "Major Depressive Disorder; title specifies cognitive dysfunction", evidence: [evidence(sources.nct014, conditions, ["Major Depressive Disorder"]), evidence(sources.nct014, `${id}/briefTitle`, "Efficacy Study of Vortioxetine on Cognitive Dysfunction in Adult Patients With Major Depressive Disorder")] },
        ],
        interpretation: "The shared MDD label supports a focused design-reading exercise. The cognitive-dysfunction title adds a distinction that the condition field alone cannot settle.",
      },
      {
        key: "primary-outcome",
        label: "Registered primary outcome",
        cells: [
          { nctId: "NCT03866174", value: "Central-rater MADRS total-score change", evidence: [evidence(sources.nct038, `${outcomes}/0/measure`, "Change in Central Rater Montgomery-Asberg Depression Rating Scale (MADRS) Total Score From Baseline to Post-dose Day 43")] },
          { nctId: "NCT03672175", value: "17-item HAM-D total-score change", evidence: [evidence(sources.nct036, `${outcomes}/0/measure`, "Change From Baseline in the 17-item HAM-D Total Score at Day 15")] },
          { nctId: "NCT01422213", value: "DSST/RAVLT composite cognitive Z-score change", evidence: [evidence(sources.nct014, `${outcomes}/0/measure`, "Change From Baseline to Week 8 in DSST (Number of Correct Symbols) and RAVLT (Acquisition and Delayed Recall) Using the Composite Z-score Defined as the Weighted Sum of the Individual Patient Z-scores")] },
        ],
        interpretation: "These registered measures do not ask exactly the same thing. The record alone cannot turn one scale or composite into another.",
      },
      {
        key: "assessment-window",
        label: "Primary-outcome time frame",
        cells: [
          { nctId: "NCT03866174", value: "Baseline; Day 43 post-dose", evidence: [evidence(sources.nct038, `${outcomes}/0/timeFrame`, "Baseline; Day 43 post-dose")] },
          { nctId: "NCT03672175", value: "Baseline; Day 15", evidence: [evidence(sources.nct036, `${outcomes}/0/timeFrame`, "Baseline (BL), Day 15")] },
          { nctId: "NCT01422213", value: "Baseline; Week 8", evidence: [evidence(sources.nct014, `${outcomes}/0/timeFrame`, "Baseline and Week 8")] },
        ],
        interpretation: "The assessment windows differ. Sharing a condition label does not make the timing directly comparable.",
      },
      {
        key: "phase-enrollment",
        label: "Registered phase and enrolment",
        cells: [
          { nctId: "NCT03866174", value: "Phase 2; 347 actual", evidence: [evidence(sources.nct038, `${design}/phases`, ["PHASE2"]), evidence(sources.nct038, `${design}/enrollmentInfo`, { count: 347, type: "ACTUAL" })] },
          { nctId: "NCT03672175", value: "Phase 3; 581 actual", evidence: [evidence(sources.nct036, `${design}/phases`, ["PHASE3"]), evidence(sources.nct036, `${design}/enrollmentInfo`, { count: 581, type: "ACTUAL" })] },
          { nctId: "NCT01422213", value: "Phase 3; 598 actual", evidence: [evidence(sources.nct014, `${design}/phases`, ["PHASE3"]), evidence(sources.nct014, `${design}/enrollmentInfo`, { count: 598, type: "ACTUAL" })] },
        ],
        interpretation: "Phase and registered enrolment describe study context. They do not establish comparable populations, results or strength of evidence.",
      },
    ],
    takeaways: [
      { text: "SOURCE_FACT: The three registered primary outcomes use the Montgomery-Asberg Depression Rating Scale (MADRS), HAM-D and a DSST/RAVLT composite, respectively.", evidenceClass: "SOURCE_FACT", evidence: [evidence(sources.nct038, `${outcomes}/0/measure`, "Change in Central Rater Montgomery-Asberg Depression Rating Scale (MADRS) Total Score From Baseline to Post-dose Day 43"), evidence(sources.nct036, `${outcomes}/0/measure`, "Change From Baseline in the 17-item HAM-D Total Score at Day 15"), evidence(sources.nct014, `${outcomes}/0/measure`, "Change From Baseline to Week 8 in DSST (Number of Correct Symbols) and RAVLT (Acquisition and Delayed Recall) Using the Composite Z-score Defined as the Weighted Sum of the Individual Patient Z-scores")] },
      { text: "MODEL_INFERENCE: Before results are considered, a careful comparison keeps the differences in measure and timing visible instead of treating these as one MDD efficacy question.", evidenceClass: "MODEL_INFERENCE", evidence: [evidence(sources.nct038, `${outcomes}/0/measure`, "Change in Central Rater Montgomery-Asberg Depression Rating Scale (MADRS) Total Score From Baseline to Post-dose Day 43"), evidence(sources.nct038, `${outcomes}/0/timeFrame`, "Baseline; Day 43 post-dose"), evidence(sources.nct036, `${outcomes}/0/measure`, "Change From Baseline in the 17-item HAM-D Total Score at Day 15"), evidence(sources.nct036, `${outcomes}/0/timeFrame`, "Baseline (BL), Day 15"), evidence(sources.nct014, `${outcomes}/0/measure`, "Change From Baseline to Week 8 in DSST (Number of Correct Symbols) and RAVLT (Acquisition and Delayed Recall) Using the Composite Z-score Defined as the Weighted Sum of the Individual Patient Z-scores"), evidence(sources.nct014, `${outcomes}/0/timeFrame`, "Baseline and Week 8")] },
    ],
    cannotEstablish: "This comparison cannot tell us whether a treatment works, is safe, has lasting effects or provides more benefit than another. It cannot show whether the participant groups can be treated as equivalent. Starting symptom severity, previous-treatment requirements, whether treatment was used on its own, and comparable follow-up remain unknown unless checked directly in the saved record. Planned measurements are not study results.",
    nextQuestions: ["What do the full eligibility criteria and randomisation records say about baseline severity and prior treatment?", "Are results posted or publications available under the project’s source policy, and do their analysis populations match the registry enrolment definitions?"],
    selectionRationale: "Ranked first because three retained MDD records make a meaningful comparability limit visible without relying on compound or company claims.",
  },
  {
    id: "adjunctive-inadequate-response",
    title: "Add-on depression studies: same scale, different timeline",
    kicker: "Same measure, different starting points",
    question: "Both studies planned to use the same depression rating scale. How do their different starting points and treatment periods affect a comparison?",
    summary: "Both saved records describe treatment added to antidepressant therapy. They planned to track change on the Montgomery Asberg Depression Rating Scale (MADRS). Their study phases, introductory periods and planned timing differ.",
    studyIds: ["NCT03559192", "NCT01360645"],
    whyTogether: "These two records describe add-on treatment for major depressive disorder (MDD). They show why using the same measure is not enough: the starting point and treatment stages also matter.",
    dimensions: [
      { key: "setting", label: "Registered adjunctive setting", cells: [
        { nctId: "NCT03559192", value: "Adjunctive treatment in partially SSRI/SNRI-responsive MDD; placebo lead-in", evidence: [evidence(sources.nct035, `${protocol}/descriptionModule/briefSummary`, "The purpose of this study is to evaluate the efficacy of JNJ-67953964 compared to placebo when administered as adjunctive treatment in participants with Major Depressive Disorder (MDD) partially responsive to selective serotonin reuptake inhibitor/ serotonin-norepinephrine reuptake inhibitor (SSRI/SNRI) treatment in terms of reduction of symptoms of depression, as assessed by the change from baseline on the Montgomery Asberg Depression Rating Scale (MADRS) in non-responders during the placebo lead-in period."), evidence(sources.nct035, `${protocol}/armsInterventionsModule/armGroups/0/label`, "Lead-in Period: Placebo")] },
        { nctId: "NCT01360645", value: "Add-on treatment to assigned antidepressant therapy; incomplete response stated", evidence: [evidence(sources.nct013, `${protocol}/descriptionModule/briefSummary`, "To compare the effect of OPC-34712 (brexpiprazole) to the effect of placebo (an inactive substance) as add on treatment to an assigned FDA approved antidepressant treatment (ADT) in patients with Major Depressive Disorder who demonstrate an incomplete response to a prospective trial of the same assigned FDA approved ADT"), evidence(sources.nct013, `${protocol}/armsInterventionsModule/armGroups/0/label`, "Phase B")] },
      ], interpretation: "Both records describe add-on treatment, but they do not describe their study periods in the same way." },
      { key: "madrs-window", label: "MADRS baseline and primary window", cells: [
        { nctId: "NCT03559192", value: "Treatment baseline to Week 6; non-responders during placebo lead-in", evidence: [evidence(sources.nct035, `${outcomes}/0/measure`, "Change From Treatment Baseline in Montgomery Asberg Depression Rating Scale (MADRS) Total Score at Treatment Week 6 in Participants Who Were Non-Responders During Placebo Lead-in Period"), evidence(sources.nct035, `${outcomes}/0/timeFrame`, "Treatment Baseline up to Week 6 of DB-treatment period")] },
        { nctId: "NCT01360645", value: "End of Phase A (Week 8) to Week 14", evidence: [evidence(sources.nct013, `${outcomes}/0/measure`, "Change From Baseline (End of Phase A [Week 8]) to Week 14 in Montgomery-Asberg Depression Rating Scale (MADRS) Total Score for the Efficacy Sample."), evidence(sources.nct013, `${outcomes}/0/timeFrame`, "Baseline and Week 14")] },
      ], interpretation: "Both records use the MADRS label, but their registered baseline and analysis timing do not line up." },
      { key: "phase-enrollment", label: "Registered phase and enrolment", cells: [
        { nctId: "NCT03559192", value: "Phase 2; 181 actual", evidence: [evidence(sources.nct035, `${design}/phases`, ["PHASE2"]), evidence(sources.nct035, `${design}/enrollmentInfo`, { count: 181, type: "ACTUAL" })] },
        { nctId: "NCT01360645", value: "Phase 3; 826 actual", evidence: [evidence(sources.nct013, `${design}/phases`, ["PHASE3"]), evidence(sources.nct013, `${design}/enrollmentInfo`, { count: 826, type: "ACTUAL" })] },
      ], interpretation: "The registry’s overall enrolment field alone does not identify a shared randomised or efficacy-analysis population." },
    ],
    takeaways: [
      { text: "SOURCE_FACT: Both records register MADRS total-score change as a primary outcome, but describe the baseline and timing differently.", evidenceClass: "SOURCE_FACT", evidence: [evidence(sources.nct035, `${outcomes}/0/measure`, "Change From Treatment Baseline in Montgomery Asberg Depression Rating Scale (MADRS) Total Score at Treatment Week 6 in Participants Who Were Non-Responders During Placebo Lead-in Period"), evidence(sources.nct035, `${outcomes}/0/timeFrame`, "Treatment Baseline up to Week 6 of DB-treatment period"), evidence(sources.nct013, `${outcomes}/0/measure`, "Change From Baseline (End of Phase A [Week 8]) to Week 14 in Montgomery-Asberg Depression Rating Scale (MADRS) Total Score for the Efficacy Sample."), evidence(sources.nct013, `${outcomes}/0/timeFrame`, "Baseline and Week 14")] },
      { text: "MODEL_INFERENCE: A shared MADRS label supports a focused design comparison, but not a direct comparison of effects without aligned population, baseline and analysis definitions.", evidenceClass: "MODEL_INFERENCE", evidence: [evidence(sources.nct035, `${outcomes}/0/measure`, "Change From Treatment Baseline in Montgomery Asberg Depression Rating Scale (MADRS) Total Score at Treatment Week 6 in Participants Who Were Non-Responders During Placebo Lead-in Period"), evidence(sources.nct035, `${outcomes}/0/timeFrame`, "Treatment Baseline up to Week 6 of DB-treatment period"), evidence(sources.nct013, `${outcomes}/0/measure`, "Change From Baseline (End of Phase A [Week 8]) to Week 14 in Montgomery-Asberg Depression Rating Scale (MADRS) Total Score for the Efficacy Sample."), evidence(sources.nct013, `${outcomes}/0/timeFrame`, "Baseline and Week 14")] },
    ],
    cannotEstablish: "This comparison cannot tell us which add-on treatment works better. It cannot show whether the enrolled groups, people included in the analysis, starting symptom severity, previous-treatment requirements, treatment length, follow-up, safety or benefit are comparable.",
    nextQuestions: ["Which eligibility and lead-in criteria define inadequate response in each protocol?", "Which randomised/treated/analysis populations are reported in results sources, if they are admissible under the source policy?"],
    selectionRationale: "Ranked second because it is the strongest retained pair in this setting while keeping the different study timing and analysis population in view.",
  },
  {
    id: "registry-change-brief",
    title: "Comparing two saved versions of a study record",
    kicker: "What comparing two saved versions can tell you",
    question: "What changed between two saved versions of a public study record, and what can those changes tell us?",
    summary: "Explore two saved versions of each of three records on major depressive disorder (MDD) or treatment-resistant depression (TRD). The comparison checks which details changed between those copies. It does not assume that a change occurred.",
    studyIds: ["NCT03866174", "NCT05711940", "NCT06605105"],
    whyTogether: "Each study has two saved copies whose integrity has been checked. This example follows changes to public records. It does not combine participant groups or treatment results.",
    dimensions: [
      { key: "registered-condition", label: "Registered condition", cells: [
        { nctId: "NCT03866174", value: "Depressive Disorder, Major", evidence: [evidence(sources.nct038, conditions, ["Depressive Disorder, Major"])] },
        { nctId: "NCT05711940", value: "Treatment Resistant Depression", evidence: [evidence(sources.nct057, conditions, ["Treatment Resistant Depression"])] },
        { nctId: "NCT06605105", value: "Major Depressive Disorder", evidence: [evidence(sources.nct066, conditions, ["Major Depressive Disorder"])] },
      ], interpretation: "These condition labels do not describe one shared participant group. Each record is compared only with another saved version of the same record." },
      { key: "current-capture-status", label: "Later-capture registered status", cells: [
        { nctId: "NCT03866174", value: "Completed", evidence: [evidence(sources.nct038, `${status}/overallStatus`, "COMPLETED")] },
        { nctId: "NCT05711940", value: "Active, not recruiting", evidence: [evidence(sources.nct057, `${status}/overallStatus`, "ACTIVE_NOT_RECRUITING")] },
        { nctId: "NCT06605105", value: "Enrolling by invitation", evidence: [evidence(sources.nct066, `${status}/overallStatus`, "ENROLLING_BY_INVITATION")] },
      ], interpretation: "A registry status is a source field on the date captured. It does not establish efficacy, safety, commercial rights or present-day operational reality." },
    ],
    takeaways: [
      { text: "SOURCE_FACT: The retained later captures identify three different registered statuses across the three NCT IDs.", evidenceClass: "SOURCE_FACT", evidence: [evidence(sources.nct038, `${status}/overallStatus`, "COMPLETED"), evidence(sources.nct057, `${status}/overallStatus`, "ACTIVE_NOT_RECRUITING"), evidence(sources.nct066, `${status}/overallStatus`, "ENROLLING_BY_INVITATION")] },
      { text: "MODEL_INFERENCE: Comparing the same saved details lets someone else reconstruct the comparison. It does not replace ClinicalTrials.gov Record History or clinical interpretation.", evidenceClass: "MODEL_INFERENCE", evidence: [evidence(sources.nct038, `${id}/nctId`, "NCT03866174"), evidence(sources.nct057, `${id}/nctId`, "NCT05711940"), evidence(sources.nct066, `${id}/nctId`, "NCT06605105")] },
    ],
    cannotEstablish: "These copies cannot tell us why a record changed or show its complete history. They do not establish how a study is being run now, its results, treatment safety or business implications.",
    nextQuestions: ["Does ClinicalTrials.gov Record History provide a fuller official chronology for a specific field?", "Which additional public fields are necessary for the research question without broadening the safe export scope?"],
    selectionRationale: "Ranked third because the retained capture pairs make provenance visible while keeping a registry update separate from a clinical conclusion.",
  },
  mappCase,
];
