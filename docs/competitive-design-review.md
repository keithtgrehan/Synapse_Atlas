# Competitive design review — Synapse Atlas

**Scope:** A bounded visual and interaction review for the NCT-first research workspace. This is design research, not a claim that Synapse Atlas has been evaluated by the referenced companies. Reviewed 20 November 2026.

## What is on the product now

The current home page has a source-backed MDD endpoint comparison beside the first action, three research-case cards, and a quiet editorial palette. The research workspace already separates case framing, matrix, source detail, saved capture and export. The 39-record catalogue uses filtering, a bounded selection of four studies, a collection-level distribution and an evidence table. The most material remaining visual risks are density drift between pages, mobile handling of long provenance strings, and making the action hierarchy obvious before detail expands.

### Graphic review evidence

**Observed screenshot:** [`design-review-desktop.png`](screenshots/design-review-desktop.png), 1440 × 1000, production build, 20 November 2026. The first viewport shows navigation, a question-led headline, primary case action and a three-row source-backed endpoint table without clipping. The green action, calm off-white field and restrained borders establish an original editorial-research character; they do not resemble a copied Benchling, Linear or Labguru screen.

**Accepted graphic decisions:** keep the featured evidence card on the first screen; use concise source-derived endpoint/window labels there; reserve the serif display face for questions and case titles; use compact sans serif for identifiers, dates and sources. Do not add decorative molecular imagery, gradients as information encoding, synthetic science dashboards or additional raised cards.

## Public references

