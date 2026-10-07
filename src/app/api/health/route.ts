import { NextResponse } from "next/server";
import { AdminService } from "@/services/admin.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await AdminService.getSystemHealth();
  const isHealthy = health.database.status === "HEALTHY";

  return NextResponse.json(
    {
      status: isHealthy ? "OK" : "DEGRADED",
      product: "Zoqonyx Email Marketing",
      developer: "Nawix Tech Solution (https://newixtechsolutions.com/)",
      ...health,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
