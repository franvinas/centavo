import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, userEvent, within } from "@/test-utils/react-testing";
import { OnboardingForm } from "./onboarding-form";

const mockCompleteOnboarding = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/actions/onboarding", () => ({
  completeOnboarding: (...args: unknown[]) => mockCompleteOnboarding(...args),
}));

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates visible copy when the language selector changes", async () => {
    const user = userEvent.setup();

    const view = render(<OnboardingForm initialLocale="en" />);
    const scope = within(view.container);

    expect(scope.getByText("Let's set up your account")).toBeInTheDocument();

    await user.click(scope.getByRole("button", { name: "Español" }));

    expect(
      scope.getByText(
        "Usaremos este idioma para tu cuenta y categorías iniciales",
      ),
    ).toBeInTheDocument();
    expect(scope.getByRole("button", { name: "Comenzar" })).toBeInTheDocument();
  });

  it("submits the selected locale", async () => {
    const user = userEvent.setup();

    const view = render(<OnboardingForm initialLocale="en" />);
    const scope = within(view.container);

    await user.type(scope.getByPlaceholderText("Your name"), "Fran");
    await user.click(scope.getByRole("button", { name: "Español" }));
    await user.click(scope.getByRole("button", { name: "Comenzar" }));

    expect(mockCompleteOnboarding).toHaveBeenCalledWith({
      name: "Fran",
      baseCurrency: "USD",
      locale: "es",
    });
  });
});
