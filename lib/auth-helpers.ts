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
  return session?.user?.id ?? null;
}

async function userExists(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  return Boolean(user);
}

export async function requireApiAuth(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.sub && (await userExists(payload.sub as string))) {
        return { userId: payload.sub as string };
      }
      return null;
    } catch {
      return null;
    }
  }

  const session = await auth();
  // Guard against stale JWT sessions pointing to a user that no longer exists
  // (e.g. after a database reset). This forces a clean re-login instead of a
  // foreign-key 500 on the first write.
  if (session?.user?.id && (await userExists(session.user.id))) {
    return { userId: session.user.id };
  }
  return null;
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
