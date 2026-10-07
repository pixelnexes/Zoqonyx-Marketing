import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { InboxService } from "@/services/inbox.service";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const context = await getTenantContext(req);
    const { messageHtml, subject } = await req.json();

    if (!messageHtml) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    const result = await InboxService.sendDirectReply(
      params.id,
      context.organizationId,
      messageHtml,
      subject
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
