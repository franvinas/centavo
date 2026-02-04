import { prisma } from "@/lib/db";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const MAX_HISTORY = 20;
const PRUNE_THRESHOLD = 50;

export async function getConversationHistory(
  userId: string,
): Promise<ChatCompletionMessageParam[]> {
  const messages = await prisma.telegramMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY,
  });

  // Reverse to chronological order
  messages.reverse();

  return messages.map((msg) => {
    if (msg.role === "assistant" && msg.toolCalls) {
      return {
        role: "assistant" as const,
        content: msg.content ?? null,
        tool_calls: msg.toolCalls as Array<{
          id: string;
          type: "function";
          function: { name: string; arguments: string };
        }>,
      };
    }

    if (msg.role === "tool") {
      return {
        role: "tool" as const,
        content: msg.content ?? "",
        tool_call_id: msg.toolCallId ?? "",
      };
    }

    return {
      role: msg.role as "user" | "assistant",
      content: msg.content ?? "",
    };
  });
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
  await prisma.telegramMessage.createMany({
    data: messages.map((msg) => ({
      userId,
      role: msg.role,
      content: msg.content ?? null,
      toolCalls: msg.toolCalls ? (msg.toolCalls as object) : undefined,
      toolCallId: msg.toolCallId ?? null,
    })),
  });

  // Prune old messages
  const count = await prisma.telegramMessage.count({ where: { userId } });
  if (count > PRUNE_THRESHOLD) {
    const toKeep = await prisma.telegramMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: MAX_HISTORY,
      select: { id: true },
    });
    const keepIds = toKeep.map((m) => m.id);
    await prisma.telegramMessage.deleteMany({
      where: { userId, id: { notIn: keepIds } },
    });
  }
}
