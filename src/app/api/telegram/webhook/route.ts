import { NextRequest, NextResponse } from "next/server";
import { webhookCallback } from "grammy";
import { getBot } from "@/lib/telegram/bot";
import { handleMessage } from "@/lib/telegram/handler";

let initialized = false;

function ensureHandlers() {
  if (initialized) return;
  const bot = getBot();
  bot.on("message:text", handleMessage);
  initialized = true;
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureHandlers();

  const handler = webhookCallback(getBot(), "std/http");
  return handler(req);
}
