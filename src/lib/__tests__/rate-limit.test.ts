import { beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import {
  consumeRateLimit,
  limitRequest,
  cleanupExpiredAuthRecords,
} from "@/lib/rate-limit";
beforeEach(() => resetPrismaMock());
describe("persistent rate limiting", () => {
  it("allows requests within the limit without storing the identity", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 1, retryAfter: 60 }]);
    expect(
      (await consumeRateLimit("email:private@example.test", 3, 60)).allowed,
    ).toBe(true);
    expect(JSON.stringify(prismaMock.$queryRaw.mock.calls)).not.toContain(
      "private@example.test",
    );
  });
  it("returns 429 and a retry delay after the shared counter exceeds its limit", async () => {
    prismaMock.$queryRaw.mockResolvedValue([{ count: 4, retryAfter: 55 }]);
    const result = await limitRequest(
      new NextRequest("http://localhost"),
      "otp",
      3,
      60,
    );
    expect(result?.status).toBe(429);
    expect(result?.headers.get("Retry-After")).toBe("55");
  });
  it("fails closed if the shared database cannot enforce the limit", async () => {
    prismaMock.$queryRaw.mockRejectedValue(new Error("database unavailable"));
    expect(
      (await limitRequest(new NextRequest("http://localhost"), "otp", 3, 60))
        ?.status,
    ).toBe(503);
  });
  it("only removes expired authentication records", async () => {
    await cleanupExpiredAuthRecords();
    expect(prismaMock.cliAuthRequest.deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lt: expect.any(Date) } },
    });
    expect(prismaMock.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { expires: { lt: expect.any(Date) } },
    });
    expect(prismaMock.cliToken.deleteMany).not.toHaveBeenCalled();
  });
});
