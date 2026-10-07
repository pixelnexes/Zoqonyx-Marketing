import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { Role, OrgStatus, SubscriptionStatus, BillingInterval } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { name, orgName, email, password } = await req.json();

    if (!name || !orgName || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const slugBase = orgName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const slug = `${slugBase}-${Math.random().toString(36).substring(2, 6)}`;

    // Create User, Organization, Membership, and Free Plan Subscription transactionally
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: cleanEmail,
          passwordHash,
          isEmailVerified: true,
        },
      });

      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          status: OrgStatus.ACTIVE,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: Role.OWNER,
        },
      });

      const freePlan = await tx.plan.findUnique({ where: { name: "FREE" } });
      if (freePlan) {
        await tx.subscription.create({
          data: {
            organizationId: org.id,
            planId: freePlan.id,
            status: SubscriptionStatus.ACTIVE,
            billingInterval: BillingInterval.MONTHLY,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isTestMode: true,
          },
        });
      }

      return { user, org };
    });

    const token = signSessionToken({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      isSuperAdmin: false,
      defaultOrgId: result.org.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        defaultOrgId: result.org.id,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}
