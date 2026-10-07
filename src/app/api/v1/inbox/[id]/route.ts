import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { InboxService } from "@/services/inbox.service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    const details = await InboxService.getConversationDetails(params.id, context.organizationId);

    return NextResponse.json({ success: true, ...details });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
