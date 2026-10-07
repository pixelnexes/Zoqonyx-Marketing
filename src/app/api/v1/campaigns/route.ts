import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { CampaignService } from "@/services/campaign.service";
import { BillingService } from "@/services/billing.service";
import { dbStore } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext(req);

    try {
      const campaigns = await prisma.campaign.findMany({
        where: { organizationId: context.organizationId },
        orderBy: { createdAt: "desc" },
        include: {
          mailbox: { select: { id: true, email: true, fromName: true } },
          sequenceSteps: { orderBy: { stepNumber: "asc" } },
          _count: {
            select: {
              campaignLeads: true,
              sentEmails: true,
            },
          },
        },
      });

      return NextResponse.json({ success: true, campaigns });
    } catch (err: any) {
      return NextResponse.json({ success: true, campaigns: dbStore.getCampaigns() });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(req: Request) {
  try {
    const context = await getTenantContext(req);

    // Check campaign limit
    try {
      const quotaCheck = await BillingService.verifyQuota(context.organizationId, "campaigns");
      if (!quotaCheck.allowed) {
        return NextResponse.json({ error: quotaCheck.reason }, { status: 403 });
      }
    } catch (qErr: any) {}

    const body = await req.json();
    try {
      const campaign = await CampaignService.createCampaign(context.organizationId, body);
      return NextResponse.json({ success: true, campaign });
    } catch (err: any) {
      const saved = dbStore.addCampaign({
        organizationId: context.organizationId,
        name: body.name || "New Outbound Campaign",
        description: body.description || "",
        dailyLimit: body.dailyLimit || 50,
        timezone: body.timezone || "America/New_York",
        startHour: body.startHour || 9,
        endHour: body.endHour || 17,
        mailboxId: body.mailboxId,
        sequenceSteps: body.sequenceSteps,
        targetListTag: body.targetListTag,
      });
      return NextResponse.json({ success: true, campaign: saved });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

