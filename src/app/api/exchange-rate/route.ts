import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";
import { getExchangeRate } from "@/lib/exchange-rate";
import { z } from "zod/v4";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date =
    searchParams.get("date") ?? new Date().toISOString().slice(0, 10);

  if (!from || !to) {
    return badRequest("Both 'from' and 'to' query parameters are required");
  }

  if (!z.string().date().safeParse(date).success)
    return badRequest("Invalid date");
  let rate: number;
  try {
    rate = await getExchangeRate(from, to, date);
  } catch {
    return NextResponse.json(
      { from, to, date, rate: null, conversionPending: true },
      { status: 200 },
    );
  }

  return NextResponse.json({
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    rate,
    date,
    conversionPending: false,
    timestamp: new Date().toISOString(),
  });
}
