import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { LeadService } from "@/services/lead.service";
import { BillingService } from "@/services/billing.service";
import { dbStore } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext(req);
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || undefined;
    const status = (searchParams.get("status") as any) || undefined;
    const category = searchParams.get("category") || undefined;

    try {
      const data = await LeadService.getLeads(context.organizationId, {
        page,
        limit,
        search,
        status,
      });
      return NextResponse.json({ success: true, ...data });
    } catch (err: any) {
      const storeData = dbStore.getLeads({
        page,
        limit,
        search,
        status,
        category,
      });
      return NextResponse.json({
        success: true,
        leads: storeData.leads,
        total: storeData.total,
        page: storeData.page,
        limit: storeData.limit,
        totalPages: storeData.totalPages,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getTenantContext(req);

    // Check contact quota
    try {
      const quotaCheck = await BillingService.verifyQuota(context.organizationId, "contacts");
      if (!quotaCheck.allowed) {
        return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
      }
    } catch (qErr: any) {}

    const body = await req.json();
    const leadsToAdd = Array.isArray(body) ? body : (body.leads ? body.leads : [body]);
    try {
      const result = await LeadService.importLeads(
        context.organizationId,
        leadsToAdd,
        body.source || "MANUAL",
        body.targetCampaignId,
        body.autoEnroll
      );
      return NextResponse.json({ success: true, result });
    } catch (err: any) {
      const result = dbStore.addLeads(
        leadsToAdd.map((l: any) => ({
          ...l,
          organizationId: context.organizationId,
        }))
      );
      return NextResponse.json({
        success: true,
        result: {
          totalProcessed: leadsToAdd.length,
          importedCount: result.importedCount,
          duplicateCount: result.duplicateCount,
          invalidCount: 0,
          suppressedCount: 0,
          enrolledCount: body.autoEnroll ? result.importedCount : 0,
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const context = await getTenantContext(req);
    const body = await req.json();

    if (body.id) {
      dbStore.deleteLead(body.id);
      return NextResponse.json({ success: true, message: "Lead deleted" });
    }

    if (body.ids && Array.isArray(body.ids)) {
      const count = dbStore.deleteLeads(body.ids);
      return NextResponse.json({ success: true, count, message: `${count} leads deleted` });
    }

    if (body.category) {
      const count = dbStore.deleteCategory(body.category);
      return NextResponse.json({ success: true, count, message: `Category '${body.category}' deleted` });
    }

    return NextResponse.json({ error: "Missing id, ids, or category in request body" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
