import { prisma } from "@/lib/db";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const MAX_HISTORY = 20;
const PRUNE_THRESHOLD = 50;

export async function getConversationHistory(
  userId: string,
): Promise<ChatCompletionMessageParam[]> {
  const messages = await prisma.telegramMessage.findMany({
    where: { userId, role: { in: ["user", "assistant"] } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: MAX_HISTORY,
  });

  // Reverse to chronological order
  messages.reverse();

  return messages.map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content ?? "",
  }));
}

export async function saveMessages(
  userId: string,
  messages: Array<{
    role: string;
    content?: string | null;
    toolCalls?: unknown;
    toolCallId?: string;
  }>,
) {
  // Only persist user messages and final assistant text replies.
  // Tool-related messages (assistant+tool_calls, tool results) are
  // ephemeral and only needed within a single request loop.
  const persistable = messages.filter(
    (msg) =>
      (msg.role === "user" || msg.role === "assistant") && !msg.toolCalls,
  );

  if (persistable.length === 0) return;

  await prisma.telegramMessage.createMany({
    data: persistable.map((msg) => ({
      userId,
      role: msg.role,
      content: msg.content ?? null,
    })),
  });

  // Prune old messages
  const count = await prisma.telegramMessage.count({ where: { userId } });
  if (count > PRUNE_THRESHOLD) {
    const toKeep = await prisma.telegramMessage.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: MAX_HISTORY,
      select: { id: true },
    });
    const keepIds = toKeep.map((m) => m.id);
    await prisma.telegramMessage.deleteMany({
      where: { userId, id: { notIn: keepIds } },
    });
  }
}
