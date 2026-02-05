import { describe, it, expect, vi, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";

const mockSendMessage = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/telegram/bot", () => ({
  getBot: () => ({
    api: { sendMessage: mockSendMessage },
  }),
}));

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

describe("handleMessage", () => {
  beforeEach(() => {
    resetPrismaMock();
    vi.clearAllMocks();
  });

  it("handles /start command — generates link token", async () => {
    prismaMock.telegramLinkToken.upsert.mockResolvedValue({
      id: "lt-1",
      token: "abc123",
      chatId: "123456",
      expiresAt: new Date(),
      createdAt: new Date(),
    } as never);

    await handleMessage({ chatId: "123456", text: "/start" });

    expect(prismaMock.telegramLinkToken.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chatId: "123456" },
      }),
    );
    expect(mockSendMessage).toHaveBeenCalledWith(
      "123456",
      expect.stringContaining("link code"),
      expect.objectContaining({ parse_mode: "Markdown" }),
    );
  });

  it("replies with not-linked message for unknown chat", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await handleMessage({ chatId: "123456", text: "spent 25 on lunch" });

    expect(mockSendMessage).toHaveBeenCalledWith(
      "123456",
      expect.stringContaining("not linked"),
      expect.objectContaining({ parse_mode: "Markdown" }),
    );
  });

  it("processes normal message for linked user", async () => {
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

    await handleMessage({ chatId: "123456", text: "spent 25 on lunch" });

    expect(mockChat).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
      [],
      "spent 25 on lunch",
    );
    expect(mockSaveMessages).toHaveBeenCalledWith("user-1", expect.any(Array));
    expect(mockSendMessage).toHaveBeenCalledWith(
      "123456",
      "Added $25.00 expense for Lunch in Food category.",
      expect.objectContaining({ parse_mode: "Markdown" }),
    );
  });

  it("sends fallback message on error", async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("DB error"));

    await handleMessage({ chatId: "123456", text: "spent 25 on lunch" });

    expect(mockSendMessage).toHaveBeenCalledWith(
      "123456",
      "Something went wrong. Please try again later.",
      expect.objectContaining({ parse_mode: "Markdown" }),
    );
  });
});
