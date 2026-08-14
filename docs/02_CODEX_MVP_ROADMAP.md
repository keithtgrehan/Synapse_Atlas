# Synapse Atlas — Authoritative Codex MVP Roadmap

**Version:** 2.0  
**Prepared:** 14 August 2026  
**Canonical repository:** `keithtgrehan/Career-Path-to-Psychedelic-Biotech`  
**Current canonical `main`:** Resolve dynamically from Git/GitHub at the start of every session.

**Current project status:** Maintained in `CONTROL_ROOM.md`.

**Private v0.1 target:** 27 August 2026  
**Validation target:** 11 September 2026  
**Career-proof publication target:** 30 September 2026  
**Career conversion target:** 12 November 2026

## 1. Current truth

The canonical repository's operating controls are:

- `README.md`
- `AGENTS.md`
- `CONTROL_ROOM.md`

This roadmap is the stable implementation plan. Read `CONTROL_ROOM.md` for the
live task, completed work, blockers, and next action; do not infer current status
from this roadmap.

Do not claim the production MVP is shipped until the canonical repository contains the application, CI passes, and a private deployed URL has been smoke-tested.

The working product name is **Synapse Atlas**.

---

# 2. Product decision

Do **not** build:

- a broad “AI drug-discovery platform”;
- a generic chatbot;
- a molecule-generation system;
- a clinical recommendation tool;
- a drug-ranking or approval-probability model;
- a generalized knowledge graph;
- an investment-advice product;
- a startup platform with billing, teams, or collaboration.

Build one narrow, credible workflow:

> A user searches a neuropsychiatric programme, inspects its compound, mechanism, indication, registered trials and supporting literature, compares two to four programmes, and opens the source behind every material fact.

The product proves:

```text
biology and scientific reasoning
+ public-data engineering
+ evidence provenance
+ deterministic analysis
+ disciplined AI
+ useful commercial comparison
+ clean product UX
+ reproducible publication
```

## Primary user

A biotech business-development, partnerships, commercial-strategy, research-operations, or R&D product leader evaluating programmes.

## Core questions

1. What programmes exist?
2. Which companies control or sponsor them?
3. What compounds, mechanisms, targets, and indications are involved?
4. What registered trials support each programme?
5. What literature is directly linked?
6. What is source fact versus extraction versus inference?
7. How do two to four programmes differ?
8. What is missing, conflicting, stale, or uncertain?
9. What are the scientific, operational, and partnership questions?

---

# 3. Core demo and acceptance contract

## Demo flow

```text
Search
-> Programme page
-> Registered trials
-> Compare 2–4 programmes
-> Evidence/source detail
-> Reproducible export
```

## Private v0.1 acceptance

A user can:

1. Search by company, compound, indication, target, or mechanism.
2. Open a normalised programme page.
3. Inspect linked registered trials and source timestamps.
4. Compare two to four programmes.
5. Open the evidence behind every material displayed fact.
6. Distinguish:
   - `SOURCE_FACT`
   - `STRUCTURED_EXTRACTION`
   - `DERIVED_CALCULATION`
   - `HUMAN_INFERENCE`
   - `MODEL_INFERENCE`
   - `UNVERIFIED`
   - `UNKNOWN`
7. View methodology, source rights, limitations, and freshness.
8. Export a reproducible table or Markdown brief tied to source versions and a code commit.

## Directional data target

Do not delay release merely to reach these numbers:

- 20 reviewed companies;
- 30 reviewed programmes/compounds;
- 75 registered trials;
- 150 literature metadata records;
- 10–15 mechanisms/targets;
- 50 manually reviewed extraction examples before model summaries are trusted.

## Quality gate

The release fails if:

- a material fact lacks a source or stable external identifier;
- model output is rendered as source fact;
- missing data are hidden;
- a company statement is presented as independent evidence;
- an unlicensed full text or private artefact is committed;
- source automation lacks an approved policy;
- the product implies clinical, patient, safety, investment, or superiority advice;
- lint, typecheck, tests, build, or core journey fail;
- the demo depends entirely on a live external API with no fixture/fallback.

---

# 4. Agile product-management system

## Operating rules

