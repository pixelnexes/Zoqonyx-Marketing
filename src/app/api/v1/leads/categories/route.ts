import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { dbStore } from "@/lib/db-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await getTenantContext(req);
    const categories = dbStore.getCategories();
    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
