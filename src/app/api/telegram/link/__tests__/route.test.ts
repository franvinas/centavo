import { describe, it, expect, beforeEach } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test-utils/prisma-mock";
import { mockAuth, mockUnauthenticated } from "@/test-utils/auth-mock";
import { POST, DELETE } from "../route";

describe("Telegram Link API", () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  describe("POST /api/telegram/link", () => {
    it("returns 401 when unauthenticated", async () => {
      mockUnauthenticated();
      const res = await POST();
      expect(res.status).toBe(401);
    });

    it("creates a deep link for Telegram connection", async () => {
      mockAuth("user-1");
      prismaMock.telegramLinkToken.upsert.mockResolvedValue({
        id: "lt-1",
        token: "generated-token",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60000),
        createdAt: new Date(),
      } as never);

      const res = await POST();
      expect(res.status).toBe(200);

      expect(prismaMock.telegramLinkToken.upsert).toHaveBeenCalledWith({
        where: { userId: "user-1" },
        update: expect.objectContaining({
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
        create: expect.objectContaining({
          userId: "user-1",
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.url).toContain("https://t.me/CentaBot?start=");
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
