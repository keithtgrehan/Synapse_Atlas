# CONTROL_ROOM.md

<!-- CONTROL_ROOM_SCHEMA: v1 -->
<!-- Canonical persistent memory for ChatGPT, Codex, manual project sessions and all agents. -->

```yaml
project:
  canonical_repo: keithtgrehan/Career-Path-to-Psychedelic-Biotech
  product_name: Synapse Atlas
  visibility: private
  owner: Keith Grehan
  location: Berlin, Germany
  started: 2026-08-14
  last_updated: 2026-08-14
mission:
  career_goal: Move into CNS, neuropsychiatric or psychedelic biotech through partnerships, business development, strategy, research operations, or AI/data product work.
  product_goal: Prove scientific, product, engineering and commercial capability with a trustworthy private drug-development intelligence tool.
active_goal:
  id: G1
  name: Ship private v0.1
  target_date: 2026-08-27
  status: in_progress
active_sprint:
  id: S1
  dates: 2026-08-14/2026-08-27
  wip_limit: 3
  current_task: S1-01
operating_rules:
  one_active_goal: true
  new_scope_requires_tradeoff: true
  source_registry_deny_by_default: true
  human_review_required: true
  no_medical_advice: true
  no_custom_model_training_v0_1: true
last_completed:
  - Canonical repository selected.
  - Three-file project operating system defined.
  - S1-01 deployable-foundation implementation completed on its feature branch; review and merge remain pending.
next_action:
  task: Review S1-01 draft pull request
  instruction: Review CI and scope, then merge only with Keith's explicit approval; do not start S1-02 before S1-01 is integrated.
blockers:
  - Vercel and database project/environment configuration may require Keith's authenticated account.
  - Firecrawl requires a user API key or approved self-hosted setup before runtime use.
```

---

# 1. Product and career thesis

Keith should not discard his commercial history and attempt to become an entry-level scientist.

The differentiated career proposition is:

> Biology-trained commercial and partnerships leader with deep enterprise SaaS experience, now demonstrating evidence-governed AI/data product capability in neuropsychiatric drug development.

The product must make that proposition credible to a biotech founder, CBO, partnerships leader, research-operations lead or digital/R&D product leader.

## Target role order

1. Strategic partnerships / business development
2. Research and external partnerships
3. Commercial strategy
4. Strategy and operations / Chief of Staff
5. AI or data product for R&D
6. Research operations
7. Digital transformation in biotech/pharma

Do not reposition Keith as a neuroscientist, clinician, medicinal chemist or computational drug-discovery scientist.

---

# 2. Goals

## G0 — Establish control system

**Status:** Complete  
**Date:** 14 August 2026

Acceptance:

- canonical private repository selected;
- scope boundary recorded;
- agent contract recorded;
- persistent control room created.

## G1 — Ship a private v0.1

**Target:** 27 August 2026  
**Status:** Ready

A user must be able to:

1. search a relevant company, compound, program or indication;
2. inspect a normalized program page;
3. inspect linked registered trials and their current source timestamp;
4. compare two to four programs;
5. open the evidence behind every material fact;
6. distinguish source fact, extraction, calculation and inference;
7. view methodology, licensing and limitations;
8. export a reproducible source-bound table for a publication.

## G2 — Validate usefulness

**Target:** 11 September 2026

- five reviews from scientifically or commercially relevant people;
- each completes the core demo without explanation;
- record top three repeated problems;
- fix only repeated high-impact problems;
- obtain at least two permissioned quotes or concrete career introductions where possible.

## G3 — Publish career proof

**Target:** 30 September 2026

- one flagship report;
- four shorter analyses;
- public-safe case study;
- five-minute product demo;
- biotech-specific CV and LinkedIn positioning;
- direct outreach to relevant founders/CBOs/partnership leaders.

## G4 — Convert into career pipeline

**Target:** 12 November 2026

