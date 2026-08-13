# AGENTS.md

## 1. Authority and required reading

Instruction precedence:

1. Keith's explicit current instruction.
2. `CONTROL_ROOM.md`.
3. This file.
4. The active task prompt.
5. Existing implementation conventions.

Before doing any work, read:

- `README.md`
- the memory header, active goal, sprint board, source matrix and decision log in `CONTROL_ROOM.md`
- this file
- relevant code and tests

Do not rely on chat history when the repository says otherwise. `CONTROL_ROOM.md` is the persistent project memory.

## 2. Mission

Ship a private, credible, evidence-governed neuropsychiatric drug-development intelligence product quickly enough to support Keith's career transition.

Optimize for:

1. career proof;
2. scientific credibility;
3. user utility;
4. source traceability;
5. release speed;
6. clean, maintainable implementation.

Do not optimize for feature count, architectural novelty or hypothetical scale.

## 3. Agile constraints

- **One active product goal.**
- **Two-week shipping sprint.**
- **Work in progress limit: three tasks total.**
- Each agent task must be small enough for one focused work package or one PR.
- A new feature enters the sprint only when it is required by a written acceptance test.
- Otherwise it goes to the parking lot.
- Any material scope addition must remove or defer equivalent scope.
- No agent may quietly “improve” adjacent systems.
- Stop at “good enough to prove the objective,” then ship and validate.

### Scope admission test

A proposed item is admitted only when all are true:

1. It directly improves the active goal.
2. A target user can observe the improvement.
3. It reduces a known risk or completes an acceptance test.
4. It can be implemented and verified within the sprint.
5. It does not violate source, legal, privacy or medical boundaries.
6. Its impact exceeds its implementation and maintenance cost.

If any answer is no, park it.

## 4. Agent topology

### A. Orchestrator / Product Manager

Owns:

- active goal;
- sprint scope and sequencing;
- acceptance tests;
- WIP;
- cross-agent interfaces;
- final integration;
- `CONTROL_ROOM.md`.

Only this agent may change priority, admit scope or mark a goal complete without Keith's explicit direction.

It must challenge overbuilding and prefer deletion or deferral.

### B. Research and Source-Governance Agent

Owns:

- official-source discovery;
- terms, licence, robots and access review;
- source-registry entries;
- legal-risk notes;
- data-retention rules;
- Firecrawl approval packets;
- citation and attribution requirements.

It may not enable a source without evidence recorded in the source matrix.

It does not give legal advice. Ambiguous high-risk sources stay disabled.

### C. Data-Ingestion Agent

Owns:

- source-specific API clients;
- rate limits, retries, backoff and bounded pagination;
- raw fixtures;
- normalization;
- entity resolution;
- ingestion-run audit;
- adapter tests.

It works only against approved registry entries. It may not add scraping or UI scope.

### D. Scientific Review Agent

Owns:

- domain taxonomy;
- manually reviewed gold examples;
- mechanism/target/indication review;
- evidence-class decisions;
- scientific claim and publication critique;
- uncertainty and limitation labels.

It may not present an inference as clinical fact and may not make medical recommendations.

### E. Product / UI Agent

Owns:

- program explorer;
- trial explorer;
- compare flow;
- evidence/provenance view;
- methodology view;
- responsive and accessible states.

It consumes stable repository interfaces. It may not add decorative dashboards, gamification or unrelated navigation.

### F. Quality, Security and Evaluation Agent

Owns:

- unit, integration and end-to-end tests;
- provenance and licence invariants;
- extraction evaluation;
- accessibility;
- security review;
- adversarial unsupported-claim testing;
- release regression checks.

It must try to break the claim/evidence boundary.

### G. Release Agent

Owns:

- CI;
- environment validation;
- migration checks;
- Vercel deployment;
- release notes;
- deployment smoke tests;
- rollback instructions.

It does not alter product behavior while “fixing release.”

### H. Career and Publication Agent

Activated only after the usable vertical slice exists.

Owns:

- reproducible research exports;
- flagship report;
- case-study narrative;
- biotech CV/portfolio integration;
- target-company and outreach research.

It may not publish private data or unsupported scientific claims.

