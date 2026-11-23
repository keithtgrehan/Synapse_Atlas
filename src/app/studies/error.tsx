"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="shell">
      <h1>We could not open the saved records</h1>
      <p>
        We could not confirm that the saved records match their sources.
        We have not replaced them with unchecked information.
      </p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
