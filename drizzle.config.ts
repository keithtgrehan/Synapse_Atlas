import "dotenv/config";

import { defineConfig } from "drizzle-kit";

import { parseServerEnvironment } from "./src/lib/env";

const environment = parseServerEnvironment(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: environment.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
