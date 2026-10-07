import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { LeadService } from "@/services/lead.service";
import { BillingService } from "@/services/billing.service";

/**
 * Public & Internal API Endpoint for high-volume JSON lead ingestion.
 * Supports API Key Authentication (Authorization: Bearer zoq_live_...).
 */
export async function POST(req: Request) {
  try {
    const context = await getTenantContext(req);

    // Verify contact quota limit
    const quotaCheck = await BillingService.verifyQuota(context.organizationId, "contacts");
    if (!quotaCheck.allowed) {
      return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
    }

    const payload = await req.json();

    let leadsArray: any[] = [];
    if (Array.isArray(payload)) {
      leadsArray = payload;
    } else if (payload.leads && Array.isArray(payload.leads)) {
      leadsArray = payload.leads;
    } else if (payload.email) {
      leadsArray = [payload];
    } else {
      return NextResponse.json(
        { error: "Invalid payload format. Expected single lead object or array of leads." },
        { status: 400 }
      );
    }

    const targetCampaignId = payload.campaignId || undefined;
    const autoEnroll = Boolean(payload.autoEnroll);
    const source = payload.source || (context.isApiKeyAuth ? "API_KEY_INGESTION" : "CSV_IMPORT");

    const result = await LeadService.importLeads(
      context.organizationId,
      leadsArray,
      source,
      targetCampaignId,
      autoEnroll
    );

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${leadsArray.length} lead(s).`,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
