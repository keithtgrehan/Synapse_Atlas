# Synapse Atlas

**Turn registered clinical-trial data into a clear, source-backed research brief.**

[Open the demo](https://synapse-atlas-theta.vercel.app/) · [Explore the implementation](src/lib/programs/research-brief.ts) · [Read the methodology](src/app/methodology/page.tsx)

Synapse Atlas is a portfolio research tool for exploring neuropsychiatric drug-development programmes and comparing selected registered studies. It brings study design, endpoints, timelines and source evidence into one workflow, then exports the same information for further analysis or discussion.

The commercial question behind it is practical: **how do you prepare a useful conversation about a complex market while keeping facts, assumptions and unanswered questions separate?**

## Start here: a three-minute walkthrough

1. Open the demo and select **Explore the depression study comparison**.
2. Compare the selected studies associated with Usona psilocybin, COMP360 and CYB003. Inspect registered phase, enrolment, endpoints and completion dates.
3. Follow a source link and check when the evidence was collected. Programme associations and registry observations are labelled separately.
4. Download the **CSV** and **source manifest**, or use **Print / save as PDF** to take the comparison into a research discussion.

The prepared comparison contains **three reviewed programme contexts, with one selected study per programme**. It is a dated research view, rather than a complete company pipeline or a comparison of treatment effectiveness.

## What works

| Capability | Why it matters |
| --- | --- |
| Search registered trials through ClinicalTrials.gov | Start with an official source and open the underlying record. |
| Explore reviewed programme associations | Connect a research question to a defined set of studies without silently equating programme names and chemical identities. |
| Compare selected study facts side by side | Make differences in registered design and timing easier to inspect. |
| Export CSV, source manifest and printable brief | Carry the evidence into a meeting, spreadsheet or follow-up document. |
| Show collection dates, source links and evidence labels | Let another reviewer check where information came from and distinguish observation from interpretation. |
| Preserve unknown and missing values | Make the next research question visible instead of filling gaps with plausible text. |

## Product judgement behind the design

**Complete the research workflow before expanding the dataset.** A comparison becomes useful when someone can inspect its sources and take the findings away. Export and print therefore came before broader literature enrichment, alerts or account features.

**Use saved evidence for comparison and live data for exploration.** The prepared comparison reads validated, versioned snapshots. That makes its display and exports reproducible without a live API call. The trial explorer queries ClinicalTrials.gov separately for current registry observations; it does not silently replace a saved comparison with newer data.

**Keep the user's judgement visible.** Registry facts do not establish programme ownership, commercial rights or comparative efficacy. The product preserves those distinctions rather than generating a ranking that would imply more than the evidence supports.

**Use deterministic comparison before generated synthesis.** Explicit fields, validation and source references address the current task directly. A vector database, custom model or generated analyst narrative would add complexity before demonstrating a better answer to that task.

**Keep infrastructure proportional to the product.** The comparison and exports work from checked-in evidence and need no database. A Drizzle/Postgres schema exists for future persistence; it is not a prerequisite for the demonstrated workflow.

## What this project demonstrates

This project connects Keith Grehan's biology background and commercial interests with practical data-product work: defining a research question, choosing useful comparisons, reviewing programme associations and making evidence accessible to a non-specialist reader. Keith explicitly reviewed the three bounded programme mappings; implementation was developed with AI-assisted tooling.

For a sales or partnerships conversation, the relevant skills are structured discovery, source evaluation and explaining a complex domain clearly. The application supports research preparation; it does not establish clinical conclusions or commercial rights.

## Architecture and review points

```text
Official registry API → validated records → reviewed programme associations
                                           ↓
Versioned study snapshots → comparison → CSV / source manifest / print
```

- **Application:** Next.js, React and TypeScript.
- **Validation:** Zod schemas, retained response hashes and field-level source references.
- **Data:** ClinicalTrials.gov; versioned evidence for the prepared comparison.
- **Quality:** Vitest unit and integration tests, strict type checking and a production build check.

Useful places to inspect:

- [Comparison evidence](data/comparison/2026-10-13/manifest.json) — source URLs, dates and hashes.
- [Research brief](src/lib/programs/research-brief.ts) — shared data preparation for display and export.
- [Export handling](src/lib/programs/brief-download.ts) — selection validation and download behaviour.
- [Research-brief tests](tests/unit/research-brief.test.tsx) — evidence integrity and output behaviour.
- [ClinicalTrials.gov client](src/lib/sources/clinicaltrials/client.ts) — bounded requests and source-policy checks.

## Run locally

Use Node.js 22 and pnpm 10.18.3. From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000` and choose the prepared comparison. That route and its exports need no API key or database. Live trial search needs internet access to ClinicalTrials.gov.

```bash
pnpm check
```

This runs lint, type checking, tests, migration consistency and the production build. Database features are separate: `.env.example` documents `DATABASE_URL`, and the database health endpoint requires a configured connection.

## Project notes

Synapse Atlas is a focused portfolio prototype. Its value is a reviewable research workflow with explicit evidence boundaries. The [methodology](src/app/methodology/page.tsx) documents sources and interpretation; [CONTROL_ROOM.md](CONTROL_ROOM.md) retains the detailed development record and [AGENTS.md](AGENTS.md) governs contributions. Deployment and data-expansion decisions remain separate from documentation changes.
