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
  last_updated: 2026-08-15
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
  current_task: S1-05
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
  - PR #2 merged S1-01 at a79759f6615913fd088ae04184c2c9c7c520abc2.
  - S1-01 post-merge closeout removed the unintended Production deployment and aliases while preserving both protected Preview deployments.
  - Automatic Vercel Git deployments from main are disabled by tested version-controlled policy; pull-request Preview deployments remain enabled.
  - PR #3 merged the S1-01 post-merge closeout at 290ca358c86ffd9fd7cfaae61534eec9427115e8.
  - PR #4 merged S1-02 at 3b83f8f92b925c791430950a8ed5c22e1d5915b2.
  - PR #5 merged S1-03 at b7305dae739841a23c769e264fa4a84cee6db47c with successful GitHub CI and Vercel Preview checks.
  - PR #6 merged S1-04 at d9cd1e6d41c560e9af7170b27b21aa5c1e50988c with all three bounded programme mappings approved and resolved.
next_action:
  task: S1-05
  instruction: Commit and push the reviewed exact-base slice, open one draft S1-05 PR, then verify exact-head CI and the protected Git-integrated Preview before final Control Room review; never merge, enable auto-merge, deploy to Production, or start S1-06.
blockers:
  - No approved Postgres connection is configured, so the S1-02 migration remains unapplied and S1-03 live normalized records are not persisted.
  - S1-06 is blocked and unstarted until S1-05 is explicitly merged and post-merge verified.
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
**Status:** Complete

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
**Status:** Complete — merged in PR #4 at `3b83f8f92b925c791430950a8ed5c22e1d5915b2`

Acceptance:

- deny-by-default source-policy schema;
- ClinicalTrials.gov approved source entry;
- source, claim and ingestion-run tables;
- provenance invariant tests;
- exact host/method/path restrictions;
- content hash and processing timestamp.

### S1-03 — ClinicalTrials.gov vertical slice

**Owner:** Data + Product/UI  
**Status:** Complete — merged in PR #5 at `b7305dae739841a23c769e264fa4a84cee6db47c`

Acceptance:

- official API client;
- bounded query and pagination;
- normalized trial records;
- list/filter/detail UI;
- source freshness;
- source link;
- fixture and integration tests;
- no AI dependency.

### S1-04 — Program and compound resolution

**Owner:** Data + Scientific Review + Product/UI
**Status:** Complete — merged in PR #6 at `d9cd1e6d41c560e9af7170b27b21aa5c1e50988c`

Acceptance:

- version-controlled, runtime-validated mapping candidates;
- exact `SRC-CTG` v1 snapshots and provenance;
- canonical labels and raw aliases;
- conservative deterministic resolver with explicit unresolved/conflict states;
- only approved mappings may resolve;
- programme list/search/detail UI with linked registered trials and official evidence;
- auditable human review decision record;
- no database migration, AI, fuzzy matching, or new source.

### S1-05 — Program comparison
**Owner:** Data + Scientific Review + Product/UI + Quality
**Status:** In progress — current

Two-to-four comparison using deterministic registered facts.

## Next

### S1-06 — PubChem enrichment
**Status:** Blocked and unstarted — requires explicit S1-05 merge and post-merge verification

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
| 2026-08-14 | Disable automatic Vercel Git deployments from `main` | Keep Synapse Atlas Preview-only until a future human-approved Production action | Before an explicitly approved Production release |
| 2026-08-14 | Keep S1-04 mapping candidates version-controlled, pending, and resolver-gated | ClinicalTrials.gov supports registry observations but not company identity, ownership, focal intervention, or approved programme/compound relationships | After Keith reviews each mapping row |
| 2026-08-15 | Approve the three S1-04 mappings only within bounded internal programme namespaces | Keith explicitly approved the Usona, COMP360, and CYB003 associations; registry interventions remain separate source observations, programme aliases do not create chemical synonym/equivalence claims, and all unsupported company, rights, chemical, programme-wide, efficacy, safety, mechanism, and superiority claims remain unknown | Final Control Room review of draft PR #6; never broaden these decisions without new approved evidence and review |
| 2026-08-15 | Build S1-05 only from the validated S1-04 dataset and exact retained ClinicalTrials.gov bytes | A deterministic comparison can expose reviewed associations, registry observations, a versioned unique-NCT calculation, and explicit unknowns without a live fetch, database, new source, scientific claim promotion, or ranking | Final Control Room review of the S1-05 draft PR |

---

# 18. Handover ledger

Append one compact row per completed work package.

