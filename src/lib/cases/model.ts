import type { ExternalReadingReference } from "./reading-references";

export type CaseEvidence = {
  nctId: string;
  /** JSON pointer into the immutable retained registry response. */
  locator: string;
  sourcePath: string;
  sourceUrl: string;
  retrievedAt: string;
  expectedValue: unknown;
};

export type CaseClaim = {
  text: string;
  evidenceClass: "SOURCE_FACT" | "MODEL_INFERENCE";
  evidence: CaseEvidence[];
};

export type CaseDimension = {
  key: string;
  label: string;
  cells: { nctId: string; value: string; evidence: CaseEvidence[] }[];
  interpretation: string;
};

export type ResearchCase = {
  id: string;
  title: string;
  kicker: string;
  question: string;
  summary: string;
  studyIds: string[];
  whyTogether: string;
  dimensions: CaseDimension[];
  takeaways: CaseClaim[];
  cannotEstablish: string;
  nextQuestions: string[];
  selectionRationale: string;
  includePrimaryOutcomes?: boolean;
  readingReferences?: ExternalReadingReference[];
};

export type VerifiedCase = {
  content: ResearchCase;
  contentSha256: string;
  evidence: (CaseEvidence & { rawSha256: string; valueSha256: string })[];
  verificationVersion: "research-case-evidence/v1";
};
