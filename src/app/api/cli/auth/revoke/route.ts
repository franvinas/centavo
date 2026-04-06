import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { revokeCliTokenById } from "@/lib/cli-auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  if (user.authType !== "cli" || !user.cliTokenId) {
    return badRequest("CLI token authentication required");
  }

  await revokeCliTokenById(user.cliTokenId);

  return NextResponse.json({ success: true });
}
