// Bounded, manual capture only. Never overwrite a released snapshot version.
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bootstrap loads the existing TypeScript validators without a new runtime dependency. */
const fs = require("node:fs/promises");
const path = require("node:path");
const ts = require("typescript");
require.extensions[".ts"] = (module, filename) => {
  module._compile(ts.transpileModule(require("node:fs").readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText, filename);
};
const { briefRequestUrl, briefVersion, validateBriefSnapshot, briefManifestSchema } = require("../src/lib/domain/brief-snapshots.ts");
const { evaluateSourceRequest } = require("../src/lib/sources/policies.ts");
const { sha256Bytes } = require("../src/lib/evidence/provenance.ts");
const { programmeMappingDataset } = require("../src/lib/programs/dataset.ts");

async function main() {
  const destination = path.join(__dirname, "../data/comparison", briefVersion);
  try { await fs.access(destination); throw new Error("Snapshot directory exists; use a new reviewed version"); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const captures = [];
  for (const nctId of programmeMappingDataset.sourceSnapshots.map((s) => s.externalId)) {
    const requestUrl = briefRequestUrl(nctId);
    if (!evaluateSourceRequest({ sourceId: "SRC-CTG", policyVersion: "1", method: "GET", url: requestUrl }).allowed) throw new Error("POLICY_DENIED");
    const response = await fetch(requestUrl, { method: "GET", credentials: "omit", redirect: "manual", headers: { accept: "application/json" }, signal: AbortSignal.timeout(10000) });
    if (!response.ok || response.headers.get("content-type")?.split(";")[0] !== "application/json") throw new Error(`Capture failed: ${response.status}`);
    const chunks = []; let size = 0;
    for await (const chunk of response.body) {
      size += chunk.byteLength;
      if (size > 1048576) throw new Error("RESPONSE_TOO_LARGE");
      chunks.push(chunk);
    }
    const bytes = Buffer.concat(chunks);
    const retrievedAt = new Date().toISOString();
    const metadata = { nctId, sourceId: "SRC-CTG", policyVersion: "1", requestUrl, retrievedAt, processedAt: new Date().toISOString(), sha256: sha256Bytes(bytes) };
    validateBriefSnapshot(metadata, bytes);
    captures.push({ metadata, bytes });
  }
  const manifest = briefManifestSchema.parse({ version: briefVersion, snapshots: captures.map((c) => c.metadata) });
  await fs.mkdir(destination, { recursive: true });
  for (const { metadata, bytes } of captures) await fs.writeFile(path.join(destination, `${metadata.nctId}.json`), bytes, { flag: "wx" });
  await fs.writeFile(path.join(destination, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx" });
  console.log(`Captured and validated ${captures.length} official study snapshots: ${briefVersion}`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
