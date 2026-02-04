import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { getConversationHistory, saveMessages } from "../conversation";

describe("Conversation", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  describe("getConversationHistory", () => {
    it("returns messages in OpenAI format", async () => {
      prismaMock.telegramMessage.findMany.mockResolvedValue([
        {
          id: "msg-2",
          userId: "user-1",
          role: "assistant",
          content: "Hello!",
          toolCalls: null,
          toolCallId: null,
          createdAt: new Date("2025-01-15T12:01:00Z"),
        },
        {
          id: "msg-1",
          userId: "user-1",
          role: "user",
          content: "Hi",
          toolCalls: null,
          toolCallId: null,
          createdAt: new Date("2025-01-15T12:00:00Z"),
        },
      ] as never);

      const history = await getConversationHistory("user-1");

      // Messages are reversed to chronological order
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({ role: "user", content: "Hi" });
      expect(history[1]).toEqual({ role: "assistant", content: "Hello!" });
    });

    it("handles tool call messages", async () => {
      const toolCalls = [
        {
          id: "tc-1",
          type: "function",
          function: { name: "add_expense", arguments: '{"amount":25}' },
        },
      ];

      prismaMock.telegramMessage.findMany.mockResolvedValue([
        {
          id: "msg-1",
          userId: "user-1",
          role: "assistant",
          content: null,
          toolCalls,
          toolCallId: null,
          createdAt: new Date("2025-01-15T12:00:00Z"),
        },
      ] as never);

      const history = await getConversationHistory("user-1");

      expect(history[0]).toEqual({
        role: "assistant",
        content: null,
        tool_calls: toolCalls,
      });
    });

    it("handles tool result messages", async () => {
      const toolCalls = [
        {
          id: "tc-1",
          type: "function",
          function: { name: "add_expense", arguments: '{"amount":25}' },
        },
      ];

      prismaMock.telegramMessage.findMany.mockResolvedValue([
        {
          id: "msg-2",
          userId: "user-1",
          role: "tool",
          content: '{"id":"exp-1"}',
          toolCalls: null,
          toolCallId: "tc-1",
          createdAt: new Date("2025-01-15T12:00:01Z"),
        },
        {
          id: "msg-1",
          userId: "user-1",
          role: "assistant",
          content: null,
          toolCalls,
          toolCallId: null,
          createdAt: new Date("2025-01-15T12:00:00Z"),
        },
      ] as never);

      const history = await getConversationHistory("user-1");

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        role: "assistant",
        content: null,
        tool_calls: toolCalls,
      });
      expect(history[1]).toEqual({
        role: "tool",
        content: '{"id":"exp-1"}',
        tool_call_id: "tc-1",
      });
    });

    it("uses secondary id sort for stable ordering", async () => {
      prismaMock.telegramMessage.findMany.mockResolvedValue([
        {
          id: "msg-1",
          userId: "user-1",
          role: "user",
          content: "Hi",
          toolCalls: null,
          toolCallId: null,
          createdAt: new Date("2025-01-15T12:00:00Z"),
        },
      ] as never);

      await getConversationHistory("user-1");

      expect(prismaMock.telegramMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        }),
      );
    });
  });

  describe("saveMessages", () => {
    it("persists messages and prunes when over threshold", async () => {
      prismaMock.telegramMessage.createMany.mockResolvedValue({
        count: 1,
      } as never);
      prismaMock.telegramMessage.count.mockResolvedValue(60 as never);
      prismaMock.telegramMessage.findMany.mockResolvedValue(
        Array.from({ length: 20 }, (_, i) => ({ id: `msg-${i}` })) as never,
      );
      prismaMock.telegramMessage.deleteMany.mockResolvedValue({
        count: 40,
      } as never);

      await saveMessages("user-1", [{ role: "user", content: "Hello" }]);

      expect(prismaMock.telegramMessage.createMany).toHaveBeenCalled();
      expect(prismaMock.telegramMessage.deleteMany).toHaveBeenCalled();
    });

    it("skips pruning when under threshold", async () => {
      prismaMock.telegramMessage.createMany.mockResolvedValue({
        count: 1,
      } as never);
      prismaMock.telegramMessage.count.mockResolvedValue(10 as never);

      await saveMessages("user-1", [{ role: "user", content: "Hello" }]);

      expect(prismaMock.telegramMessage.createMany).toHaveBeenCalled();
      expect(prismaMock.telegramMessage.deleteMany).not.toHaveBeenCalled();
    });
  });
});
