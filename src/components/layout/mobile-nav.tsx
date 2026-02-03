"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { mobileNavItems } from "@/lib/nav-config";

export function MobileNav() {
  const pathname = usePathname();
  const t = useTranslations();

  // Split items evenly around the center FAB
  const half = Math.ceil(mobileNavItems.length / 2);
  const leftItems = mobileNavItems.slice(0, half);
  const rightItems = mobileNavItems.slice(half);

  return (
    <nav className="border-border-subtle bg-bg-surface fixed right-0 bottom-0 left-0 z-50 border-t md:hidden">
      <div className="flex h-[84px] items-end justify-around pb-[34px]">
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
        <div className="-mt-4 flex flex-col items-center">
          <Link
            href="/expenses/new"
            className="bg-accent-primary flex h-[60px] w-[60px] items-center justify-center rounded-full shadow-[0_4px_12px_rgba(61,138,90,0.25),0_2px_6px_rgba(61,138,90,0.19)]"
          >
            <Plus className="h-7 w-7 text-white" />
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
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-0.5 ${
        active ? "text-accent-primary" : "text-text-tertiary"
      }`}
    >
      <Icon className="h-[22px] w-[22px]" />
      <span
        className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}
      >
        {label}
      </span>
    </Link>
  );
}
