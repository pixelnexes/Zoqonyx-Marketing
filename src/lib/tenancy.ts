import crypto from "crypto";
import { prisma } from "./prisma";
import { getSession, SessionPayload } from "./auth";
import { Role } from "@prisma/client";
import { MOCK_USERS } from "./mock-store";

export interface TenantContext {
  userId: string;
  userEmail: string;
  userName: string;
  organizationId: string;
  organizationName: string;
  role: Role;
  planName: string;
  isSuperAdmin: boolean;
  isApiKeyAuth?: boolean;
}

export class AuthorizationError extends Error {
  statusCode: number;
  constructor(message = "Unauthorized access", statusCode = 401) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = statusCode;
  }
}

/**
 * Hashes an API key string for secure lookup.
 */
export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Generates a new cryptographically random API Key.
 * Format: zoq_live_<32 random hex chars>
 */
export function generateApiKey(): { key: string; keyPrefix: string; keyHash: string } {
  const rawHex = crypto.randomBytes(16).toString("hex");
  const key = `zoq_live_${rawHex}`;
  const keyPrefix = key.substring(0, 12);
  const keyHash = hashApiKey(key);
  return { key, keyPrefix, keyHash };
}

/**
 * Resolves the authenticated TenantContext from either Session Cookie, Bearer JWT, or Bearer API Key.
 */
export async function getTenantContext(
  req: Request,
  explicitOrgId?: string
): Promise<TenantContext> {
  const authHeader = req.headers.get("Authorization");

  // Check for Public API Key authentication (zoq_live_...)
  if (authHeader && authHeader.startsWith("Bearer zoq_live_")) {
    const rawApiKey = authHeader.substring(7).trim();
    const keyHash = hashApiKey(rawApiKey);

    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        organization: {
          include: {
            subscription: {
              include: { plan: true },
            },
            members: {
              take: 1,
              include: { user: true },
            },
          },
        },
      },
    });

    if (!apiKeyRecord || (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date())) {
      throw new AuthorizationError("Invalid or expired API Key", 401);
    }

    // Update last used timestamp asynchronously
    prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {});

    const org = apiKeyRecord.organization;
    const firstMember = org.members[0];

    return {
      userId: firstMember?.userId || "system-api-user",
      userEmail: firstMember?.user?.email || "api@zoqonyx.internal",
      userName: firstMember?.user?.name || "API Ingestion Agent",
      organizationId: org.id,
      organizationName: org.name,
      role: Role.OWNER,
      planName: org.subscription?.plan?.name || "FREE",
      isSuperAdmin: false,
      isApiKeyAuth: true,
    };
  }

  // Otherwise, resolve via standard session cookie or Bearer JWT token
  const session: SessionPayload | null = await getSession(req);
  if (!session) {
    throw new AuthorizationError("Authentication required", 401);
  }

  // Determine target organizationId
  const targetOrgId =
    explicitOrgId ||
    req.headers.get("X-Zoqonyx-Organization") ||
    session.defaultOrgId;

  // Fetch membership
  let membership: any = null;
  try {
    membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.userId,
        ...(targetOrgId ? { organizationId: targetOrgId } : {}),
      },
      include: {
        organization: {
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        },
      },
    });
  } catch (dbErr: any) {
    console.warn("Database offline during tenancy lookup, using mock context");
  }

  if (!membership) {
    // Check mock user fallback
    const mockUser = (MOCK_USERS as Record<string, any>)[session.email];
    if (mockUser) {
      return {
        userId: session.userId,
        userEmail: session.email,
        userName: session.name,
        organizationId: mockUser.organizationId,
        organizationName: mockUser.organizationName,
        role: mockUser.role,
        planName: mockUser.planName,
        isSuperAdmin: mockUser.isSuperAdmin || session.isSuperAdmin,
        isApiKeyAuth: false,
      };
    }

    // If super admin and no organization exists, allow platform admin context
    if (session.isSuperAdmin) {
      return {
        userId: session.userId,
        userEmail: session.email,
        userName: session.name,
        organizationId: "super-admin-global",
        organizationName: "Platform Administration",
        role: Role.OWNER,
        planName: "ENTERPRISE",
        isSuperAdmin: true,
      };
    }
    throw new AuthorizationError("No organization membership found for this user", 403);
  }

  return {
    userId: session.userId,
    userEmail: session.email,
    userName: session.name,
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    role: membership.role,
    planName: membership.organization.subscription?.plan?.name || "FREE",
    isSuperAdmin: session.isSuperAdmin,
    isApiKeyAuth: false,
  };
}

/**
 * Validates whether the user's role meets the required hierarchy.
 */
export function requireRole(
  context: TenantContext,
  allowedRoles: Role[]
): void {
  if (context.isSuperAdmin) return;
  if (!allowedRoles.includes(context.role)) {
    throw new AuthorizationError(
      `Insufficient permissions. Required one of: ${allowedRoles.join(", ")}`,
      403
    );
  }
}
