import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@prisma/client";
import { dbStore } from "@/lib/db-store";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);

    try {
      const campaign = await prisma.campaign.update({
        where: { id: params.id },
        data: { status: CampaignStatus.PAUSED },
      });
      return NextResponse.json({ success: true, campaign });
    } catch (err: any) {
      const updated = dbStore.updateCampaignStatus(params.id, CampaignStatus.PAUSED);
      return NextResponse.json({
        success: true,
        campaign: updated || { id: params.id, status: CampaignStatus.PAUSED },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
