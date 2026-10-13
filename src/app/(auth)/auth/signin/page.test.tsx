import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  userEvent,
  waitFor,
  within,
} from "@/test-utils/react-testing";
import SignInPage from "./page";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
  useSearchParams: () => mocks.params,
}));

vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mocks.signIn(...args),
}));

vi.mock("@/lib/actions/locale", () => ({
  updateLocale: vi.fn(),
}));

function mockVerificationResponse(url: string, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      redirected: true,
      url,
    }),
  );
}

async function requestCode(container: HTMLElement) {
  const scope = within(container);
  const user = userEvent.setup();

  await user.type(
    scope.getByPlaceholderText("Enter your email"),
    "test@example.com",
  );
  await user.click(scope.getByRole("button", { name: "Continue with Email" }));

  return { scope, user };
}

describe("SignInPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mocks.signIn.mockResolvedValue({ ok: true });
    mocks.params = new URLSearchParams();
  });

  it("shows an error and re-enables the OTP inputs for an invalid code", async () => {
    mockVerificationResponse(
      "http://localhost:3000/auth/signin?error=Verification",
    );
    const view = render(<SignInPage />);
    const { scope } = await requestCode(view.container);

    fireEvent.paste(scope.getByRole("textbox", { name: "Digit 1" }), {
      clipboardData: { getData: () => "000000" },
    });

    expect(
      await scope.findByRole("alert", {}, { timeout: 2000 }),
    ).toHaveTextContent("Invalid or expired code. Please try again.");
    expect(scope.getByRole("textbox", { name: "Digit 1" })).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
  });

  it("navigates to the callback URL after successful verification", async () => {
    mockVerificationResponse("http://localhost:3000/dashboard");
    const view = render(<SignInPage />);
    const { scope } = await requestCode(view.container);

    fireEvent.paste(scope.getByRole("textbox", { name: "Digit 1" }), {
      clipboardData: { getData: () => "123456" },
    });

    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"));
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("does not advance when requesting an email code fails", async () => {
    mocks.signIn.mockResolvedValue({ error: "EmailSignInError" });
    const view = render(<SignInPage />);
    const { scope } = await requestCode(view.container);

    expect(scope.getByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again.",
    );
    expect(
      scope.queryByRole("heading", { name: "Enter verification code" }),
    ).not.toBeInTheDocument();
  });
  it("allows another code after a failed verification", async () => {
    mockVerificationResponse(
      "http://localhost:3000/auth/signin?error=Verification",
    );
    const view = render(<SignInPage />);
    const { scope } = await requestCode(view.container);
    fireEvent.paste(scope.getByRole("textbox", { name: "Digit 1" }), {
      clipboardData: { getData: () => "000000" },
    });
    await scope.findByRole("alert");
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      url: "http://localhost:3000/dashboard",
    } as Response);
    fireEvent.paste(scope.getByRole("textbox", { name: "Digit 1" }), {
      clipboardData: { getData: () => "123456" },
    });
    await waitFor(() => expect(mocks.push).toHaveBeenCalledWith("/dashboard"));
    expect(scope.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("recovers from a verification network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
    const view = render(<SignInPage />);
    const { scope } = await requestCode(view.container);
    fireEvent.paste(scope.getByRole("textbox", { name: "Digit 1" }), {
      clipboardData: { getData: () => "123456" },
    });
    expect(await scope.findByRole("alert")).toHaveTextContent(
      "Something went wrong",
    );
    expect(scope.getByRole("textbox", { name: "Digit 1" })).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it("reenables Google sign-in after a provider error", async () => {
    mocks.signIn.mockRejectedValueOnce(new Error("Provider unavailable"));
    const view = render(<SignInPage />);
    const scope = within(view.container);
    await userEvent
      .setup()
      .click(scope.getByRole("button", { name: "Continue with Google" }));
    expect(await scope.findByRole("alert")).toHaveTextContent(
      "Something went wrong",
    );
    expect(
      scope.getByRole("button", { name: "Continue with Google" }),
    ).toBeEnabled();
  });
  it.each(["//external.example", "/\\external.example", "/\\["])(
    "does not redirect to unsafe callback %s",
    async (callback) => {
      mocks.params.set("callbackUrl", callback);
      mockVerificationResponse("http://localhost:3000/dashboard");
      const view = render(<SignInPage />);
      const { scope } = await requestCode(view.container);
      fireEvent.paste(scope.getByRole("textbox", { name: "Digit 1" }), {
        clipboardData: { getData: () => "123456" },
      });
      await waitFor(() =>
        expect(mocks.push).toHaveBeenCalledWith("/dashboard"),
      );
    },
  );
});
