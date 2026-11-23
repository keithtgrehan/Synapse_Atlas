# Synapse Atlas

**What changed in the study record?** Explore saved public records, compare them with a new check, and download a summary with its sources.

[Public site](https://synapse-atlas-theta.vercel.app/) · [Source and release record](CONTROL_ROOM.md) · [Reviewed wording release PR16](https://github.com/keithtgrehan/Synapse_Atlas/pull/16) · [Comparison implementation](src/lib/snapshots/compare.ts)

**The MVP contains 41 saved study records, eight study collections and four guided examples.** The release pairs a dark evergreen editorial entry with warm, readable scientific workspaces, complete saved primary-outcome inspection and direct PDF downloads. A separately captured MAPP1/MAPP2 PTSD design case adds source-linked external reading without pooling outcomes. Publication is authorized; exact validation and deployment revisions are recorded in the control room.

Custom briefs expose every saved primary measure and time frame, grouped by study, with local source inspection before a current lookup. Repeated entries remain separate; missing and unrequested fields are labelled. The same saved view is included in PDF, CSV and JSON. The original Atlas logo/artwork and concise homepage keep the real evidence preview visible; imagery is decorative.

The core journey uses 41 immutable saved NCT records independently of programme mappings. Optional programme context retains its original review status. No annotation, clinical adjudication, model training, database or account is required.

Each guided example offers **Explore the comparison**: choose a study detail, compare its study-labelled Atlas summaries, and open the exact saved source fields. Topic selection changes only the view. The complete study matrix remains available through **View all study details**, and every PDF, CSV and JSON brief retains the full case. Browser printing was verified on the three-study MDD example with the screen matrix closed: all five topics remain in the printed brief. Actual print inspection is recorded in the release record. This interaction is a portfolio product hypothesis, not a measured usability improvement.

## Run the demo

Use Node.js 22 and pnpm 10.18.3:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`, then **Explore an example**, or browse the 41 saved studies. Collections group records by question and describe their study phase, status, enrolment type and planned measurements without combining treatment results. Select up to four studies and open the saved source details. Choose **Check for updates** to compare a saved record with one new public-record check during this visit. The three original studies also offer **Compare two saved versions** using real dated copies; this is not a live update. Download the PDF summary, CSV table or JSON source data. They contain the selected records, labelled interpretation, version state and source details.

Update checks need internet access to the approved ClinicalTrials.gov API. If a check fails, saved records and saved-version comparisons remain available. One new check per study is kept during the visit; reloading starts another visit. Downloads do not request new registry data.

## How it works

This section is generated from the same content used by the in-product `/how-it-works` page. Run `node scripts/sync-how-it-works.mjs` after editing it; `--check` verifies consistency.

<!-- HOW_IT_WORKS:START -->
### Start with the study records

Synapse Atlas helps you explore how selected clinical studies were designed and what they planned to measure. It uses dated copies from ClinicalTrials.gov, a public database of clinical study records. Each record has an NCT ID, a unique study identifier. A record is not automatically a research paper or a report of results. Use Atlas to prepare questions and keep the sources with your summary, not to rank treatments or judge a business opportunity.

### Try the three-minute example

Open a guided example, or browse the study collections. Filter the list by collection and study status, then choose up to four studies. Collections can overlap; they are ways to explore a question, not groups whose results should be combined. Read the saved study details and the labelled AI-assisted notes. Open the source details to check the wording. Choose Check for updates, or Compare two saved versions where available. Then download a PDF summary, a CSV table and the JSON source data.

### Understand saved copies and update checks

A saved copy is the dated record Atlas starts with. Check for updates gets one new response for the selected NCT ID and keeps it during this visit. It does not continuously monitor the record. Compare two saved versions uses two copies saved earlier; it is not a live update. The page and downloads use the same records and checks. Reloading starts a new visit. The original saved records are never replaced, and new checks are not stored in a database. Study records can be compared without relying on the separate programme-to-study associations.

### Know what a comparison can tell you

A change in a public record does not show that a treatment works or that a study has made clinical progress. Main planned measurements, also called primary outcomes or endpoints, are not results. Missing information stays missing. If repeated entries cannot be matched reliably, Atlas shows both sources and marks the comparison as uncertain. Dates keep their reported level of detail and their Actual or Estimated labels. ClinicalTrials.gov has its own Record History; Atlas compares the selected saved versions, not the complete history.

### Check where the information came from

Source details show the saved wording, the study ID, where each field came from and when the copy was made. That saved date is separate from the public record’s last-update date. Technical checks validate IDs and fields and use SHA-256 checksums to identify the original response, the exported selection of fields and the normalized values separately. Source locations and processing/comparison versions are included. The JSON download contains the fields needed to reconstruct the comparison, including the public protocol fields cited by an example and bounded study-purpose text where needed. Unused contact fields are excluded. Further reading contains separate citation details, links and original notes. The full linked documents are not stored in the brief or included in its saved-record comparison.

### What has been checked

Automated tests check saved-record integrity, repeatable processing, changed and unchanged fields, missing information, partial dates, uncertain repeated entries, wrong IDs, failed requests and safe downloads. Tests use retained official records and deliberately altered test cases; these are not human clinical review labels. Browser checks cover example navigation, narrow screens, keyboard controls and downloads. Actual PDFs are compared with their matching CSV and JSON files and inspected as rendered pages for saved records, update checks, saved-version comparisons and custom selections. Long fields continue onto later pages. Unsupported font characters cause an explicit error rather than being discarded. These checks do not establish scientific truth or full accessibility conformance.

### Inside the application

Next.js, React and TypeScript serve the saved study list and a limited ClinicalTrials.gov API connection. Fixed comparison rules run on the two selected record versions. No account, database, vector search or live AI model call is needed. AI-assisted interpretation means Atlas reading notes written with AI assistance, not study findings. Counts describe the selected records; clinical results are not combined. Comparing a limited set of source fields makes the view reproducible, but cannot establish clinical significance or provide a complete drug-development pipeline.

### Keith’s contribution

Keith Grehan set the research question, audience and product direction, authorized the scope and reviewed the original three programme-to-study associations. The implementation, research support and testing were developed with AI assistance. Ten later associations remain model-proposed and approved for inclusion; they are not presented as independently reviewed scientific conclusions. No user adoption, accuracy improvement or time saving has been measured.
<!-- HOW_IT_WORKS:END -->

## Review the evidence chain

```text
Immutable retained NCT snapshots ─┐
                                 ├─ Captured pair → semantic comparison → screen / PDF / CSV
One bounded exact-ID API capture ─┘                                     └→ replayable source bundle
```

- [Catalogue and capture validation](src/lib/snapshots/catalogue.ts) — exact IDs, source policy, preserved source hashes and safe field projections; no programme dependency.
- [Comparator](src/lib/snapshots/compare.ts) — missing/removed/unchanged/ambiguous fields, date precision and type, conservative repeated entries.
- [Session exports](src/app/studies/session-export.ts) — all selected saved studies and displayed evidence pairs, with safe CSV cells.
- [Client](src/lib/sources/clinicaltrials/client.ts) — host/path restrictions, bounded response, timeout, bounded retry and redirect denial.
- [Retained baseline sources](data/comparison/2026-10-13/manifest.json) and [ten further registry captures](data/study-examples/v1/catalog.json).

The original-response hash identifies the source capture. The field-projection hash verifies the evidence included in the bundle. Normalized values and comparator versions describe subsequent transformations. Hashes establish integrity, not scientific correctness. Registry strings render as text; potentially executable CSV cells receive a leading apostrophe.

## Validation and release

```sh
pnpm check
node scripts/sync-how-it-works.mjs --check
```

`pnpm check` runs lint, strict types, unit/integration tests, migration consistency and production build. Current observed results and browser evidence are recorded in [CONTROL_ROOM.md](CONTROL_ROOM.md); historical counts are not fresh validation.

The existing Drizzle schema is optional future infrastructure; no database is needed for the demonstrated workflow. Direct PDF export dynamically loads jsPDF4.2.1 (MIT) and bundled Noto Sans fonts (SIL OFL1.1); it makes no registry request. The source integration remains unchanged.

Production target remains the existing Vercel project `synapse-atlas` and [public alias](https://synapse-atlas-theta.vercel.app/). [Version-controlled policy](vercel.json) disables automatic production deployment from `main`. Keith authorized the reviewed PR merge and explicit public deployment. Preview protection remains enabled. The verified prior production deployment is the rollback target, recorded in the control room.

## Screenshots and demo script

Current test counts and the final checked revision are recorded in the control room. See the [competitive design review](docs/competitive-design-review.md), [desktop home](docs/screenshots/home.png), [tablet research brief](docs/screenshots/research-tablet.png) and [narrow research brief](docs/screenshots/research-mobile.png). Direct PDF downloads are validated by text/source comparison and page rendering; browser printing remains a separate optional control. The [current home](docs/screenshots/home-mapp-desktop.png), [MAPP case](docs/screenshots/mapp-case-desktop.png) and [320px source inspection](docs/screenshots/mapp-outcome-mobile.png) show the final additive case. The three-minute script is the shared “Try the three-minute demo” section above. No user adoption, scientific accuracy or time-saving metrics are asserted.

The case-led iteration adds distinct measurement, trial-clock and computed replay previews; seven manifest-derived research starting points; and a shared saved/current/replay state for the brief and export. See [before](docs/screenshots/home-before-case-led.png), [after](docs/screenshots/home-case-led.png), [case previews](docs/screenshots/cases-case-led.png) and [mobile](docs/screenshots/home-case-led-mobile.png).

The Light Scientific Workstation iteration uses the [research and optimized implementation brief](docs/competitive-design-review.md), with [desktop](docs/screenshots/home-workstation.png), [mobile](docs/screenshots/home-workstation-mobile.png) and [research workspace](docs/screenshots/brief-workstation-tablet.png) evidence. It learns from public scientific/data-tool interface patterns while retaining original Atlas identity. Reviews are agent-assisted, not human certification.

The Precision Atlas redesign applies original composition learned from public SaaS and biomed references: [research and optimized brief](docs/competitive-design-review.md), [desktop home](docs/screenshots/precision-atlas/home-desktop.png), [mobile home](docs/screenshots/precision-atlas/home-mobile.png), [research brief](docs/screenshots/precision-atlas/brief-desktop.png) and [catalogue](docs/screenshots/precision-atlas/catalogue-desktop.png). Independent art-direction, UI and frontend agent reviews passed; actual release checks are recorded in CONTROL_ROOM.
