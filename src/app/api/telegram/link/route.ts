import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/api-utils";

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;
const DEFAULT_BOT_USERNAME = "CentaBot";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const token = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);
  const botUsername =
    process.env.TELEGRAM_BOT_USERNAME?.trim() || DEFAULT_BOT_USERNAME;

  await prisma.telegramLinkToken.upsert({
    where: { userId: user.id },
    update: { token, expiresAt },
    create: { userId: user.id, token, expiresAt },
  });

  return NextResponse.json({
    success: true,
    url: `https://t.me/${botUsername}?start=${token}`,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: null },
  });

  // Also clean up conversation history
  await prisma.telegramMessage.deleteMany({
    where: { userId: user.id },
  });

  return NextResponse.json({ success: true });
}
