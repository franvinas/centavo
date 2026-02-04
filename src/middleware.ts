import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/auth/signin", "/api/auth", "/api/telegram/webhook"];

function detectLocale(req: Parameters<Parameters<typeof auth>[0]>[0]): Locale {
  const cookie = req.cookies.get("NEXT_LOCALE")?.value;
  if (cookie && locales.includes(cookie as Locale)) {
    return cookie as Locale;
  }

  const acceptLang = req.headers.get("Accept-Language");
  if (acceptLang) {
    for (const part of acceptLang.split(",")) {
      const lang = part.split(";")[0].trim().slice(0, 2).toLowerCase();
      if (locales.includes(lang as Locale)) {
        return lang as Locale;
      }
    }
  }

  return defaultLocale;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = publicPaths.some((path) => pathname.startsWith(path));
  if (!req.auth && !isPublic) {
    const signInUrl = new URL("/auth/signin", req.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const locale = detectLocale(req);
  const response = NextResponse.next();

  if (!req.cookies.get("NEXT_LOCALE")?.value) {
    response.cookies.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest\\.webmanifest|manifest\\.json|icons/|sw\\.js|swe-worker-).*)",
  ],
};
