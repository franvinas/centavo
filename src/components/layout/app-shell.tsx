import { MobileNav } from "./mobile-nav";
import { DesktopSidebar } from "./desktop-sidebar";

interface AppShellProps {
  children: React.ReactNode;
  user: { name: string; email: string } | null;
}

export function AppShell({ children, user }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <DesktopSidebar user={user} />
      <main className="pb-[calc(88px+env(safe-area-inset-bottom))] md:pb-0 md:pl-[260px]">
        <div className="mx-auto w-full max-w-[1120px] px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 md:px-10 md:pt-10 md:pb-12">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
