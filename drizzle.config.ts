import "dotenv/config";

import { defineConfig } from "drizzle-kit";

import { serverEnvironmentSchema } from "./src/lib/env";

const environment = serverEnvironmentSchema.safeParse(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  ...(environment.success
    ? { dbCredentials: { url: environment.data.DATABASE_URL } }
    : {}),
  strict: true,
  verbose: true,
});
