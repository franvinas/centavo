import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getSessionAuthUser,
  notFound,
  unauthorized,
} from "@/lib/api-utils";
import { approveCliAuthRequest } from "@/lib/cli-auth";
import { cliAuthRequestCodeSchema } from "@/lib/validations/cli-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const user = await getSessionAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = cliAuthRequestCodeSchema.safeParse(body);

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const authRequest = await approveCliAuthRequest(
      id,
      parsed.data.code,
      user.id,
    );
    if (!authRequest) return notFound("Auth request not found");

    return NextResponse.json({
      success: true,
      requestId: authRequest.id,
      userCode: authRequest.userCode,
      status: authRequest.status,
      expiresAt: authRequest.expiresAt.toISOString(),
      approvedAt: authRequest.approvedAt?.toISOString() ?? null,
    });
  } catch (error) {
    return badRequest(
      error instanceof Error ? error.message : "Unable to approve auth request",
    );
  }
}