- One active product goal.
- Two-week shipping sprint.
- Work in progress limit: **three tasks total**.
- A task must produce a user-visible outcome or eliminate a release risk.
- New scope requires an equivalent cut or deferral.
- No agent silently improves adjacent systems.
- Stop at “good enough to prove the objective,” then ship and validate.

## Scope admission test

A feature enters the sprint only when all are true:

1. It directly improves the active goal.
2. A target user can observe the improvement.
3. It completes an acceptance test or reduces a known risk.
4. It can be implemented and verified within the sprint.
5. It complies with source, legal, privacy, and medical boundaries.
6. Its impact exceeds its implementation and maintenance cost.

If one answer is no, park it.

## Prioritisation

Use:

```text
Priority = (Career proof × User impact × Confidence) / Effort
```

Score 1–5. The formula forces trade-offs; it is not a scientific metric.

| Item | Career proof | User impact | Confidence | Effort | Decision |
|---|---:|---:|---:|---:|---|
| ClinicalTrials vertical slice | 5 | 5 | 5 | 3 | Build first |
| Claim provenance | 5 | 5 | 5 | 3 | Build first |
| Programme comparison | 5 | 5 | 4 | 3 | Build |
| Literature metadata | 4 | 4 | 5 | 3 | Build |
| Structured AI extraction | 4 | 3 | 3 | 4 | Gate |
| Company-site Firecrawl | 3 | 3 | 2 | 4 | After v0.1 |
| Vector search | 2 | 2 | 2 | 4 | Park |
| Patent intelligence | 4 | 3 | 2 | 5 | Park |
| Fine-tuning | 3 | 2 | 1 | 5 | Kill v0.1 |
| Authentication | 1 | 1 | 5 | 4 | Kill v0.1 |

## Scope-killer rule

When the release date is threatened, cut in this order:

1. Model-generated analyst summary.
2. ChEMBL/Open Targets enrichment.
3. Publication polish.
4. PubChem enrichment.
5. Literature enrichment beyond identifiers/metadata.

Never cut:

- ClinicalTrials.gov vertical slice;
- reviewed programme mapping;
- comparison;
- evidence/provenance;
- tests;
- methodology and limitations;
- usable UX.

---

# 5. Canonical repository structure

```text
/
  README.md
  AGENTS.md
  CONTROL_ROOM.md
  package.json
  pnpm-lock.yaml
  next.config.ts
  drizzle.config.ts
  .env.example
  .github/
    workflows/
  docs/
    01_EDUCATION_90_DAY.md
    02_CODEX_MVP_ROADMAP.md
    ARCHITECTURE.md
    EVIDENCE_MODEL.md
    DATA_SOURCES.md
    LEGAL_AND_LICENSING.md
    EVALS.md
    RELEASE.md
  src/
    app/
      page.tsx
      programs/
      trials/
      compare/
      evidence/
      methodology/
      research/
      api/
        health/
    components/
    lib/
      db/
      domain/
      evidence/
      sources/
      research/
      exports/
  scripts/
    ingest-clinicaltrials.ts
    ingest-literature.ts
    ingest-compounds.ts
    build-gold-set.ts
    export-research.ts
  tests/
    unit/
    integration/
    e2e/
  research/
    gold/
    reviewed/
    publications/
    exports/
  data/
    fixtures/
```

Do not create a monorepo, microservices, event bus, Kubernetes, custom design system, or separate Python service in v0.1.

---

# 6. Technical architecture

## Stack

```text
Application: Next.js 16 App Router + React + TypeScript
Runtime: Node.js
Validation: Zod
Database: Postgres
ORM/migrations: Drizzle
Testing: Vitest + Playwright
Deployment: Vercel
CI: GitHub Actions
Package manager: pnpm
AI API: OpenAI Responses API, only after evaluation
```

Use Python only when a scientific/data library materially reduces work that TypeScript cannot perform cleanly.

## Why this stack

The canonical Career Command Center repositories already demonstrate relevant Next.js, TypeScript, Zod, Drizzle/Postgres, testing, provenance, and release patterns. Reusing the engineering shape reduces time-to-ship and makes the portfolio story coherent.

## Runtime shape

```text
Official/public source
-> source-policy gate
-> bounded adapter
-> immutable ingestion run
-> normaliser/entity resolution
-> source + claim records
-> review state
-> deterministic query
-> UI
-> reproducible export
```