| Date | Task | Result | Checks | Next |
|---|---|---|---|---|
| 2026-08-14 | G0 control system | README, AGENTS and CONTROL_ROOM established | Repository review | S1-01 scaffold |
| 2026-08-14 | PR #1 — Authoritative education and MVP roadmaps | Added `docs/01_EDUCATION_90_DAY.md` and `docs/02_CODEX_MVP_ROADMAP.md`; merged as `5609a9b09bb8578f39a088aec1a57ed94eaddc9a` | Git/GitHub merge verification | S1-01 scaffold |
| 2026-08-14 | S1-01 deployable foundation | Next.js/Postgres scaffold, health route, CI and real ClinicalTrials.gov fixture implemented on feature branch | lint, typecheck, 7 tests, build, Drizzle config, local smoke test, production dependency audit | Review and merge S1-01 draft PR; keep S1-02 blocked |
| 2026-08-14 | S1-01 review remediation | Added aggregate check, runtime fixture/metadata validation, corrected provenance dates, durable roadmap status, PR #1 ledger evidence and protected Vercel preview | Full requested local verification; protected preview root 200 and expected health 503 | Return draft PR #2 to Control Room review; keep S1-02 blocked |
| 2026-08-14 | S1-01 post-merge closeout | Verified PR #2 merged; removed the unintended Production deployment and three aliases; preserved the project and protected Previews; added and tested the `main` deployment guardrail | Frozen install, lint, typecheck, 4 test files/8 tests, build, aggregate check, Vercel before/after verification | After Keith explicitly merges PR #3 and the Control Room verifies `main` and Vercel state, issue `START S1-02` |
| 2026-08-14 | PR #3 — S1-01 post-merge closeout | Merged the tested Preview-only deployment guardrail and closeout record as `290ca358c86ffd9fd7cfaae61534eec9427115e8` | Local, origin/main and live GitHub merge verification; Vercel Production remained empty | S1-02 source registry and evidence schema |
| 2026-08-14 | S1-02 source registry and evidence schema | Added the deny-by-default `SRC-CTG` policy, seven-table provenance schema, baseline migration/approved-policy bootstrap, runtime invariants and migration drift checks on the feature branch | `pnpm check`; 7 test files/41 tests; build; Drizzle check and no-drift regeneration; smoke, diff and secret review | Review the draft PR; keep S1-03 blocked and unstarted |
| 2026-08-14 | PR #4 — S1-02 source registry and evidence schema | Merged the reviewed source-policy, evidence, schema and migration foundation as `3b83f8f92b925c791430950a8ed5c22e1d5915b2` | Local, origin/main, live GitHub, CI and protected Preview verification; Vercel Production remained empty | S1-03 ClinicalTrials.gov vertical slice |
| 2026-08-14 | S1-03 ClinicalTrials.gov vertical slice | Added the bounded official API client, normalized trial records, live list/filter/detail UI, explicit freshness/provenance, and fail-closed states on the feature branch | `pnpm check`; 10 test files/65 tests; production build; live API and desktop/mobile browser journey; diff, secret and scope review | Review the draft PR; keep S1-04 unstarted |
| 2026-08-14 | PR #5 — S1-03 ClinicalTrials.gov vertical slice | Merged the reviewed registered-trial explorer as `b7305dae739841a23c769e264fa4a84cee6db47c` | Local, origin/main, live GitHub, CI and Vercel Preview verification; no open PR remained | S1-04 program and compound resolution |
| 2026-08-14 | S1-04 program and compound resolution | Added three evidence-bound pending mapping candidates, deterministic approval-gated resolution, offline programme search/detail, and exact registry snapshot provenance | `pnpm check`; 13 test files/85 tests; audit clean; migration and Vercel policy unchanged; production smoke and desktop/390 px browser journey | Review the draft PR and decide each pending mapping row; keep S1-05 blocked |
| 2026-08-15 | S1-04 human-review remediation | Recorded Keith's three bounded approvals, strengthened exact snapshot-query validation, and made programme review/resolution UI state-driven | `pnpm check`; 14 test files/93 tests; audit clean; migration/dependencies/CI/Vercel policy unchanged; seven-route production smoke and desktop/390 px Chrome verification | Confirm the updated draft PR #6 head has green CI and Preview checks, then return it to final Control Room review; never merge or start S1-05 automatically |
| 2026-08-15 | S1-04 final evidence-governance remediation | Bound every mapping to exact NCT, sponsor, compound, locator, and chronology evidence; made distinct open programme candidates block alias resolution | Focused 4 files/37 tests; `pnpm check` 14 files/102 tests; audit, smoke, no-change checks, invalid-mutation rerun, and two independent read-only reviews passed | After exact-head CI and Ready Preview-only verification, complete final Control Room review of draft PR #6; never merge or start S1-05 automatically |
| 2026-08-15 | PR #6 — S1-04 program and compound resolution | Merged the reviewed mappings as `d9cd1e6d41c560e9af7170b27b21aa5c1e50988c`; all three approved associations and evidence boundaries are now canonical | Live GitHub main, merge commit, reviewed head, successful CI, Ready Preview inventory, no open PR, and empty Production inventory verified | S1-05 deterministic programme comparison |
| 2026-08-15 | S1-05 deterministic programme comparison | Added exact status/start observations, pure offline comparison construction, strict two-to-four selection, evidence-separated comparison UI, derived unique-NCT count, provenance, explicit unknowns, and responsive states on the feature branch | Frozen install; focused and full 16 files/120 tests; all required individual and aggregate checks; audit; trace, drift, dependency, secret, and exact-base review; route smoke; desktop/390 px browser journey | Open one draft PR, verify exact-head CI and protected Preview, then return it for review; keep S1-06 blocked |

