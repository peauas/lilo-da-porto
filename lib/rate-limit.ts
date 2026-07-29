import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type RateLimitResult = { success: boolean; remaining: number };

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// One Ratelimit instance per (limit, window) pair, reused across requests.
const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  const cached = limiters.get(cacheKey);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: false,
    prefix: "ratelimit",
  });
  limiters.set(cacheKey, limiter);
  return limiter;
}

// Fallback used only when Upstash isn't configured (e.g. local dev). Not safe
// for production: each serverless instance has its own memory, so it does not
// enforce a real limit across a multi-instance deployment.
type MemoryEntry = { count: number; resetAt: number };
const memoryStore = new Map<string, MemoryEntry>();

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt < now) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}

let warnedNoRedis = false;

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  if (!redis) {
    if (process.env.NODE_ENV === "production" && !warnedNoRedis) {
      warnedNoRedis = true;
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN not set — falling back to a per-instance " +
          "in-memory limiter, which does not protect a multi-instance deployment.",
      );
    }
    return memoryRateLimit(key, limit, windowMs);
  }

  const { success, remaining } = await getLimiter(limit, windowMs).limit(key);
  return { success, remaining };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
