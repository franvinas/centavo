"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import {
  desktopNavItems,
  desktopBottomNavItems,
  type NavItem,
} from "@/lib/nav-config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DesktopSidebarProps {
  user: { name: string; email: string } | null;
}

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  // Keep "All expenses" highlighted while viewing/editing a single expense.
  return (
    href === "/expenses" &&
    pathname.startsWith("/expenses/") &&
    pathname !== "/expenses/new"
  );
}

function SidebarLink({
  item,
  active,
  label,
}: {
  item: NavItem;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-accent-soft text-accent-primary"
          : "text-text-secondary hover:bg-bg-muted/70 hover:text-text-primary"
      }`}
    >
      {active && (
        <span
          aria-hidden="true"
          className="bg-accent-primary absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full"
        />
      )}
      <item.icon
        className={`h-[18px] w-[18px] transition-colors ${
          active
            ? "text-accent-primary"
            : "text-text-tertiary group-hover:text-text-secondary"
        }`}
      />
      {label}
    </Link>
  );
}

export function DesktopSidebar({ user }: DesktopSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations();
  const displayName = user?.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="border-border-subtle bg-bg-surface fixed top-0 left-0 z-40 hidden h-screen w-[260px] flex-col border-r md:flex">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-6 pt-7 pb-6"
      >
        <Image
          src="/icons/centavo-logo.svg"
          alt=""
          width={32}
          height={32}
          className="rounded-lg"
        />
        <span className="text-text-primary text-lg font-semibold tracking-tight">
          Centavo
        </span>
      </Link>

      {/* Primary action */}
      <div className="px-4 pb-5">
        <Link
          href="/expenses/new"
          className="bg-accent-primary hover:bg-accent-hover shadow-fab flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-colors"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
          {t("nav.addExpense")}
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {desktopNavItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            label={t(item.labelKey)}
            active={isActive(pathname, item.href)}
          />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="flex flex-col gap-0.5 px-3 pb-4">
        {desktopBottomNavItems.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            label={t(item.labelKey)}
            active={isActive(pathname, item.href)}
          />
        ))}

        {/* User row */}
        <div className="border-border-subtle mt-3 flex items-center gap-3 border-t px-3 pt-4">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-accent-light text-accent-primary text-sm font-semibold">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-text-primary truncate text-sm font-medium">
              {displayName}
            </p>
            {user?.email && (
              <p className="text-text-tertiary truncate text-xs">
                {user.email}
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