- 30 industry conversations;
- 20 high-quality applications or direct approaches;
- 10 meaningful relationships;
- five referrals/intros;
- active interview pipeline in CNS/neuropsychiatric biotech, CRO, pharma R&D technology or adjacent healthtech.

---

# 3. v0.1 acceptance contract

## Core demo

```text
Search
  -> Program page
  -> Registered trials
  -> Compare
  -> Evidence/source
  -> Reproducible export
```

## Dataset target

Targets are directional, not a reason to delay release:

- 20 reviewed companies;
- 30 reviewed programs/compounds;
- 75 registered trials;
- 150 literature metadata records;
- 10–15 mechanisms/targets;
- 50 manually reviewed extraction examples before generated summaries are trusted.

## Core entities

```text
Company
Program
Compound
Target
Mechanism
Indication
Trial
TrialArm
Endpoint
Publication
Source
Claim
IngestionRun
```

Avoid a generalized graph platform in v0.1.

## Deterministic metrics allowed

- registered trial count;
- active registered trial count;
- highest registered phase;
- total registered enrollment;
- days since registry update;
- publication count;
- open-access publication count;
- indication count;
- program recency.

## Prohibited scores

- approval probability;
- therapeutic superiority;
- “best drug”;
- investment attractiveness;
- safety recommendation;
- patient suitability.

---

# 4. Product UX map

## Required routes

```text
/                         Search and concise value proposition
/programs                 Program table and filters
/programs/[id]            Program evidence page
/trials                   Trial explorer
/compare                   Compare two to four programs
/evidence/[claimId]        Claim provenance
/methodology               Data, evidence and licence rules
/research                  Reproducible analyses
```

## UX release bar

- core journey in no more than three navigation actions;
- real data in primary screens;
- responsive;
- keyboard navigable;
- accessible labels, focus and contrast;
- clear stale-data indicator;
- facts, inference and unknowns distinct;
- loading, empty, error and partial-data states;
- no decorative charts until they answer a real comparison question.

---

# 5. Sprint S1 — 14 August to 27 August 2026

WIP limit: **3**.  
Only tasks in **Now** may be started.

## Now

### S1-01 — Deployable foundation

**Owner:** Orchestrator + Release  
**Status:** In review

**Outcome:** A minimal Next.js app builds in CI and deploys to a private preview.

Acceptance:

- Next.js 16 / TypeScript;
- pnpm;
- lint, typecheck, test and build;
- environment schema;
- Drizzle/Postgres configuration;
- health route;
- CI;
- one real ClinicalTrials.gov response fixture;
- no decorative product UI.

### S1-02 — Source registry and evidence schema

**Owner:** Research/Source + Data  
**Blocked by:** S1-01 interfaces

Acceptance:

- deny-by-default source-policy schema;
- ClinicalTrials.gov approved source entry;
- source, claim and ingestion-run tables;
- provenance invariant tests;
- exact host/method/path restrictions;
- content hash and processing timestamp.

### S1-03 — ClinicalTrials.gov vertical slice

**Owner:** Data + Product/UI  
**Blocked by:** S1-01 and S1-02

Acceptance:

- official API client;
- bounded query and pagination;
- normalized trial records;
- list/filter/detail UI;
- source freshness;
- source link;
- fixture and integration tests;
- no AI dependency.

## Next

### S1-04 — Program and compound resolution
Manual reviewed mapping first; aliases and conflicts preserved.

### S1-05 — Program comparison
Two-to-four comparison using deterministic registered facts.

### S1-06 — PubChem enrichment
Canonical identifiers and structures with provenance and throttling.

### S1-07 — Europe PMC literature metadata
Metadata/abstracts plus article-level OA licence state; no unauthorized full-text bulk download.

### S1-08 — Evidence drawer and methodology
Claim source, locator, transformation, timestamp, review status and licence.

### S1-09 — Limited ChEMBL/Open Targets enrichment
Selected target/mechanism facts with attribution and source-level licence review.

