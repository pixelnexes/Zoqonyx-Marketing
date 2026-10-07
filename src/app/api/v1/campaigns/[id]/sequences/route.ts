import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { CampaignService } from "@/services/campaign.service";
import { dbStore } from "@/lib/db-store";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    const { steps } = await req.json();

    if (!Array.isArray(steps)) {
      return NextResponse.json({ error: "Expected an array of sequence steps" }, { status: 400 });
    }

    try {
      const createdSteps = await CampaignService.setSequenceSteps(
        params.id,
        context.organizationId,
        steps
      );
      return NextResponse.json({ success: true, steps: createdSteps });
    } catch (err: any) {
      const savedSteps = dbStore.saveCampaignSequences(params.id, steps);
      return NextResponse.json({ success: true, steps: savedSteps });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
