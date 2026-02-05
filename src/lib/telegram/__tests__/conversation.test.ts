import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { getConversationHistory, saveMessages } from "../conversation";

describe("Conversation", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  describe("getConversationHistory", () => {
    it("returns user and assistant messages in chronological order", async () => {
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

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({ role: "user", content: "Hi" });
      expect(history[1]).toEqual({ role: "assistant", content: "Hello!" });
    });

    it("only queries user and assistant roles", async () => {
      prismaMock.telegramMessage.findMany.mockResolvedValue([] as never);

      await getConversationHistory("user-1");

      expect(prismaMock.telegramMessage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1", role: { in: ["user", "assistant"] } },
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        }),
      );
    });
  });

  describe("saveMessages", () => {
    it("only persists user and assistant text messages", async () => {
      prismaMock.telegramMessage.createMany.mockResolvedValue({
        count: 2,
      } as never);
      prismaMock.telegramMessage.count.mockResolvedValue(2 as never);

      await saveMessages("user-1", [
        { role: "user", content: "spent 25 on lunch" },
        {
          role: "assistant",
          content: null,
          toolCalls: [{ id: "tc-1", type: "function", function: {} }],
        },
        { role: "tool", content: '{"id":"exp-1"}', toolCallId: "tc-1" },
        { role: "assistant", content: "Done! Recorded 25 for lunch." },
      ]);

      expect(prismaMock.telegramMessage.createMany).toHaveBeenCalledWith({
        data: [
          { userId: "user-1", role: "user", content: "spent 25 on lunch" },
          {
            userId: "user-1",
            role: "assistant",
            content: "Done! Recorded 25 for lunch.",
          },
        ],
      });
    });

    it("skips save when no persistable messages", async () => {
      await saveMessages("user-1", [
        {
          role: "assistant",
          content: null,
          toolCalls: [{ id: "tc-1", type: "function", function: {} }],
        },
        { role: "tool", content: '{"id":"exp-1"}', toolCallId: "tc-1" },
      ]);

      expect(prismaMock.telegramMessage.createMany).not.toHaveBeenCalled();
    });

    it("prunes old messages when over threshold", async () => {
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
