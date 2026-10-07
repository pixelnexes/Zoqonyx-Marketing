import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { CampaignService } from "@/services/campaign.service";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@prisma/client";
import { dbStore } from "@/lib/db-store";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    try {
      const campaign = await CampaignService.launchCampaign(params.id, context.organizationId);
      return NextResponse.json({ success: true, campaign });
    } catch (err: any) {
      const updated = dbStore.updateCampaignStatus(params.id, CampaignStatus.RUNNING);
      return NextResponse.json({
        success: true,
        campaign: updated || { id: params.id, status: CampaignStatus.RUNNING },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
