import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/compare": ["./data/fixtures/clinicaltrials.gov/*.json", "./data/comparison/**/*.json"],
    "/compare/*": ["./data/fixtures/clinicaltrials.gov/*.json", "./data/comparison/**/*.json"],
  },
  poweredByHeader: false,
};

export default nextConfig;
