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
  text,
  voiceFileId,
}: {
  chatId: string;
  text?: string;
  voiceFileId?: string;
}) {
  try {
    // Transcribe voice message if present
    if (voiceFileId && !text) {
      text = await transcribeVoice(voiceFileId);
    }

    if (!text) {
      return;
    }

    // Handle /start command with deep-link payload
    if (text.startsWith("/start")) {
      const payload = text.trim().split(/\s+/, 2)[1];
      if (!payload) {
        await sendReply(
          chatId,
          "To connect your account, open Centavo Settings and tap *Connect on Telegram*.",
        );
        return;
      }

      const linkToken = await prisma.telegramLinkToken.findUnique({
        where: { token: payload },
      });

      if (!linkToken) {
        await sendReply(
          chatId,
          "This connection link is invalid or already used. Please start again from Centavo Settings.",
        );
        return;
      }

      if (linkToken.expiresAt < new Date()) {
        await prisma.telegramLinkToken.delete({ where: { id: linkToken.id } });
        await sendReply(
          chatId,
          "This connection link has expired. Please start again from Centavo Settings.",
        );
        return;
      }

      const ownerOfChat = await prisma.user.findUnique({
        where: { telegramChatId: chatId },
        select: { id: true },
      });

      if (ownerOfChat && ownerOfChat.id !== linkToken.userId) {
        await sendReply(
          chatId,
          "This Telegram account is already connected to another Centavo account.",
        );
        return;
      }

      await prisma.user.update({
        where: { id: linkToken.userId },
        data: { telegramChatId: chatId },
      });

      await prisma.telegramLinkToken.deleteMany({
        where: { userId: linkToken.userId },
      });

      await sendReply(
        chatId,
        "Connected successfully. You can now track expenses from Telegram.",
      );
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
    );

    // Save new messages to DB
    await saveMessages(user.id, newMessages);

    // Reply to Telegram
    await sendReply(chatId, reply);
  } catch (error) {
    console.error("Telegram handler error:", error);
    try {
      await sendReply(chatId, "Something went wrong. Please try again later.");
    } catch {
      // Nothing we can do — the response was already sent
    }
  }
}