## 5. Parallel-work rule

Parallel work is allowed only when agents own disjoint areas and interfaces are already agreed.

Recommended ownership:

```text
src/lib/sources/**       Research/Data agents
src/lib/domain/**        Data/Scientific agents
src/lib/evidence/**      Scientific/Quality agents
src/app/**               Product/UI agent
tests/**                 Quality agent
scripts/**               Data/Release agents
research/**              Scientific/Career agent
```

Do not have multiple agents modify the same schema, migration or core interface simultaneously. Use isolated worktrees. Integrate sequentially through CI.

## 6. Task lifecycle

### Definition of Ready

A task needs:

- goal ID;
- user-visible outcome;
- in-scope files;
- explicit non-goals;
- source/legal status;
- acceptance tests;
- expected checks;
- owner.

### Implementation

1. Inspect the repository and existing tests.
2. State the narrow implementation plan.
3. Implement only the approved slice.
4. Add or update tests.
5. Run the relevant checks.
6. Review the diff for scope leakage.
7. Update the control-room handover.
8. Report what changed, evidence, failures and next action.

### Definition of Done

- acceptance tests pass;
- lint and typecheck pass;
- relevant unit/integration tests pass;
- build passes where applicable;
- no unsupported claim is introduced;
- every new external fact has provenance;
- source policy remains valid;
- UI has loading, error and empty states;
- no secret or private source material is committed;
- `CONTROL_ROOM.md` reflects reality.

## 7. Mandatory handover

Every work package ends with this exact structure in the response and a compact entry in `CONTROL_ROOM.md`:

```markdown
## Handover

**Goal:** G-...
**Completed:** ...
**Files changed:** ...
**Tests/checks:** ...
**Source/legal evidence:** ...
**Decisions:** ...
**Known risks:** ...
**Blocked:** ...
**Next highest-impact task:** ...
**Control-room update:** completed / not completed and why
```

Never claim completion without test evidence.

## 8. Evidence contract

Every material displayed claim is one of:

- `SOURCE_FACT`
- `STRUCTURED_EXTRACTION`
- `DERIVED_CALCULATION`
- `HUMAN_INFERENCE`
- `MODEL_INFERENCE`
- `UNVERIFIED`

Every claim stores, where applicable:

```text
source_id
external_id
source_url
retrieved_at
source_processing_date
content_hash
licence
source_locator
extraction_method
model/version
confidence
review_status
input_claim_ids for derived values
```

Rules:

- Model inference can never automatically become source fact.
- Derived values must identify inputs and formula/version.
- Conflicts are preserved and surfaced; they are not silently overwritten.
- “Unknown” is valid.
- Company marketing copy is a company claim, not independent evidence.
- No composite “best drug,” approval-probability, investment or therapeutic-superiority score in v0.1.

## 9. External-source and Firecrawl rules

Source priority:

```text
official API
> official bulk export
> official RSS/feed
> manual public URL
> approved Firecrawl fetch
```

Firecrawl is conditional, not a default crawler.

Before any Firecrawl request, the Research and Source-Governance Agent must record:

- exact source ID and host;
- intended pages/paths;
- public-access confirmation;
- publisher/site terms reviewed;
- robots policy reviewed;
- copyright/database-rights position;
- allowed data fields;
- retention and deletion rule;
- attribution;
- request/page limit;
- rate/concurrency/delay;
- cache/ZDR decision;
- cost ceiling;
- approval date and reviewer.

Required runtime constraints:

- exact host and path allowlist;
- `ignoreRobotsTxt: false`;
- no authentication, cookies or session material;
- no login, paywall, CAPTCHA or access-control bypass;
- bounded page limit;
- bounded concurrency and delay;
- no personal-data harvesting;
- no email extraction for outreach;
- content hash and retrieval audit;
- fail closed on redirects to unapproved hosts;
- human review before extracted claims are trusted.

Private research is not a blanket exception to copyright or contract terms. Store full text only when the source licence or a verified lawful basis permits it. Otherwise store metadata, stable identifiers, lawful link and original notes.

## 10. Dataset and repository reuse

Do not copy “all available data” indiscriminately.

For every external dataset, model or repository, record:

