import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { getCategories } from "@/lib/data/categories";
import { getBot } from "@/lib/telegram/bot";
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
}: {
  chatId: string;
  text: string;
}) {
  try {
    // Handle /start command — generate link token
    if (text.startsWith("/start")) {
      const token = crypto.randomBytes(3).toString("hex"); // 6-char hex code
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Upsert to handle re-starts
      await prisma.telegramLinkToken.upsert({
        where: { chatId },
        update: { token, expiresAt },
        create: { token, chatId, expiresAt },
      });

      await sendReply(
        chatId,
        `Your link code is: *${token}*\n\nEnter this code in Centavo Settings to connect your account. It expires in 10 minutes.`,
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