### S1-10 — Gold set and structured AI extraction
Fifty manually reviewed examples; model output remains review-only unless quality gates pass.

### S1-11 — Analyst summary
Facts, inferences, uncertainties and commercial questions, each source-bound.

### S1-12 — Release quality
Accessibility, responsive states, Playwright, security/source-policy checks and private release.

## Parking lot

- semantic/vector search;
- patent data;
- trial-change alerts;
- company-site monitoring;
- read-only MCP interface;
- scheduled updates;
- richer endpoint/result extraction;
- public deployment;
- user accounts;
- multi-tenant RLS;
- custom visualization;
- automated newsletter;
- fine-tuning.

## Killed for v0.1

- molecule generation;
- clinical recommendations;
- patient matching;
- autonomous browser research;
- authenticated LinkedIn extraction;
- proprietary database copying;
- paywall bypass;
- drug ranking;
- investment scoring;
- mobile app;
- subscriptions;
- collaboration/community;
- generalized agent platform;
- microservices;
- Kubernetes;
- event bus;
- custom design system.

---

# 6. Day-by-day shipping sequence

| Day | Date | Deliverable |
|---:|---|---|
| 1 | 14 Aug | Control system + scaffold + CI |
| 2 | 15 Aug | Source registry + evidence schema |
| 3 | 16 Aug | ClinicalTrials.gov client + fixtures |
| 4 | 17 Aug | Trial explorer vertical slice |
| 5 | 18 Aug | Program/company/compound entities |
| 6 | 19 Aug | PubChem identifiers |
| 7 | 20 Aug | Compare v0 + first internal demo |
| 8 | 21 Aug | Europe PMC/Crossref/OpenAlex metadata |
| 9 | 22 Aug | Selected ChEMBL/Open Targets enrichment |
| 10 | 23 Aug | Claim provenance UX |
| 11 | 24 Aug | Gold set + extraction validator |
| 12 | 25 Aug | Source-bound analyst summary |
| 13 | 26 Aug | UX, accessibility, tests, release checks |
| 14 | 27 Aug | Private v0.1 release + publication export |

If a day slips, cut from the bottom. Do not extend the release for AI, enrichment or visual polish. The minimum shippable product is ClinicalTrials.gov + reviewed program mappings + compare + provenance.

---

# 7. Prioritization

Use:

```text
Priority = (Career proof × User impact × Confidence) / Effort
```

Score each dimension 1–5. Reject false precision; the formula forces comparison.

Current order:

| Item | Career proof | User impact | Confidence | Effort | Decision |
|---|---:|---:|---:|---:|---|
| ClinicalTrials vertical slice | 5 | 5 | 5 | 3 | Build first |
| Provenance/evidence | 5 | 5 | 5 | 3 | Build first |
| Program compare | 5 | 5 | 4 | 3 | Build |
| Literature metadata | 4 | 4 | 5 | 3 | Build |
| AI extraction | 4 | 3 | 3 | 4 | Gate |
| Vector search | 2 | 2 | 2 | 4 | Park |
| Custom training | 3 | 2 | 1 | 5 | Kill v0.1 |
| Patent intelligence | 4 | 3 | 2 | 5 | Park |
| Authentication | 1 | 1 | 5 | 4 | Kill v0.1 |

---

# 8. Source and legal matrix

This is an operational risk screen, not legal advice. Recheck source terms before enabling adapters.

