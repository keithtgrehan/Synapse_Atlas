import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/compare": ["./data/fixtures/clinicaltrials.gov/*.json"],
  },
  poweredByHeader: false,
};

export default nextConfig;