Detailed handovers may be placed below.

### 2026-08-14 — S1-01

**Goal:** G1 — Ship private v0.1

**Completed:** Minimal Next.js 16/TypeScript app; pnpm lockfile and aggregate `check` script; Zod environment validation; lazy Drizzle/Postgres client and migration configuration; `/api/health`; GitHub Actions CI; bounded real ClinicalTrials.gov fixture and metadata validated at runtime with Zod; malformed-fixture rejection and integrity tests; protected Vercel preview.

**Files changed:** Application/configuration under `src/`, root build/tooling configuration, `.github/workflows/ci.yml`, `data/fixtures/clinicaltrials.gov/`, unit tests, `README.md`, `docs/02_CODEX_MVP_ROADMAP.md`, and this control room.

**Tests/checks:** `pnpm install --frozen-lockfile`; `pnpm lint`; `pnpm typecheck`; `pnpm test` (3 files, 7 tests, including malformed-fixture rejection); `pnpm build`; `pnpm check`; `pnpm db:generate` (configuration loaded from a clean generated-output state, zero S1-01 tables); local production smoke test (`/` 200, `/api/health` expected 503 without database configuration); `pnpm audit --prod` (no known vulnerabilities); `git diff --check`; targeted secret-pattern scan.

**Source/legal evidence:** `SRC-CTG` is approved in the source matrix. Fixture came from the official `clinicaltrials.gov/api/v2/studies` endpoint with one exact NCT ID and selected fields; metadata separately records API retrieval time, local processing time, registry last-update-posted date, URL, attribution, transformation, and SHA-256. No Firecrawl, authentication, paywall, or restricted full text was used.

**Decisions:** Health reports configuration readiness without exposing credentials or requiring a database connection during build. Database creation remains lazy. Drizzle schema generation does not require a live connection; commands that use the database still validate `DATABASE_URL`. S1-02 tables and source-policy interfaces were intentionally not introduced.

**Vercel preview:** `https://synapse-atlas-axd426qa0-keith-grehans-projects.vercel.app` is Ready in the Preview environment. Vercel SSO protection applies to all non-custom-domain deployments and Git fork protection is enabled. Unauthenticated root access redirects to authentication; authenticated root returned 200; authenticated `/api/health` returned the expected 503 degraded response because no `DATABASE_URL` exists. The CLI unexpectedly assigned the project's first deployment to production despite no `--prod`; that exact deployment and its aliases were removed. Only the preview remains, and the temporary verification bypass was revoked.

**Known risks:** A real Postgres connection has not been provisioned or smoke-tested. GitHub CI must rerun on the review-remediation commit.

**Blocked:** None for the S1-01 foundation preview. Database-backed behavior remains unavailable until a real approved Postgres connection is configured.

**Next highest-impact task:** Review and merge the S1-01 draft PR with explicit Keith approval; S1-02 remains blocked until then.

### 2026-08-14 — S1-01 post-merge closeout

**Goal:** G1 — Ship private v0.1

**Completed:** Verified PR #2 merged as `a79759f6615913fd088ae04184c2c9c7c520abc2`. Removed unintended Vercel Production deployment `dpl_9rnR62w5icN46wzDWk55UpfpMPVQ` and the aliases `synapse-atlas-theta.vercel.app`, `synapse-atlas-keith-grehans-projects.vercel.app`, and `synapse-atlas-git-main-keith-grehans-projects.vercel.app`. Preserved the Synapse Atlas Vercel project and protected Preview deployments `dpl_7ZuhsDoV27r9bBq1EbHMZJsZP3tz` and `dpl_C8tsu9tgk4QtvmgBit4EKPA4pJrQ`. Added a version-controlled Vercel policy disabling automatic Git deployments only from `main`; pull-request Preview deployments remain enabled. No Production deployment or promotion occurred.

**Files changed:** `vercel.json`, `tests/unit/vercel-policy.test.ts`, `README.md`, and this control room.

**Tests/checks:** Node `v22.23.1`; pnpm `10.18.3`; `pnpm install --frozen-lockfile`; `pnpm lint`; `pnpm typecheck`; `pnpm test` (4 files, 8 tests); `pnpm build`; `pnpm check`; official Vercel configuration documentation and live schema review; Vercel deployment, alias, project, and Preview before/after verification; final diff and secret/private-data review.

