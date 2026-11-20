import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/": ["./data/comparison/**/*.json", "./data/study-examples/v1/*.json", "./data/research-catalogue/v1/*.json"],
    "/catalogue": ["./data/comparison/**/*.json", "./data/study-examples/v1/*.json", "./data/research-catalogue/v1/*.json"],
    "/studies": ["./data/research-catalogue/v1/*.json", "./data/comparison/**/*.json", "./data/study-examples/v1/*.json", "./data/fixtures/clinicaltrials.gov/*.json"],
    "/api/snapshots/*": ["./data/research-catalogue/v1/*.json", "./data/comparison/**/*.json", "./data/study-examples/v1/*.json", "./data/fixtures/clinicaltrials.gov/*.json"],
    "/programs/[slug]": ["./data/study-examples/v1/*.json"],
    "/trials/examples": ["./data/study-examples/v1/*.json"],
    "/trials/examples/[nctId]": ["./data/study-examples/v1/*.json"],
    "/compare": ["./data/fixtures/clinicaltrials.gov/*.json", "./data/comparison/**/*.json", "./data/program-mappings/*.md", "./data/study-examples/v1/*.json"],
    "/compare/*": ["./data/fixtures/clinicaltrials.gov/*.json", "./data/comparison/**/*.json", "./data/program-mappings/*.md", "./data/study-examples/v1/*.json"],
  },
  poweredByHeader: false,
};

export default nextConfig;
