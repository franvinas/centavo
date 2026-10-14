"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <h2 className="text-text-primary text-xl font-semibold">
        {t("errorTitle")}
      </h2>
      <p className="text-text-secondary text-sm">{t("errorDescription")}</p>
      <Button
        onClick={reset}
        className="bg-accent-primary hover:bg-accent-primary/90 text-white"
      >
        {t("tryAgain")}
      </Button>
    </div>
  );
}