**Source/legal evidence:** No research source or external content was added. Vercel operations were limited to Keith's exact authorized deployment and aliases. No credentials, environment values, bypass tokens, private data, paid service, database, Firecrawl, or OpenAI API use was introduced.

**Decisions:** S1-01 is Complete. S1-02 is Ready and current/next but not started. S1-03 is blocked by S1-02. Production deployment requires a future explicit human-approved action.

**Known risks:** No real Postgres connection exists, which may block applying and integration-testing S1-02 migrations. Production remains restricted to a future explicit human-approved action.

**Blocked:** No S1-01 blocker remains. S1-02 has not started and awaits Keith's explicit `START S1-02` command; database-backed migration verification may remain blocked until a real Postgres connection is configured.

**Next highest-impact task:** After Keith explicitly merges PR #3 and the Control Room verifies `main` and Vercel state, issue `START S1-02`.

### 2026-08-14 — S1-02

**Goal:** G1 — Ship private v0.1

**Completed:** Implemented a fail-closed, versioned source-policy registry with one approved ClinicalTrials.gov entry and exact HTTPS host, GET method, path, credential, port, fragment, expiry, and redirect boundaries. Added source-policy, source/version, ingestion-run, claim/input, and review-decision tables with restrictive provenance and policy-coherence foreign keys and database checks. Added pure Zod claim/provenance validators, exact-byte SHA-256 verification, a baseline migration that bootstraps the matching approved policy, migration consistency in CI, and deterministic adversarial tests. S1-02 remains In review until its draft PR is explicitly merged.

**Files changed:** Source policy and evidence modules under `src/lib/`; Drizzle schema, lazy typed client and generated `drizzle/` migration; fixture validation; unit tests; CI/package scripts; `README.md`; and this control room.

**Tests/checks:** `pnpm install --frozen-lockfile`; `pnpm check` (lint, strict typecheck, 7 test files/41 tests, Drizzle migration check, production build); second migration generation reported no schema changes; local production smoke test returned `/` 200 and the expected `/api/health` 503 without database configuration; `git diff --check`; bounded diff, migration SQL, secret/private-data, and S1-03 scope review. GitHub CI evidence will be recorded in the PR/final handover.

**Source/legal evidence:** `SRC-CTG` remains the sole runtime-approved policy. The entry records the official ClinicalTrials.gov API and terms pages, attribution, allowed use, prohibited use, and review timestamp. No new external content, scraping, Firecrawl, authentication, paywall access, or AI API use was introduced.

**Decisions:** Immutable retrieval time, local processing time, and exact stored-byte hash live on `source_versions`; the provider-reported registry update date remains separate source metadata. `source_versions` must match the policy version on both its source and ingestion run. Derived inputs that span rows are enforced by the pure claim validator and `claim_inputs`; conflicts remain representable because claims are not made unique by subject/predicate. The baseline migration and approved-policy bootstrap are generated/statically tested without provisioning or contacting a database.

**Known risks:** The migration has not been applied to a real Postgres instance. Cross-row claim-input class validation and synchronization between claim review status and decision history will require transaction-level application logic in later bounded tasks.

**Blocked:** No blocker to reviewing S1-02. Applying and integration-testing the migration is blocked until a real Postgres connection is separately approved and configured. S1-03 is blocked by S1-02 merge and remains unstarted.

**Next highest-impact task:** Review and explicitly merge the S1-02 draft PR if it passes; only then start S1-03 as a separate work package.

### 2026-08-14 — S1-03

**Goal:** G1 — Ship private v0.1

**Completed:** Implemented a server-only ClinicalTrials.gov client that constructs one approved request shape, rechecks `SRC-CTG` before every attempt, rejects redirects, sends no credentials or cookies, and bounds term length, status, page token, URL, timeout, retry, response bytes and page size. Added Zod runtime validation, partial-date precision, exact-byte SHA-256 provenance, normalized trial records with explicit reported/not-reported/not-requested states, stable field locators, and deterministic freshness based on retrieval time. Added live `/trials` search/status/pagination and `/trials/[nctId]` detail views with loading, empty, redacted error and not-found states. S1-03 was merged in PR #5 at `b7305dae739841a23c769e264fa4a84cee6db47c`; GitHub CI and Vercel Preview checks succeeded.

**Files changed:** Official API client and normalized trial domain modules under `src/lib/`; trial list, detail and state views under `src/app/trials/`; the minimal landing page and shared styles; fixture partial-date validation; deterministic unit/integration tests; `README.md`; and this control room. No database table, migration, source policy, dependency, background job or unrelated product entity was added.

**Tests/checks:** `pnpm lint`; strict `pnpm typecheck`; `pnpm test` (10 test files/65 tests); Drizzle migration consistency; production build and aggregate `pnpm check`; live local official-API smoke; automated browser verification of home, default live search, status filter, opaque-token next page, exact NCT detail, provenance/hash, empty and invalid-ID states, and 390 px mobile layout; no console/framework overlay or horizontal overflow; `git diff --check`; bounded diff, secret/private-data and S1-04 scope review.

