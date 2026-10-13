"use client";

import { useTranslations } from "next-intl";

export function ConversionNotice({ count }: { count: number }) {
  const t = useTranslations("expenses");
  if (!count) return null;
  return (
    <p role="status" className="text-status-negative mt-2 text-sm">
      {t("pendingConversions", { count })}
    </p>
  );
}
