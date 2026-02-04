import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { POST, DELETE } from "../route";
import { NextRequest } from "next/server";

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/telegram/link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Telegram Link API", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  describe("POST /api/telegram/link", () => {
    it("returns 401 when unauthenticated", async () => {
      mockUnauthenticated();
      const req = createRequest({ token: "abc123" });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 400 for missing token", async () => {
      mockAuth();
      const req = createRequest({});
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid token", async () => {
      mockAuth();
      prismaMock.telegramLinkToken.findUnique.mockResolvedValue(null);

      const req = createRequest({ token: "invalid" });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Invalid");
    });

    it("returns 400 for expired token", async () => {
      mockAuth();
      prismaMock.telegramLinkToken.findUnique.mockResolvedValue({
        id: "lt-1",
        token: "abc123",
        chatId: "999",
        expiresAt: new Date(Date.now() - 60000), // expired
        createdAt: new Date(),
      } as never);
      prismaMock.telegramLinkToken.delete.mockResolvedValue({} as never);

      const req = createRequest({ token: "abc123" });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("expired");
    });

    it("links telegram account on valid token", async () => {
      mockAuth("user-1");
      prismaMock.telegramLinkToken.findUnique.mockResolvedValue({
        id: "lt-1",
        token: "abc123",
        chatId: "999",
        expiresAt: new Date(Date.now() + 60000), // valid
        createdAt: new Date(),
      } as never);
      prismaMock.user.update.mockResolvedValue({} as never);
      prismaMock.telegramLinkToken.delete.mockResolvedValue({} as never);

      const req = createRequest({ token: "abc123" });
      const res = await POST(req);
      expect(res.status).toBe(200);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { telegramChatId: "999" },
      });
      expect(prismaMock.telegramLinkToken.delete).toHaveBeenCalledWith({
        where: { id: "lt-1" },
      });
    });
  });

  describe("DELETE /api/telegram/link", () => {
    it("returns 401 when unauthenticated", async () => {
      mockUnauthenticated();
      const res = await DELETE();
      expect(res.status).toBe(401);
    });

    it("unlinks telegram account", async () => {
      mockAuth("user-1");
      prismaMock.user.update.mockResolvedValue({} as never);
      prismaMock.telegramMessage.deleteMany.mockResolvedValue({
        count: 0,
      } as never);

      const res = await DELETE();
      expect(res.status).toBe(200);

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { telegramChatId: null },
      });
    });
  });
});