**Source/legal evidence:** Requests are limited to credential-free `GET https://clinicaltrials.gov/api/v2/studies` under existing approved policy `SRC-CTG` version `1`, with the fixed fields needed by the views and direct registry attribution. The live client uses the official API; fixtures are deterministic tests only and never a silent product fallback. No scraping, Firecrawl, authentication, restricted content, AI API or new source was used.

**Decisions:** Pagination is one bounded page per user action, at most 10 records, using an opaque provider token; there is no autonomous crawl. Detail lookup remains on the approved studies path through exact `query.id`. Unknown registry values remain explicit. Registry last-update date is a provider fact separate from API retrieval and local processing times. Live records remain request-scoped until an approved Postgres connection exists; no database was provisioned. S1-03 intentionally fails closed rather than presenting its test fixture as live data; this is an explicit review-stage scope override, and an approved persisted or clearly labelled resilience path remains a release-quality gate before `SHIP`.

**Known risks:** The product depends on live ClinicalTrials.gov availability. The S1-02 migration has not been applied to real Postgres, and S1-03 records are not yet persisted or database-integration-tested. A future persistence task must use the existing source/version/claim model and preserve the current provenance semantics.

**Blocked:** S1-03 has no remaining review blocker and is Complete. Database persistence remains blocked on a separately approved Postgres connection.

**Next highest-impact task:** S1-04 program and compound resolution as a separate review-gated work package.

### 2026-08-14 — S1-04

**Goal:** G1 — Ship private v0.1

**Completed:** Added a strict version `1.0.0` programme-mapping dataset containing three bounded candidates; exact ClinicalTrials.gov snapshots and metadata for `NCT05711940` and `NCT06605105`; reuse of the existing `NCT03866174` fixture; canonical programme, compound, and reported sponsor-organisation records; exact raw aliases and source locators; pending human-inference mapping assertions; a pure conservative resolver; deterministic offline search; `/programs` and `/programs/[slug]`; Home navigation; loading, empty, partial/unknown, redacted error, and not-found states. Only approved synthetic test mappings resolve; collisions retain every approved candidate and select no winner. Production mappings remain `PENDING` and `UNRESOLVED` without reviewer identity or timestamp. S1-04 remains In review until its draft PR is explicitly merged and post-merge verified.

**Files changed:** Versioned data under `data/program-mappings/`; two additional exact `data/fixtures/clinicaltrials.gov/` responses and metadata envelopes; programme domain, resolver, runtime dataset, and fixture validation modules under `src/lib/`; programme list/detail/state UI under `src/app/programs/`; the Home CTA and bounded shared styles; focused unit/integration tests; `README.md`; and this control room. `AGENTS.md`, the durable roadmap, dependencies, database schema, Drizzle migration history, source policy, CI, and `vercel.json` remain unchanged.

**Tests/checks:** `pnpm install --frozen-lockfile`; focused programme suite (3 files/20 tests); `pnpm check` (lint, strict typecheck, 13 test files/85 tests, `pnpm db:check`, production build); `pnpm audit --prod` (no known vulnerabilities); exact migration/schema no-drift diff against `b7305dae739841a23c769e264fa4a84cee6db47c`; unchanged `vercel.json`; `git diff --check`; targeted credential/secret scan. Production-mode local smoke returned `/` 200, `/programs` 200, `/programs/comp360-treatment-resistant-depression` 200, an unknown programme 404, and `/api/health` the expected degraded 503 without a database.

**Browser verification:** Desktop and 390 px checks completed through the in-app browser against the production-mode local server. Home → Programmes, canonical-label search, alias search, candidate detail, linked live `NCT05711940` trial, and the correct official source link were verified. The no-results, repeated-parameter redacted error, pending/unknown status, status-key conflict vocabulary, and programme not-found states were verified. Semantic headings/lists/description lists, the labelled GET form, keyboard-visible 3 px focus outline, descriptive links, source timestamps/hash/locators, and responsive layout were present. No console warnings/errors, framework overlay, blank state, or horizontal overflow appeared on the list or detail page.

**Source/legal evidence:** `SRC-CTG` version `1` remains the sole source. The retained NCT records are `NCT03866174` (Usona Institute; Psilocybin, Niacin, and Set and Setting protocol; major depressive disorder), `NCT05711940` (COMPASS Pathways; Psilocybin; treatment-resistant depression), and `NCT06605105` (Cybin IRL Limited; CYB003; major depressive disorder). Each record preserves the exact API request URL, official human-readable study URL, retrieval time, later/equal local processing time, separate registry update date, exact retained-byte SHA-256, attribution, and field locators. Raw registry observations are `STRUCTURED_EXTRACTION`; programme, alias, sponsor-organisation, and compound relationships are `HUMAN_INFERENCE`. No other API, scraping, Firecrawl, authentication, paywall, restricted content, AI, embeddings, or fuzzy matching was used.

