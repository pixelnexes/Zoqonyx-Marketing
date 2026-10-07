import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { InboxService } from "@/services/inbox.service";
import { dbStore } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext(req);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    try {
      const data = await InboxService.getConversations(context.organizationId, {
        status,
        search,
        page,
        limit,
      });

      return NextResponse.json({ success: true, ...data });
    } catch (err: any) {
      const convs = dbStore.getConversations();
      return NextResponse.json({
        success: true,
        conversations: convs,
        total: convs.length,
        page,
        totalPages: Math.ceil(convs.length / limit) || 1,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}

