import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const hashed = createHash("sha256").update(key).digest("hex");
  // A single atomic PostgreSQL statement works across serverless instances.
  const rows = await prisma.$queryRaw<
    Array<{ count: number; retryAfter: number }>
  >`
    INSERT INTO rate_limits (key, count, expires_at)
    VALUES (${hashed}, 1, NOW() + ${windowSeconds} * INTERVAL '1 second')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.expires_at <= NOW() THEN 1 ELSE rate_limits.count + 1 END,
      expires_at = CASE WHEN rate_limits.expires_at <= NOW() THEN NOW() + ${windowSeconds} * INTERVAL '1 second' ELSE rate_limits.expires_at END
    RETURNING count, GREATEST(1, CEIL(EXTRACT(EPOCH FROM expires_at - NOW())))::int AS "retryAfter"
  `;
  return { allowed: rows[0].count <= limit, retryAfter: rows[0].retryAfter };
}
export function requestIp(request: Request) {
  const trusted = request.headers.get("x-vercel-forwarded-for");
  return (
    trusted?.split(",")[0]?.trim() ||
    (process.env.VERCEL
      ? "unknown"
      : request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()) ||
    "unknown"
  );
}
export async function limitRequest(
  request: Request,
  scope: string,
  limit: number,
  seconds: number,
  identity?: string,
) {
  try {
    const result = await consumeRateLimit(
      `${scope}:${identity ?? requestIp(request)}`,
      limit,
      seconds,
    );
    if (!result.allowed)
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfter),
            "Cache-Control": "no-store",
          },
        },
      );
    return null;
  } catch (error) {
    console.error("Rate limit unavailable", error);
    return NextResponse.json(
      { error: "Please try again later." },
      {
        status: 503,
        headers: { "Retry-After": "30", "Cache-Control": "no-store" },
      },
    );
  }
}
export async function cleanupExpiredAuthRecords() {
  // Only expired requests/tokens are removed; active credentials are untouched.
  await prisma.$executeRaw`DELETE FROM rate_limits WHERE expires_at < NOW() - INTERVAL '1 day'`;
  await prisma.cliAuthRequest.deleteMany({
    where: { expiresAt: { lt: new Date(Date.now() - 86400000) } },
  });
  await prisma.verificationToken.deleteMany({
    where: { expires: { lt: new Date() } },
  });
}
