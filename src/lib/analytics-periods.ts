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
): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "this-month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        from,
        to: today,
        label: today.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
      };
    }

    case "last-3-months": {
      const from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
      return { from, to: today, label: "Last 3 Months" };
    }

    case "last-6-months": {
      const from = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      return { from, to: today, label: "Last 6 Months" };
    }

    case "last-12-months": {
      const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
      return { from, to: today, label: "Last 12 Months" };
    }

    case "this-year": {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from, to: today, label: `${today.getFullYear()}` };
    }

    case "custom": {
      if (customFrom && customTo) {
        const from = new Date(customFrom + "T00:00:00");
        const to = new Date(customTo + "T00:00:00");
        return {
          from,
          to,
          label: `${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
        };
      }
      // Fallback to this month if custom dates are missing
      return getDateRange("this-month");
    }

    default:
      return getDateRange("this-month");
  }
}
