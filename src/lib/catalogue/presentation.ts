import type { ResearchCollection } from "./model";

// Reader-facing copy only. The stored collection definitions and exports stay exact.
const collectionCopy: Record<string, Pick<ResearchCollection, "title" | "question">> = {
  "mdd-pharmacology-endpoints": {
    title: "Depression studies: measures and timing",
    question: "How do the planned main measurements and their time frames differ across these depression study records?",
  },
  "adjunctive-or-resistant-setting": {
    title: "Depression studies: add-on and treatment-resistant settings",
    question: "Which saved records describe add-on treatment or treatment-resistant depression (TRD), and what does each record say about its setting?",
  },
  "cognition-and-measurement": {
    title: "Depression studies: thinking and brain-related measurements",
    question: "Which planned measurements relate to thinking or brain-related assessment, and which conditions are listed in each record?",
  },
  "neurostimulation-comparator": {
    title: "Depression studies: stimulation treatments",
    question: "Which records list brain-stimulation interventions, and what study details can be compared without combining outcomes?",
  },
  "mdd-setting-boundaries": {
    title: "Depression studies: different health contexts",
    question: "What different health contexts do these records list, and why should the studies remain separate?",
  },
  "snapshot-replay": {
    title: "Comparing saved versions of study records",
    question: "What, if anything, differs between two saved versions of the same study record, and what can this comparison not tell us?",
  },
  "heterogeneous-legacy-contexts": {
    title: "Studies kept separate by condition",
    question: "Which conditions are listed across these records, and why should they be inspected separately rather than treated as one group?",
  },
  "ptsd-mdma-design-context": {
    title: "PTSD studies: MAPP1 and MAPP2 design",
    question: "What do the saved MAPP1 and MAPP2 records for post-traumatic stress disorder (PTSD) say about planned measurements, timing and listed interventions?",
  },
};

export function presentCollection(collection: ResearchCollection) {
  return collectionCopy[collection.id] ?? collection;
}
