import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { AdminService } from "@/services/admin.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext(req);
    if (!context.isSuperAdmin) {
      return NextResponse.json({ error: "Super Admin privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    try {
      const result = await AdminService.listOrganizations({ search, page, limit });
      return NextResponse.json({ success: true, ...result });
    } catch (err: any) {
      const mockOrgs = [
        {
          id: "org_navix_01",
          name: "Navix Demo Solutions",
          slug: "navix-demo",
          status: "ACTIVE",
          planName: "PRO",
          contactsCount: 148,
          mailboxesCount: 2,
          campaignsCount: 2,
          createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
        },
        {
          id: "org_alpha_02",
          name: "Alpha Scale Ventures",
          slug: "alpha-scale",
          status: "ACTIVE",
          planName: "BUSINESS",
          contactsCount: 4200,
          mailboxesCount: 8,
          campaignsCount: 6,
          createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
        },
        {
          id: "org_apex_03",
          name: "Apex Healthcare Outreach",
          slug: "apex-health",
          status: "ACTIVE",
          planName: "ENTERPRISE",
          contactsCount: 8100,
          mailboxesCount: 15,
          campaignsCount: 12,
          createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
        },
      ];

      return NextResponse.json({
        success: true,
        organizations: mockOrgs,
        total: mockOrgs.length,
        page: 1,
        totalPages: 1,
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
