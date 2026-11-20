import { readFileSync, writeFileSync } from "node:fs";
const source = readFileSync(
  new URL("../src/lib/product/how-it-works.ts", import.meta.url),
  "utf8",
);
const sections = [
  ...source.matchAll(
    /\{ title: ("(?:[^"\\]|\\.)*"), body: ("(?:[^"\\]|\\.)*") \}/g,
  ),
].map((match) => `### ${JSON.parse(match[1])}\n\n${JSON.parse(match[2])}`);
if (sections.length !== 8)
  throw new Error("Unexpected shared How it works content");
const path = new URL("../README.md", import.meta.url);
const readme = readFileSync(path, "utf8");
const start = "<!-- HOW_IT_WORKS:START -->";
const end = "<!-- HOW_IT_WORKS:END -->";
const generated = `${start}\n${sections.join("\n\n")}\n${end}`;
const next = readme.replace(new RegExp(`${start}[\\s\\S]*${end}`), generated);
if (process.argv.includes("--check")) {
  if (next !== readme) throw new Error("README shared explanation is stale");
} else writeFileSync(path, next);
