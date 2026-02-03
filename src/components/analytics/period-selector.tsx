"use client";

import { useTranslations } from "next-intl";
import { PERIOD_PRESETS } from "@/lib/analytics-periods";
import { Input } from "@/components/ui/input";

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
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="text-text-secondary mb-1 block text-xs">
          {tAnalytics("period")}
        </label>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="border-input bg-bg-surface text-text-primary h-9 rounded-md border px-3 text-sm"
        >
          {PERIOD_PRESETS.filter((p) => !exclude?.includes(p.key)).map((p) => (
            <option key={p.key} value={p.key}>
              {t(p.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {period === "custom" && (
        <>
          <label className="grid gap-1">
            <span className="text-text-secondary text-xs">
              {tExpenses("from")}
            </span>
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className="w-36"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-text-secondary text-xs">
              {tExpenses("to")}
            </span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
              className="w-36"
            />
          </label>
        </>
      )}
    </div>
  );
}