## Search

Use Postgres filters and full-text search first.

Do not add embeddings or a vector database until:

- users cannot find relevant programmes with deterministic search;
- the failure is measured;
- an embedding approach outperforms the baseline on a reviewed query set.

---

# 7. Domain and evidence model

## Core tables

```text
source_policies
sources
source_versions
ingestion_runs

companies
programs
compounds
targets
mechanisms
indications

trials
trial_arms
endpoints
publications

program_trials
program_publications
compound_targets
program_indications

claims
claim_inputs
review_decisions
research_exports
```

## Source

```text
id
provider
external_id
url
title
published_at
retrieved_at
source_processing_date
content_hash
licence
licence_url
raw_retention_class
policy_id
```

## Claim

```text
id
subject_type
subject_id
predicate
value_json
evidence_class
source_id
source_version_id
source_locator
extraction_method
model_version
confidence
review_status
created_at
```

## Ingestion run

```text
id
source_policy_id
policy_version
request_hash
started_at
completed_at
request_count
record_counts
cost_counters
status
redacted_error
```

## Invariants

1. Every material displayed fact has a source or stable external identifier.
2. Every derived calculation lists input claim IDs and a formula version.
3. Every model claim stores model, schema/prompt version, source locator, confidence, and review status.
4. `MODEL_INFERENCE` never becomes `SOURCE_FACT` automatically.
5. Conflicts are retained and surfaced.
6. Unknown is valid.
7. Stale records are visibly stale.
8. Company marketing copy remains a company claim.
9. No “best drug,” approval, investment, safety, or patient-suitability score.

---

# 8. Required product routes

```text
/                         concise value proposition + search
/programs                 filterable programme table
/programs/[id]            programme evidence page
/trials                   trial explorer
/trials/[nctId]           registered trial detail
/compare                   compare 2–4 programmes
/evidence/[claimId]        claim provenance
/methodology               methods, data, licences, limitations
/research                  reproducible analyses
```

## UX release bar

- Core journey completed in three navigation actions.
- Useful real data on primary screens.
- Responsive at mobile, tablet, and desktop.
- Keyboard usable.
- Accessible labels, focus, contrast, and table semantics.
- Clear loading, empty, error, partial, and stale states.
- Facts, inferences, and unknowns visually distinct.
- Source link reachable from every material fact.
- No dead controls.
- No decorative chart unless it answers a comparison question.
- No psychedelic visual clichés.

A restrained research/product aesthetic is preferable to a flashy “AI dashboard”.

---

# 9. Data-source and legal-access matrix

This is an operational screen, not legal advice. Recheck terms before enabling an adapter.

## Approved starting sources

| ID | Source | Direct access | v0.1 use | Key conditions |
|---|---|---|---|---|
| `SRC-CTG` | ClinicalTrials.gov | `https://clinicaltrials.gov/data-api/api` | Registered study data | Attribute ClinicalTrials.gov; retain processing date; disclose modifications; keep data current; no extracted-email marketing |
| `SRC-EPMC` | Europe PMC | `https://europepmc.org/developers` | Publication metadata, abstracts, OA discovery | Full text only from OA subset and only under the individual article licence |
| `SRC-CROSSREF` | Crossref | `https://api.crossref.org/` | DOI, bibliographic, licence, update, and relationship metadata | Most metadata is open; abstracts may remain copyrighted |
| `SRC-OALEX` | OpenAlex | `https://docs.openalex.org/` | Scholarly graph, DOI linking, citation/OA metadata | Dataset is CC0; do not treat an OA indicator as permission to copy full text |
| `SRC-PUBCHEM` | PubChem | `https://pubchem.ncbi.nlm.nih.gov/docs/programmatic-access` | Canonical chemical identifiers, structures, selected properties | Maximum five requests/second; preserve contributor provenance; field rights may vary |
| `SRC-CHEBI` | ChEBI | `https://www.ebi.ac.uk/chebi/about/` | Chemical ontology and identifiers | CC BY 4.0; attribute |
| `SRC-CHEMBL` | ChEMBL | `https://www.ebi.ac.uk/chembl/` | Selected molecule, target, mechanism, assay, and development data | CC BY-SA 3.0; preserve attribution and share-alike obligations |
| `SRC-OT` | Open Targets | `https://platform-docs.opentargets.org/data-access` | Target/disease/drug evidence and annotations | Platform data is CC0; preserve source/version and review underlying-source notes |
| `SRC-FDA` | FDA/openFDA | `https://open.fda.gov/apis/` | Public regulatory records/labels where relevant | Use official disclaimers; not medical advice |
| `SRC-EMA` | EMA | `https://www.ema.europa.eu/` | Public regulatory documents and statuses | Verify document-specific access/reuse terms |
| `SRC-GITHUB` | GitHub | `https://github.com/search` | Repository discovery and licence metadata | Public visibility is not a reuse licence; reuse code only with compatible licence |