| ID | Source | Access | Initial status | Allowed v0.1 use | Key conditions |
|---|---|---|---|---|---|
| SRC-CTG | ClinicalTrials.gov | Official REST API/OpenAPI | Approved | Registered study data | Attribute; retain processing date; disclose transformations; keep current; no extracted-email marketing |
| SRC-EPMC | Europe PMC | REST/OAI/bulk | Approved with field rules | Metadata, abstracts, OA subset full text | Full text only from OA subset and enforce article-level licence; no automated bulk download of non-OA content |
| SRC-CROSSREF | Crossref | Public REST API | Approved with field rules | Bibliographic/licence/update metadata | Most metadata reusable; abstracts can remain copyrighted |
| SRC-OALEX | OpenAlex | API/snapshot | Approved | Scholarly graph and OA discovery metadata | CC0 dataset; API key and current usage limits; do not treat OA indicator as licence proof for copied full text |
| SRC-PUBCHEM | PubChem | Official programmatic services | Approved with provenance | Compound identifiers, structures and selected properties | Maximum requested rate 5 requests/sec; contributed-source rights may vary |
| SRC-CHEMBL | ChEMBL | Web services/download | Approved with attribution | Selected molecule, target, mechanism, assay and development data | CC BY-SA 3.0; isolate derived layer and preserve attribution/share-alike obligations |
| SRC-OT | Open Targets Platform | GraphQL/download/MCP | Conditional | Target-disease/drug evidence | Record Open Targets version and original source; review underlying-source licensing |
| SRC-FDA | FDA/openFDA | Official data/API | Conditional | Regulatory labels, safety/public documents | Use official access and source-specific disclaimers; not clinical advice |
| SRC-EMA | EMA | Official public documents/APIs where available | Conditional | Regulatory status/documents | Verify document reuse and access terms per source |
| SRC-COMPANY | Company/IR/pipeline pages | Manual URL or Firecrawl | Conditional per host | Public pipeline and partnership claims | Company claim label; exact host approval; terms/robots/licence review; bounded fetch |
| SRC-PATENT | EPO OPS/SureChEMBL | Official service | Parked | Patent metadata and chemical links | Account/terms/licence review before integration |
| SRC-PAYWALL | Paywalled papers | Lawful manual access | Metadata/notes only | Citation, DOI, own notes | No automated fetch, bypass or committed full text without verified permission |
| SRC-PROPRIETARY | PitchBook/Citeline/Cortellis/Evaluate/GlobalData etc. | Licensed | Blocked unless separately licensed | None | Do not copy, scrape or train on |
| SRC-LINKEDIN | LinkedIn authenticated content | Authenticated platform | Blocked | None | No login/session automation or scraping |
| SRC-PRIVATE | Private communities, decks, email, employer data | Private | Blocked by default | None | Written permission and a new privacy review required |

## German/EU text-and-data-mining note

For Germany, UrhG §44b permits reproductions of lawfully accessible works for text and data mining only where the rightsholder has not reserved the use, and copies must be deleted when no longer required. Do not assume Keith qualifies as a research organisation under §60d. A machine-readable reservation, contract, technical restriction or ambiguous status keeps the source out of automated ingestion pending review.

## Full-text rule

```text
OA licence verified and compatible
  -> permitted fields/full text according to licence
else
  -> metadata + abstract where provided for API reuse + DOI/link + Keith's own notes
```

Never use “freely readable in a browser” as proof of redistribution or training permission.

---

# 9. Firecrawl approval gate

Firecrawl is used only after an entry exists for the exact host.

## Approval packet

```yaml
source_id:
host:
paths:
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
follow_external_links: false
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
follow_external_links: false
authenticated_session: false
cookies: false
page_limit: 25
concurrency: 1
request_timeout_seconds: 30
max_retries: 2
store_raw_content: false
store_content_hash: true
manual_claim_review: true
```

Increase limits only after a successful bounded canary.

No Firecrawl use for:

- paywalled paper full text;
- publisher sites that prohibit automation;
- login/session content;
- CAPTCHA/access-control bypass;
- personal contact harvesting;
- broad “crawl the whole field” jobs;
- sources with unknown cost or rights.

---

