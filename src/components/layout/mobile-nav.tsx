"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { mobileNavItems } from "@/lib/nav-config";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-bg-surface md:hidden">
      <div className="flex h-[84px] items-end justify-around pb-[34px]">
        {/* First tab */}
        <NavTab
          href={mobileNavItems[0].href}
          label={mobileNavItems[0].label}
          icon={mobileNavItems[0].icon}
          active={pathname === mobileNavItems[0].href}
        />

        {/* Center FAB */}
        <div className="-mt-4 flex flex-col items-center">
          <Link
            href="/expenses/new"
            className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-accent-primary shadow-[0_4px_12px_rgba(61,138,90,0.25),0_2px_6px_rgba(61,138,90,0.19)]"
          >
            <Plus className="h-7 w-7 text-white" />
          </Link>
        </div>

        {/* Second tab */}
        <NavTab
          href={mobileNavItems[1].href}
          label={mobileNavItems[1].label}
          icon={mobileNavItems[1].icon}
          active={pathname === mobileNavItems[1].href}
        />
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
