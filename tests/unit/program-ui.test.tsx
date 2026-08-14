import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ProgrammeDetailPage from "../../src/app/programs/[slug]/page";
import {
  MappingStateBadges,
  mappingStateSummary,
  ProgrammeCard,
  ResolutionStateBadge,
  ReviewStatusBadge,
  StatusKey,
} from "../../src/app/programs/program-ui";
import { getProgrammeBySlug } from "../../src/lib/domain/programs";
import { programmeMappingDataset } from "../../src/lib/programs/dataset";

describe("programme mapping state UI", () => {
  it("renders every review state with its own label and style", () => {
    const cases = [
      ["PENDING", "Pending review", "status-pending"],
      ["APPROVED", "Approved", "status-approved"],
      ["REJECTED", "Rejected", "status-rejected"],
      ["NEEDS_REVISION", "Needs revision", "status-needs-revision"],
    ] as const;

    for (const [status, label, className] of cases) {
      const html = renderToStaticMarkup(<ReviewStatusBadge status={status} />);

      expect(html).toContain(`class="status-label ${className}"`);
      expect(html).toContain(`data-mapping-state="review-${status.toLowerCase()}"`);
      expect(html).toContain(`>${label}</span>`);
    }
  });

  it("renders every resolution state distinctly from review approval", () => {
    const cases = [
      ["RESOLVED", "Resolved", "status-resolved"],
      ["UNRESOLVED", "Unknown", "status-unresolved"],
      ["CONFLICTING", "Conflicting", "status-conflicting"],
    ] as const;

    for (const [state, label, className] of cases) {
      const html = renderToStaticMarkup(<ResolutionStateBadge state={state} />);

      expect(html).toContain(`class="status-label ${className}"`);
      expect(html).toContain(`data-mapping-state="resolution-${state.toLowerCase()}"`);
      expect(html).toContain(`>${label}</span>`);
    }

    const approvedResolved = renderToStaticMarkup(
      <MappingStateBadges reviewStatus="APPROVED" resolutionState="RESOLVED" />,
    );
    expect(approvedResolved).toContain(">Approved</span>");
    expect(approvedResolved).toContain(">Resolved</span>");
    expect(approvedResolved).not.toContain("Pending review");
    expect(approvedResolved).not.toContain(">Unknown</span>");
  });

  it("provides deterministic copy for pending, rejected, revision, unresolved, and conflicting states", () => {
    expect(mappingStateSummary("PENDING", "UNRESOLVED")).toContain(
      "awaits a human review decision",
    );
    expect(mappingStateSummary("REJECTED", "UNRESOLVED")).toContain(
      "was rejected during human review",
    );
    expect(mappingStateSummary("NEEDS_REVISION", "UNRESOLVED")).toContain(
      "requires revision following human review",
    );
    expect(mappingStateSummary("PENDING", "CONFLICTING")).toContain(
      "resolver selects no winner",
    );

    const approvedResolved = mappingStateSummary("APPROVED", "RESOLVED");
    expect(approvedResolved).toContain("explicit human approval");
    expect(approvedResolved).toContain("mapping is resolved");
    expect(approvedResolved).not.toContain("It is not approved");
  });

  it("renders a complete status key and approved production card", () => {
    const keyHtml = renderToStaticMarkup(<StatusKey />);

    for (const label of [
      "Pending review",
      "Approved",
      "Rejected",
      "Needs revision",
      "Resolved",
      "Conflicting",
      "Unknown",
    ]) {
      expect(keyHtml).toContain(label);
    }

    const view = getProgrammeBySlug(
      programmeMappingDataset,
      "comp360-treatment-resistant-depression",
    );
    expect(view).not.toBeNull();

    const cardHtml = renderToStaticMarkup(<ProgrammeCard view={view!} />);
    expect(cardHtml).toContain("Approved mapping");
    expect(cardHtml).toContain("status-approved");
    expect(cardHtml).toContain("status-resolved");
    expect(cardHtml).toContain(">Approved</span>");
    expect(cardHtml).toContain(">Resolved</span>");
    expect(cardHtml).not.toContain("status-pending");
    expect(cardHtml).not.toContain("status-unresolved");
  });

  it("renders approved detail evidence without pending-only or equivalence copy", async () => {
    const detail = await ProgrammeDetailPage({
      params: Promise.resolve({ slug: "usona-psilocybin-mdd" }),
    });
    const html = renderToStaticMarkup(detail);

    expect(html).toContain("explicit human approval");
    expect(html).toContain("Approved");
    expect(html).toContain("Resolved");
    expect(html).toContain(
      "Keith Grehan — explicit human review decision in the S1-04 Codex task",
    );
    expect(html).toContain("14 Aug 2026, 22:10 UTC");
    expect(html).toContain("Psilocybin");
    expect(html).toContain("Niacin");
    expect(html).toContain("Set and Setting (SaS) Protocol");
    expect(html).toContain("Namespace-scoped programme aliases");
    expect(html).toContain("do not assert chemical synonyms or cross-entity equivalence");
    expect(html).not.toContain("It is not approved");
    expect(html).not.toContain("Proposed aliases");
  });
});
