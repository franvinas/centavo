import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data/user";
import { CliAuthApproveClient } from "./approve-client";

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
      <div className="bg-bg-primary flex min-h-screen items-center justify-center px-6">
        <div className="bg-bg-surface shadow-card w-full max-w-md rounded-lg p-6 text-center">
          <h1 className="text-text-primary text-xl font-semibold">
            Invalid CLI Login Request
          </h1>
          <p className="text-text-secondary mt-2 text-sm">
            This approval link is missing required parameters. Start the login
            flow again from the terminal.
          </p>
        </div>
      </div>
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(buildCallbackUrl(requestId, code))}`,
    );
  }

  return (
    <div className="bg-bg-primary flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md space-y-4">
        <p className="text-text-secondary text-center text-sm">
          Signed in as {user.email}
        </p>
        <CliAuthApproveClient requestId={requestId} code={code} />
      </div>
    </div>
  );
}