## Conditional sources

| ID | Source | Use | Gate |
|---|---|---|---|
| `SRC-COMPANY` | Company pipeline, investor-relations, press-release pages | Company programme and partnership claims | Manual URL or Firecrawl after exact-host terms/robots/rights review |
| `SRC-PATENT-EPO` | EPO Open Patent Services | Patent bibliographic/legal-event data | Register for OPS and accept terms before integration |
| `SRC-SURECHEMBL` | SureChEMBL | Chemical-patent links | Confirm current licence/version and preserve attribution |
| `SRC-GRANTS` | NIH RePORTER / Europe PMC grants | Public funding relationships | Use official API/exports and source/version metadata |
| `SRC-PREPRINT` | bioRxiv/medRxiv metadata and rights-qualified text | Preprint discovery | Label as non-peer-reviewed and check licence per item |

## Blocked unless separately licensed

- Citeline.
- Cortellis.
- Evaluate Pharma.
- GlobalData.
- PitchBook.
- Proprietary analyst reports.
- Licensed market reports.
- Private investor decks.
- Employer data.
- Authenticated LinkedIn data.
- Private communities.
- Paywalled full text.
- Content obtained through another employer’s or institution’s restricted account.
- Sci-Hub or piracy sources.

## Legal routes to restricted material

Use one of:

1. Open-access article or author manuscript with a compatible licence.
2. University/public-library or lawful personal subscription for reading.
3. Publisher text-and-data-mining licence.
4. Direct author or rightsholder permission.
5. Vendor licence explicitly covering:
   - storage;
   - automated extraction;
   - derived outputs;
   - portfolio use;
   - model input/training if applicable.
6. Metadata and citation only, with your own notes, when full-text reuse is not permitted.

Private use is not a blanket exception to copyright, database rights, contracts, privacy law, robots directives, or access controls.

---

# 10. Firecrawl policy

## Decision

Firecrawl is a conditional source adapter, not the primary research engine.

Priority:

```text
official API
> official bulk export
> official RSS/feed
> manual public URL
> approved Firecrawl scrape
> approved bounded crawl
```

## Setup

Official Firecrawl onboarding currently supports:

```bash
npx -y firecrawl-cli@latest init --all --browser
```

Or configure an API key in a server-only environment variable:

```text
FIRECRAWL_API_KEY
```

Never commit the key.

## Required approval packet

```yaml
source_id:
host:
allowed_paths:
purpose:
public_access_verified:
terms_url:
terms_reviewed_at:
robots_reviewed_at:
rights_basis:
rightsholder_reservation:
allowed_fields:
full_text_allowed:
attribution:
retention:
deletion_trigger:
page_limit:
requests_per_second:
concurrency:
delay_ms:
allow_external_links: false
cache_policy:
zero_data_retention:
cost_cap:
reviewer:
status: proposed|approved|blocked|expired
```

## Runtime defaults

```yaml
deny_by_default: true
ignoreRobotsTxt: false
allowExternalLinks: false
authenticated_session: false
cookies: false
page_limit: 10
max_discovery_depth: 1
concurrency: 1
delay_ms: 1500
request_timeout_seconds: 30
max_retries: 2
store_raw_content: false
store_content_hash: true
manual_claim_review: true
```

Increase limits only after a successful one-page canary.

## Firecrawl may be used for

- exact public company pipeline pages;
- public investor-relations pages;
- public press-release archives;
- public regulator pages where no suitable API/export exists;
- public research-centre pages;
- rights-qualified open documents;
- source discovery that stores links/metadata rather than copied protected text.

