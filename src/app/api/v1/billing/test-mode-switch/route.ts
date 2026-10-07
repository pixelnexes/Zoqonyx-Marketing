import { NextResponse } from "next/server";
import { getTenantContext, requireRole } from "@/lib/tenancy";
import { BillingService } from "@/services/billing.service";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const context = await getTenantContext(req);
    requireRole(context, [Role.OWNER, Role.ADMIN]);

    const { planName } = await req.json();

    if (!planName) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    const updatedSub = await BillingService.switchPlanInTestMode(
      context.organizationId,
      planName
    );

    return NextResponse.json({
      success: true,
      message: `Successfully updated subscription to ${planName} (Test Mode Active)`,
      subscription: updatedSub,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
