import crypto from "node:crypto";
import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { Resend as ResendClient } from "resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";
import {
  getOTPEmailHtml,
  getOTPEmailText,
} from "@/lib/email-templates/otp-email";

const resend = new ResendClient(process.env.RESEND_API_KEY);

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", color: "#E67E22", icon: "UtensilsCrossed" },
  { name: "Transport", color: "#3498DB", icon: "Car" },
  { name: "Groceries", color: "#3D8A5A", icon: "ShoppingCart" },
  { name: "Entertainment", color: "#9B59B6", icon: "Film" },
  { name: "Health", color: "#E74C3C", icon: "Heart" },
  { name: "Housing", color: "#2ECC71", icon: "Home" },
  { name: "Shopping", color: "#1ABC9C", icon: "ShoppingBag" },
  { name: "Utilities", color: "#F39C12", icon: "Zap" },
];

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
        await resend.emails.send({
          from: provider.from as string,
          to: email,
          subject: `${token} is your Centavo verification code`,
          html: getOTPEmailHtml({ otp: token, email }),
          text: getOTPEmailText({ otp: token, email }),
        });
      },
    }),
  ],
  adapter: PrismaAdapter(prisma),
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      await prisma.category.createMany({
        data: DEFAULT_CATEGORIES.map((cat) => ({
          userId: user.id!,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
        })),
      });
    },
  },
});
