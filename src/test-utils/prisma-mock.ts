import { vi } from "vitest";
import { mockDeep, mockReset, type DeepMockProxy } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma/client";

export const prismaMock = mockDeep<PrismaClient>();

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
  getPrisma: () => prismaMock,
}));

export function resetPrismaMock() {
  mockReset(prismaMock);
}

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