## Firecrawl may not be used for

- paywall bypass;
- publisher pages prohibiting automation;
- login/session content;
- CAPTCHA or access-control bypass;
- authenticated LinkedIn;
- personal contact harvesting;
- broad “crawl the whole field” jobs;
- pages with unknown rights or unknown cost;
- storing paper full text without a compatible licence;
- converting restricted text into a training corpus.

Firecrawl’s robots and zero-data-retention controls reduce operational risk; they do not create a copyright or contractual right to use the source.

---

# 11. Repository-reuse strategy

## Rule

“Borrow from all repositories” means **audit the entire accessible estate, then reuse only the highest-value, owned or compatibly licensed patterns**. It does not mean merge every repository.

No direct links are required for repositories accessible through the connected GitHub account. Direct local paths are required only for unpushed worktrees, local-only branches, or files outside GitHub.

## Priority donor repositories

| Repository | Reuse | Status |
|---|---|---|
| `keith-career-command-center` | Source registry, provenance, audit history, deterministic gates, capability registry, CI/test patterns | Highest priority; no private career data |
| `career-command-Centre-Portfolio-Production` | Postgres/Drizzle or Supabase patterns, structured model proposals, release/privacy checks | High priority; preserve private boundary |
| `ds-rag-pipeline-16-02-2026` | Retrieval/evaluation learning | Reference only until semantic retrieval is justified |
| `aipm-product-discovery-framework` | Gold-set/evaluation ideas | Restricted: repository states material must not be made public |
| Data-cleaning repositories | Normalisation and validation utilities | Audit exact ownership and tests |
| SQL/EDA/evaluation repositories | Query, metric, and benchmark patterns | Reuse small tested utilities |
| `clarity-ai-transparent-dating` and UI-heavy projects | Interaction/component ideas | Audit licence, dependencies, and accessibility |
| MCP/agent repositories | Capability and tool patterns | Add only after core UI works |
| Third-party course/upstream repos | None by default | Reuse only under explicit compatible licence |

## Repository-mining agent task

For every accessible repository, record:

```text
repository
default branch
commit
visibility
owner
licence
relevant files
candidate pattern
private/restricted material
decision: reuse / rewrite / reference / block
reason
```

Do not copy a file merely because it is publicly visible.

Prefer rewriting a narrow tested utility over importing a framework.

---

# 12. Agent topology

Codex supports parallel agents and worktrees. Use that capability, but enforce a WIP limit of three.

## A. Orchestrator / Product Manager

Owns:

- active goal;
- sprint scope;
- priorities;
- acceptance tests;
- WIP;
- integration;
- `CONTROL_ROOM.md`.

Only this agent admits or removes scope.

## B. Research and Source-Governance Agent

Owns:

- source discovery;
- licence/terms/robots review;
- source-policy entries;
- Firecrawl approval packets;
- retention and attribution rules.

It cannot enable ambiguous sources.

## C. Data-Ingestion Agent

Owns:

- API clients;
- rate limits;
- retries/backoff;
- fixtures;
- normalisation;
- entity resolution;
- ingestion audit;
- adapter tests.

It works only against approved source policies.

## D. Scientific Review Agent

Owns:

- terminology;
- mechanism/target/indication review;
- gold examples;
- evidence-class decisions;
- uncertainty and limitation labels.

It cannot make medical recommendations.

## E. Product / UI Agent

Owns:

- programme explorer;
- trial explorer;
- compare flow;
- provenance UI;
- methodology;
- responsive/accessibility states.

It cannot add decorative product scope.

## F. Quality, Security, and Evaluation Agent

Owns:

- unit/integration/e2e tests;
- provenance invariants;
- licence-policy tests;
- extraction evaluation;
- accessibility;
- adversarial unsupported-claim testing.

## G. Release Agent

Owns:

- CI;
- environment verification;
- migration checks;
- Vercel deployment;
- smoke tests;
- rollback;
- release notes.

## H. Career and Publication Agent

Activated after the vertical slice works.

Owns:

- reproducible research exports;
- publication;
- case study;
- demo narrative;
- target-company research;
- application evidence.

## Parallel-work rule

