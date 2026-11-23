import type { CaseEvidence, ResearchCase } from "./model";

type Source = {
  nctId: string;
  retrievedAt: string;
};

const sourcePath = (nctId: string) =>
  `data/research-cases/mdma-ptsd/v1/${nctId}.json`;

const sources = {
  mapp1: {
    nctId: "NCT03537014",
    retrievedAt: "2026-11-20T01:09:33.746Z",
  },
  mapp2: {
    nctId: "NCT04077437",
    retrievedAt: "2026-11-20T01:09:34.292Z",
  },
} as const satisfies Record<string, Source>;

function evidence(source: Source, locator: string, expectedValue: unknown): CaseEvidence {
  return {
    nctId: source.nctId,
    locator,
    sourcePath: sourcePath(source.nctId),
    sourceUrl: `https://clinicaltrials.gov/study/${source.nctId}`,
    retrievedAt: source.retrievedAt,
    expectedValue,
  };
}

const protocol = "/studies/0/protocolSection";
const identification = `${protocol}/identificationModule`;
const design = `${protocol}/designModule`;
const interventions = `${protocol}/armsInterventionsModule/interventions`;

type RegisteredIntervention = { type: string; name: string };

function interventionEvidence(
  source: Source,
  values: readonly RegisteredIntervention[],
): CaseEvidence[] {
  return values.flatMap((item, index) => [
    evidence(source, `${interventions}/${index}/name`, item.name),
    evidence(source, `${interventions}/${index}/type`, item.type),
  ]);
}

const mapp1Title =
  "A Randomized, Double-Blind, Placebo-Controlled, Multi-Site Phase 3 Study of the Efficacy and Safety of Manualized MDMA-Assisted Psychotherapy for the Treatment of Severe Posttraumatic Stress Disorder";
const mapp2Title =
  "A Randomized, Double-Blind, Placebo-Controlled, Multi-Site Phase 3 Study of the Efficacy and Safety of Manualized MDMA-Assisted Psychotherapy for the Treatment of Posttraumatic Stress Disorder of Moderate or Greater Severity";

/**
 * A source-bounded design-reading case. Registry facts are separate from the
 * linked publication, protocol, and regulator reading references below.
 */
