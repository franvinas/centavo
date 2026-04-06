import { NextRequest, NextResponse } from "next/server";
import { getCliAuthRequest } from "@/lib/cli-auth";
import { badRequest, notFound } from "@/lib/api-utils";
import { cliAuthRequestCodeSchema } from "@/lib/validations/cli-auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const parsed = cliAuthRequestCodeSchema.safeParse({
    code: request.nextUrl.searchParams.get("code") ?? "",
  });

  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const authRequest = await getCliAuthRequest(id, parsed.data.code);
  if (!authRequest) return notFound("Auth request not found");

  return NextResponse.json({
    requestId: authRequest.id,
    userCode: authRequest.userCode,
    status: authRequest.status,
    expiresAt: authRequest.expiresAt.toISOString(),
    approvedAt: authRequest.approvedAt?.toISOString() ?? null,
    consumedAt: authRequest.consumedAt?.toISOString() ?? null,
  });
}
