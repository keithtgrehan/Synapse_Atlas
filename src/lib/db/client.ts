import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { type EnvironmentInput, parseServerEnvironment } from "../env";
import { databaseSchema } from "./schema";

export function createDatabase(environment: EnvironmentInput = process.env) {
  const { DATABASE_URL } = parseServerEnvironment(environment);
  const client = postgres(DATABASE_URL, { prepare: false });

  return {
    client,
    database: drizzle(client, { schema: databaseSchema }),
  };
}
