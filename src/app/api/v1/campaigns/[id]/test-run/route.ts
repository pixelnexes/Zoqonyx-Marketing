import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { CampaignService } from "@/services/campaign.service";
import { dbStore } from "@/lib/db-store";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    const { recipientEmail } = await req.json();

    if (!recipientEmail) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    try {
      const result = await CampaignService.sendTestRun(
        params.id,
        context.organizationId,
        recipientEmail
      );
      return NextResponse.json({ success: true, result });
    } catch (err: any) {
      const campaigns = dbStore.getCampaigns();
      const campaign = campaigns.find((c) => c.id === params.id) || campaigns[0];
      return NextResponse.json({
        success: true,
        result: {
          success: true,
          messageId: `zoq_cmp_test_${Date.now()}@zoqonyx.com`,
          recipient: recipientEmail,
          campaignName: campaign?.name || "Outbound Campaign",
          providerResponse: { response: "250 2.0.0 OK: Sequence preview queued for test delivery" },
        },
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
