import { NextResponse } from "next/server";
import {
  loadSnapshotCatalogue,
  loadReplayPair,
} from "../../../../lib/snapshots/catalogue";
import {
  getClinicalTrialCapture,
  ClinicalTrialsClientError,
} from "../../../../lib/sources/clinicaltrials/client";

export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ nctId: string }> },
) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const { nctId } = await params;
  if (!/^NCT\d{8}$/.test(nctId))
    return NextResponse.json(
      { error: "Invalid study identifier." },
      { status: 400, headers },
    );
  try {
    const catalogue = await loadSnapshotCatalogue();
    if (!catalogue.some((c) => c.nctId === nctId))
      return NextResponse.json(
        { error: "This study is outside the saved catalogue." },
        { status: 404, headers },
      );
    if (new URL(request.url).searchParams.get("mode") === "replay") {
      const pair = await loadReplayPair(nctId);
      return NextResponse.json(
        pair ?? { error: "No retained replay is available for this study." },
        { status: pair ? 200 : 404, headers },
      );
    }
    const capture = await getClinicalTrialCapture(nctId);
    return NextResponse.json(
      capture ?? {
        error:
          "No matching current registry record was returned. Your saved evidence is still available.",
      },
      { status: capture ? 200 : 502, headers },
    );
  } catch (error) {
    const limited =
      error instanceof ClinicalTrialsClientError && error.status === 429;
    return NextResponse.json(
      {
        error: limited
          ? "The registry is limiting requests. Your saved evidence is still available; try again later."
          : "The current registry record could not be retrieved and validated. Your saved evidence is still available.",
      },
      { status: limited ? 429 : 502, headers },
    );
  }
}
