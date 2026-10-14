import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/api-utils";
import { getAnalyticsSummary } from "@/lib/data/analytics";
import {
  getAnalyticsPreferences,
  getUserBaseCurrency,
  parseAnalyticsQuery,
} from "../_lib";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const preferences = await getAnalyticsPreferences(user.id);
  const parsed = parseAnalyticsQuery(
    request.nextUrl.searchParams,
    "this-month",
    preferences.timezone,
    preferences.locale,
  );
  if ("error" in parsed) return parsed.error;

  const [summary, baseCurrency] = await Promise.all([
    getAnalyticsSummary({
      userId: user.id,
      from: parsed.from,
      to: parsed.to,
    }),
    getUserBaseCurrency(user.id),
  ]);

  return NextResponse.json({
    summary,
    baseCurrency,
    period: parsed.period,
    periodLabel: parsed.label,
    from: parsed.from.toISOString(),
    to: parsed.to.toISOString(),
  });
}