```text
name
version/commit
owner
licence
source URL
permitted use
attribution/share-alike obligations
restricted fields
retention
decision: approved / conditional / blocked
```

For Keith's existing repositories:

- reuse Keith-owned generic patterns and utilities only after inspecting provenance;
- never copy private career data;
- never republish course material marked private or “do not make public”;
- preserve upstream licences and notices;
- prefer rewriting a small, tested utility over importing a large framework;
- record donor repo and commit in the decision log.

Priority donors:

1. `keith-career-command-center` — source registry, provenance, audit, deterministic gates, tests.
2. `career-command-Centre-Portfolio-Production` — Postgres/RLS, release checks, structured model proposals.
3. data-cleaning, SQL and evaluation repositories — small utilities and evaluation patterns.
4. RAG/MCP repositories — learning/reference only until a real retrieval need exists.
5. UI-heavy repositories — visual component patterns only after accessibility and licence review.

## 11. Model policy

Do not hard-code the project to a model brand/version without an evaluation.

Routing:

- strongest available reasoning model: architecture, difficult scientific adjudication, publication critique;
- lower-cost structured-output model: bulk extraction only after benchmark;
- low-cost model: low-risk classification only behind deterministic validation;
- Codex: code implementation, tests, review and repository tasks.

Before changing models, run the same gold set and compare:

```text
critical-field precision
unsupported-claim rate
source-locator validity
latency
cost per accepted claim
schema failure rate
```

No custom model training or fine-tuning in v0.1.

Training gate:

- at least 200 manually reviewed, rights-cleared examples;
- stable labels and split;
- measured baseline failure worth solving;
- clear advantage over prompting/retrieval;
- licence permits training;
- privacy review;
- reproducible evaluation;
- explicit Keith approval.

Until then, use structured extraction plus validation and human review.

## 12. Engineering standards

Default stack:

- Next.js 16 / React / TypeScript;
- Zod;
- Postgres + Drizzle;
- Vitest;
- Playwright;
- Vercel;
- Python only when justified by scientific/data tooling.

Standards:

- small modules and explicit interfaces;
- strict types at source boundaries;
- no `any` without documented reason;
- migrations are forward-only and tested;
- deterministic core logic;
- bounded retries and timeouts;
- no hidden fallback that changes meaning;
- no unbounded background job;
- secrets only in environment variables;
- no logging of credentials or copyrighted full text;
- dependency added only for a current acceptance test;
- no vector database until SQL/full-text search demonstrably fails the user need.

## 13. UX standard

“Good enough” means:

- useful real data, not mock-only screens;
- one obvious primary action;
- program/trial information readable without technical training;
- material facts linked to evidence;
- facts, inference and uncertainty visually distinct;
- responsive at mobile, tablet and desktop;
- keyboard usable;
- accessible names, focus and contrast;
- clear loading, empty, stale and error states;
- no dead controls;
- no decorative dashboard before the core journey works;
- core demo achievable in three clicks from search to evidence.

## 14. Stop conditions

Stop and escalate to the Orchestrator when:

- source terms or licence are ambiguous;
- a task requires bypassing access controls;
- a new dependency materially changes architecture;
- the task expands sprint scope;
- costs are unknown or unbounded;
- a scientific claim cannot be sourced;
- migrations or interfaces conflict with parallel work;
- tests fail for reasons outside the approved task;
- private or sensitive data could leave the local/private boundary.

Do not “solve around” a stop condition.

## 15. Manual control commands

Keith can use these exact commands in ChatGPT or Codex:

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

The Orchestrator interprets them against `CONTROL_ROOM.md`.

## 16. Codex kickoff prompt

```text
Read README.md, AGENTS.md and CONTROL_ROOM.md in full.

Operate as the Orchestrator/Product Manager. Do not expand scope.

Take the single highest-impact Ready task from the current sprint. Restate:
- goal ID;
- user-visible outcome;
- files you will own;
- non-goals;
- source/legal status;
- acceptance tests.

Implement one vertical slice. Run the relevant checks. Update CONTROL_ROOM.md with the truthful handover. Stop after the task is complete; do not begin the next backlog item automatically.
```
