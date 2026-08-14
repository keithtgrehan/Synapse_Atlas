import { serverEnvironmentSchema } from "../../../lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const environment = serverEnvironmentSchema.safeParse(process.env);

  if (!environment.success) {
    return Response.json(
      {
        status: "degraded",
        service: "synapse-atlas",
        checks: { databaseConfiguration: "missing" },
      },
      { status: 503 },
    );
  }

  return Response.json({
    status: "ok",
    service: "synapse-atlas",
    checks: { databaseConfiguration: "present" },
  });
}
