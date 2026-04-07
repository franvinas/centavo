import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { tools } from "./tools/definitions";
import { executeTool } from "./tools/executor";

let openai: OpenAI | undefined;

export function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

interface ChatContext {
  userId: string;
  userName: string;
  baseCurrency: string;
  locale: string;
  timezone: string;
  categories: Array<{ id: string; name: string; icon: string | null }>;
}

export function getCurrentDateInTimeZone(
  timezone: string,
  now: Date = new Date(),
): string {
  const formatDate = (timeZone: string): string => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      throw new Error("Could not format date parts");
    }

    return `${year}-${month}-${day}`;
  };

  try {
    return formatDate(timezone);
  } catch {
    return formatDate("UTC");
  }
}

export function buildSystemPrompt(context: ChatContext): string {
  const today = getCurrentDateInTimeZone(context.timezone);
  const categoryList = context.categories
    .map((c) => `- ${c.name} (id: ${c.id})`)
    .join("\n");

  return `You are Centavo Bot, an expense tracking assistant on Telegram.

User: ${context.userName}
Base currency: ${context.baseCurrency}
Locale: ${context.locale}
Timezone: ${context.timezone}
Today: ${today}

Available categories:
${categoryList}

Rules:
- When the user mentions spending money, add the expense immediately using add_expense. Do NOT ask for confirmation.
- Default to the user's base currency (${context.baseCurrency}) unless they specify another.
- Default to today's date unless they specify another.
- Pick the best matching category from the list above.
- Keep responses concise — this is a chat interface.
- Respond in the user's locale (${context.locale === "es" ? "Spanish" : "English"}).
- Format currency amounts with 2 decimal places.
- When interpreting relative dates (yesterday, last Friday, etc.), use the user's timezone.
- When the user asks to delete or edit "the last expense", use list_expenses first to find it.`;
}

interface ChatResult {
  reply: string;
  newMessages: Array<{
    role: string;
    content?: string | null;
    toolCalls?: unknown;
    toolCallId?: string;
  }>;
}

const MAX_TOOL_ITERATIONS = 5;

export async function chat(
  context: ChatContext,
  conversationHistory: ChatCompletionMessageParam[],
  userMessage: string,
): Promise<ChatResult> {
  const client = getOpenAI();
  const newMessages: ChatResult["newMessages"] = [];

  const systemMessage: ChatCompletionMessageParam = {
    role: "system",
    content: buildSystemPrompt(context),
  };

  const userMsg: ChatCompletionMessageParam = {
    role: "user",
    content: userMessage,
  };
  newMessages.push({ role: "user", content: userMessage });

  const messages: ChatCompletionMessageParam[] = [
    systemMessage,
    ...conversationHistory,
    userMsg,
  ];

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
    });

    const choice = response.choices[0];
    if (!choice?.message) break;

    const assistantMsg = choice.message;

    const functionCalls = assistantMsg.tool_calls?.filter(
      (tc): tc is Extract<typeof tc, { type: "function" }> =>
        tc.type === "function",
    );

    if (functionCalls && functionCalls.length > 0) {
      // Save the assistant message with tool calls
      const toolCallsData = functionCalls.map((tc) => ({
        id: tc.id,
        type: "function" as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      }));

      newMessages.push({
        role: "assistant",
        content: assistantMsg.content,
        toolCalls: toolCallsData,
      });

      messages.push({
        role: "assistant",
        content: assistantMsg.content,
        tool_calls: toolCallsData,
      });

      // Execute each tool call
      for (const toolCall of functionCalls) {
        let result: string;
        try {
          const args = JSON.parse(toolCall.function.arguments);
          result = await executeTool(
            context.userId,
            toolCall.function.name,
            args,
          );
        } catch (error) {
          result = JSON.stringify({
            error:
              error instanceof Error ? error.message : "Tool execution failed",
          });
        }

        newMessages.push({
          role: "tool",
          content: result,
          toolCallId: toolCall.id,
        });

        messages.push({
          role: "tool",
          content: result,
          tool_call_id: toolCall.id,
        });
      }

      // Continue the loop so the LLM can process tool results
      continue;
    }

    // No tool calls — we have the final response
    const reply = assistantMsg.content ?? "";
    newMessages.push({ role: "assistant", content: reply });
    return { reply, newMessages };
  }

  // Fallback if we hit max iterations
  const fallback = "Sorry, I couldn't process that. Please try again.";
  newMessages.push({ role: "assistant", content: fallback });
  return { reply: fallback, newMessages };
}
