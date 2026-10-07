import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { CampaignService } from "@/services/campaign.service";
import { dbStore } from "@/lib/db-store";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    try {
      const analytics = await CampaignService.getCampaignAnalytics(params.id, context.organizationId);
      return NextResponse.json({ success: true, analytics });
    } catch (err: any) {
      const analytics = dbStore.getCampaignAnalytics(params.id);
      return NextResponse.json({ success: true, analytics });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
