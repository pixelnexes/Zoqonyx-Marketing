import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { mapRowsToLeads } from "@/lib/spreadsheet-parser";
import { LeadService } from "@/services/lead.service";
import { BillingService } from "@/services/billing.service";

export async function POST(req: Request) {
  try {
    const context = await getTenantContext(req);

    // Verify contact quota
    const quotaCheck = await BillingService.verifyQuota(context.organizationId, "contacts");
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
    }

    const { rows, columnMapping, targetCampaignId, autoEnroll } = await req.json();

    if (!rows || !columnMapping || !columnMapping.email) {
      return NextResponse.json({ error: "Invalid mapping. Email column must be selected." }, { status: 400 });
    }

    const { validLeads, invalidCount } = mapRowsToLeads(rows, columnMapping);

    const result = await LeadService.importLeads(
      context.organizationId,
      validLeads,
      "CSV_WIZARD",
      targetCampaignId,
      autoEnroll
    );

    return NextResponse.json({
      success: true,
      invalidCount,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