**Mapping review table:**

| Mapping ID | Programme candidate | Reported sponsor organisation | Candidate compound | NCT | Review | Resolution | Human decision required |
|---|---|---|---|---|---|---|---|
| `mapping-usona-psilocybin-mdd` | Usona psilocybin for major depressive disorder | Usona Institute | Psilocybin | `NCT03866174` | `PENDING` | `UNRESOLVED` | Approve, reject, or amend the grouping and proposed focal compound; the registry reports three interventions. |
| `mapping-comp360-trd` | COMP360 for treatment-resistant depression | COMPASS Pathways | Psilocybin | `NCT05711940` | `PENDING` | `UNRESOLVED` | Approve, reject, or amend the COMP360 ↔ Psilocybin programme mapping. |
| `mapping-cyb003-mdd` | CYB003 for major depressive disorder | Cybin IRL Limited | CYB003 | `NCT06605105` | `PENDING` | `UNRESOLVED` | Approve, reject, or amend the CYB003 programme mapping. |

**Decisions:** The first slice ships three candidates because all three can be represented without leaving the approved registry boundary or claiming approval. Reported sponsor organisations are not treated as companies, owners, controllers, or developers. Company identity, asset rights, programme-level phase/status, mechanism, efficacy, safety, and superiority remain explicitly unknown. Search may expose a pending candidate but never turns that candidate into a resolved mapping. The checked-in programme pages are snapshots; linked trial pages remain the live official-API view.

**Known risks:** Human mapping approval is outstanding. `NCT03866174` has multiple reported interventions, so its focal compound is especially review-sensitive. ClinicalTrials.gov alone does not establish company identity or asset ownership/control. The existing S1-02 migration remains unapplied and S1-03 live records remain request-scoped because no approved Postgres connection exists. The linked trial page still depends on live ClinicalTrials.gov availability.

**Blocked:** No blocker to reviewing the S1-04 draft PR. Merge is blocked on Keith's explicit review decision for the three mapping rows and explicit merge approval. S1-05 is blocked and unstarted.

**Next highest-impact task:** Review the S1-04 draft PR, record an explicit approve/reject/amend decision for each mapping row in the same branch, rerun checks if mappings change, then explicitly merge and post-merge verify before starting S1-05.

### 2026-08-15 — S1-04 human-review remediation

**Goal:** G1 — Ship private v0.1

**Completed:** Recorded Keith's explicit human decisions for all three mapping assertions as `APPROVED` and `RESOLVED`, using the exact reviewer reference, rationales, and actual processing time `2026-08-14T22:10:17Z`. Preserved the three Usona registry interventions separately; kept COMP360 and Psilocybin non-equivalent with their chemical/formulation relationship unknown; limited CYB003 approval to the programme candidate, candidate compound label, trial, and reported-sponsor association; and kept programme aliases namespace-scoped. Replaced pending-only UI copy/classes with exhaustive state-driven review and resolution presentations, exposed the human review record and registry interventions, and strengthened snapshot URLs to exactly one approved value for each required parameter with no extras.

**Files changed:** The versioned mapping dataset; programme domain/schema; programme list/detail/state UI and shared styles; focused fixture, resolver, integration, and server-render tests; `README.md`; and this control room. No fixture bytes or metadata, dependency, source policy, CI workflow, database schema, migration, or Vercel policy changed.

**Tests/checks:** `pnpm install --frozen-lockfile`; focused programme suite (4 files/28 tests); `pnpm check` (lint, strict typecheck, 14 test files/93 tests, Drizzle consistency, production build); `pnpm audit --prod` (no known vulnerabilities); `git diff --check`; exact schema/migration, dependency, CI, and `vercel.json` no-change checks; targeted credential/private-data scan. Production-mode local smoke passed `/programs`, COMP360 search, all three detail routes, repeated-parameter redacted error, and unknown-programme 404. Chrome desktop and emulated 390 px checks rendered meaningful content, distinct Approved/Resolved badges, the review record, and all Usona interventions; the 390 px page had no horizontal overflow, framework overlay, or page console error.

**Source/legal evidence:** `SRC-CTG` policy version `1` remains the sole source. No source, request, or fixture was added or refreshed. Existing exact official snapshots for `NCT03866174`, `NCT05711940`, and `NCT06605105` retain their original bytes, metadata, SHA-256 values, registry observations, attribution, and locators. Registry facts remain `STRUCTURED_EXTRACTION`; the reviewed relationships remain bounded `HUMAN_INFERENCE`.

