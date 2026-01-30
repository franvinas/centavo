import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/auth/signin", "/api/auth"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  if (!req.auth && !isPublic) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)"],
};
