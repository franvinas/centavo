import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const token = body?.token?.trim();

  if (!token || typeof token !== "string") {
    return badRequest("Link code is required");
  }

  const linkToken = await prisma.telegramLinkToken.findUnique({
    where: { token },
  });

  if (!linkToken) {
    return badRequest("Invalid link code");
  }

  if (linkToken.expiresAt < new Date()) {
    await prisma.telegramLinkToken.delete({ where: { id: linkToken.id } });
    return badRequest("Link code has expired. Send /start to get a new one.");
  }

  // Link the Telegram chat to this user
  await prisma.user.update({
    where: { id: user.id },
    data: { telegramChatId: linkToken.chatId },
  });

  // Clean up the token
  await prisma.telegramLinkToken.delete({ where: { id: linkToken.id } });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const user = await getAuthUser();
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
