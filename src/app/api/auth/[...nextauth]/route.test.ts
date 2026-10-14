import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { GET, POST } from "./route";
import { handlers } from "@/lib/auth";
import { limitRequest, cleanupExpiredAuthRecords } from "@/lib/rate-limit";
vi.mock("@/lib/auth", () => ({
  handlers: {
    GET: vi.fn().mockResolvedValue(new Response("auth")),
    POST: vi.fn().mockResolvedValue(new Response("auth")),
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  limitRequest: vi.fn().mockResolvedValue(null),
  cleanupExpiredAuthRecords: vi.fn().mockResolvedValue(undefined),
}));
beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());
describe("authentication abuse boundaries", () => {
  it("limits email requests by IP and normalized email before sending", async () => {
    await POST(
      new NextRequest("http://localhost/api/auth/signin/resend", {
        method: "POST",
        body: new URLSearchParams({ email: "Person@Example.test" }),
      }),
    );
    expect(limitRequest).toHaveBeenCalledWith(
      expect.anything(),
      "otp-send-ip",
      20,
      600,
    );
    expect(limitRequest).toHaveBeenCalledWith(
      expect.anything(),
      "otp-send-email",
      3,
      600,
      "person@example.test",
    );
    expect(cleanupExpiredAuthRecords).toHaveBeenCalled();
    expect(handlers.POST).toHaveBeenCalled();
  });
  it("never sends mail once throttled", async () => {
    vi.mocked(limitRequest).mockResolvedValueOnce(
      NextResponse.json({ error: "Too many requests" }, { status: 429 }),
    );
    expect(
      (
        await POST(
          new NextRequest("http://localhost/api/auth/signin/resend", {
            method: "POST",
            body: new URLSearchParams({ email: "person@example.test" }),
          }),
        )
      ).status,
    ).toBe(429);
    expect(handlers.POST).not.toHaveBeenCalled();
  });
  it("limits OTP guesses before consulting verification tokens", async () => {
    vi.mocked(limitRequest)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
      );
    expect(
      (
        await GET(
          new NextRequest(
            "http://localhost/api/auth/callback/resend?email=person@example.test&token=000000",
          ),
        )
      ).status,
    ).toBe(429);
    expect(handlers.GET).not.toHaveBeenCalled();
  });
  it("does not throttle session discovery or Google callbacks as OTP guesses", async () => {
    await GET(new NextRequest("http://localhost/api/auth/session"));
    await GET(new NextRequest("http://localhost/api/auth/callback/google"));
    expect(limitRequest).not.toHaveBeenCalled();
    expect(handlers.GET).toHaveBeenCalledTimes(2);
  });
});
