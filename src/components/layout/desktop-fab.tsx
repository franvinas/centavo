"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export function DesktopFab() {
  return (
    <Link
      href="/expenses/new"
      className="fixed bottom-6 right-6 z-50 hidden h-16 w-16 items-center justify-center rounded-full bg-accent-primary shadow-[0_4px_16px_rgba(61,138,90,0.25),0_2px_8px_rgba(61,138,90,0.19)] transition-transform hover:scale-105 md:flex"
      aria-label="Add expense"
    >
      <Plus className="h-7 w-7 text-white" />
    </Link>
  );
}