**Decisions:** `mapping-usona-psilocybin-mdd`, `mapping-comp360-trd`, and `mapping-cyb003-mdd` may resolve only within their reviewed programme namespaces. Review approval does not establish company identity, ownership/control, developer or commercial-rights status, chemical/formulation equivalence, programme-wide phase/status, mechanism, efficacy, safety, superiority, or any unreviewed intervention role. S1-04 remains In review until explicit merge and post-merge verification.

**Known risks:** No approved Postgres connection exists, so the S1-02 migration remains unapplied and normalized live trial records remain request-scoped. Linked trial pages still depend on live ClinicalTrials.gov availability. The reviewed mapping boundary must not be broadened without new evidence and human review.

**Blocked:** Draft PR #6 merge remains blocked on Keith's explicit merge instruction. S1-05 remains blocked and unstarted until S1-04 is merged and post-merge verified.

**Next highest-impact task:** Confirm the updated draft PR #6 head has green GitHub CI and a Ready Preview-only Vercel deployment, then return it to final Control Room review without merging.

### 2026-08-15 — S1-04 final evidence-governance remediation

**Goal:** G1 — Ship private v0.1

**Completed:** Strengthened the programme dataset to reject duplicate NCT IDs, evidence snapshot IDs, evidence locators, raw-evidence ownership, and snapshot field locators; require exact one-to-one NCT/evidence coverage; bind each asserted sponsor and compound to raw aliases from every evidence snapshot; require the five material snapshot locators plus exactly one selected compound intervention child; and enforce precision-preserving retrieval, processing, review, and dataset chronology with equality allowed. Updated the conservative alias resolver so `APPROVED`, `PENDING`, and `NEEDS_REVISION` candidates from distinct programmes conflict, while `REJECTED` history remains visible but nonblocking and same-programme history does not create a false conflict. The three human decisions and scientific boundaries are unchanged.

**Files changed:** The versioned mapping dataset, programme domain/schema and resolver, focused programme tests, and this control room. `README.md`, fixture and metadata bytes, source queries and hashes, dependencies, database schema and migration, source policy, CI, both roadmaps, and Vercel policy remain unchanged.

**Tests/checks:** `pnpm install --frozen-lockfile`; focused programme suite (4 files/37 tests); `pnpm check` (lint, strict typecheck, 14 files/102 tests, Drizzle consistency, production build); `pnpm audit --prod` (no known vulnerabilities); targeted invalid-mutation rerun (8 tests); production-mode local smoke for `/programs` and all three programme details; `git diff --check`; schema/migration, dependency, CI, source-policy, roadmap, fixture/metadata, README, and Vercel-policy no-change checks; filename-only environment and added-line credential/private-data/bypass scans. Two independent read-only reviews reproduced the adversarial mutations and found no remaining blocker after one bounded repair loop.

**Source/legal evidence:** `SRC-CTG` policy version `1` remains the sole source. No source, request, fixture, or metadata was added or refreshed. The exact retained bytes, SHA-256 values, URLs, provenance, registry facts, original human-review timestamp, reviewer reference, rationales, aliases, and explicit unknowns remain unchanged; only exact material evidence locators and the truthful dataset update timestamp changed.

**Decisions:** Evidence ownership is unique within each entity type; one locator cannot stand for multiple snapshot fields; chronology comparisons retain fractional precision and normalize offsets. Alias resolution blocks an approved winner whenever another programme has an active pending or needs-revision candidate, retains rejected history, and resolves same-programme approved/open history without a false cross-programme conflict. S1-04 remains In review.

**Known risks:** No approved Postgres connection exists, so the S1-02 migration remains unapplied and normalized live trial records remain request-scoped. Linked trial pages still depend on live ClinicalTrials.gov availability. Exact-head GitHub CI and Preview-only Vercel evidence must be verified after the commit and push and recorded in PR #6 without changing that head.

**Blocked:** Draft PR #6 merge remains blocked on Keith's explicit merge instruction. S1-05 remains blocked and unstarted until S1-04 is merged and post-merge verified.

**Next highest-impact task:** After exact-head GitHub CI and Ready Preview-only Vercel verification, complete final Control Room review of draft PR #6 without merging.

### 2026-08-15 — S1-05

**Goal:** G1 — Ship private v0.1

**Completed:** Verified PR #6 merged to canonical `main` at `d9cd1e6d41c560e9af7170b27b21aa5c1e50988c`, with reviewed branch head `4ec9d522c0008b08718ce228f6e96d4d9f199c21`, green CI, no open PR, no competing S1-05 branch, nine Ready Preview deployments, and an empty Production inventory. Added a server-rendered `/compare` flow for two to four distinct approved/resolved programme slugs; strict fail-closed selection parsing; stable dataset ordering; links to programme and registered-trial details; exact official-source links; desktop semantic table and mobile definition-list cards; visible evidence, review, resolution, unknown, provenance, and freshness boundaries; and change/clear actions. The programme dataset is additively versioned `1.1.0` with exact ClinicalTrials.gov overall-status and registered-start-date observations and JSON-pointer locators cross-validated against unchanged fixture bytes.

