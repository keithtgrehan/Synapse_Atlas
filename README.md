# Career Path to Psychedelic Biotech

Canonical private repository for Keith Grehan's transition into CNS, neuropsychiatric and psychedelic biotech.

The portfolio product inside this repository is **Synapse Atlas**: a source-traceable intelligence tool for comparing neuropsychiatric drug-development programs, registered trials, compounds, mechanisms and supporting literature.

## Current objective

By **27 August 2026**, ship a private, credible v0.1 that demonstrates:

- scientific literacy;
- structured public-data ingestion;
- deterministic analysis;
- evidence provenance;
- restrained, evaluated AI use;
- commercially useful program comparison;
- clean, accessible product UX;
- production-minded engineering.

By **12 November 2026**, use the product, research outputs and network-building work to become a credible candidate for roles such as:

- strategic partnerships / business development;
- research or external partnerships;
- commercial strategy;
- strategy and operations / Chief of Staff;
- AI or data product for R&D;
- research operations;
- digital transformation in CNS or neuropsychiatric biotech.

## Active product goal

> A user can search for a neuropsychiatric program, inspect its compound, mechanism, indication and registered trials, compare it with two to four competing programs, and open the source behind every material fact.

This is a **private career portfolio and research tool**, not a clinical decision-support system, medical-advice product, drug-ranking engine or investment recommendation service.

## v0.1 scope

1. ClinicalTrials.gov ingestion through the official API.
2. Canonical company, program, compound, indication and trial entities.
3. Literature metadata through Europe PMC, Crossref and/or OpenAlex.
4. Compound identifiers through PubChem; selected mechanism/target enrichment through ChEMBL and Open Targets only where licensing is recorded.
5. Program and trial explorer.
6. Two-to-four-program comparison.
7. Claim-level provenance and source freshness.
8. Methodology, limitations and data-license view.
9. Reproducible export supporting one strong research publication.
10. Review-only structured AI extraction after a manually reviewed evaluation gate.

## Explicit non-goals for v0.1

- custom model training or fine-tuning;
- autonomous medical or scientific conclusions;
- efficacy, approval-probability or investment scores;
- vector database or broad RAG layer;
- molecule generation;
- patent intelligence;
- multi-tenant authentication;
- subscriptions or billing;
- community features;
- mobile app;
- broad internet crawling;
- authenticated, paywalled or access-controlled scraping;
- automated job applications or outbound messaging.

Adding one of these requires removing equivalent sprint scope and recording the decision in `CONTROL_ROOM.md`.

## Lean architecture

- Next.js 16 and TypeScript
- Zod schemas
- Postgres with Drizzle
- Vitest and Playwright
- Vercel deployment
- Python only where a scientific/data library creates clear value
- SQL and deterministic filters before embeddings
- source-specific adapters behind a deny-by-default registry

Patterns may be adapted from Keith's existing repositories, especially the provenance, source-registry, audit, release and evidence-governance patterns in Career Command Center. Private career data, restricted course content and unlicensed code or datasets must never be copied.

## Project control

Read these files before changing the repository:

1. [`CONTROL_ROOM.md`](./CONTROL_ROOM.md) — canonical project memory, goals, sprint, backlog, source approvals, decisions and handovers.
2. [`AGENTS.md`](./AGENTS.md) — operating contract for Codex and specialist agents.
3. This `README.md` — stable product boundary and onboarding.

`CONTROL_ROOM.md` is the persistent handover between ChatGPT, Codex, manual project sessions and future agents. Every completed work package must leave it accurate.

## Execution rule

Build the smallest trustworthy vertical slice first:

```text
official source
  -> validated adapter
  -> normalized relational record
  -> provenance
  -> useful UI
  -> test
  -> deploy
```

Do not build infrastructure in anticipation of hypothetical scale.

## Local foundation

The S1-01 foundation uses Node.js 22 and pnpm. Copy `.env.example` to a local
`.env` file, replace `DATABASE_URL` with the intended Postgres connection, then
run:

```bash
pnpm install
pnpm dev
```

The readiness endpoint is `GET /api/health`. Validate the foundation with:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Data and research policy

Private use does not cancel copyright, database rights, contractual terms, robots directives or privacy law.

- Prefer official APIs and bulk downloads.
- Use Firecrawl only for exact, approved public sources after source-specific legal and technical review.
- Never bypass login, paywall, CAPTCHA, robots controls, rate limits or access controls.
- Do not commit full paper text unless an applicable licence permits storage and reuse.
- For restricted papers, retain citation metadata, lawful links and Keith's own notes—not automated copied full text.
- Record source, external identifier, retrieval time, processing date, content hash, licence and transformation.
- Generated inference never silently becomes source fact.

See the source matrix and Firecrawl gate in `CONTROL_ROOM.md`.

## Definition of success

The project succeeds when it improves career credibility, not when it maximizes technical complexity.

The highest-value proof is:

```text
biology and scientific reasoning
+ trustworthy public data
+ evidence provenance
+ useful commercial comparison
+ evaluated AI
+ polished private demo
+ reproducible publication
```

## Status

- Canonical repository selected: **complete**
- Project operating system: **initialized**
- Product scaffold: **implemented in S1-01; awaiting review and merge**
- Current sprint target: **private v0.1 by 27 August 2026**
