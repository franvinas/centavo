import Link from "next/link";
import { CirclePlus } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function EmptyStateDashboard({ userName }: { userName: string }) {
  const t = await getTranslations("dashboard");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">
          {t("emptyWelcome", { name: userName })}
        </h1>
        <p className="text-text-secondary mt-1 text-[15px]">
          {t("emptySubtitle")}
        </p>
      </div>

      <div className="bg-bg-surface shadow-card flex flex-col items-center gap-4 rounded-2xl p-8">
        <div className="bg-accent-light flex h-14 w-14 items-center justify-center rounded-full">
          <CirclePlus className="text-accent-primary h-7 w-7" />
        </div>
        <h2 className="text-text-primary text-lg font-semibold">
          {t("emptyTitle")}
        </h2>
        <p className="text-text-secondary text-center text-sm">
          {t("emptyDescription")}
        </p>
        <Link
          href="/expenses/new"
          className="bg-accent-primary shadow-fab flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white"
        >
          {t("addExpense")}
        </Link>
      </div>
    </div>
  );
}
