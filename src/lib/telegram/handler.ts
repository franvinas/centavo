import { getExpenseDb } from "@/lib/expense-db";
import { executeDurableTool } from "./durable";
import { prisma } from "@/lib/db";
import { getCategories } from "@/lib/data/categories";
import { getBot } from "@/lib/telegram/bot";
import { transcribeVoice } from "@/lib/telegram/transcribe";
import { getConversationHistory, saveMessages } from "./conversation";
import { chat } from "./llm";

async function sendReply(chatId: string, text: string) {
  const bot = getBot();
  await bot.api
    .sendMessage(chatId, text, { parse_mode: "Markdown" })
    .catch(() => {
      // Retry without Markdown if parsing fails
      return bot.api.sendMessage(chatId, text);
    });
}

export async function handleMessage({
  chatId,
  senderId,
  chatType,
  text,
  voiceFileId,
  updateId,
}: {
  chatId: string;
  senderId: string;
  chatType: string;
  text?: string;
  voiceFileId?: string;
  updateId?: number;
}) {
  if (
    chatType !== "private" ||
    senderId !== chatId ||
    !/^[1-9]\d*$/.test(chatId)
  )
    return;
  try {
    // Transcribe voice message if present
    if (voiceFileId && !text) {
      text = await transcribeVoice(voiceFileId);
    }

    if (!text) {
      return;
    }

    // Link consumption and its reply are checkpointed together on webhook retries.
    if (text.startsWith("/start")) {
      const payload = text.trim().split(/\s+/, 2)[1];
      const connect = async () => {
        if (!payload)
          return "To connect your account, open Centavo Settings and tap *Connect on Telegram*.";
        const db = getExpenseDb();
        if (updateId !== undefined)
          await db.$queryRaw`SELECT id FROM telegram_link_tokens WHERE token = ${payload} FOR UPDATE`;
        const linkToken = await db.telegramLinkToken.findUnique({
          where: { token: payload },
        });
        if (!linkToken)
          return "This connection link is invalid or already used. Please start again from Centavo Settings.";
        if (linkToken.expiresAt < new Date()) {
          await db.telegramLinkToken.delete({ where: { id: linkToken.id } });
          return "This connection link has expired. Please start again from Centavo Settings.";
        }
        const ownerOfChat = await db.user.findUnique({
          where: { telegramChatId: chatId },
          select: { id: true },
        });
        if (ownerOfChat && ownerOfChat.id !== linkToken.userId)
          return "This Telegram account is already connected to another Centavo account.";
        await db.user.update({
          where: { id: linkToken.userId },
          data: { telegramChatId: chatId },
        });
        await db.telegramLinkToken.deleteMany({
          where: { userId: linkToken.userId },
        });
        return "Connected successfully. You can now track expenses from Telegram.";
      };
      const reply =
        updateId === undefined
          ? await connect()
          : await executeDurableTool(updateId, "link", connect);
      await sendReply(chatId, reply);
      return;
    }

    // Look up user by telegramChatId
    const user = await prisma.user.findUnique({
      where: { telegramChatId: chatId },
      select: {
        id: true,
        name: true,
        baseCurrency: true,
        locale: true,
        timezone: true,
      },
    });

    if (!user) {
      await sendReply(
        chatId,
        "Your Telegram account is not linked to Centavo. Send /start to get a link code, then enter it in your Centavo Settings.",
      );
      return;
    }

    // Load categories and conversation history in parallel
    const [categories, conversationHistory] = await Promise.all([
      getCategories(user.id),
      getConversationHistory(user.id),
    ]);

    const context = {
      userId: user.id,
      userName: user.name ?? "User",
      baseCurrency: user.baseCurrency,
      locale: user.locale,
      timezone: user.timezone ?? "UTC",
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
      })),
    };

    // Call LLM
    const { reply, newMessages } = await chat(
      context,
      conversationHistory,
      text,
      updateId,
    );

    // Save new messages to DB
    if (updateId === undefined) await saveMessages(user.id, newMessages);
    else
      await executeDurableTool(updateId, "conversation", async () => {
        await saveMessages(user.id, newMessages);
        return "saved";
      });

    // Reply to Telegram
    await sendReply(chatId, reply);
  } catch (error) {
    console.error("Telegram handler error:", error);
    if (updateId !== undefined) throw error;
    try {
      await sendReply(chatId, "Something went wrong. Please try again later.");
    } catch {
      // Nothing we can do — the response was already sent
    }
  }
}
