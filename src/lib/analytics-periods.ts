import { todayInTimezone, parseDateOnly } from "@/lib/date-only";

export interface PeriodPreset {
  key: string;
  labelKey: string;
}

export const PERIOD_PRESETS: PeriodPreset[] = [
  { key: "this-month", labelKey: "periods.thisMonth" },
  { key: "last-3-months", labelKey: "periods.last3Months" },
  { key: "last-6-months", labelKey: "periods.last6Months" },
  { key: "last-12-months", labelKey: "periods.last12Months" },
  { key: "this-year", labelKey: "periods.thisYear" },
  { key: "custom", labelKey: "periods.customRange" },
];

export interface DateRange {
  from: Date;
  to: Date;
  label: string;
}

export function getDateRange(
  preset: string,
  customFrom?: string,
  customTo?: string,
  timezone = "UTC",
  locale = "en",
): DateRange {
  const today = todayInTimezone(timezone);
  const spanish = locale === "es";

  switch (preset) {
    case "this-month": {
      const from = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
      );
      return {
        from,
        to: today,
        label: today.toLocaleDateString(locale, {
          timeZone: "UTC",
          month: "long",
          year: "numeric",
        }),
      };
    }

    case "last-3-months": {
      const from = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 2, 1),
      );
      return {
        from,
        to: today,
        label: spanish ? "Últimos 3 meses" : "Last 3 Months",
      };
    }

    case "last-6-months": {
      const from = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1),
      );
      return {
        from,
        to: today,
        label: spanish ? "Últimos 6 meses" : "Last 6 Months",
      };
    }

    case "last-12-months": {
      const from = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 11, 1),
      );
      return {
        from,
        to: today,
        label: spanish ? "Últimos 12 meses" : "Last 12 Months",
      };
    }

    case "this-year": {
      const from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      return { from, to: today, label: `${today.getUTCFullYear()}` };
    }

    case "custom": {
      const from = parseDateOnly(customFrom);
      const to = parseDateOnly(customTo);
      if (from && to && from <= to) {
        return {
          from,
          to,
          label: `${from.toLocaleDateString(locale, {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
          })} – ${to.toLocaleDateString(locale, {
            timeZone: "UTC",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`,
        };
      }
      // Fallback to this month if custom dates are missing
      return getDateRange("this-month", undefined, undefined, timezone, locale);
    }

    default:
      return getDateRange("this-month", undefined, undefined, timezone, locale);
  }
}
