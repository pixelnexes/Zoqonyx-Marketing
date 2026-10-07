import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { BillingService } from "@/services/billing.service";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext(req);
    const [subData, plans] = await Promise.all([
      BillingService.getOrganizationSubscription(context.organizationId),
      BillingService.getPlans(),
    ]);

    return NextResponse.json({
      success: true,
      ...subData,
      availablePlans: plans,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
