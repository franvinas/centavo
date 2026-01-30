import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { createPrismaUser } from "@/test-utils/factories";
import { getCurrentUser } from "../user";

beforeEach(() => {
  resetPrismaMock();
});

describe("getCurrentUser", () => {
  it("returns user from authenticated session", async () => {
    mockAuth("user-1");
    const user = createPrismaUser();
    prismaMock.user.findUnique.mockResolvedValue(user as never);

    const result = await getCurrentUser();

    expect(result).toEqual(user);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
  });

  it("falls back to first user in development", async () => {
    mockUnauthenticated();
    const originalEnv = process.env.NODE_ENV;
    vi.stubEnv("NODE_ENV", "development");

    const user = createPrismaUser();
    prismaMock.user.findFirst.mockResolvedValue(user as never);

    const result = await getCurrentUser();

    expect(result).toEqual(user);
    expect(prismaMock.user.findFirst).toHaveBeenCalledWith({
      orderBy: { createdAt: "asc" },
    });

    vi.stubEnv("NODE_ENV", originalEnv!);
  });

  it("returns null when unauthenticated in production", async () => {
    mockUnauthenticated();
    vi.stubEnv("NODE_ENV", "production");

    const result = await getCurrentUser();

    expect(result).toBeNull();

    vi.stubEnv("NODE_ENV", "test");
  });
});
