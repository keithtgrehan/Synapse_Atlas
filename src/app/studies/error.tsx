"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="shell">
      <h1>Saved evidence is unavailable</h1>
      <p>
        We could not validate the retained catalogue. No unverified records have
        been substituted.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
