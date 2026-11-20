import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("bounded MAPP capture publication", () => {
  it.each(["failed", "malformed", "wrong-id"])("does not publish a partial package when the second response is %s", async failure => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), "mapp-capture-test-"));
    try {
      const source = await readFile(path.join(process.cwd(), "data/research-cases/mdma-ptsd/v1/NCT03537014.json"), "utf8");
      const preload = path.join(cwd, "fake-registry.mjs");
      await writeFile(preload, `let calls=0; globalThis.fetch=async()=>{ if(++calls===1) return new Response(${JSON.stringify(source)},{headers:{'content-type':'application/json'}}); ${failure === "failed" ? "throw new Error('SIMULATED_FAILED_CAPTURE');" : `return new Response(${JSON.stringify(failure === "malformed" ? "{" : source)},{headers:{'content-type':'application/json'}});`} };`);
      const result = spawnSync(process.execPath, ["--import", preload, path.join(process.cwd(), "scripts/capture-mapp-case.mjs")], { cwd, encoding: "utf8", timeout: 10_000 });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(failure === "failed" ? "SIMULATED_FAILED_CAPTURE" : failure === "malformed" ? "CAPTURE_INVALID_JSON:NCT04077437" : "CAPTURE_EXACT_ID_MISMATCH:NCT04077437");
      await expect(stat(path.join(cwd, "data/research-cases/mdma-ptsd/v1"))).rejects.toMatchObject({ code: "ENOENT" });
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });
});
