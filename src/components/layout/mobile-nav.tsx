"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { mobileNavItems } from "@/lib/nav-config";

// Full-screen form routes render their own header and close button.
function isFormRoute(pathname: string) {
  return /^\/expenses\/[^/]+$/.test(pathname);
}

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations();

  if (isFormRoute(pathname)) return null;

  // Split items evenly around the center FAB
  const half = Math.ceil(mobileNavItems.length / 2);
  const leftItems = mobileNavItems.slice(0, half);
  const rightItems = mobileNavItems.slice(half);

  return (
    <nav className="border-border-subtle bg-bg-surface fixed right-0 bottom-0 left-0 z-50 border-t pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid h-16 grid-cols-5 items-center px-2">
        {leftItems.map((item) => (
          <NavTab
            key={item.href}
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            active={pathname === item.href}
          />
        ))}

        {/* Center FAB */}
        <div className="flex justify-center">
          <Link
            href="/expenses/new"
            aria-label={t("expenses.addExpense")}
            className="bg-accent-primary shadow-fab ring-bg-surface flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full ring-4 transition-transform active:scale-95"
          >
            <Plus className="h-7 w-7 text-white" strokeWidth={2.25} />
          </Link>
        </div>

        {rightItems.map((item) => (
          <NavTab
            key={item.href}
            href={item.href}
            label={t(item.labelKey)}
            icon={item.icon}
            active={pathname === item.href}
          />
        ))}
      </div>
    </nav>
  );
}

function NavTab({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-full min-w-[44px] flex-col items-center justify-center gap-1 transition-colors active:opacity-70 ${
        active ? "text-accent-primary" : "text-text-tertiary"
      }`}
    >
      <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.25 : 1.75} />
      <span
        className={`text-[10.5px] leading-none ${active ? "font-semibold" : "font-medium"}`}
      >
        {label}
      </span>
    </Link>
  );
}
