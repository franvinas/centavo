import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/api-utils";
import { listTagsWithTotalsForUser } from "@/lib/services/tags";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const tags = await listTagsWithTotalsForUser(user.id);
  return NextResponse.json({ tags });
}