Parallel agents may work only in disjoint directories after interfaces are fixed.

```text
src/lib/sources/**       Research/Data
src/lib/domain/**        Data/Scientific
src/lib/evidence/**      Scientific/Quality
src/app/**               Product/UI
tests/**                 Quality
scripts/**               Data/Release
research/**              Scientific/Career
```

Do not let multiple agents edit the same schema, migration, or core interface simultaneously.

---

# 13. Model routing

Model availability changes; keep the routing policy and benchmark the current models.

## Coding

Use **GPT-5.3-Codex**:

- `high` reasoning for ordinary implementation, tests, refactors, and PR work.
- `xhigh` only for schema changes, source/security boundaries, difficult bugs, and release review.

## Scientific and architecture reasoning

Use **GPT-5.6 Sol** for:

- difficult scientific adjudication;
- architecture decisions;
- evidence conflicts;
- publication critique;
- adversarial review.

## High-volume structured extraction

Benchmark **GPT-5.6 Terra** against Sol on the same manually reviewed gold set.

Use Terra only if it meets the release thresholds.

## Low-risk high-volume tasks

Use **GPT-5.6 Luna** only for tasks such as:

- low-risk categorisation;
- synonym proposals;
- formatting;
- triage;

and only when deterministic validators catch errors.

## Required extraction benchmark

```text
critical-field precision >= 95%
unsupported critical claims < 1%
source-locator validity >= 98%
schema success >= 99%
cost per accepted claim
latency
```

Until all critical gates pass, model output remains `needs_review`.

## Fine-tuning gate

Do not fine-tune or train a custom model until all are true:

- at least 200 manually reviewed, rights-cleared examples;
- stable labels;
- train/validation/test split;
- measured baseline failure worth solving;
- prompting/retrieval/validation is insufficient;
- every example permits training;
- privacy review;
- reproducible evaluation;
- explicit Keith approval.

The likely 90-day winner is a strong evidence pipeline and gold set, not a custom model.

---

# 14. Fourteen-day aggressive sprint

## Day 1 — 14 August
### Control and deployable foundation

- Read `README.md`, `AGENTS.md`, and `CONTROL_ROOM.md`.
- Scaffold Next.js 16/TypeScript with pnpm.
- Add Zod environment validation.
- Add Drizzle/Postgres configuration.
- Add `/api/health`.
- Add Vitest, lint, typecheck, build.
- Add GitHub Actions.
- Add one real, rights-qualified ClinicalTrials.gov fixture.
- Create private Vercel preview shell.

**Exit:** CI-green deployable foundation. No decorative UI.

## Day 2 — 15 August
### Source registry and evidence schema

- `source_policies`
- `sources`
- `source_versions`
- `ingestion_runs`
- `claims`
- `review_decisions`
- exact ClinicalTrials.gov host/method/path policy
- provenance invariant tests

**Exit:** deny-by-default source layer.

## Day 3 — 16 August
### ClinicalTrials.gov adapter

- official API client;
- bounded query;
- bounded pagination;
- timeout/retry/backoff;
- raw fixture;
- normalisation;
- content hash;
- processing/retrieval timestamps;
- tests.

**Exit:** real trial data in Postgres.

## Day 4 — 17 August
### Trial explorer

- list;
- search/filter;
- detail;
- status;
- enrolment;
- phase;
- sponsor;
- endpoints;
- source freshness;
- source link;
- loading/error/empty states.

**Exit:** first genuinely useful product slice.

## Day 5 — 18 August
### Programme/company/compound mapping

- canonical entities;
- aliases;
- manual reviewed mappings;
- conflict preservation;
- no model dependency.

## Day 6 — 19 August
### PubChem / ChEBI identifiers

- CID;
- InChIKey;
- canonical SMILES where permitted;
- aliases;
- provenance;
- throttling.

## Day 7 — 20 August
### Programme compare v0

- compare two to four programmes;
- registered facts only;
- explicit unknowns;
- first internal user test.

**Week-one demo:** search -> programme -> trial -> source -> compare.

## Day 8 — 21 August
### Literature metadata

- Europe PMC;
- Crossref;
- OpenAlex;
- PMID/PMCID/DOI;
- title/authors/year;
- abstract only under API/source rules;
- OA/licence metadata;
- programme/publication links.

