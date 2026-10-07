import { NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy";
import { getCurrentUserWithOrgs } from "@/lib/auth";
import { MOCK_USERS } from "@/lib/mock-store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const context = await getTenantContext(req);
    let user: any = null;

    try {
      user = await getCurrentUserWithOrgs(context.userId);
    } catch (err: any) {
      console.warn("DB offline in auth/me, fallback to mock context");
    }

    if (!user) {
      const mock = (MOCK_USERS as Record<string, any>)[context.userEmail] || {
        id: context.userId,
        email: context.userEmail,
        name: context.userName,
        isSuperAdmin: context.isSuperAdmin,
        organizationId: context.organizationId,
        organizationName: context.organizationName,
        role: context.role,
        planName: context.planName,
      };

      return NextResponse.json({
        success: true,
        context,
        user: {
          id: mock.id,
          email: mock.email,
          name: mock.name,
          isSuperAdmin: mock.isSuperAdmin,
          organizations: [
            {
              id: mock.organizationId,
              name: mock.organizationName,
              slug: "demo-org",
              role: mock.role,
              planName: mock.planName,
            },
          ],
        },
      });
    }

    return NextResponse.json({
      success: true,
      context,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin,
        organizations: user.memberships.map((m: any) => ({
          id: m.organization.id,
          name: m.organization.name,
          slug: m.organization.slug,
          role: m.role,
          planName: m.organization.subscription?.plan?.name || "FREE",
        })),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unauthorized" }, { status: error.statusCode || 401 });
  }
}
