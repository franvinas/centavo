import { after, NextRequest, NextResponse } from "next/server";
import { isDuplicate } from "@/lib/telegram/dedup";
import { handleMessage } from "@/lib/telegram/handler";

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = await req.json();

  // Dedup by update_id
  if (isDuplicate(update.update_id)) {
    return NextResponse.json({ ok: true });
  }

  const text = update.message?.text;
  const chatId = update.message?.chat?.id?.toString();
  if (!text || !chatId) {
    return NextResponse.json({ ok: true });
  }

  // Return 200 immediately, process in background
  after(() => handleMessage({ chatId, text }));
  return NextResponse.json({ ok: true });
}
