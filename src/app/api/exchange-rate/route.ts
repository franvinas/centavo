import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { getExchangeRate } from "@/lib/exchange-rate";

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return badRequest("Both 'from' and 'to' query parameters are required");
  }

  const rate = await getExchangeRate(from, to);

  return NextResponse.json({
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    rate,
    timestamp: new Date().toISOString(),
  });
}
