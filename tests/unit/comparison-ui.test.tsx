import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import ComparePage from "../../src/app/compare/page";

async function renderComparison(
  searchParams: Record<string, string | string[] | undefined>,
): Promise<string> {
  return renderToStaticMarkup(
    await ComparePage({ searchParams: Promise.resolve(searchParams) }),
  );
}

describe("server-rendered comparison UI", () => {
  it("renders the initial accessible selection form with exactly the three approved candidates", async () => {
    const html = await renderComparison({});

    expect(html).toContain("<h1>Compare programmes</h1>");
    expect(html).toContain("<fieldset>");
    expect(html).toContain("<legend>Select two to four reviewed programmes</legend>");
    expect(html.match(/name="programme"/g)).toHaveLength(3);
    expect(html.match(/Approved · Resolved/g)).toHaveLength(3);
    expect(html).toContain("Choose programmes to compare");
    expect(html).not.toContain("<table");
  });

  it("renders a valid two-programme comparison in stable dataset order with semantic table headers", async () => {
    const html = await renderComparison({
      programme: [
        "cyb003-major-depressive-disorder",
        "usona-psilocybin-mdd",
      ],
    });

    expect(html).toContain("<table class=\"comparison-table\">");
    expect(html).toContain("<caption>Evidence-bounded fields for the selected reviewed programmes</caption>");
    expect(html).toContain("scope=\"col\"");
    expect(html).toContain("scope=\"row\"");
    expect(html).toContain("2 reviewed programmes");
    expect(html.indexOf("Usona psilocybin for major depressive disorder"))
      .toBeLessThan(html.indexOf("CYB003 for major depressive disorder"));
    expect(html).not.toContain("COMP360 for treatment-resistant depression</a></th>");
  });

  it("renders all three programmes with exact status and partial-date observations", async () => {
    const html = await renderComparison({
      programme: [
        "comp360-treatment-resistant-depression",
        "cyb003-major-depressive-disorder",
        "usona-psilocybin-mdd",
      ],
    });

    expect(html).toContain("3 reviewed programmes");
    expect(html).toContain("COMPLETED");
    expect(html).toContain("ACTIVE_NOT_RECRUITING");
    expect(html).toContain("ENROLLING_BY_INVITATION");
    expect(html).toContain("2020-01-23");
    expect(html).toContain("2023-02-14");
    expect(html).toContain("2025-07-18");
    expect(html).toContain("day precision");
  });

  it("preserves a one-programme selection and shows the bounded validation message", async () => {
    const html = await renderComparison({
      programme: "comp360-treatment-resistant-depression",
    });

    expect(html).toContain("Select at least two programmes");
    expect(html).toContain("Your valid selection has been preserved");
    expect(html).toMatch(
      /checked="" value="comp360-treatment-resistant-depression"/,
    );
    expect(html).not.toContain("<table");
  });

  it("fails closed for malformed and unknown selections without echoing submitted input", async () => {
    for (const parameters of [
      { programme: ["usona-psilocybin-mdd", "unknown-programme"] },
      { programme: ["usona-psilocybin-mdd", "bad<value"] },
      { programme: ["usona-psilocybin-mdd", "usona-psilocybin-mdd"] },
      { programme: ["usona-psilocybin-mdd", "cyb003-major-depressive-disorder"], extra: "raw-secret-value" },
    ]) {
      const html = await renderComparison(parameters);

      expect(html).toContain("The comparison selection could not be used");
      expect(html).toContain("role=\"alert\"");
      expect(html).not.toContain("unknown-programme");
      expect(html).not.toContain("bad&lt;value");
      expect(html).not.toContain("raw-secret-value");
      expect(html).not.toContain("<table");
    }
  });

  it("renders programme, trial, official-source, API, provenance, and clear/change links", async () => {
    const html = await renderComparison({
      programme: [
        "usona-psilocybin-mdd",
        "comp360-treatment-resistant-depression",
      ],
    });

    expect(html).toContain('href="/programs/usona-psilocybin-mdd"');
    expect(html).toContain('href="/trials/NCT03866174"');
    expect(html).toContain("Reviewed sponsor-organisation association");
    expect(html).toContain("Source-reported sponsor organisation");
    expect(html).toContain(
      'href="https://clinicaltrials.gov/study/NCT03866174"',
    );
    expect(html).toContain("Open the exact official API request");
    expect(html).toContain("Exact retained response SHA-256");
    expect(html).toContain("Exact mapping provenance references");
    expect(html).toContain("Exact JSON-pointer locators");
    expect(html).toContain('href="#comparison-selection"');
    expect(html).toContain('href="/compare"');
  });

  it("renders explicit unknowns visibly and keeps every evidence class textual", async () => {
    const html = await renderComparison({
      programme: [
        "comp360-treatment-resistant-depression",
        "cyb003-major-depressive-disorder",
      ],
    });

    expect(html).toContain("Not established from approved sources.");
    expect(html).toContain('data-evidence-class="HUMAN_INFERENCE"');
    expect(html).toContain('data-evidence-class="STRUCTURED_EXTRACTION"');
    expect(html).toContain('data-evidence-class="DERIVED_CALCULATION"');
    expect(html).toContain('data-evidence-class="UNKNOWN"');
    expect(html).toContain("registered-trial-count/distinct-nct/v1");
    expect(html).toContain("Company legal identity");
  });
});
