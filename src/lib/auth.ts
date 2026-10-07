import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.SESSION_SECRET || "zoqonyx_dev_session_jwt_secret_2026";
export const AUTH_COOKIE_NAME = "zoqonyx_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
  defaultOrgId?: string;
}

/**
 * Hashes a plaintext password using bcrypt with salt factor 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Compares a candidate password with a stored hash.
 */
export async function comparePassword(candidate: string, hash: string): Promise<boolean> {
  return bcrypt.compare(candidate, hash);
}

/**
 * Issues a signed JWT session token.
 */
export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verifies a JWT token.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Extracts session payload from Next.js server cookies or Bearer Authorization header.
 */
export async function getSession(req?: Request): Promise<SessionPayload | null> {
  // Check Authorization header first
  if (req) {
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      const payload = verifySessionToken(token);
      if (payload) return payload;
    }
  }

  // Fallback to cookie
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Resolves full user record and active organization memberships.
 */
export async function getCurrentUserWithOrgs(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              subscription: {
                include: {
                  plan: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
