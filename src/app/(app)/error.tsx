"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <div className="bg-status-negative/10 mb-1 flex h-14 w-14 items-center justify-center rounded-2xl">
        <AlertTriangle className="text-status-negative h-6 w-6" />
      </div>
      <h2 className="text-text-primary text-xl font-semibold">
        {t("errorTitle")}
      </h2>
      <p className="text-text-secondary max-w-xs text-sm">
        {t("errorDescription")}
      </p>
      <Button
        onClick={reset}
        className="bg-accent-primary hover:bg-accent-hover mt-2 h-11 rounded-xl px-6 font-semibold text-white md:h-10"
      >
        {t("tryAgain")}
      </Button>
    </div>
  );
}