# 10. Evidence and database contract

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
record_counts
rate/cost counters
status
redacted_error
```

## Invariants

1. Every material fact displayed has a source or external identifier.
2. Every derived calculation has input claim IDs and a formula version.
3. Every AI claim has model/prompt/schema version and review status.
4. No `MODEL_INFERENCE` is rendered as `SOURCE_FACT`.
5. Deleted or superseded source records remain auditable.
6. Stale source data is visibly stale rather than silently treated as current.

---

# 11. Model and training strategy

## v0.1

Use models only for:

- reviewed entity/claim extraction;
- source-bound summarization;
- uncertainty prompts;
- publication critique;
- coding assistance.

Do not use models for:

- clinical recommendations;
- unsupported mechanism conclusions;
- approval prediction;
- autonomous canonical updates;
- fabricated gap filling.

## Model selection

Run a gold-set benchmark rather than selecting by reputation.

Required metrics:

- critical-field precision ≥95%;
- unsupported critical claims <1%;
- source-locator validity ≥98%;
- schema success ≥99%;
- cost per accepted claim;
- latency.

Until those gates pass, model output stays visibly “needs review.”

## Custom training gate

No fine-tuning or custom model training until all are true:

- ≥200 manually reviewed rights-cleared examples;
- stable label definition;
- train/validation/test split;
- baseline error that materially limits the product;
- evidence that retrieval/prompting/validation is insufficient;
- training licence for every example;
- reproducible eval;
- explicit Keith approval.

The likely 90-day winner is not training a model. It is building an excellent evidence pipeline and evaluation set.

---

# 12. Existing-repository reuse audit

Do not import code until its exact provenance is reviewed.

| Donor | Intended reuse | Status | Rule |
|---|---|---|---|
| `keith-career-command-center` | Source registry, provenance, audit, deterministic gates, CI/test patterns | Approved for pattern review | No career/private data; adapt small generic modules |
| `career-command-Centre-Portfolio-Production` | Postgres, structured model proposals, release/privacy checks | Approved for pattern review | Preserve repository privacy and ownership boundaries |
| `ds-rag-pipeline-16-02-2026` | Retrieval/evaluation learning | Reference only | No LangChain/FAISS by default |
| `aipm-product-discovery-framework` | Evaluation/gold-set ideas | Restricted review | Repository says not to make material public; do not copy course content |
| data-cleaning/SQL/evaluation repos | Normalization and metrics utilities | Audit queued | Import only Keith-owned small tested code |
| UI-rich repos | Component/interaction ideas | Audit queued | Check dependency/licence/accessibility first |
| third-party/upstream course repos | None by default | Blocked | No copying without explicit compatible licence |

First implementation should write narrow production modules rather than merge whole donor repositories.

---

# 13. Education and credibility track

Target: **14–18 hours/week**, concurrent with product work.

Weekly pass rule:

- quiz ≥80%;
- five-minute explanation without notes;
- one paper/trial teardown;
- one product data contribution;
- all factual claims sourced.

| Week | Dates | Topic | Checkpoint |
|---:|---|---|---|
| 1 | 14–20 Aug | Drug development: target to approval | Explain pathway; map five programs |
| 2 | 21–27 Aug | Receptor pharmacology + PK/PD | Affinity/efficacy/potency/PK quiz |
| 3 | 28 Aug–3 Sep | CNS systems: serotonin, glutamate, plasticity | Evidence ladder for 5-HT2A claim |
| 4 | 4–10 Sep | Compound comparisons | 60-minute written exam + 10-minute oral |
| 5 | 11–17 Sep | Clinical trial design | Full RCT teardown |
| 6 | 18–24 Sep | Statistics and evidence | Interpret effect, uncertainty and clinical meaning |
| 7 | 25 Sep–1 Oct | Psychedelic trial-specific bias | Improved trial design |
| 8 | 2–8 Oct | GCP, regulation and safety | 15-minute program briefing |
| 9 | 9–15 Oct | Biotech business, IP and partnerships | Company value-chain map |
| 10 | 16–22 Oct | Competitive intelligence | Three-program comparison |
| 11 | 23–29 Oct | Scientific writing | Publish analysis |
| 12 | 30 Oct–5 Nov | Capstone | Flagship report draft |
| Final | 6–12 Nov | Interview defense | Written retest + 20-minute oral defense |

## Day-90 evidence target

- 20+ papers critically analyzed;
- 50+ trials mapped;
- 30+ programs mapped;
- deployed product;
- four public analyses;
- one flagship report;
- 30 industry conversations;
- 20 targeted applications/direct approaches.

---

# 14. Career execution track

## Weeks 1–2

- build product vertical slice;
- reposition CV/LinkedIn language internally;
- identify 100 target organizations;
- begin two expert conversations/week.

## Weeks 3–6

- five conversations/week;
- share private demo selectively;
- collect repeated product/domain feedback;
- publish first analysis;
- target CNS biotech, psychedelic biotech, CROs, pharma neuroscience, AI drug discovery and specialist investors.

## Weeks 7–12

- direct founder/CBO/partnership outreach;
- 20 high-quality applications;
- referral asks based on demonstrated work;
- flagship report;
- interview brief for each target;
- maintain a smaller conventional GTM pipeline as downside protection.

The product is a career asset, not a startup fundraising exercise.

---

# 15. Release definition

v0.1 is shipped when:

- [ ] private deployed URL works;
- [ ] ClinicalTrials.gov ingestion is live and bounded;
- [ ] reviewed company/program/compound mapping exists;
- [ ] trial explorer works;
- [ ] two-to-four-program comparison works;
- [ ] evidence/source view works;
- [ ] methodology/licence page exists;
- [ ] source timestamps and stale states are visible;
- [ ] provenance invariant tests pass;
- [ ] lint, typecheck, unit tests and build pass;
- [ ] Playwright core journey passes;
- [ ] no secrets/private full text are committed;
- [ ] one reproducible research export exists;
- [ ] README and control room are current.

AI extraction, ChEMBL enrichment and publication polish are cut before the release date slips.

---

# 16. Risks and responses

| Risk | Response |
|---|---|
| Overengineering | WIP 3, no speculative infra, new scope requires tradeoff |
| Scientific overclaim | Claim classes, source locator, domain review, uncertainty |
| Copyright/licence breach | Deny-by-default registry, OA licence verification, no paywall automation |
| Scraping cost/runaway crawl | Exact host/path, page cap, canary, ledger, fail closed |
| Poor data quality | Source timestamps, conflicts, review state, gold fixtures |
| AI hallucination | Structured schema, source validation, unsupported-claim eval |
| Weak UX | Test core journey with five users; fix repeated problems only |
| Career project becomes startup | Career KPI remains primary; no billing/multitenancy |
| Berlin-limited job market | Broader CNS/CRO/pharma/remote target universe |
| Model churn | Benchmark contracts, no hard dependency on model branding |

---

# 17. Decision log

| Date | Decision | Reason | Revisit |
|---|---|---|---|
| 2026-08-14 | Use `Career-Path-to-Psychedelic-Biotech` as canonical repo | User-selected single source of truth | Never unless Keith directs |
| 2026-08-14 | Keep repository private for v0.1 | Enables careful research and portfolio review without publishing restricted material | G3 public-safe case study |
| 2026-08-14 | Product name: Synapse Atlas | Clear internal identity without creating another repo | After validation only |
| 2026-08-14 | Next.js/Postgres monolith | Fastest path using proven existing patterns | Only if blocked |
| 2026-08-14 | Official APIs before Firecrawl | Better legal, provenance and engineering quality | Source-specific exceptions |
| 2026-08-14 | No vector DB or custom training in v0.1 | No validated need; major scope risk | After user evidence |
| 2026-08-14 | Three control files at root | Maximum discoverability for Codex/GPT and minimal documentation sprawl | After v0.1 |

---

# 18. Handover ledger

Append one compact row per completed work package.

| Date | Task | Result | Checks | Next |
|---|---|---|---|---|
| 2026-08-14 | G0 control system | README, AGENTS and CONTROL_ROOM established | Repository review | S1-01 scaffold |
| 2026-08-14 | S1-01 deployable foundation | Next.js/Postgres scaffold, health route, CI and real ClinicalTrials.gov fixture implemented on feature branch | lint, typecheck, 6 tests, build, Drizzle config, local smoke test, production dependency audit | Review and merge S1-01 draft PR; keep S1-02 blocked |

Detailed handovers may be placed below.

### 2026-08-14 — S1-01

**Goal:** G1 — Ship private v0.1

**Completed:** Minimal Next.js 16/TypeScript app; pnpm lockfile; Zod environment validation; lazy Drizzle/Postgres client and migration configuration; `/api/health`; GitHub Actions CI; bounded real ClinicalTrials.gov fixture with source metadata and integrity test; private Vercel-preview-ready build.

**Files changed:** Application/configuration under `src/`, root build/tooling configuration, `.github/workflows/ci.yml`, `data/fixtures/clinicaltrials.gov/`, unit tests, `README.md`, and this control room.

**Tests/checks:** `pnpm lint`; `pnpm typecheck`; `pnpm test` (3 files, 6 tests); `pnpm build`; `pnpm db:generate` (configuration loaded, zero S1-01 tables); local production smoke test for `/` and `/api/health`; `pnpm audit --prod` (no known vulnerabilities); `git diff --check`; targeted secret-pattern scan.

**Source/legal evidence:** `SRC-CTG` is approved in the source matrix. Fixture came from the official `clinicaltrials.gov/api/v2/studies` endpoint with one exact NCT ID and selected fields; metadata records retrieval time, source processing date, URL, attribution, transformation, and SHA-256. No Firecrawl, authentication, paywall, or restricted full text was used.

**Decisions:** Health reports configuration readiness without exposing credentials or requiring a database connection during build. Database creation remains lazy. S1-02 tables and source-policy interfaces were intentionally not introduced.

**Known risks:** CI and a private Vercel preview can only be confirmed after the branch is pushed and platform integrations run. A real Postgres connection has not been provisioned or smoke-tested.

**Blocked:** Private preview/database environment configuration may require Keith's authenticated Vercel and database accounts.

**Next highest-impact task:** Review and merge the S1-01 draft PR with explicit Keith approval; S1-02 remains blocked until then.

## Handover template

```markdown
### YYYY-MM-DD — TASK-ID