export const mappCase: ResearchCase = {
  id: "mdma-ptsd-design-context",
  title: "MDMA-assisted therapy studies: what to check before comparing them",
  kicker: "Keep the study records and further reading in context",
  question:
    "MAPP1 and MAPP2 study a similar treatment model for post-traumatic stress disorder (PTSD). What should we check about the participants, measurements and therapy before reading their findings together?",
  summary:
    "This example compares two saved PTSD study records. Published reports, a public study protocol and regulatory documents appear separately as further reading.",
  studyIds: ["NCT03537014", "NCT04077437"],
  includePrimaryOutcomes: true,
  whyTogether:
    "The two records let us inspect the study titles, planned measurements and timing, and listed interventions. These details help frame questions about study design; they are not a combined result.",
  dimensions: [
    {
      key: "registered-population",
      label: "Registered population wording",
      cells: [
        {
          nctId: "NCT03537014",
          value: mapp1Title,
          evidence: [
            evidence(
              sources.mapp1,
              `${identification}/officialTitle`,
              mapp1Title,
            ),
          ],
        },
        {
          nctId: "NCT04077437",
          value: mapp2Title,
          evidence: [
            evidence(
              sources.mapp2,
              `${identification}/officialTitle`,
              mapp2Title,
            ),
          ],
        },
      ],
      interpretation:
        "The official titles describe symptom severity differently. They do not show that the studies used the same entry criteria or that the enrolled groups or analysis groups can be compared.",
    },
    {
      key: "phase-enrollment",
      label: "Phase and registered enrolment",
      cells: [
        {
          nctId: "NCT03537014",
          value: "Phase 3; 100 actual",
          evidence: [
            evidence(sources.mapp1, `${design}/phases`, ["PHASE3"]),
            evidence(sources.mapp1, `${design}/enrollmentInfo`, {
              count: 100,
              type: "ACTUAL",
            }),
          ],
        },
        {
          nctId: "NCT04077437",
          value: "Phase 3; 121 actual",
          evidence: [
            evidence(sources.mapp2, `${design}/phases`, ["PHASE3"]),
            evidence(sources.mapp2, `${design}/enrollmentInfo`, {
              count: 121,
              type: "ACTUAL",
            }),
          ],
        },
      ],
      interpretation:
        "The registry lists actual enrolment of 100 and 121. These are not necessarily the counts assigned to treatment groups, treated, completing the study or included in the analysis. They do not make the reports directly comparable.",
    },
    {
      key: "registered-interventions",
      label: "Registered intervention names and types",
      cells: [
        {
          nctId: "NCT03537014",
          value: "BEHAVIORAL: Therapy; DRUG: midomafetamine HCl; DRUG: Placebo",
          evidence: interventionEvidence(sources.mapp1, [
            { type: "BEHAVIORAL", name: "Therapy" },
            { type: "DRUG", name: "midomafetamine HCl" },
            { type: "DRUG", name: "Placebo" },
          ]),
        },
        {
          nctId: "NCT04077437",
          value: "BEHAVIORAL: Therapy; DRUG: Midomafetamine; DRUG: Placebo",
          evidence: interventionEvidence(sources.mapp2, [
            { type: "BEHAVIORAL", name: "Therapy" },
            { type: "DRUG", name: "Midomafetamine" },
            { type: "DRUG", name: "Placebo" },
          ]),
        },
      ],
      interpretation:
        "These are the interventions listed in each record, in their saved order. The lists do not show which group received each intervention, how therapy was delivered, the dose, safety or treatment effects.",
    },
  ],
  takeaways: [
    {
      text:
        "SOURCE_FACT: Both official titles describe randomised, double-blind, placebo-controlled, multi-site Phase 3 studies, while their severity wording differs.",
      evidenceClass: "SOURCE_FACT",
      evidence: [
        evidence(sources.mapp1, `${identification}/officialTitle`, mapp1Title),
        evidence(sources.mapp2, `${identification}/officialTitle`, mapp2Title),
      ],
    },
    {
      text:
        "MODEL_INFERENCE: The saved records help us compare study design. They do not support a combined conclusion about whether treatment works, is safe, is approved or can be compared across the studies.",
      evidenceClass: "MODEL_INFERENCE",
      evidence: [
        evidence(sources.mapp1, `${design}/enrollmentInfo`, {
          count: 100,
          type: "ACTUAL",
        }),
        evidence(sources.mapp2, `${design}/enrollmentInfo`, {
          count: 121,
          type: "ACTUAL",
        }),
        ...interventionEvidence(sources.mapp1, [
          { type: "BEHAVIORAL", name: "Therapy" },
          { type: "DRUG", name: "midomafetamine HCl" },
          { type: "DRUG", name: "Placebo" },
        ]),
        ...interventionEvidence(sources.mapp2, [
          { type: "BEHAVIORAL", name: "Therapy" },
          { type: "DRUG", name: "Midomafetamine" },
          { type: "DRUG", name: "Placebo" },
        ]),
      ],
    },
  ],
  cannotEstablish:
    "These records cannot establish matching entry criteria or comparable groups assigned to treatment or included in the analysis. They do not show how well blinding worked, how much psychotherapy contributed, comparable follow-up, treatment safety or benefit, or approval status. They cannot support a combined result.",
  nextQuestions: [
    "What do the linked reports and protocol say about population definitions, analysis sets and when assessments began?",
    "Which trial-design and safety questions in the FDA documents sit outside the retained registry fields?",
  ],
  selectionRationale:
    "Selected as a separate PTSD design-reading pair because the retained exact-ID records and compact external reading trail show why registry, report, protocol and regulatory materials need to stay distinct.",
  readingReferences: [
    {
      id: "mapp1-report",
      title:
        "MDMA-assisted therapy for severe PTSD: a randomized, double-blind, placebo-controlled phase 3 study",
      documentType: "Trial report",
      citation: "Nature Medicine 27, 1025–1033 (2021).",
      doi: "10.1038/s41591-021-01336-3",
      publicationOrVersionDate: "2021-05-10",
      checkedAt: "2026-11-20",
      availability: "available",
      availabilityNote: "Open-access article was available when checked.",
      url: "https://www.nature.com/articles/s41591-021-01336-3",
      status: "active",
      note:
        "A primary report linked for reading context; it is not a retained registry response or a source for the registry dimensions above.",
    },
    {
      id: "mapp2-report",
      title:
        "MDMA-assisted therapy for moderate to severe PTSD: a randomized, placebo-controlled phase 3 trial",
      documentType: "Trial report",
      citation: "Nature Medicine 29, 2473–2480 (2023).",
      doi: "10.1038/s41591-023-02565-4",
      publicationOrVersionDate: "2023-09-14",
      checkedAt: "2026-11-20",
      availability: "metadata_only",
      availabilityNote:
        "Metadata and indexed text were available when checked; direct publisher access was intermittent.",
      url: "https://www.nature.com/articles/s41591-023-02565-4",
      status: "corrected",
      notice: {
        appliesTo: "mapp2-report",
        kind: "correction",
        title:
          "Author Correction: MDMA-assisted therapy for moderate to severe PTSD: a randomized, placebo-controlled phase 3 trial",
        url: "https://www.nature.com/articles/s41591-024-03331-w",
        date: "2024-10-07",
        note:
          "The correction updates the placement of named MAPP2 Study Collaborator Group members; it is not a retraction.",
      },
      note:
        "A primary report linked for reading context; its article-scoped correction is separately identified and does not become registry evidence.",
    },
    {
      id: "mapp2-protocol",
      title: "Protocol and Synopsis MAPP2",
      documentType: "Protocol",
      citation: "MAPP2 Protocol and Synopsis, Amendment 4 Version 1 (2021).",
      publicationOrVersionDate: "2021-03-23",
      version: "Amendment 4 Version 1",
      checkedAt: "2026-11-20",
      availability: "available",
      availabilityNote: "Public redacted protocol PDF was available when checked.",
      url: "https://maps.org/wp-content/uploads/2022/05/MAPP2-Protocol-A4V1-FINAL_REDACTED_23MAR2021.pdf",
      status: "active",
      note:
        "A dated, redacted protocol reference for reading treatment stages and assessment context; it is not presented as the current protocol.",
    },
    {
      id: "fda-2024-briefing",
      title: "FDA Briefing Document: NDA/BLA# 215455",
      documentType: "Regulatory briefing",
      citation: "FDA Psychopharmacologic Drugs Advisory Committee Meeting briefing document (2024).",
      publicationOrVersionDate: "2024-06-04",
      checkedAt: "2026-11-20",
      availability: "available",
      availabilityNote: "FDA PDF was available when checked.",
      url: "https://www.fda.gov/media/178984/download",
      status: "active",
      note:
        "A dated regulatory-reading reference whose disclaimer says it is not FDA's final determination.",
    },
    {
      id: "fda-2026-final-guidance",
      title: "Psychedelic Drugs: Considerations for Clinical Investigations",
      documentType: "Guidance",
      citation: "FDA Guidance for Industry (July 2026).",
      publicationOrVersionDate: "2026-07",
      version: "Final guidance",
      checkedAt: "2026-11-20",
      availability: "available",
      availabilityNote: "FDA guidance PDF was available when checked.",
      url: "https://www.fda.gov/media/169694/download",
      status: "active",
      note:
        "Nonbinding FDA guidance linked for general design-reading questions, not as a compliance finding for either trial.",
    },
    {
      id: "mapp1-protocol",
      title: "MAPP1 public protocol",
      documentType: "Protocol",
      citation: "MAPP1 protocol link from the MAPS study page; document date unavailable.",
      publicationOrVersionDate: null,
      checkedAt: "2026-11-20",
      availability: "unavailable",
      availabilityNote: "The checked MAPS-linked protocol destination returned 404.",
      url: null,
      checkedUrl:
        "https://mapscontent.s3-us-west-1.amazonaws.com/research-archive/mdma/mapp1/FINAL%2BMAPP1%2BPublic%2BProtocol%2BA4V1_%2B22MAY2020.pdf",
      status: "active",
      note:
        "No working protocol link was recovered in this review; unavailable does not mean that no protocol exists.",
    },
  ],
};
