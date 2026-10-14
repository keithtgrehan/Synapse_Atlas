import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { nctIdSchema } from "../../../lib/domain/trials";
import { getClinicalTrial } from "../../../lib/sources/clinicaltrials/client";
import {
  Freshness,
  ProvenancePanel,
  availabilityText,
} from "../trial-ui";

import { TrialFacts } from "../trial-facts";

export const metadata: Metadata = {
  title: "Trial detail · Synapse Atlas",
};

export const dynamic = "force-dynamic";

type TrialDetailPageProps = {
  params: Promise<{ nctId: string }>;
};

export default async function TrialDetailPage({ params }: TrialDetailPageProps) {
  const { nctId } = await params;

  if (!nctIdSchema.safeParse(nctId).success) {
    notFound();
  }

  const trial = await getClinicalTrial(nctId);

  if (trial === null) {
    notFound();
  }

  const asOf = new Date();

  return (
    <main className="shell">
      <header className="page-header detail-header">
        <Link className="back-link" href="/trials">← Back to trial search</Link>
        <div className="detail-kicker">
          <p className="nct-id">{trial.nctId}</p>
          <Freshness retrievedAt={trial.provenance.retrievedAt} asOf={asOf} />
        </div>
        <h1>{trial.briefTitle}</h1>
        <p className="lede">
          {availabilityText(trial.officialTitle)}
        </p>
      </header>

      <TrialFacts trial={trial} />

      <ProvenancePanel trial={trial} />
    </main>
  );
}
