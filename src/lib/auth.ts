import crypto from "node:crypto";
import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { Resend as ResendClient } from "resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import {
  getOTPEmailHtml,
  getOTPEmailText,
  getOTPEmailSubject,
} from "@/lib/email-templates/otp-email";
import { locales, type Locale } from "@/i18n/config";

let _resend: ResendClient | undefined;
function getResend() {
  if (!_resend) {
    _resend = new ResendClient(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM ?? "Centavo <onboarding@resend.dev>",
      maxAge: 5 * 60,
      async generateVerificationToken() {
        return crypto.randomInt(100000, 999999).toString();
      },
      async sendVerificationRequest({ identifier: email, token, provider }) {
        const cookieStore = await cookies();
        const locale = cookieStore.get("NEXT_LOCALE")?.value;

        await getResend().emails.send({
          from: provider.from as string,
          to: email,
          subject: getOTPEmailSubject({ otp: token, email, locale }),
          html: getOTPEmailHtml({ otp: token, email, locale }),
          text: getOTPEmailText({ otp: token, email, locale }),
        });
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  events: {
    async signIn({ user }) {
      if (!user?.id) return;
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { locale: true },
        });
        if (dbUser?.locale && locales.includes(dbUser.locale as Locale)) {
          const cookieStore = await cookies();
          cookieStore.set("NEXT_LOCALE", dbUser.locale, {
            path: "/",
            maxAge: 60 * 60 * 24 * 365,
            sameSite: "lax",
          });
        }
      } catch {
        // Non-critical: locale sync failure shouldn't block sign-in
      }
    },
  },
});
