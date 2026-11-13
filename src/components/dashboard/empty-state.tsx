import Link from "next/link";
import { CirclePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function EmptyStateDashboard({ userName }: { userName: string }) {
  const t = await getTranslations("dashboard");
  return (
    <div className="animate-page-in space-y-6">
      <div>
        <h1 className="text-text-primary text-[26px] leading-tight font-semibold tracking-tight md:text-[28px]">
          {t("emptyWelcome", { name: userName })}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">{t("emptySubtitle")}</p>
      </div>

      <div className="bg-bg-surface shadow-card border-border-subtle/60 flex flex-col items-center gap-3 rounded-3xl border px-6 py-10 text-center md:py-14">
        <div className="bg-accent-soft mb-1 flex h-16 w-16 items-center justify-center rounded-2xl">
          <CirclePlus className="text-accent-primary h-8 w-8" />
        </div>
        <h2 className="text-text-primary text-lg font-semibold">
          {t("emptyTitle")}
        </h2>
        <p className="text-text-secondary max-w-sm text-sm">
          {t("emptyDescription")}
        </p>
        <Link
          href="/expenses/new"
          className="bg-accent-primary hover:bg-accent-hover mt-3 flex h-12 w-full max-w-xs items-center justify-center rounded-xl text-[15px] font-semibold text-white transition-colors"
        >
          {t("addExpense")}
        </Link>
      </div>
    </div>
  );
}
