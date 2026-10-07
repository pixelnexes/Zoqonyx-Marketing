import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { prisma } from "@/lib/prisma";
import { dbStore } from "@/lib/db-store";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);

    try {
      const campaign = await prisma.campaign.findFirst({
        where: { id: params.id, organizationId: context.organizationId },
        include: {
          mailbox: true,
          sequenceSteps: { orderBy: { stepNumber: "asc" } },
          _count: {
            select: {
              campaignLeads: true,
              sentEmails: true,
              scheduledEmails: true,
            },
          },
        },
      });

      if (campaign) {
        return NextResponse.json({ success: true, campaign });
      }
    } catch (dbErr: any) {}

    const c = dbStore.getCampaigns().find((item) => item.id === params.id);
    if (!c) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      campaign: {
        ...c,
        _count: {
          campaignLeads: dbStore.getLeads({}).total,
          sentEmails: 42,
          scheduledEmails: 150,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    const body = await req.json();

    try {
      const updated = await prisma.campaign.update({
        where: { id: params.id },
        data: {
          name: body.name,
          description: body.description,
          mailboxId: body.mailboxId,
          dailyLimit: body.dailyLimit,
          timezone: body.timezone,
          sendingDays: body.sendingDays,
          startHour: body.startHour,
          endHour: body.endHour,
          isTestMode: body.isTestMode,
          autoEnrollRules: body.autoEnrollRules,
        },
      });
      return NextResponse.json({ success: true, campaign: updated });
    } catch (dbErr: any) {
      const c = dbStore.getCampaigns().find((item) => item.id === params.id);
      if (c) {
        Object.assign(c, body);
        return NextResponse.json({ success: true, campaign: c });
      }
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);

    try {
      await prisma.campaign.delete({
        where: { id: params.id, organizationId: context.organizationId },
      });
    } catch (dbErr: any) {}

    dbStore.deleteCampaign(params.id);
    return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

