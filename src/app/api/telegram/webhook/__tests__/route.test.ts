import { after, NextRequest } from "next/server";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "../route";
import { handleMessage } from "@/lib/telegram/handler";

vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: vi.fn((callback: () => unknown) => callback()),
}));
vi.mock("@/lib/telegram/handler", () => ({
  handleMessage: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/telegram/dedup", () => ({
  isDuplicate: vi.fn().mockReturnValue(false),
}));
const message = {
  chat: { id: 123, type: "private" },
  from: { id: 123, is_bot: false },
  text: "/start secret-link",
};
const request = (body: unknown, secret = "webhook-secret") =>
  new NextRequest("http://localhost/api/telegram/webhook", {
    method: "POST",
    headers: { "x-telegram-bot-api-secret-token": secret },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "webhook-secret");
});
afterEach(() => vi.unstubAllEnvs());

describe("Telegram webhook privacy", () => {
  it.each(["group", "supergroup", "channel"])(
    "ignores %s chat links and messages",
    async (type) => {
      const response = await POST(
        request({
          update_id: 1,
          message: { ...message, chat: { id: -100123, type } },
        }),
      );
      expect(response.status).toBe(200);
      expect(after).not.toHaveBeenCalled();
      expect(handleMessage).not.toHaveBeenCalled();
    },
  );
  it("rejects mismatched senders in private chats", async () => {
    await POST(
      request({
        update_id: 2,
        message: { ...message, from: { id: 456, is_bot: false } },
      }),
    );
    expect(handleMessage).not.toHaveBeenCalled();
  });
  it("ignores messages from bots", async () => {
    await POST(
      request({
        update_id: 3,
        message: { ...message, from: { id: 123, is_bot: true } },
      }),
    );
    expect(handleMessage).not.toHaveBeenCalled();
  });
  it("handles matching private senders", async () => {
    const response = await POST(request({ update_id: 4, message }));
    expect(response.status).toBe(200);
    expect(handleMessage).toHaveBeenCalledWith({
      chatId: "123",
      senderId: "123",
      chatType: "private",
      text: "/start secret-link",
      voiceFileId: undefined,
    });
  });
  it("ignores voice messages in groups", async () => {
    await POST(
      request({
        update_id: 5,
        message: {
          chat: { id: -123, type: "group" },
          from: message.from,
          voice: { file_id: "voice-1" },
        },
      }),
    );
    expect(handleMessage).not.toHaveBeenCalled();
  });
  it("requires a valid webhook secret", async () => {
    expect(
      (await POST(request({ update_id: 6, message }, "wrong"))).status,
    ).toBe(401);
    expect(handleMessage).not.toHaveBeenCalled();
  });
  it("does not allow an empty configured secret", async () => {
    vi.stubEnv("TELEGRAM_WEBHOOK_SECRET", "");
    expect((await POST(request({ update_id: 7, message }, ""))).status).toBe(
      401,
    );
  });
  it("rejects malformed updates without scheduling work", async () => {
    expect((await POST(request({ update_id: "wrong", message }))).status).toBe(
      400,
    );
    expect(after).not.toHaveBeenCalled();
  });
});
