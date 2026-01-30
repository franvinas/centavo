import { MobileNav } from "./mobile-nav";
import { DesktopSidebar } from "./desktop-sidebar";
import { DesktopFab } from "./desktop-fab";

interface AppShellProps {
  children: React.ReactNode;
  user: { name: string; email: string } | null;
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <DesktopSidebar user={user} />
      <main className="pb-[84px] md:pb-0 md:pl-[260px]">
        <div className="px-6 py-6 md:px-10 md:py-8">{children}</div>
      </main>
      <MobileNav />
      <DesktopFab />
    </div>
  );
}
