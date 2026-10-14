import { NextRequest } from "next/server";
import { handlers } from "@/lib/auth";
import { cleanupExpiredAuthRecords, limitRequest } from "@/lib/rate-limit";

async function protect(request: NextRequest) {
  const action = request.nextUrl.pathname;
  const sending =
    action.endsWith("/signin/resend") && request.method === "POST";
  const verifying = action.endsWith("/callback/resend");
  if (!sending && !verifying) return null;
  const ipLimit = await limitRequest(
    request,
    sending ? "otp-send-ip" : "otp-verify-ip",
    sending ? 20 : 60,
    600,
  );
  if (ipLimit) return ipLimit;
  let email = request.nextUrl.searchParams.get("email");
  if (request.method === "POST") {
    const type = request.headers.get("content-type") ?? "";
    const body = type.includes("application/json")
      ? await request
          .clone()
          .json()
          .catch(() => ({}))
      : Object.fromEntries(
          await request
            .clone()
            .formData()
            .catch(() => new FormData()),
        );
    email = typeof body.email === "string" ? body.email : email;
  }
  if (email) {
    const emailLimit = await limitRequest(
      request,
      sending ? "otp-send-email" : "otp-verify-email",
      sending ? 3 : 10,
      600,
      email.trim().toLowerCase().slice(0, 320),
    );
    if (emailLimit) return emailLimit;
  }
  if (sending) await cleanupExpiredAuthRecords();
  return null;
}
export async function GET(request: NextRequest) {
  return (await protect(request)) ?? handlers.GET(request);
}
export async function POST(request: NextRequest) {
  return (await protect(request)) ?? handlers.POST(request);
}