| Product | Observed public principle | Design inference for Atlas |
| --- | --- | --- |
| [Benchling](https://www.benchling.com/) | Its public product story groups scientific work around connected workflows, structured records and traceable data rather than decorative analytics. | Lead with a concrete evidence object and the next research action. Keep provenance attached to records, rather than presenting Atlas as a generic AI dashboard. |
| [Linear](https://linear.app/) | Its public interface examples use compact named states, dense but orderly rows, and clear hierarchy between a work item, its activity and its properties. | Make each study row a deliberate research object: identity first, then the one comparison-relevant field, then disclosures. Use small tags only for stable metadata. |
| [Labguru](https://www.labguru.com/) | Its public product framing treats the electronic notebook, LIMS, inventory and automation as distinct but connected systems. It makes structured lab work legible as a workflow. | Treat case selection, captured evidence, comparison and export as connected stages. Do not borrow Labguru’s laboratory branding, illustrations, commercial claims or metrics. |
| [ClinicalTrials.gov](https://clinicaltrials.gov/) | Its public surface foregrounds search and registry data, and directs record managers to data-element definitions. | Use registry terminology precisely, preserve NCT identity and labels, and show saved/retrieved dates separately from registry update dates. |

The first two columns are directly observed from the linked public pages. The final column is an Atlas-specific inference, not an attribute or endorsement of those products.

## Original Synapse Atlas identity

**Position:** an editorial evidence desk for neuropsychiatric trial records, not a lab operating system, generic data room or clinical-decision product.

**Visual grammar:** warm paper background; deep green for primary actions and record continuity; muted blue for collection context; amber only for boundaries and uncertainty. Serif display type signals a considered research brief, while compact sans-serif metadata carries NCT IDs, dates, states and hashes. Thin rules, left edges and restrained cards show how evidence is grouped without simulating a competitor’s interface.

**Interaction grammar:** one primary action per view; a case question before a table; data density earned by a stated research question; source detail progressively disclosed; export visibly tied to the selected/captured evidence. Tables retain semantic headers on desktop and become study-labelled records at narrow widths.

## Optimised implementation brief

1. **Landing screen:** Keep the actual featured endpoint comparison in the first screen. Use concise source-backed measure/window labels there; keep exact long registry strings in the case detail. The page must never imply an endpoint is an outcome.
2. **Research cases:** Present `question → why together → comparison matrix → sourced takeaways → limits → next questions`. The source disclosure should stay close to a value, with no artificial confidence score.
3. **Catalogue:** Give search and scoped filters priority, then the collection-level distribution, then rows. Selection should visibly say “x of 4” and lead directly to the same comparison/export route.
4. **Responsive data:** At 320 CSS pixels, nonessential multi-column layouts stack. Each formerly tabular cell identifies its study label. Long titles, URLs and hashes wrap without forcing page-level horizontal scroll. Tables may scroll only where the two-dimensional structure is essential.
5. **Accessibility:** Keep a persistent high-contrast `:focus-visible` ring and a skip link. This follows [W3C focus-visible guidance](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html). Reflow should preserve content and function at 320 CSS pixels, following [W3C reflow guidance](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

## Small, prioritised improvements

| Priority | Improvement | Why it matters | Bound |
| --- | --- | --- | --- |
| P0 | Keep the home evidence table fixed-width by using case-derived short labels, with full registry text in the disclosure. | The tested desktop layout previously clipped the right column when full endpoint strings were used. | Completed in the current design layer; confirm desktop and 320px screenshots after final data sync. |
| P0 | Raise the case-matrix stacked-card breakpoint to tablet width, or wrap its direct table in an overflow region. | The matrix had a 50rem intrinsic width without the expected wrapper at intermediate widths. | Implemented a labelled, focusable scrolling wrapper; verified page width at 768 and 320 CSS pixels. |
| P1 | Keep source state adjacent to each comparison: saved capture date, registry update date and current-session/replay label. | Prevents visitors confusing retrieval, record updates and study progress. | Existing data only; no new source integration. |
| P1 | Add a subtle active-nav treatment using `aria-current` when routing support is available. | Improves orientation across Catalogue, Brief and How it works. | Implemented shared active navigation with aria-current and a quiet underline. |

## Review coordination evidence

These fields intentionally distinguish agent feedback from unsupported claims of professional review.

| Review role | Evidence to add | Status |
| --- | --- | --- |
| Graphic design reviewer | `docs/screenshots/design-review-desktop.png`; first-screen hierarchy and endpoint-card fit checked | Complete for desktop; root verified narrow reflow. |
| UX reviewer | Desktop and 320px task path, keyboard-focus and error-state findings | Complete: root browser checks and independent screenshot review; no blanket accessibility certification. |
| UI reviewer | Components inspected, responsive table/card findings, implementation regressions | Complete: overflow wrapper, search metadata, status announcements and disabled-state cursor corrected. |
| Independent source/quality reviewer | Case evidence links, labels and inference boundary findings | Maintained by the lead review workflow |

## Non-goals

Do not imitate Benchling, Linear or Labguru branding, layout or copy. Do not add graphs without a defensible derived calculation, use decorative biological imagery, add a dashboard framework, or imply that the registry establishes clinical benefit, safety or commercial success.

## Supplied design handoff reconciliation

Keith supplied a “Website design and interaction handoff” via the monitoring chat on 20 November and asked to retain a professional SaaS/biotech look. Its useful additions fit the existing direction: warm paper (`#F7F5EF`), green-black ink (`#17231D`), restrained forest actions, editorial headings and neutral UI text, real comparison evidence and clear control feedback. The warm-paper/ink tokens were aligned; the established responsive spacing and evidence density were retained. No playful portfolio branding, illustrations, copied layouts, heavy outlines or decorative motion were adopted. This supplied reference was not a test of the current branch.

Catalogue filters now persist in the URL using the framework’s [native History API integration](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api); search/reload and keyboard selection were checked in the local browser. Selection counts, result counts, reset and export confirmations reflect actual state. Live capture remains an explicit user action. The existing source dates, uncertainty labels, field-level diffs and progressive disclosures were retained.

Final review is agent-assisted, not a claim of human professional certification. Print/PDF rendering remains unverified: invoking the print control timed out, and the available controls could not inspect the system print UI. Network errors are covered by automated tests rather than an induced browser outage.

## Appendix — scientific/source audit for case previews

**Scope and method:** Read-only audit on 20 November 2026. This appendix checks the three case narratives and seven catalogue collections against their retained ClinicalTrials.gov captures, the hash-validated catalogue manifest, and the case-evidence pointers. It is an AI-assisted source review, not human scientific or clinical review. No live record, publication, Cortellis content, or proprietary interface was refreshed for this appendix: the existing public-design findings already support the interface decisions below, while `SRC-PROPRIETARY` remains blocked by the project source policy.

### Inventory

| Surface | IDs | Memberships | Evidence boundary |
| --- | ---: | ---: | --- |
| Detailed cases | 3 | 8 case-study references | `mdd-measurement-window` (3), `adjunctive-inadequate-response` (2), and `registry-change-brief` (3). These are scoped readings, not cohort definitions. |
| Catalogue collections | 7 | 42 collection memberships | 39 unique NCT IDs. Some records intentionally belong to more than one collection, such as a replay record also used in an MDD design collection. |
| Retained catalogue | 39 | 39 unique NCT IDs | 13 prior captures plus 26 exact-ID captures. The selected 80-record discovery page is a convenience inventory, not a systematic, complete, or representative landscape. |

The seven collections are: MDD pharmacology/endpoints (14 memberships), adjunctive or resistant-setting (8), cognition and measurement (3), neurostimulation boundary (5), MDD setting boundaries (3), saved-record replay (3), and heterogeneous legacy contexts (6). The last collection is explicitly non-pooled. Its postpartum, bipolar, schizophrenia, PTSD, and insomnia records are individual contexts, not a cross-indication comparison group.

### Case integrity findings

| Case | Supported compact preview | Boundary that must remain visible |
| --- | --- | --- |
| MDD measurement window | Three completed, interventional MDD records register different primary measures and windows: MADRS at post-dose Day 43, HAM-D at Day 15, and a DSST/RAVLT cognitive composite at Week 8. | Common MDD wording does not make the instruments, timing, population, baseline severity, prior treatment, or follow-up comparable. Registered endpoints are not results. |
| Adjunctive MDD | The retained NCT03559192 record describes adjunctive treatment after a placebo lead-in and a treatment-baseline-to-Week-6 MADRS outcome. NCT01360645 describes add-on antidepressant treatment with Phase-A Week-8 to Week-14 MADRS framing. | The shared MADRS label is insufficient for an effect comparison: phase, lead-in structure, baseline definition, enrolment denominator, and analysis population differ. |
| Saved registry brief | The three specified IDs have paired retained captures. Replay computes field-level state from the saved pair and exposes capture identity, source locators, and hashes. | A replay does not explain why a field changed, recreate full ClinicalTrials.gov Record History, or establish current conduct, efficacy, safety, or commercial meaning. |

Each statement above is a **source-backed observation** from retained registry fields or a **derived product behavior** covered by the corresponding tests. The comparability limits are **AI-assisted interpretations** tied to those fields. They must never be shortened into a benefit, safety, superiority, or programme-ownership claim.

### Three small preview opportunities

| Opportunity | Value | Evidence basis | Effort | Classification |
| --- | --- | --- | --- | --- |
| Put the two adjunctive trial clocks directly beneath the case title: “lead-in → treatment baseline → Week 6” beside “Phase A Week 8 → Week 14.” | Makes the material mismatch legible before the matrix, while preserving the common MADRS label as a design fact rather than an outcome. | Retained primary-outcome measures/time frames and the NCT03559192 placebo-lead-in and NCT01360645 Phase-A field evidence. | Small, presentation-only. | **Hypothesis:** this will reduce mistaken cross-trial equivalence. |
| Add a compact saved-capture → replay-capture rail to the replay-case opening, with retrieval dates and an “open computed field differences” action. | Gives visitors a clear provenance path before they enter the diff rows. | The product already has hash-validated capture pairs and generates replay states from those pairs. | Small, presentation-only. | **Hypothesis:** this will clarify that replay is evidence comparison, not a clinical timeline. |
| Give collection cards a one-line “compare these fields” preview adjacent to catalogue filters, retaining the collection limitation in the same card. | Helps a visitor select a research context without treating collection labels as hidden clinical cohort definitions. | Each manifest collection already carries its comparison dimensions and limitation. | Small, presentation-only. | **Hypothesis:** this will improve route selection without adding a score or dashboard. |

These are design hypotheses, not measured usability findings. They require no new source, schema, runtime data, or scientific claim. Keep source disclosure, “cannot establish” language, NCT identity, and the existing 4-study comparison cap intact.

## Baseline delivered verification (before case-led iteration)

[Working Preview](https://synapse-atlas-git-codex-nct-snaps-dd9d7a-keith-grehans-projects.vercel.app) and [draft PR12](https://github.com/keithtgrehan/Synapse_Atlas/pull/12) are available. Final hosted screenshots: [desktop](screenshots/home.png) and [320px mobile](screenshots/research-mobile.png). The narrow case table uses stacked, study-labelled cells; intermediate widths use its focusable local scroll container. GitHub validation and Vercel build passed. Root verified all three hosted cases, catalogue/filter reload, live capture, retained replay and downloaded-bundle replay; independent UX review accepted the hierarchy and responsive containment. These observations do not imply full accessibility certification.

## Selected iteration decisions — marketing / copy / GTM synthesis

Keith supplied a reviewed synthesis from VP Marketing, CMO, scientific/SaaS copywriter and GTM research agents on 20 November. It targets a researcher/analyst preparing a bounded neuropsychiatry study-design brief. This audience and its value proposition are hypotheses: no interviews, willingness-to-pay evidence or demand validation were supplied. The existing workaround is registry records/history plus downloaded data and a manually assembled comparison. [ClinicalTrials.gov download guidance](https://clinicaltrials.gov/data-api/how-download-study-records) documents the registry alternative; the [NIH-authored research-use paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC5968400/) supports saving evidence with extraction dates, not a market-size claim. [CTTI State of Clinical Trials](https://ctti-clinicaltrials.org/about/ctti-projects/state-of-clinical-trials/) describes research usability and AACT. [Benchling Platform](https://www.benchling.com/platform) publicly describes connected scientific records; its private interface was not inspected. Public Cortellis/GlobalData capabilities remain vendor descriptions, and inaccessible features remain unknown. No competitor is claimed to lack this workflow.

The three source-safe preview ideas above are folded into these three selected product opportunities, not additional platform features:

| Selected opportunity | Evidence and hypothesis | Implemented decision | Acceptance evidence |
| --- | --- | --- | --- |
| Discover a bounded question | Existing 3 cases / 7 collections were available but their roles and routes were hard to scan; faster discovery is untested. High portfolio value, small effort. | One guided-brief action, enriched existing case entries before a manifest-derived collection overview; distinguish 39 records from 42 memberships. | All 3 case routes and 7 collection routes verified in browser; 39 unique IDs and 42 memberships validated. |
| Understand the analytical purpose visually | Retained case fields support different measures/windows, incompatible adjunctive clocks and real capture pairs; visual clarity is a hypothesis. High value, moderate effort. | Compact evidence object in hero; three distinct source-backed previews with nearby limits. No shared efficacy axis or fabricated change. | Scientific/source, graphic and UX reviews passed; before/after screenshots show the compact hero and three distinct previews. |
| Know which evidence will leave the page | Registry history/downloads and Benchling’s public traceability framing support clear source identity; no novelty claim. High value, small effort. | Reusable evidence-state component derives saved/current/replay mode and separate dates from displayed captures; same model included in source JSON and export feedback. Visible selection tray persists across filters. | 169 tests passed; actual CSV/JSON downloaded, state matched to replay and source bundle replayed offline. |

Original editorial identity and the supplied warm-paper/ink/forest direction remain. No outreach, paid source, runtime integration, commercial analytics, new audience segment or account system is introduced.

Refresh note: on 20 November the lead re-opened the public Benchling Platform page and confirmed its vendor descriptions of a unified data model, system-wide search and audit trails. The ClinicalTrials.gov download URL returned only its JavaScript shell to text retrieval; the supplied specialist research remains the basis for its documented download workflow. Neither observation is a hands-on review of paid competitor software.

Final CMO review moved the single primary hero action directly under its support line; at320px it is visible at512–559px rather than below the featured panel. Final heading review changed case and collection article titles to h3 without changing their appearance. [Before](screenshots/home-before-case-led.png) / [after](screenshots/home-case-led.png), [case visuals](screenshots/cases-case-led.png), [mobile](screenshots/home-case-led-mobile.png). Text contrast samples measured from rendered styles range from5.83:1 to14.88:1. Reduced-motion rules were inspected; no OS preference was changed. The supported print action again timed out before an inspectable preview; no PDF pass is claimed.
