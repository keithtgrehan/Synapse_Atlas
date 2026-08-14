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

## Source and evidence foundation

S1-02 adds a deny-by-default source-policy gate and a baseline Drizzle
migration for `source_policies`, `sources`, `source_versions`,
`ingestion_runs`, `claims`, `claim_inputs`, and `review_decisions`. The sole
runtime-approved entry is `SRC-CTG` version `1`: credential-free `GET` requests
to `https://clinicaltrials.gov/api/v2/studies` only. Unknown sources, policy
versions, methods, hosts, paths, ports, credentials, fragments, and redirects
outside that same boundary are rejected. The baseline migration bootstraps the
same approved policy so future source and ingestion rows can satisfy their
policy foreign keys.

Evidence classes preserve source facts, structured extraction, derived
calculation, human inference, model inference, unverified, and unknown states.
`retrieved_at` records acquisition time, `processed_at` records local
processing time, and the provider-reported registry update date remains a
separate source fact. SHA-256 values cover the exact stored response bytes.

Generate or validate migrations without applying them to a database:

```bash
pnpm db:generate --name=<migration_name>
pnpm db:check
```

No live Postgres instance is provisioned by these commands. Applying and
integration-testing the migration requires a separately approved connection.

## Live registered-trial explorer

S1-03 adds a small server-rendered product slice at `/trials`. It searches the
official ClinicalTrials.gov `/api/v2/studies` endpoint, applies an optional
overall-status filter, follows the API's opaque next-page token, and opens an
exact NCT record at `/trials/<NCT ID>`. Each user action requests at most 10
records. Detail lookup uses `query.id` on the already approved endpoint rather
than broadening the source policy.

The adapter constructs every request itself and rechecks `SRC-CTG` immediately
before network access. It sends no credentials or cookies, rejects redirects,
uses a 10-second timeout, retries a transient failure once after a fixed bounded
delay, accepts at most 1 MiB of JSON, and validates the response at runtime.
Response bytes are hashed before UTF-8 decoding and normalization. Missing,
unreported, and unrequested values remain distinct; partial registry dates keep
their original year, month, or day precision.

List and detail views expose the official study link, API retrieval time, local
processing time, provider-reported registry update date, evidence class, exact
response SHA-256, and retained field locators. Freshness describes the age of
the API retrieval, not the age of the study's registry update. The UI never
silently substitutes fixture or generated data when the official API fails.
For this review-stage slice that fail-closed choice is intentional; release
quality still requires a separately approved persisted or clearly labelled
resilience path so the final demo is not dependent on live API availability.

S1-03 currently normalizes live records in memory for the server-rendered
request. It does not claim database persistence: the S1-02 migration still has
not been applied or integration-tested because no approved Postgres connection
is configured.

## Programme mapping candidates

S1-04 adds a strictly validated, version-controlled dataset at `/programs`.
It contains three bounded mapping candidates backed by exact checked-in
ClinicalTrials.gov snapshots: Usona psilocybin / `NCT03866174`, COMP360 /
`NCT05711940`, and CYB003 / `NCT06605105`. Search covers candidate labels,
aliases, reported sponsor organisations, compounds, source-reported conditions,
and NCT identifiers without network access, fuzzy matching, AI, or automatic
entity creation.

Registry observations remain `STRUCTURED_EXTRACTION`; programme, alias,
sponsor-organisation, and compound relationships remain `HUMAN_INFERENCE`.
All three mapping assertions are `PENDING` and `UNRESOLVED` because no S1-04
human review decision has been made. The UI calls registry organisations
“reported sponsor organisations,” keeps company identity and programme-level
claims explicitly unknown, and labels the records as version-controlled
snapshots rather than live programme data. Each candidate links to its live
`/trials/<NCT ID>` view and official ClinicalTrials.gov evidence.

S1-04 does not add database tables or a migration. The existing S1-02 migration
remains valid, unchanged, and unapplied because no approved Postgres connection
is configured.

## Deployment policy

Automatic Vercel Git deployments from `main` are disabled by the root
`vercel.json`. Pull-request branches remain eligible for protected Preview
deployments. Any future Production deployment requires an explicit,
human-approved action; the S1-01 post-merge closeout did not deploy or promote
anything to Production.

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
- Product scaffold: **S1-01 merged and post-merge closeout complete**
- Registered-trial explorer: **S1-03 complete; merged in PR #5 at `b7305dae739841a23c769e264fa4a84cee6db47c`**
- Current task: **S1-04 in review; human mapping decisions remain pending**
- Next task: **S1-05 blocked and unstarted**
- Current sprint target: **private v0.1 by 27 August 2026**
