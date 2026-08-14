import { z } from "zod";

const databaseUrlSchema = z
  .url("DATABASE_URL must be a valid URL")
  .refine(
    (value) => {
      if (!URL.canParse(value)) {
        return false;
      }

      const protocol = new URL(value).protocol;
      return protocol === "postgres:" || protocol === "postgresql:";
    },
    "DATABASE_URL must use the postgres or postgresql protocol",
  );

export const serverEnvironmentSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type EnvironmentInput = Readonly<Record<string, string | undefined>>;

export function parseServerEnvironment(
  environment: EnvironmentInput,
): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join(".") || "environment")
      .join(", ");

    throw new Error(`Invalid server environment: ${fields}`);
  }

  return result.data;
}
