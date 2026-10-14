import { prisma } from "@/lib/db";
import { getDateRange } from "@/lib/analytics-periods";
import { analyticsQuerySchema } from "@/lib/validations/analytics";
import { badRequest } from "@/lib/api-utils";

export function parseAnalyticsQuery(
  searchParams: URLSearchParams,
  defaultPeriod: string,
  timezone = "UTC",
  locale = "en",
):
  | {
      error: ReturnType<typeof badRequest>;
    }
  | {
      period: string;
      from: Date;
      to: Date;
      label: string;
    } {
  const parsed = analyticsQuerySchema.safeParse({
    period: searchParams.get("period") ?? defaultPeriod,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  });

  if (!parsed.success) {
    return {
      error: badRequest(parsed.error.issues[0]?.message ?? "Invalid input"),
    };
  }

  const period = parsed.data.period ?? defaultPeriod;
  const { from, to, label } = getDateRange(
    period,
    parsed.data.from,
    parsed.data.to,
    timezone,
    locale,
  );

  return {
    period,
    from,
    to,
    label,
  };
}

export async function getUserBaseCurrency(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { baseCurrency: true },
  });

  return user?.baseCurrency ?? "USD";
}

export async function getAnalyticsPreferences(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, locale: true },
  });
  return { timezone: user?.timezone ?? "UTC", locale: user?.locale ?? "en" };
}
