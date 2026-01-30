import Link from "next/link";
import { CirclePlus } from "lucide-react";

export function EmptyStateDashboard({ userName }: { userName: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome, {userName}!
        </h1>
        <p className="mt-1 text-[15px] text-text-secondary">
          Start tracking your expenses today
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-bg-surface p-8 shadow-card">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-light">
          <CirclePlus className="h-7 w-7 text-accent-primary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary">
          Add your first expense
        </h2>
        <p className="text-center text-sm text-text-secondary">
          Tap the button below to start tracking where your money goes
        </p>
        <Link
          href="/expenses/new"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-accent-primary text-[15px] font-semibold text-white shadow-fab"
        >
          Add Expense
        </Link>
      </div>
    </div>
  );
}