**Goal:**  
**Completed:**  
**Files changed:**  
**Tests/checks:**  
**Source/legal evidence:**  
**Decisions:**  
**Known risks:**  
**Blocked:**  
**Next highest-impact task:**  
```

---

# 19. Manual control

Use these commands in a project conversation or Codex:

- `STATUS` — read this file and report active goal, WIP, blockers and next action.
- `START S1-01` — execute only that task.
- `CUT <item>` — remove item from current scope and record decision.
- `PARK <item>` — move item to parking lot.
- `APPROVE SOURCE <id>` — only after approval packet is complete.
- `REPLAN` — re-sequence within fixed goal/date; additions require removals.
- `REVIEW DIFF` — inspect scope, evidence, tests and risk.
- `SHIP` — run release definition; do not waive failures silently.
- `RETRO` — record what worked, failed and is cut next.

## Current instruction to Codex

```text
Read README.md, AGENTS.md and CONTROL_ROOM.md.

Execute S1-01 only. Create the smallest deployable Next.js 16 / TypeScript foundation with pnpm, Zod, Drizzle/Postgres configuration, Vitest, a health route, CI, environment validation and one checked-in ClinicalTrials.gov API fixture.

Do not add authentication, AI, Firecrawl, vector search, design system, dashboards or extra routes. Run lint, typecheck, tests and build. Update this control room with a truthful handover and stop.
```
