import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-response";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-secret-change-me-in-production",
);

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function getAuthUserId(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await getUserSecurityInfo(session.user.id);
  if (!user) return null;
  if (isIssuedBeforePasswordChange(session.iat, user.passwordChangedAt)) return null;

  return user.id;
}

async function getUserSecurityInfo(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordChangedAt: true },
  });
}

// A token/session issued before the account's password was last changed is
// stale: it must be rejected so a stolen cookie or bearer token doesn't
// survive a password reset.
function isIssuedBeforePasswordChange(
  issuedAtSeconds: number | undefined,
  passwordChangedAt: Date,
): boolean {
  if (!issuedAtSeconds) return false;
  return issuedAtSeconds * 1000 < passwordChangedAt.getTime();
}

export async function requireApiAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (!payload.sub) return null;

      const user = await getUserSecurityInfo(payload.sub as string);
      if (!user) return null;
      if (isIssuedBeforePasswordChange(payload.iat, user.passwordChangedAt)) return null;

      return { userId: user.id };
    } catch {
      return null;
    }
  }

  const session = await auth();
  if (!session?.user?.id) return null;

  // Guard against stale sessions pointing to a user that no longer exists
  // (e.g. after a database reset), and against sessions issued before the
  // account's password was last changed/reset.
  const user = await getUserSecurityInfo(session.user.id);
  if (!user) return null;
  if (isIssuedBeforePasswordChange(session.iat, user.passwordChangedAt)) return null;

  return { userId: user.id };
}

export async function createExtensionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function checkRateLimit(
  request: Request,
  key: string,
  limit: number,
  windowMs: number,
) {
  const ip = getClientIp(request);
  const result = await rateLimit(`${key}:${ip}`, limit, windowMs);
  if (!result.success) {
    return apiError("RATE_LIMIT", "Muitas requisições. Tente novamente.", 429);
  }
  return null;
}

export async function getRequestIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
