import { after, NextRequest, NextResponse } from "next/server";
import { isDuplicate } from "@/lib/telegram/dedup";
import { handleMessage } from "@/lib/telegram/handler";
import { z } from "zod/v4";

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

  // Dedup by update_id
  if (isDuplicate(update.update_id)) {
    return NextResponse.json({ ok: true });
  }

  const text = message.data.text;
  const voiceFileId = message.data.voice?.file_id;
  const chatId = message.data.chat.id.toString();
  if ((!text && !voiceFileId) || !chatId) {
    return NextResponse.json({ ok: true });
  }

  // Return 200 immediately, process in background
  after(() =>
    handleMessage({
      chatId,
      senderId: message.data.from.id.toString(),
      chatType: "private",
      text,
      voiceFileId,
    }),
  );
  return NextResponse.json({ ok: true });
}
