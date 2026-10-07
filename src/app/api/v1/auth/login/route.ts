import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, signSessionToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { MOCK_USERS } from "@/lib/mock-store";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const cleanEmail = String(email).toLowerCase().trim();

    let user: any = null;
    let valid = false;
    let defaultOrgId: string | undefined = undefined;

    try {
      user = await prisma.user.findUnique({
        where: { email: cleanEmail },
        include: {
          memberships: {
            take: 1,
            include: { organization: true },
          },
        },
      });

      if (user) {
        valid = await comparePassword(password, user.passwordHash);
        defaultOrgId = user.memberships[0]?.organizationId;
      }
    } catch (dbErr: any) {
      console.warn("Database offline, checking mock user registry:", dbErr.message);
    }

    // Graceful fallback for demo accounts if DB is offline or user not found in local db
    if (!user || !valid) {
      const mockUser = MOCK_USERS[cleanEmail];
      if (mockUser) {
        user = {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          isSuperAdmin: mockUser.isSuperAdmin,
        };
        defaultOrgId = mockUser.organizationId;
        valid = true; // allow instant access for seeded role testing
      }
    }

    if (!user || !valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
      defaultOrgId,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isSuperAdmin: user.isSuperAdmin,
        defaultOrgId,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Login failed" }, { status: 500 });
  }
}
