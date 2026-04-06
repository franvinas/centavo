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

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({
    children,
    user,
  }: {
    children: React.ReactNode;
    user: { name: string; email: string } | null;
  }) => (
    <div>
      <div data-testid="app-shell-user">{user?.name ?? "guest"}</div>
      {children}
    </div>
  ),
}));

vi.mock("@/components/timezone-detector", () => ({
  TimezoneDetector: ({
    currentTimezone,
  }: {
    currentTimezone: string | null;
  }) => <div data-testid="timezone-detector">{currentTimezone ?? "none"}</div>,
}));

import AppLayout from "../layout";

describe("AppLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to onboarding when the user has no categories", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      name: "Google User",
      email: "google@example.com",
      timezone: null,
    });
    hasAnyCategoriesMock.mockResolvedValue(false);

    await expect(
      AppLayout({ children: <div>Child</div> }),
    ).rejects.toThrowError("redirect:/onboarding");
  });

  it("renders the app when onboarding is complete", async () => {
    getCurrentUserMock.mockResolvedValue({
      id: "user-1",
      name: "Google User",
      email: "google@example.com",
      timezone: "America/Argentina/Buenos_Aires",
    });
    hasAnyCategoriesMock.mockResolvedValue(true);

    render(await AppLayout({ children: <div>Child</div> }));

    expect(screen.getByText("Child")).toBeInTheDocument();
    expect(screen.getByTestId("app-shell-user")).toHaveTextContent(
      "Google User",
    );
    expect(screen.getByTestId("timezone-detector")).toHaveTextContent(
      "America/Argentina/Buenos_Aires",
    );
  });
});
