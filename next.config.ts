import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/programs/[slug]": ["./data/study-examples/v1/*.json"],
    "/trials/examples": ["./data/study-examples/v1/*.json"],
    "/trials/examples/[nctId]": ["./data/study-examples/v1/*.json"],
    "/compare": ["./data/fixtures/clinicaltrials.gov/*.json", "./data/comparison/**/*.json", "./data/program-mappings/*.md", "./data/study-examples/v1/*.json"],
    "/compare/*": ["./data/fixtures/clinicaltrials.gov/*.json", "./data/comparison/**/*.json", "./data/program-mappings/*.md", "./data/study-examples/v1/*.json"],
  },
  poweredByHeader: false,
};

export default nextConfig;
