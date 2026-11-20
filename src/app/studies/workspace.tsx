"use client";

import Link from "next/link";
import type { VerifiedCase } from "../../lib/cases/model";
import { CaseView } from "./case-view";
import { EvidenceState } from "./evidence-state";
import { PrimaryOutcomeInspector } from "./primary-outcome-inspector";
import { savedPrimaryOutcomes } from "../../lib/snapshots/primary-outcomes";
import { evidenceSummary } from "./evidence-state-model";
import { useEffect, useRef, useState } from "react";
import type {
  Capture,
  SnapshotDiff,
  SnapshotFieldChange,
} from "../../lib/snapshots/model";
import { compareCaptures, formatValue } from "../../lib/snapshots/compare";
import { createSnapshotBrief } from "../../lib/snapshots/export";
import { snapshotLimitations } from "../../lib/product/how-it-works";
import {
  sessionCsv,
  sessionManifest,
  type CapturedComparison,
} from "./session-export";

const prepared = ["NCT03866174", "NCT05711940", "NCT06605105"];
const fieldLabels = {
  overallStatus: "Registry status",
  enrollment: "Enrolment",
  primaryCompletionDate: "Primary completion",
  completionDate: "Study completion",
  leadSponsor: "Lead sponsor",
  interventions: "Interventions",
  primaryOutcomes: "Primary endpoints",
} as const;
const stateLabels = {
  unchanged: "= Unchanged",
  changed: "↔ Changed",
  added: "+ Newly reported",
  removed: "− No longer reported",
  not_compared: "? Could not compare",
  ambiguous: "? Ambiguous entries",
};
function date(value: string) {
  return value
    .replace("T", " · ")
    .replace(/\.\d+Z$/, " UTC")
    .replace(/Z$/, " UTC");
}
function value(capture: Capture, key: keyof typeof fieldLabels) {
  const item = capture.record[key];
  return item.state === "reported"
    ? formatValue(item.value)
    : item.state === "not_requested"
      ? "Not captured"
      : "Not reported";
}
function download(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function sourceAt(capture: Capture, locator: string): unknown {
  let cursor: unknown = JSON.parse(capture.sourceProjectionJson);
  for (const part of locator.split("/").slice(1)) {
    if (typeof cursor !== "object" || cursor === null)
      return "Field absent from exported evidence";
    cursor = (cursor as Record<string, unknown>)[
      part.replaceAll("~1", "/").replaceAll("~0", "~")
    ];
  }
  return cursor ?? "Field absent from exported evidence";
}
function SourceFields({
  capture,
  locators,
  label,
}: {
  capture: Capture;
  locators: string[];
  label: string;
}) {
  return (
    <div>
      <h5>{label}</h5>
      {locators.length === 0 ? (
        <p>No reported field locator in this capture.</p>
      ) : (
        locators.map((locator) => (
          <div key={locator}>
            <code>{locator}</code>
            <pre>{JSON.stringify(sourceAt(capture, locator), null, 2)}</pre>
          </div>
        ))
      )}
      <p>
        <a href={capture.requestUrl} target="_blank" rel="noreferrer">Open registry API request ↗</a> ·
        Retrieved {date(capture.retrievedAt)}
      </p>
    </div>
  );
}
function FieldChange({
  field,
  diff,
}: {
  field: SnapshotFieldChange;
  diff: SnapshotDiff;
}) {
  return (
    <article className="diff-row" data-state={field.state}>
      <header>
        <h4>{field.label}</h4>
        <span className="change-label">{stateLabels[field.state]}</span>
      </header>
      <div className="diff-values">
        <div>
          <h5>Baseline</h5>
          <p>{field.before}</p>
        </div>
        <div>
          <h5>Comparison capture</h5>
          <p>{field.after}</p>
        </div>
      </div>
      {field.note && <p className="quiet">{field.note}</p>}
      <p className="print-only quiet">
        Source fields: {field.baselineLocators.join("; ") || "not captured"} →{" "}
        {field.currentLocators.join("; ") || "not captured"}
      </p>
      <details className="source-disclosure">
        <summary>Inspect {field.label.toLowerCase()} source fields</summary>
        <p>
          These are the captured values used here. Opening the API link makes a
          new external request and may show newer evidence.
        </p>
        <div className="diff-values">
          <SourceFields
            capture={diff.baseline}
            locators={field.baselineLocators}
            label="Baseline source"
          />
          <SourceFields
            capture={diff.current}
            locators={field.currentLocators}
            label="Comparison source"
          />
        </div>
      </details>
    </article>
  );
}
function CaptureHeader({
  capture,
  title,
}: {
  capture: Capture;
  title: string;
}) {
  return (
    <div>
      <h3>{title}</h3>
      <p>Retrieved: {date(capture.retrievedAt)}</p>
      <p>
        Registry last update:{" "}
        {capture.record.provenance.registryLastUpdatePostedDate ??
          "Not reported"}
      </p>
      <details className="source-disclosure">
        <summary>Capture identity &amp; hashes</summary>
        <p>
          Original response SHA-256: <code>{capture.rawSha256}</code>
        </p>
        <p>
          Exported evidence SHA-256: <code>{capture.projectedSha256}</code>
        </p>
        <p>
          Normalized SHA-256: <code>{capture.normalizedSha256}</code>
        </p>
        <p>
          Transformation: <code>{capture.transformationVersion}</code>
        </p>
        <p>
          The field-limited export omits unused and personal fields. Its hash is
          distinct from the original response.{" "}
          {capture.sourceEvidenceMode === "exact-response"
            ? "The exact field-limited live response is also included in the source bundle."
            : "The full retained original remains in the repository; its path is included in the source bundle."}
        </p>
      </details>
    </div>
  );
}

export function StudyWorkspace({
  catalogue,
  initialIds,
  selectionError,
  researchCases = [],
  initialCaseId,
}: {
  catalogue: Capture[];
  initialIds: string[];
  selectionError: boolean;
  researchCases?: VerifiedCase[];
  initialCaseId?: string;
}) {
  const [ids, setIds] = useState(initialIds);
  const [caseId, setCaseId] = useState(initialCaseId);
  const currentCase = researchCases.find((item) => item.content.id === caseId);
  const [query, setQuery] = useState("");
  const [selectionOpen, setSelectionOpen] = useState(initialIds.length === 0);
  const [active, setActive] = useState(initialIds[0] ?? "");
  const [captures, setCaptures] = useState<Record<string, CapturedComparison>>(
    {},
  );
  const [shown, setShown] = useState<Record<string, "current" | "replay">>({});
  const [replays, setReplays] = useState<Record<string, CapturedComparison>>(
    {},
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [exportedAt, setExportedAt] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const inflight = useRef(false);
  const panel = useRef<HTMLElement>(null);
  const selected = ids.map((id) => catalogue.find((c) => c.nctId === id)!);
  const activeCapture = selected.find((c) => c.nctId === active) ?? selected[0];
  const activeId = activeCapture?.nctId;
  const visiblePair = activeId
    ? shown[activeId] === "replay"
      ? replays[activeId]
      : captures[activeId]
    : undefined;
  const comparisons = selected.flatMap((c) => {
    const pair =
      shown[c.nctId] === "replay" ? replays[c.nctId] : captures[c.nctId];
    return pair ? [pair] : [];
  });
  const filtered = catalogue.filter((c) =>
    `${c.nctId} ${c.record.briefTitle} ${formatValue(c.record.interventions.value)}`
      .toLowerCase()
      .includes(query.toLowerCase().trim()),
  );

  useEffect(() => {
    const states = new Map<HTMLDetailsElement, boolean>();
    const before = () => {
      document
        .querySelectorAll<HTMLDetailsElement>(
          ".workspace details:not(.source-disclosure):not(.catalogue-disclosure)",
        )
        .forEach((el) => {
          if (!states.has(el)) states.set(el, el.open);
          el.open = true;
        });
    };
    const after = () => {
      states.forEach((open, el) => {
        el.open = open;
      });
      states.clear();
    };
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  function select(next: string[]) {
    if (next.length === 0) setSelectionOpen(true);
    setCaseId(undefined);
    setIds(next);
    setMessage("");
    setPdfError("");
    setExportedAt("");
    const params = new URLSearchParams();
    next.forEach((id) => params.append("nct", id));
    window.history.replaceState(
      null,
      "",
      `/studies${next.length ? `?${params}` : ""}`,
    );
  }
  function chooseCase(id: string) {
    const nextCase = researchCases.find((item) => item.content.id === id);
    if (!nextCase) { select([]); return; }
    setCaseId(id);
    setSelectionOpen(false);
    setPdfError("");
    setIds(nextCase.content.studyIds);
    setActive(nextCase.content.studyIds[0]);
    setExportedAt("");
    setMessage(`Opened ${nextCase.content.title}. Saved evidence is ready.`);
    window.history.replaceState(null, "", `/studies?case=${id}`);
  }
  function toggle(id: string) {
    if (ids.includes(id)) select(ids.filter((entry) => entry !== id));
    else if (ids.length < 4) select([...ids, id]);
    else
      setMessage(
        "Your brief can contain up to four studies. Remove one to add another.",
      );
  }
  function inspect(id: string) {
    setActive(id);
    requestAnimationFrame(() => {
      panel.current?.scrollIntoView({ behavior: "instant", block: "start" });
      panel.current?.focus({ preventScroll: true });
    });
  }
  async function capture(mode: "current" | "replay") {
    if (!activeCapture || inflight.current) return;
    const nctId = activeCapture.nctId;
    if (
      (mode === "current" && captures[nctId]) ||
      (mode === "replay" && replays[nctId])
    ) {
      setShown((previous) => ({ ...previous, [nctId]: mode }));
      setExportedAt("");
      return;
    }
    inflight.current = true;
    setBusy(`${nctId}:${mode}`);
    setErrors((previous) => ({ ...previous, [nctId]: "" }));
    try {
      const response = await fetch(
        `/api/snapshots/${nctId}${mode === "replay" ? "?mode=replay" : ""}`,
        { cache: "no-store" },
      );
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error ??
            "The record is unavailable. Saved evidence is unchanged.",
        );
      const diff =
        mode === "replay"
          ? compareCaptures(payload.baseline, payload.current)
          : compareCaptures(activeCapture, payload);
      const result: CapturedComparison = { mode, diff };
      setExportedAt("");
      if (mode === "current")
        setCaptures((previous) => ({ ...previous, [nctId]: result }));
      else setReplays((previous) => ({ ...previous, [nctId]: result }));
      setShown((previous) => ({ ...previous, [nctId]: mode }));
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        [nctId]:
          error instanceof Error
            ? error.message
            : "The registry could not be reached. Your saved evidence is still available.",
      }));
    } finally {
      inflight.current = false;
      setBusy(null);
    }
  }
  function exportBrief(kind: "csv" | "json") {
    const timestamp = exportedAt || new Date().toISOString();
    setExportedAt(timestamp);
    const name = `synapse-atlas-brief-${timestamp.slice(0, 10)}`;
    if (kind === "csv")
      download(
        `${name}.csv`,
        sessionCsv(selected, comparisons, timestamp, currentCase),
        "text/csv;charset=utf-8",
      );
    else
      download(
        `${name}-sources.json`,
        JSON.stringify(
          sessionManifest(selected, comparisons, timestamp, currentCase),
          null,
          2,
        ),
        "application/json",
      );
    setMessage(`${kind === "csv" ? "CSV" : "Source bundle"} download prepared for ${currentCase?.content.title ?? "custom selection"}: ${evidenceSummary(selected, comparisons)}. Uses the evidence shown in this brief.`);
  }
  async function exportPdf() {
    if (pdfBusy || selected.length === 0) return;
    const timestamp = exportedAt || new Date().toISOString();
    setExportedAt(timestamp);
    setPdfBusy(true);
    setPdfError("");
    try {
      // Capture this render's selection and pairs before loading the PDF renderer.
      // Exporting never refreshes registry evidence or changes saved baselines.
      const { sessionPdf } = await import("./session-pdf");
      const bytes = await sessionPdf(selected, comparisons, timestamp, currentCase);
      download(`synapse-atlas-brief-${timestamp.slice(0, 10)}.pdf`, new Uint8Array(bytes).buffer, "application/pdf");
      setMessage(`PDF download prepared for ${currentCase?.content.title ?? "custom selection"}: ${selected.map((item) => item.nctId).join(", ")}. ${evidenceSummary(selected, comparisons)}. Uses the evidence selected when you requested the download.`);
    } catch {
      setPdfError("The PDF could not be prepared. Your evidence is unchanged. Retry, or download the CSV and source bundle below.");
    } finally {
      setPdfBusy(false);
    }
  }
  const changed =
    visiblePair?.diff.fields.filter((f) =>
      ["changed", "added", "removed"].includes(f.state),
    ) ?? [];
  const unchanged =
    visiblePair?.diff.fields.filter((f) => f.state === "unchanged") ?? [];
  const uncompared =
    visiblePair?.diff.fields.filter((f) =>
      ["ambiguous", "not_compared"].includes(f.state),
    ) ?? [];
  return (
    <main id="main-content" className="shell workspace">
      <header className="workspace-intro workspace-context">
        <div>
          <p className="eyebrow workspace-context__label">Research workspace / Brief</p>
          <h1 className="workspace-context__title">{currentCase?.content.title ?? "Custom research brief"}</h1>
          <p className="workspace-context__meta">
            {selected.length} of 4 studies selected · {evidenceSummary(selected, comparisons)}
          </p>
        </div>
        <div className="workspace-context__next no-print">
          <button className="button" onClick={exportPdf} disabled={pdfBusy || selected.length === 0} aria-busy={pdfBusy}>
            {pdfBusy ? "Preparing PDF…" : "Download PDF"}
          </button>
          <Link className="quiet" href="/how-it-works">How this brief works ↗</Link>
        </div>
      </header>
      {pdfError && <p className="notice error" role="alert">{pdfError}</p>}
      {researchCases.length > 0 && <nav className="brief-toolbar workspace-toolbar no-print" aria-label="Research workspace">
        <label htmlFor="case-switch">Research case<select id="case-switch" value={caseId ?? ""} onChange={(event) => chooseCase(event.target.value)}>
          <option value="">Custom study selection</option>{researchCases.map((item) => <option key={item.content.id} value={item.content.id}>{item.content.title}</option>)}
        </select></label>{selected.length > 0 && <><a href="#saved-studies">Study records ↓</a><a href="#snapshot-heading">Snapshot comparison ↓</a><a href="#brief-export">Export brief ↓</a></>}
      </nav>}
      <EvidenceState saved={selected} comparisons={comparisons} title={currentCase?.content.title} activeId={activeId} busy={busy} error={activeId ? errors[activeId] : undefined} />
      {currentCase && <CaseView researchCase={currentCase} />}
      {selectionError && (
        <p className="notice error" role="alert">
          The link contained an invalid selection. Choose one to four saved NCT
          records below.
        </p>
      )}
      <details
        className="catalogue-disclosure"
        open={selectionOpen}
        onToggle={(event) => setSelectionOpen(event.currentTarget.open)}
      >
        <summary>Choose studies · {ids.length} of 4 selected</summary>
        <div className="catalogue-controls">
          <label htmlFor="study-search">
            Find a saved study by NCT ID, title or intervention
          </label>
          <input
            id="study-search"
            name="study-search"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try NCT05711940 or depression…"
          />
        </div>
        <p className="quiet" role="status">
          {filtered.length} of {catalogue.length} saved records
        </p>
        <div className="study-options">
          {filtered.map((c) => (
            <label className="study-option" key={c.nctId}>
              <input
                type="checkbox"
                checked={ids.includes(c.nctId)}
                onChange={() => toggle(c.nctId)}
              />
              <span>
                <strong>{c.nctId}</strong>
                {c.record.briefTitle}
                <small>
                  {value(c, "overallStatus")} · saved{" "}
                  {c.retrievedAt.slice(0, 10)}
                </small>
              </span>
            </label>
          ))}
        </div>
        {filtered.length === 0 && (
          <p>
            No matching saved studies.{" "}
            <button
              className="button button-secondary"
              onClick={() => setQuery("")}
            >
              Clear search
            </button>
          </p>
        )}
        <div className="button-row">
          <button
            className="button button-secondary"
            onClick={() => select(prepared)}
          >
            Use prepared depression brief
          </button>
          <button
            className="button button-secondary"
            onClick={() => select([])}
          >
            Clear selection
          </button>
        </div>
      </details>
      <p role="status" aria-live="polite" className="quiet">
        {message}
      </p>
      {selected.length === 0 ? (
        <section className="empty-selection">
          <h2>Start with a research question</h2>
          <p>
            Select one to four saved studies, or open the prepared three-study
            brief.
          </p>
          <button className="button" onClick={() => select(prepared)}>
            Open prepared brief
          </button>
        </section>
      ) : (
        <>
          <div className="section-title">
            <h2 id="saved-studies">Selected registered studies</h2>
            <span className="quiet">
              {selected.length} NCT records · saved evidence, not live results
            </span>
          </div>
          <p className="notice">
            Dated snapshots: saved{" "}
            {selected
              .map((c) => c.retrievedAt.slice(0, 10))
              .filter((v, i, a) => a.indexOf(v) === i)
              .join(" / ")}
            . Records older than 48 hours may be stale. Use “Inspect changes” to
            capture the current registry.
          </p>
          <div className="study-grid">
            {selected.map((c) => (
              <article
                className={`saved-study ${activeId === c.nctId ? "active-study" : ""}`}
                key={c.nctId}
              >
                <a className="study-id" href={c.record.provenance.sourceUrl} target="_blank" rel="noreferrer">
                  {c.nctId} ↗
                </a>
                <h3 className="study-title">{c.record.briefTitle}</h3>
                <p className="study-date">
                  Saved {c.retrievedAt.slice(0, 10)} · registry updated{" "}
                  {c.record.provenance.registryLastUpdatePostedDate ??
                    "unknown"}
                </p>
                <dl>
                  {(
                    [
                      "overallStatus",
                      "enrollment",
                      "primaryCompletionDate",
                      "leadSponsor",
                    ] as const
                  ).map((key) => (
                    <div key={key}>
                      <dt>{fieldLabels[key]}</dt>
                      <dd>{value(c, key)}</dd>
                    </div>
                  ))}
                </dl>
                <details>
                  <summary>
                    Endpoints, interventions &amp; study completion
                  </summary>
                  <dl>
                    {(
                      [
                        "primaryOutcomes",
                        "interventions",
                        "completionDate",
                      ] as const
                    ).map((key) => (
                      <div key={key}>
                        <dt>{fieldLabels[key]}</dt>
                        <dd>{value(c, key)}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
                <p className="print-only">
                  Source: {c.record.provenance.sourceUrl}
                  <br />
                  Captured: {c.retrievedAt}
                  <br />
                  Evidence SHA-256: {c.projectedSha256}
                </p>
                <button
                  className="button button-secondary"
                  onClick={() => inspect(c.nctId)}
                >
                  Inspect changes{" "}
                  <span className="sr-only"> for {c.nctId}</span>
                </button>
              </article>
            ))}
          </div>
          {!currentCase && <PrimaryOutcomeInspector view={savedPrimaryOutcomes(selected)} />}
          {activeCapture && (
            <section
              className="snapshot-panel"
              ref={panel}
              tabIndex={-1}
              aria-labelledby="snapshot-heading"
            >
              <p className="eyebrow">02 / NCT Snapshot Diff</p>
              <div className="snapshot-heading">
                <h2 id="snapshot-heading">What changed in {activeId}?</h2>
                <a
                  className="quiet"
                  href={activeCapture.record.provenance.sourceUrl}
                  target="_blank" rel="noreferrer"
                >
                  Open official study record ↗
                </a>
              </div>
              <p className="quiet">{activeCapture.record.briefTitle}</p>
              <div className="snapshot-actions">
                <button
                  className="button"
                  disabled={busy !== null}
                  onClick={() => capture("current")}
                >
                  {busy === `${activeId}:current`
                    ? "Retrieving and validating…"
                    : captures[activeId!]
                      ? "Show captured current record"
                      : "Check current registry"}
                </button>
                {prepared.includes(activeId!) && (
                  <button
                    className="button button-secondary"
                    disabled={busy !== null}
                    onClick={() => capture("replay")}
                  >
                    {busy === `${activeId}:replay`
                      ? "Opening retained replay…"
                      : "Replay two saved captures"}
                  </button>
                )}
              </div>
              <p role="status" className="quiet">
                {busy
                  ? "Your saved baseline stays available while the capture is checked."
                  : visiblePair
                    ? "Comparison ready. Exports reuse this captured evidence."
                    : "No new lookup yet. The comparison captures one response in this session and never replaces your saved baseline."}
              </p>
              {activeId && errors[activeId] && (
                <p role="alert" className="notice error">
                  Refresh unavailable. {errors[activeId]}
                </p>
              )}
              {!visiblePair && (
                <div className="notice">
                  Check the registry to compare seven registered field groups.
                  If access is unavailable, the three prepared studies have a
                  deterministic replay from two retained captures. A replay is
                  historical evidence, not a live refresh.
                </div>
              )}
              {visiblePair && (
                <>
                  {visiblePair.mode === "replay" && (
                    <p className="notice warning">
                      <strong>
                        Retained-record replay — not a current lookup.
                      </strong>{" "}
                      Two real saved captures are compared below. Fields absent
                      from an older request cannot be compared. No historical
                      changes have been invented.
                    </p>
                  )}
                  <div className="pair-header">
                    <CaptureHeader
                      capture={visiblePair.diff.baseline}
                      title="Saved baseline"
                    />
                    <CaptureHeader
                      capture={visiblePair.diff.current}
                      title={
                        visiblePair.mode === "replay"
                          ? "Later retained capture"
                          : "Current session capture"
                      }
                    />
                  </div>
                  <p className="diff-summary">
                    {changed.length === 0
                      ? "No changes detected in comparable fields."
                      : `${changed.length} field ${changed.length === 1 ? "group has" : "groups have"} changed.`}
                  </p>
                  <p className="quiet">
                    {unchanged.length} unchanged · {uncompared.length} could not
                    be compared. The registry update date can change even when
                    these selected fields do not.
                  </p>
                  {changed.map((field) => (
                    <FieldChange
                      key={field.key}
                      field={field}
                      diff={visiblePair.diff}
                    />
                  ))}
                  {unchanged.length > 0 && (
                    <details
                      className="unchanged-group"
                      open={changed.length === 0}
                    >
                      <summary>Unchanged facts ({unchanged.length})</summary>
                      {unchanged.map((field) => (
                        <FieldChange
                          key={field.key}
                          field={field}
                          diff={visiblePair.diff}
                        />
                      ))}
                    </details>
                  )}
                  {uncompared.length > 0 && (
                    <details className="uncompared-group" open>
                      <summary>
                        Unknown or uncompared ({uncompared.length})
                      </summary>
                      {uncompared.map((field) => (
                        <FieldChange
                          key={field.key}
                          field={field}
                          diff={visiblePair.diff}
                        />
                      ))}
                    </details>
                  )}
                  <p className="quiet">
                    Comparator: {visiblePair.diff.comparatorVersion}. Only the
                    selected registered fields are compared, not the complete
                    record or official history.
                  </p>
                  <p className="print-only">
                    Comparison evidence SHA-256:{" "}
                    {visiblePair.diff.current.projectedSha256}
                  </p>
                </>
              )}
            </section>
          )}
          {comparisons
            .filter((pair) => pair.diff.nctId !== activeId)
            .map((pair) => (
              <section
                className="print-only snapshot-panel"
                key={pair.diff.nctId}
              >
                <h2>
                  {pair.diff.nctId} —{" "}
                  {pair.mode === "replay"
                    ? "Retained-record replay"
                    : "Current session capture"}
                </h2>
                <div className="pair-header">
                  <CaptureHeader
                    capture={pair.diff.baseline}
                    title="Baseline"
                  />
                  <CaptureHeader
                    capture={pair.diff.current}
                    title="Comparison capture"
                  />
                </div>
                {pair.diff.fields.map((field) => (
                  <FieldChange key={field.key} field={field} diff={pair.diff} />
                ))}
              </section>
            ))}
          <section className="export-bar" id="brief-export">
            <p className="eyebrow">03 / Take the evidence with you</p>
            <h2>Export this research brief</h2>
            <EvidenceState compact saved={selected} comparisons={comparisons} title={currentCase?.content.title} />
            <p className="quiet">
              {selected.length} saved studies and {comparisons.length} displayed{" "}
              {comparisons.length === 1 ? "comparison" : "comparisons"}.
              Downloads never refetch. The JSON source manifest includes
              replayable evidence.
            </p>
            <div className="button-row">
              <button className="button" onClick={exportPdf} disabled={pdfBusy} aria-busy={pdfBusy}>
                {pdfBusy ? "Preparing PDF…" : "Download PDF"}
              </button>
              <button className="button button-secondary" onClick={() => exportBrief("csv")}>
                Download CSV
              </button>
              <button
                className="button button-secondary"
                onClick={() => exportBrief("json")}
              >
                Download source bundle
              </button>
              <button
                className="button button-secondary"
                onClick={() => window.print()}
              >
                Print brief
              </button>
            </div>
            <p className="quiet">{snapshotLimitations}</p>
            <details className="source-disclosure">
              <summary>What is in the source bundle?</summary>
              <p>
                Selected saved captures, each displayed evidence pair, full
                source-field projections, original and projected hashes,
                normalized hashes, retrieval/registry dates and comparator
                versions. It excludes unused contact fields. The
                original-response hash identifies the retained source; use the
                projection hash to verify the bytes included here.
              </p>
              {comparisons.map((pair) => (
                <p key={pair.diff.nctId}>
                  {pair.diff.nctId}: {createSnapshotBrief(pair.diff).format} (
                  {pair.mode === "replay"
                    ? "retained replay"
                    : "current capture"}
                  )
                </p>
              ))}
            </details>
          </section>
        </>
      )}
    </main>
  );
}