## Day 9 — 22 August
### Selected target/mechanism enrichment

- limited ChEMBL/Open Targets fields;
- isolate ChEMBL attribution/share-alike layer;
- source/version metadata;
- no bulk data grab beyond current need.

## Day 10 — 23 August
### Evidence and methodology UX

- click any fact;
- source;
- locator;
- transformation;
- timestamp;
- licence;
- review state;
- limitations.

**Exit:** trustworthy private beta candidate.

## Day 11 — 24 August
### Gold set

- 50 reviewed examples:
  - registry;
  - literature metadata/abstract;
  - company claim;
  - compound;
  - ambiguous/conflicting cases.

## Day 12 — 25 August
### Structured extraction benchmark

- schema;
- validator;
- source-locator check;
- unsupported-claim detection;
- Sol/Terra comparison;
- keep review-only unless gates pass.

## Day 13 — 26 August
### Release quality

- Playwright core journey;
- accessibility;
- responsive review;
- security headers;
- source-policy tests;
- licence manifest;
- privacy/secret scan;
- failure and stale-data states;
- rollback notes.

## Day 14 — 27 August
### Private v0.1 release

- private deployed URL;
- smoke test;
- tagged release;
- README;
- methodology;
- architecture;
- reproducible export;
- five-minute demo;
- control-room handover.

If work slips, cut from Days 12, 9, 8, and 6 in that order. Do not extend the release merely to include AI.

---

# 15. Post-v0.1 sequence

## 28 August–11 September: validation

- Five scientifically or commercially relevant reviewers.
- Each completes the core demo without explanation.
- Record repeated friction.
- Fix only repeated high-impact problems.
- Obtain permissioned quotes or introductions where possible.

## 12–30 September: career proof

- One flagship report.
- Four shorter analyses.
- Public-safe case study.
- Five-minute product video.
- Biotech-specific CV and LinkedIn.
- Direct outreach to founders, CBOs, partnerships, research operations, and R&D product leaders.

## October–12 November: career conversion

- 30 industry conversations.
- 20 high-quality applications/direct approaches.
- 10 meaningful relationships.
- Five referrals/intros.
- Active interview pipeline.

## Backlog after evidence of need

- trial-change detection;
- company-page monitoring;
- Firecrawl host-by-host;
- read-only MCP;
- scheduled updates;
- patent slice;
- richer endpoint/result extraction;
- public deployment.

---

# 16. Release checks

A `release:check` script should run:

```text
lint
typecheck
unit tests
integration tests
source-policy tests
licence-manifest validation
provenance completeness
secret/privacy scan
restricted-full-text scan
production build
Playwright core journey
```

## Provenance test

For every public material fact:

```text
source_id != null
retrieved_at != null
source_url != null OR external_id != null
```

For derived facts:

```text
input_claim_ids.length > 0
formula_version != null
```

For model facts:

```text
model_version != null
source_locator != null
review_status != null
```

---

# 17. Persistent control-room handover

Every agent task ends with:

```markdown
## Handover

**Goal:**  
**Task:**  
**Completed:**  
**Files changed:**  
**Tests/checks:**  
**Source/legal evidence:**  
**Decisions:**  
**Known risks:**  
**Blocked:**  
**Next highest-impact task:**  
**Control-room update:** completed / not completed and why
```

Update `CONTROL_ROOM.md` truthfully after every work package.

## Manual commands

```text
STATUS
START <task-id>
PAUSE
CUT <scope-item>
PARK <scope-item>
APPROVE SOURCE <source-id>
REJECT SOURCE <source-id>
REPLAN
REVIEW DIFF
SHIP
RETRO
```

---

# 18. Codex prompts

## A. Initial canonical kickoff

