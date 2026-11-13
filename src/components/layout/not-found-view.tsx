import Link from "next/link";
import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function NotFoundView() {
  const t = await getTranslations("common");
  return (
    <div className="animate-page-in flex min-h-[60vh] flex-col items-center justify-center gap-3 px-5 text-center">
      <div className="bg-bg-muted mb-1 flex h-14 w-14 items-center justify-center rounded-2xl">
        <SearchX className="text-text-tertiary h-6 w-6" />
      </div>
      <p className="text-text-tertiary text-xs font-semibold tracking-wide">
        404
      </p>
      <h1 className="text-text-primary text-xl font-semibold tracking-tight">
        {t("notFoundTitle")}
      </h1>
      <p className="text-text-secondary max-w-xs text-sm">
        {t("notFoundDescription")}
      </p>
      <Link
        href="/dashboard"
        className="bg-accent-primary hover:bg-accent-hover mt-3 inline-flex h-11 items-center rounded-xl px-6 text-sm font-semibold text-white transition-colors md:h-10"
      >
        {t("backHome")}
      </Link>
    </div>
  );
}
