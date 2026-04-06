import { describe, it, expect, beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";

const { redirectMock, cookiesMock, cookieSetMock } = vi.hoisted(() => {
  const cookieSetMock = vi.fn();
  return {
    redirectMock: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    }),
    cookiesMock: vi.fn(async () => ({
      set: cookieSetMock,
    })),
    cookieSetMock,
  };
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/default-categories", () => ({
  getDefaultCategories: vi.fn(async (locale: string) => [
    {
      name: locale === "es" ? "Comida y Restaurantes" : "Food & Dining",
      color: "#E67E22",
      icon: "UtensilsCrossed",
    },
  ]),
}));

import { getDefaultCategories } from "@/lib/default-categories";
import { completeOnboarding } from "./onboarding";

describe("completeOnboarding", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.clearAllMocks();
  });

  it("throws when unauthenticated", async () => {
    mockUnauthenticated();

    await expect(
      completeOnboarding({
        name: "Fran",
        baseCurrency: "USD",
        locale: "en",
      }),
    ).rejects.toThrow("Not authenticated");
  });

  it("persists the selected locale and seeds categories in that language", async () => {
    mockAuth();
    prismaMock.user.update.mockResolvedValue({} as never);
    prismaMock.category.count.mockResolvedValue(0 as never);
    prismaMock.category.createMany.mockResolvedValue({ count: 1 } as never);

    await expect(
      completeOnboarding({
        name: "Fran",
        baseCurrency: "ARS",
        locale: "es",
      }),
    ).rejects.toThrow("redirect:/dashboard");

    expect(cookieSetMock).toHaveBeenCalledWith("NEXT_LOCALE", "es", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        name: "Fran",
        baseCurrency: "ARS",
        locale: "es",
      },
    });
    expect(getDefaultCategories).toHaveBeenCalledWith("es");
    expect(prismaMock.category.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId: "user-1",
          name: "Comida y Restaurantes",
          color: "#E67E22",
          icon: "UtensilsCrossed",
        },
      ],
    });
  });

  it("does not reseed categories when they already exist", async () => {
    mockAuth();
    prismaMock.user.update.mockResolvedValue({} as never);
    prismaMock.category.count.mockResolvedValue(2 as never);

    await expect(
      completeOnboarding({
        name: "Fran",
        baseCurrency: "USD",
        locale: "en",
      }),
    ).rejects.toThrow("redirect:/dashboard");

    expect(getDefaultCategories).not.toHaveBeenCalled();
    expect(prismaMock.category.createMany).not.toHaveBeenCalled();
  });
});
