import { NextRequest, NextResponse } from "next/server";
import {
  CLI_AUTH_POLL_INTERVAL_SECONDS,
  createCliAuthRequest,
} from "@/lib/cli-auth";
import { badRequest } from "@/lib/api-utils";
import { createCliAuthRequestSchema } from "@/lib/validations/cli-auth";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = createCliAuthRequestSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const authRequest = await createCliAuthRequest();
  const verificationUri = `${request.nextUrl.origin}/cli/auth`;

  return NextResponse.json(
    {
      requestId: authRequest.id,
      code: authRequest.code,
      userCode: authRequest.userCode,
      verificationUri,
      verificationUriComplete: `${verificationUri}?requestId=${encodeURIComponent(authRequest.id)}&code=${encodeURIComponent(authRequest.code)}`,
      expiresAt: authRequest.expiresAt.toISOString(),
      interval: CLI_AUTH_POLL_INTERVAL_SECONDS,
    },
    { status: 201 },
  );
}
