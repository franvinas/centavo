import { NextRequest, NextResponse } from "next/server";
import { claimUpdate, finishUpdate } from "@/lib/telegram/durable";
import { limitRequest } from "@/lib/rate-limit";
import { handleMessage } from "@/lib/telegram/handler";
import { z } from "zod/v4";

export const maxDuration = 300;

const privateMessageSchema = z
  .object({
    chat: z.object({
      id: z.number().int().positive(),
      type: z.literal("private"),
    }),
    from: z.object({
      id: z.number().int().positive(),
      is_bot: z.literal(false),
    }),
    text: z.string().optional(),
    voice: z.object({ file_id: z.string().min(1) }).optional(),
  })
  .refine((message) => message.chat.id === message.from.id);

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (
    !process.env.TELEGRAM_WEBHOOK_SECRET ||
    secret !== process.env.TELEGRAM_WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({
      update_id: z.number().int().nonnegative(),
      message: z.unknown().optional(),
    })
    .safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  const update = parsed.data;
  // Group/channel messages never reach account lookup, transcription, or tools.
  const message = privateMessageSchema.safeParse(update.message);
  if (!message.success) return NextResponse.json({ ok: true });

  const text = message.data.text;
  const voiceFileId = message.data.voice?.file_id;
  const chatId = message.data.chat.id.toString();
  if ((!text && !voiceFileId) || !chatId) {
    return NextResponse.json({ ok: true });
  }

  const blocked = await limitRequest(req, "telegram-chat", 30, 60, chatId);
  if (blocked) return blocked;
  try {
    const claimed = await claimUpdate(update.update_id);
    if (claimed === "complete") return NextResponse.json({ ok: true });
    if (claimed === "busy")
      return NextResponse.json(
        { error: "Update in progress" },
        { status: 503, headers: { "Retry-After": "10" } },
      );
    try {
      await handleMessage({
        updateId: update.update_id,
        chatId,
        senderId: message.data.from.id.toString(),
        chatType: "private",
        text,
        voiceFileId,
      });
      await finishUpdate(update.update_id, true);
    } catch (error) {
      await finishUpdate(update.update_id, false);
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram update failed", error);
    return NextResponse.json({ error: "Please retry" }, { status: 503 });
  }
}
