"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { desktopNavItems, desktopBottomNavItems } from "@/lib/nav-config";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DesktopSidebarProps {
  user: { name: string; email: string } | null;
}

export function DesktopSidebar({ user }: DesktopSidebarProps) {
  const pathname = usePathname();
  const displayName = user?.name || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-border-subtle bg-bg-surface md:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-primary text-white">
          <span className="text-lg font-bold">C</span>
        </div>
        <span className="text-xl font-semibold text-text-primary">
          Centavo
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
        {desktopNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-primary text-white"
                  : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4">
        {desktopBottomNavItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent-primary text-white"
                  : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}

        <Separator className="my-3 bg-border-subtle" />

        {/* User row */}
        <div className="flex items-center gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent-light text-sm font-medium text-accent-primary">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-text-primary">
            {displayName}
          </span>
        </div>
      </div>
    </aside>
  );
}
