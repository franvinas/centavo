import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@/test-utils/react-testing";

const { redirectMock, getCurrentUserMock, hasAnyCategoriesMock } = vi.hoisted(
  () => ({
    redirectMock: vi.fn((path: string) => {
      throw new Error(`redirect:${path}`);
    }),
    getCurrentUserMock: vi.fn(),
    hasAnyCategoriesMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/data/user", () => ({
  getCurrentUser: getCurrentUserMock,
}));

vi.mock("@/lib/data/onboarding", () => ({
  hasAnyCategories: hasAnyCategoriesMock,
}));

vi.mock("./onboarding-form", () => ({
  OnboardingForm: ({
    initialName,
    initialCurrency,
    initialLocale,
  }: {
    initialName?: string;
    initialCurrency?: string;
    initialLocale?: string;
  }) => (
    <div
      data-testid="onboarding-form"
      data-name={initialName ?? ""}
      data-currency={initialCurrency ?? ""}
      data-locale={initialLocale ?? ""}
    />
  ),
}));

import OnboardingPage from "./page";

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows onboarding for a Google user without categories", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      name: "Google User",
      baseCurrency: "EUR",
      locale: "es",
    });
    hasAnyCategoriesMock.mockResolvedValue(false);

    render(await OnboardingPage());

    expect(screen.getByTestId("onboarding-form")).toHaveAttribute(
      "data-name",
      "Google User",
    );
    expect(screen.getByTestId("onboarding-form")).toHaveAttribute(
      "data-currency",
      "EUR",
    );
    expect(screen.getByTestId("onboarding-form")).toHaveAttribute(
      "data-locale",
      "es",
    );
  });

  it("redirects completed users to the dashboard", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      name: "Google User",
      baseCurrency: "USD",
      locale: "en",
    });
    hasAnyCategoriesMock.mockResolvedValue(true);

    await expect(OnboardingPage()).rejects.toThrowError("redirect:/dashboard");
  });
});
