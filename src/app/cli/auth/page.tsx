import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import Image from "next/image";
import { TerminalSquare } from "lucide-react";
import { CliAuthApproveClient } from "./approve-client";

function CliShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-bg-primary flex min-h-[100dvh] items-center justify-center px-5 py-16">
      <div className="animate-page-in w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Image
            src="/icons/centavo-logo.svg"
            alt="Centavo"
            width={48}
            height={48}
            className="rounded-xl"
          />
        </div>
        {children}
      </div>
    </div>
  );
}

function buildCallbackUrl(requestId: string, code: string) {
  const params = new URLSearchParams({ requestId, code });
  return `/cli/auth?${params.toString()}`;
}

export default async function CliAuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const requestId = params.requestId;
  const code = params.code;

  if (!requestId || !code) {
    return (
      <CliShell>
        <div className="bg-bg-surface shadow-card border-border-subtle/60 rounded-3xl border p-6 text-center">
          <div className="bg-status-negative/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl">
            <TerminalSquare className="text-status-negative h-6 w-6" />
          </div>
          <h1 className="text-text-primary text-lg font-semibold">
            Invalid CLI Login Request
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            This approval link is missing required parameters. Start the login
            flow again from the terminal.
          </p>
        </div>
      </CliShell>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(buildCallbackUrl(requestId, code))}`,
    );
  }

  return (
    <CliShell>
      <CliAuthApproveClient requestId={requestId} code={code} />
      <p className="text-text-tertiary mt-4 text-center text-xs">
        Signed in as {user.email}
      </p>
    </CliShell>
  );
}
