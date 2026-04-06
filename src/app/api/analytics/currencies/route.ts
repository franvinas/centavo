import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/api-utils";
import { getSpendingByCurrency } from "@/lib/data/analytics";
import { getUserBaseCurrency, parseAnalyticsQuery } from "../_lib";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const parsed = parseAnalyticsQuery(
    request.nextUrl.searchParams,
    "this-month",
  );
  if ("error" in parsed) return parsed.error;

  const [items, baseCurrency] = await Promise.all([
    getSpendingByCurrency({
      userId: user.id,
      from: parsed.from,
      to: parsed.to,
    }),
    getUserBaseCurrency(user.id),
  ]);

  return NextResponse.json({
    items,
    baseCurrency,
    period: parsed.period,
    periodLabel: parsed.label,
    from: parsed.from.toISOString(),
    to: parsed.to.toISOString(),
  });
}
