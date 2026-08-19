import { type NextRequest, NextResponse } from "next/server";

import {
  eligibleComparisonProgrammeSlugs,
  parseComparisonSelectionForKnownSlugs,
} from "./lib/domain/comparisons";
import { programmeMappingDataset } from "./lib/programs/dataset";

const eligibleProgrammeSlugs = eligibleComparisonProgrammeSlugs(
  programmeMappingDataset,
);

export function proxy(request: NextRequest) {
  const parameters = normalizeSearchParameters(request.nextUrl.searchParams);

  if (isSanitizedInvalidSelection(parameters)) {
    return NextResponse.next();
  }

  const selection = parseComparisonSelectionForKnownSlugs(
    parameters,
    eligibleProgrammeSlugs,
  );

  if (selection.state !== "invalid") {
    return NextResponse.next();
  }

  const sanitizedUrl = request.nextUrl.clone();
  sanitizedUrl.search = "?selectionState=invalid";

  return NextResponse.redirect(sanitizedUrl, 307);
}

export const config = {
  matcher: "/compare",
};

function normalizeSearchParameters(
  searchParameters: URLSearchParams,
): Record<string, string | string[]> {
  const keys = Array.from(new Set(searchParameters.keys()));

  return Object.fromEntries(
    keys.map((key) => {
      const values = searchParameters.getAll(key);

      return [key, values.length === 1 ? values[0]! : values];
    }),
  );
}

function isSanitizedInvalidSelection(
  parameters: Readonly<Record<string, string | string[]>>,
): boolean {
  const keys = Object.keys(parameters);

  return (
    keys.length === 1 &&
    keys[0] === "selectionState" &&
    parameters.selectionState === "invalid"
  );
}
