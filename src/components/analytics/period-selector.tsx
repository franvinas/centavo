"use client";

import { useTranslations } from "next-intl";
import { PERIOD_PRESETS } from "@/lib/analytics-periods";
import { DatePicker } from "@/components/ui/date-picker";
import { CalendarRange } from "lucide-react";

interface PeriodSelectorProps {
  period: string;
  customFrom: string;
  customTo: string;
  onPeriodChange: (period: string) => void;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  exclude?: string[];
}

export function PeriodSelector({
  period,
  customFrom,
  customTo,
  onPeriodChange,
  onCustomFromChange,
  onCustomToChange,
  exclude,
}: PeriodSelectorProps) {
  const t = useTranslations();
  const tAnalytics = useTranslations("analytics");
  const tExpenses = useTranslations("expenses");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <CalendarRange className="text-text-tertiary pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4" />
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          aria-label={tAnalytics("period")}
          className="select-native border-border-subtle bg-bg-surface text-text-primary hover:bg-bg-muted/50 focus-visible:border-ring focus-visible:ring-ring/50 h-10 rounded-xl border pl-9 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] md:h-9"
        >
          {PERIOD_PRESETS.filter((p) => !exclude?.includes(p.key)).map((p) => (
            <option key={p.key} value={p.key}>
              {t(p.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-2">
          <DatePicker
            value={customFrom}
            onChange={onCustomFromChange}
            placeholder={tExpenses("from")}
            ariaLabel={tExpenses("from")}
            className="border-border-subtle bg-bg-surface h-10 w-[150px] rounded-xl px-3 shadow-none md:h-9"
          />
          <span className="text-text-tertiary text-sm">–</span>
          <DatePicker
            value={customTo}
            onChange={onCustomToChange}
            placeholder={tExpenses("to")}
            ariaLabel={tExpenses("to")}
            className="border-border-subtle bg-bg-surface h-10 w-[150px] rounded-xl px-3 shadow-none md:h-9"
          />
        </div>
      )}
    </div>
  );
}