**Files changed:** Additive versioned programme snapshot data; programme and fixture schemas; pure comparison domain under `src/lib/domain/`; offline exact-fixture comparison loader; `/compare` page/components and bounded responsive styles; one Home link; focused unit/server-render tests; a `pnpm db` verification alias; route-scoped Next output tracing for the six exact retained fixture/metadata files; `README.md`; and this control room. Dependencies, lockfile, source policy, database schema, migrations, CI, both roadmaps, fixture bytes, fixture metadata, and `vercel.json` remain unchanged.

**Tests/checks:** `pnpm install --frozen-lockfile`; focused comparison/programme checks; full `pnpm test` (16 files/120 tests); `pnpm lint`; strict `pnpm typecheck`; `pnpm db`; production `pnpm build`; aggregate `pnpm check`; `pnpm audit --prod`; `git diff --check`; exact-base, dependency/lockfile, database schema/migration, fixture, source-boundary, credential/bypass, and full-diff review. The final route trace contains exactly the three retained ClinicalTrials.gov snapshots and their three metadata envelopes. Production-mode local smoke passed for Home, `/programs`, all three programme details, initial/two/all-three/one/invalid `/compare` states, and expected degraded `/api/health` 503. Browser verification passed at 1280×720 and 390×844 for Home → Compare, two selections, all three, programme detail navigation, trial/official link targets, clearing, one-selection and unknown-selection validation, visible 3 px keyboard focus, semantic table/mobile cards, and no page overflow or console/framework errors. The browser pass found and verified one bounded repair so same-page clearing now resets preserved checkbox state. GitHub CI and protected Preview evidence remain pending branch publication.

**Source/legal evidence:** `SRC-CTG` policy version `1` remains the sole source. No source request, live refresh, fixture byte, metadata envelope, API query, hash, or mapping decision changed. Existing retained bytes support `COMPLETED` / `2020-01-23` for `NCT03866174`, `ACTIVE_NOT_RECRUITING` / `2023-02-14` for `NCT05711940`, and `ENROLLING_BY_INVITATION` / `2025-07-18` for `NCT06605105`. Registry observations remain `STRUCTURED_EXTRACTION`; reviewed programme/sponsor/compound associations remain bounded `HUMAN_INFERENCE`; the unique-NCT count is `DERIVED_CALCULATION` using formula `registered-trial-count/distinct-nct/v1` and exact NCT locator inputs; unsupported material remains `UNKNOWN`. No Firecrawl, scraping, browser extraction, AI/API inference, enrichment source, credential, restricted content, database, paid service, or Production action was used.

**Decisions:** Selection accepts only repeated `programme=<slug>` values for two to four distinct known candidates and rejects every other query shape without echo. Comparison output follows version-controlled dataset order, not query order. Registered start dates reuse the trial-domain partial-date validator and preserve year/month/day precision. Retrieval time, local processing time, registered start date, and registry last-update-posted date remain separate. The product compares reviewed snapshots and never ranks, scores, recommends, selects a winner, or promotes registry observations into programme-wide scientific or commercial claims.

**Known risks:** The three retained snapshots are intentionally frozen and can become stale. Existing linked live trial-detail pages still depend on ClinicalTrials.gov availability, but comparison construction performs no network request and never falls back to live data. No approved Postgres connection exists, so the S1-02 migration remains unapplied and live trial records remain request-scoped. Protected Preview verification is still pending branch publication.

**Blocked:** No blocker to completing the S1-05 draft PR. S1-06 is blocked and unstarted until S1-05 is explicitly merged and post-merge verified.

**Next highest-impact task:** Commit and push `agent/s1-05-programme-comparison`, open one draft PR, wait for exact-head GitHub CI and protected Vercel Preview, smoke-test the authenticated Preview, confirm Production remains empty, and return the draft PR for final Control Room review without merging.

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
S1-01 is Complete.
S1-02 is Complete and merged in PR #4 at 3b83f8f92b925c791430950a8ed5c22e1d5915b2.
S1-03 is Complete and merged in PR #5 at b7305dae739841a23c769e264fa4a84cee6db47c.
S1-04 is Complete and merged in PR #6 at d9cd1e6d41c560e9af7170b27b21aa5c1e50988c. Keith's three bounded human decisions remain APPROVED and RESOLVED, with namespace-scoped aliases and explicit unknowns preserved.
S1-05 is current and In progress. Complete its exact-base checks, open one draft PR, wait for green exact-head CI and a Ready protected Preview, verify the bounded comparison flows, and return it for final Control Room review.
Never merge, enable auto-merge, deploy or promote to Production, or start S1-06.
S1-06 remains blocked and unstarted until S1-05 is explicitly merged and post-merge verified.
```
