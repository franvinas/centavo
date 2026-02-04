import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

vi.mock("../llm", () => ({
  chat: vi.fn(),
}));

vi.mock("../conversation", () => ({
  getConversationHistory: vi.fn(),
  saveMessages: vi.fn(),
}));

vi.mock("@/lib/data/categories", () => ({
  getCategories: vi.fn(),
}));

import { handleMessage } from "../handler";
import { chat } from "../llm";
import { getConversationHistory, saveMessages } from "../conversation";
import { getCategories } from "@/lib/data/categories";

const mockChat = vi.mocked(chat);
const mockGetHistory = vi.mocked(getConversationHistory);
const mockSaveMessages = vi.mocked(saveMessages);
const mockGetCategories = vi.mocked(getCategories);

function createMockCtx(text: string, chatId: string = "123456") {
  return {
    chat: { id: parseInt(chatId) },
    message: { text },
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as import("grammy").Context;
}

describe("handleMessage", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.clearAllMocks();
  });

  it("handles /start command — generates link token", async () => {
    const ctx = createMockCtx("/start");

    prismaMock.telegramLinkToken.upsert.mockResolvedValue({
      id: "lt-1",
      token: "abc123",
      chatId: "123456",
      expiresAt: new Date(),
      createdAt: new Date(),
    } as never);

    await handleMessage(ctx);

    expect(prismaMock.telegramLinkToken.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chatId: "123456" },
      }),
    );
    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("link code"),
      expect.objectContaining({ parse_mode: "Markdown" }),
    );
  });

  it("replies with not-linked message for unknown chat", async () => {
    const ctx = createMockCtx("spent 25 on lunch");

    prismaMock.user.findUnique.mockResolvedValue(null);

    await handleMessage(ctx);

    expect(ctx.reply).toHaveBeenCalledWith(
      expect.stringContaining("not linked"),
    );
  });

  it("processes normal message for linked user", async () => {
    const ctx = createMockCtx("spent 25 on lunch");

    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      name: "Test",
      baseCurrency: "USD",
      locale: "en",
    } as never);

    mockGetCategories.mockResolvedValue([
      {
        id: "cat-1",
        name: "Food",
        icon: "UtensilsCrossed",
        color: "#E8855B",
        userId: "user-1",
        createdAt: new Date(),
      },
    ]);

    mockGetHistory.mockResolvedValue([]);

    mockChat.mockResolvedValue({
      reply: "Added $25.00 expense for Lunch in Food category.",
      newMessages: [
        { role: "user", content: "spent 25 on lunch" },
        {
          role: "assistant",
          content: "Added $25.00 expense for Lunch in Food category.",
        },
      ],
    });

    mockSaveMessages.mockResolvedValue(undefined);

    await handleMessage(ctx);

    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      [],
      "spent 25 on lunch",
    );
    expect(mockSaveMessages).toHaveBeenCalledWith("user-1", expect.any(Array));
    expect(ctx.reply).toHaveBeenCalledWith(
      "Added $25.00 expense for Lunch in Food category.",
      expect.objectContaining({ parse_mode: "Markdown" }),
    );
  });

  it("ignores messages without text", async () => {
    const ctx = {
      chat: { id: 123 },
      message: {},
      reply: vi.fn(),
    } as unknown as import("grammy").Context;

    await handleMessage(ctx);
    expect(ctx.reply).not.toHaveBeenCalled();
  });
});
