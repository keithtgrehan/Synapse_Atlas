# Synapse Atlas

**What changed since this research brief?** Compare selected registered studies, check a saved record against a newly retrieved exact-NCT-ID response, and export the evidence you actually saw.

[Validated Preview](https://synapse-atlas-git-codex-nct-snaps-dd9d7a-keith-grehans-projects.vercel.app) · [Release PR12](https://github.com/keithtgrehan/Synapse_Atlas/pull/12) · [Public site](https://synapse-atlas-theta.vercel.app/) · [Source and release record](CONTROL_ROOM.md) · [Comparison implementation](src/lib/snapshots/compare.ts)

**The MVP contains 39 retained trials, seven research collections and three guided cases.** The current release adds a compact scientific workspace and direct PDF downloads. Publication is authorized; exact validation and deployment revisions are recorded in the control room.

The core journey uses 39 immutable saved NCT records independently of programme mappings. Optional programme context retains its original review status. No annotation, clinical adjudication, model training, database or account is required.

## Run the demo

Use Node.js 22 and pnpm 10.18.3:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000`, then **Open a guided brief**, or browse the 39-trial catalogue. The catalogue groups all 39 records into explicit research contexts and describes their phase, registry status, enrolment definitions and endpoint coverage without pooling outcomes. Select up to four studies, inspect saved facts and **Check current registry**. The three original snapshot studies also offer **Replay two saved captures** using real retained evidence; this is explicitly historical, never a simulated live update. Download the PDF brief, CSV or JSON source bundle. The PDF includes the selected records, case interpretation, capture state and complete source appendix.

Live capture requires internet access to the already approved ClinicalTrials.gov API. Failure leaves the saved brief and replay usable. Capture once per study in the open session; reload starts another session. Exports do not make a new API request.

## How it works

This section is generated from the same content used by the in-product `/how-it-works` page. Run `node scripts/sync-how-it-works.mjs` after editing it; `--check` verifies consistency.

<!-- HOW_IT_WORKS:START -->
### The question

What changed since this research brief? Synapse Atlas puts selected registered studies, their saved evidence and a fresh exact-NCT-ID lookup into one research workflow. It helps prepare a source-backed discussion; it does not rank treatments or establish commercial opportunity.

### Try the three-minute demo

Open one of three guided research cases, or explore seven research collections covering 39 unique trials. Collections can overlap; they are reading contexts, not pooled cohorts. Filter the catalogue by collection and registry status. Compare registered study characteristics and read the sourced interpretation. Choose a study and check the current registry, or run the clearly dated retained-record replay. Inspect a field and its source evidence. Download the PDF brief, CSV and evidence bundle.

### One captured pair

The saved catalogue is validated directly from retained ClinicalTrials.gov records by NCT ID. It needs no programme mapping or review decision. A current lookup is captured once per study in the open session; screen, PDF, CSV and source bundle reuse that pair. Reloading starts a new session. Baselines are never overwritten and live captures are not stored in a database.

### Source transformations you can inspect

Exact identifier checks, bounded requests, field validation and SHA-256 hashes protect the evidence chain. Original response hashes, exported field-projection hashes, normalized hashes, field locators and transformation/comparator versions distinguish each step. Retrieval time is separate from the registry update date. The downloadable bundle contains the field-limited evidence needed to replay the view; contact fields are omitted. Case bundles also include the specific retained public protocol fields cited by their analysis, including bounded study-purpose text where needed.

### Conservative comparison

Comparison preserves reported date precision and Actual/Estimated types, missing fields and unknown values. Repeated entries that cannot be aligned reliably are marked ambiguous with both sources. Registered primary endpoints describe planned measurements, not reported findings. ClinicalTrials.gov already provides Record History; this tool is a comparison with an Atlas brief, not a complete official history.

### Validation and its limits

Automated checks cover retained-record integrity, deterministic transformations, changed and unchanged fields, missing data, partial dates, array ambiguity, mismatched IDs, failed requests and safe exports. Retained official records supply regression evidence; synthetic mutations are test cases, not human gold labels. Observed browser checks cover case navigation, narrow-screen reflow, keyboard controls and downloads. Direct PDF downloads are checked against the matching CSV/source bundle and rendered pages, including saved, replay, current and custom selections. Long fields paginate; unsupported font characters fail explicitly rather than being discarded. These checks do not establish scientific truth or full WCAG conformance.

### Architecture and trade-offs

Next.js, React and TypeScript serve a small immutable catalogue and a bounded ClinicalTrials.gov API adapter. Deterministic comparison runs on a captured evidence pair. No runtime model call, account, vector search or database is required. Case commentary is explicitly labelled AI-assisted interpretation. Catalogue counts describe the selected records and do not pool clinical outcomes. Limiting the scope to selected registered fields makes changes reproducible; it cannot resolve clinical significance or supply a complete pipeline.

### Keith’s contribution

Keith Grehan set the research problem, audience and product direction, authorized the scope and reviewed the original three programme associations. The implementation, research support and testing were developed with AI assistance. Ten later programme associations remain model-proposed and approved for inclusion, without a claim of independent scientific review. No adoption, accuracy or time-saving impact is claimed.
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

Current test counts and the final checked revision are recorded in the control room. See the [competitive design review](docs/competitive-design-review.md), [desktop home](docs/screenshots/home.png), [tablet research brief](docs/screenshots/research-tablet.png) and [narrow research brief](docs/screenshots/research-mobile.png). Direct PDF downloads are validated by text/source comparison and page rendering; browser printing remains a separate optional control. The three-minute script is the shared “Try the three-minute demo” section above. No user adoption, scientific accuracy or time-saving metrics are asserted.

The case-led iteration adds distinct measurement, trial-clock and computed replay previews; seven manifest-derived research starting points; and a shared saved/current/replay state for the brief and export. See [before](docs/screenshots/home-before-case-led.png), [after](docs/screenshots/home-case-led.png), [case previews](docs/screenshots/cases-case-led.png) and [mobile](docs/screenshots/home-case-led-mobile.png).

The Light Scientific Workstation iteration uses the [research and optimized implementation brief](docs/competitive-design-review.md), with [desktop](docs/screenshots/home-workstation.png), [mobile](docs/screenshots/home-workstation-mobile.png) and [research workspace](docs/screenshots/brief-workstation-tablet.png) evidence. It learns from public scientific/data-tool interface patterns while retaining original Atlas identity. Reviews are agent-assisted, not human certification.
