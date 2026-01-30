import Link from "next/link";
import { CirclePlus } from "lucide-react";

export function EmptyStateDashboard({ userName }: { userName: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary text-2xl font-bold">
          Welcome, {userName}!
        </h1>
        <p className="text-text-secondary mt-1 text-[15px]">
          Start tracking your expenses today
        </p>
      </div>

      <div className="bg-bg-surface shadow-card flex flex-col items-center gap-4 rounded-2xl p-8">
        <div className="bg-accent-light flex h-14 w-14 items-center justify-center rounded-full">
          <CirclePlus className="text-accent-primary h-7 w-7" />
        </div>
        <h2 className="text-text-primary text-lg font-semibold">
          Add your first expense
        </h2>
        <p className="text-text-secondary text-center text-sm">
          Tap the button below to start tracking where your money goes
        </p>
        <Link
          href="/expenses/new"
          className="bg-accent-primary shadow-fab flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white"
        >
          Add Expense
        </Link>
      </div>
    </div>
  );
}
