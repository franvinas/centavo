"use client";

import Image from "next/image";
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
    <aside className="border-border-subtle bg-bg-surface fixed top-0 left-0 z-40 hidden h-screen w-[260px] flex-col border-r md:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-6">
        <Image
          src="/icons/centavo-logo.svg"
          alt="Centavo"
          width={36}
          height={36}
          className="rounded-lg"
        />
        <span className="text-text-primary text-xl font-semibold">
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

        <Separator className="bg-border-subtle my-3" />

        {/* User row */}
        <div className="flex items-center gap-3 px-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-accent-light text-accent-primary text-sm font-medium">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="text-text-primary text-sm font-medium">
            {displayName}
          </span>
        </div>
      </div>
    </aside>
  );
}