```text
Read README.md, AGENTS.md and CONTROL_ROOM.md in full.

Operate as the Orchestrator/Product Manager.

Canonical repository:
keithtgrehan/Career-Path-to-Psychedelic-Biotech

Execute S1-01 only.

User-visible outcome:
A minimal deployable Next.js 16 / TypeScript foundation builds in CI and exposes a health route.

Required:
- pnpm
- Next.js 16 App Router
- TypeScript
- Zod environment validation
- Drizzle/Postgres configuration
- Vitest
- lint, typecheck, test and build scripts
- GitHub Actions
- /api/health
- one checked-in real ClinicalTrials.gov fixture with source metadata
- private Vercel-preview readiness

Non-goals:
- authentication
- AI
- Firecrawl
- vector search
- dashboards
- design system
- extra routes
- source enrichment
- broad repository refactor

Before editing, report:
- goal ID
- owned files
- acceptance tests
- non-goals
- source/legal status

Implement one vertical slice.
Run all relevant checks.
Review the diff for scope leakage.
Update CONTROL_ROOM.md with a truthful handover.
Stop. Do not begin S1-02 automatically.
```

## B. Source-governance agent

```text
Read the canonical control files.

Own only:
- source-policy schema
- docs/DATA_SOURCES.md
- docs/LEGAL_AND_LICENSING.md
- source-policy fixtures/tests

For each proposed source record:
- owner
- official access route
- terms/licence
- permitted fields
- prohibited fields
- attribution
- rate/cost limits
- retention
- full-text rule
- current decision

Do not fetch data.
Do not add application UI.
Do not enable Firecrawl.
Ambiguous sources remain blocked.
Return the mandatory handover.
```

## C. ClinicalTrials data agent

```text
Read the canonical control files and approved ClinicalTrials.gov source policy.

Own only:
- ClinicalTrials.gov client
- schemas
- normaliser
- fixtures
- ingestion-run persistence
- adapter tests

Requirements:
- official API only
- exact allowed host/path
- bounded pagination
- timeout, retry and backoff
- content hash
- retrieved_at and source processing date
- source attribution
- no email extraction
- no AI
- no UI beyond typed repository interfaces

Run the adapter and provenance tests.
Return the mandatory handover.
```

## D. Product/UI agent

```text
Read the canonical control files and stable repository interfaces.

Build only:
- trial list/detail
- programme list/detail
- compare 2–4
- evidence drawer/page
- methodology page
- loading, error, empty, partial and stale states

Constraints:
- no decorative dashboard
- no chart without a decision question
- no client-side source fetching
- accessible tables and forms
- keyboard navigation
- responsive
- facts, inference and unknowns visually distinct

Run component, integration, accessibility and Playwright checks.
Return the mandatory handover.
```

## E. Research/deep-research agent

```text
Research one bounded question only.

Question:
Replace this line with one exact, bounded research question before running the agent.

Required:
- primary sources first
- registry/regulator records where applicable
- identifiers: DOI, PMID, PMCID, NCT/CTIS
- source date and access date
- evidence for
- evidence against
- methodological limitations
- conflicts/sponsor role
- unresolved questions
- rights/licence status for any retained text

Do not:
- infer superiority
- use secondary summaries where primary evidence is available
- copy paywalled full text
- write canonical product facts
- exceed the question scope

Output a review packet, not a canonical update.
```

## F. Release agent

```text
Read the canonical control files and release definition.

Do not change product scope.

Run:
- environment-key validation
- migrations
- lint
- typecheck
- unit and integration tests
- source-policy/licence checks
- secret/private-content scans
- production build
- Playwright core journey
- private deployment
- post-deploy smoke tests

Record:
- commit
- deployment
- checks
- failures
- rollback
- unresolved risks

Update CONTROL_ROOM.md and stop.
```

---

# 19. Definition of v0.1 done

- [ ] Canonical repo contains the application.
- [ ] Private deployed URL works.
- [ ] ClinicalTrials.gov ingestion is live and bounded.
- [ ] Reviewed company/programme/compound mappings exist.
- [ ] Trial explorer works.
- [ ] Two-to-four-programme comparison works.
- [ ] Evidence/source view works.
- [ ] Methodology/licence page exists.
- [ ] Source timestamps and stale states are visible.
- [ ] Provenance invariants pass.
- [ ] Lint, typecheck, tests, and build pass.
- [ ] Playwright core journey passes.
- [ ] No secrets, private material, or unlicensed full text are committed.
- [ ] One reproducible export exists.
- [ ] README, AGENTS, and CONTROL_ROOM are current.
- [ ] Five-minute demo is recorded or rehearsed.

The project succeeds when it improves career credibility. It does not need to become a company.
