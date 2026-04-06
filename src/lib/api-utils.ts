import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCliTokenAuthFromRequest } from "@/lib/cli-auth";

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  authType?: "session" | "cli";
  cliTokenId?: string | null;
}

export async function getSessionAuthUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    authType: "session",
    cliTokenId: null,
  };
}

export async function getAuthUser(request?: Request): Promise<AuthUser | null> {
  if (request) {
    const cliAuth = await getCliTokenAuthFromRequest(request);
    if (cliAuth) {
      return {
        ...cliAuth.user,
        authType: "cli",
        cliTokenId: cliAuth.tokenId,
      };
    }
  }

  return getSessionAuthUser();
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Authentication required", code: "UNAUTHORIZED" },
    { status: 401 },
  );
}

export function badRequest(message: string) {
  return NextResponse.json(
    { error: message, code: "BAD_REQUEST" },
    { status: 400 },
  );
}

export function notFound(message: string = "Not found") {
  return NextResponse.json(
    { error: message, code: "NOT_FOUND" },
    { status: 404 },
  );
}
