// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  claimUpdate,
  executeDurableTool,
  finishUpdate,
  checkpointResponse,
} from "@/lib/telegram/durable";
import { createExpenseForUser } from "@/lib/services/expenses";
import { completeSetupForUser } from "@/lib/services/setup";
import { randomUUID } from "node:crypto";

vi.mock("@/lib/telegram/bot", () => ({
  getBot: () => ({ api: { sendMessage: async () => undefined } }),
}));
import { handleMessage } from "@/lib/telegram/handler";
const url = process.env.AUDIT_TEST_DATABASE_URL;
const userId = `audit-${randomUUID()}`;
const updateId = Math.floor(Date.now() / 10);
const categoryId = `${userId}-category`;
describe.skipIf(!url)("database audit regressions", () => {
  beforeAll(async () => {
    const parsed = new URL(url!);
    if (!["localhost", "127.0.0.1"].includes(parsed.hostname))
      throw new Error("Integration tests require a disposable local database");
    process.env.DATABASE_URL = url;
    await prisma.user.create({
      data: { id: userId, email: `${userId}@example.test`, name: "Before" },
    });
  });
  afterAll(async () => {
    await prisma.telegramUpdate.deleteMany({
      where: { id: { in: [BigInt(updateId), BigInt(updateId + 1)] } },
    });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });
  it("enforces a shared atomic rate limit under concurrent requests", async () => {
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consumeRateLimit(userId, 5, 60)),
    );
    expect(results.filter((r) => r.allowed)).toHaveLength(5);
    expect(results.every((r) => r.retryAfter > 0 && r.retryAfter <= 60)).toBe(
      true,
    );
  });
  it("rolls back onboarding if category seeding fails", async () => {
    await prisma.$executeRawUnsafe(
      `CREATE FUNCTION audit_seed_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.user_id = '${userId}' THEN RAISE EXCEPTION 'forced seed failure'; END IF; RETURN NEW; END $$`,
    );
    await prisma.$executeRawUnsafe(
      `CREATE TRIGGER audit_seed_failure BEFORE INSERT ON categories FOR EACH ROW EXECUTE FUNCTION audit_seed_failure()`,
    );
    try {
      await expect(
        completeSetupForUser(userId, {
          name: "Must roll back",
          locale: "es",
          baseCurrency: "ARS",
        }),
      ).rejects.toThrow();
      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).name,
      ).toBe("Before");
      expect(await prisma.category.count({ where: { userId } })).toBe(0);
    } finally {
      await prisma.$executeRawUnsafe(
        `DROP TRIGGER audit_seed_failure ON categories`,
      );
      await prisma.$executeRawUnsafe(`DROP FUNCTION audit_seed_failure()`);
    }
  });
  it("serializes onboarding and seeds categories only once", async () => {
    await Promise.all(
      Array.from({ length: 4 }, () =>
        completeSetupForUser(userId, {
          name: "After",
          locale: "es",
          baseCurrency: "ARS",
        }),
      ),
    );
    expect(await prisma.category.count({ where: { userId } })).toBe(8);
    await prisma.category.create({
      data: { id: categoryId, userId, name: "Audit", color: "#000000" },
    });
  });
  it("only one instance can claim an update; failed work can retry", async () => {
    const results = await Promise.all(
      Array.from({ length: 8 }, () => claimUpdate(updateId)),
    );
    expect(results.filter((r) => r === "claimed")).toHaveLength(1);
    await finishUpdate(updateId, false);
    expect(await claimUpdate(updateId)).toBe("claimed");
  });
  it("reuses the persisted model plan after a worker restart", async () => {
    let calls = 0;
    const generate = async () => {
      calls++;
      return { role: "assistant" as const, content: "saved", refusal: null };
    };
    await checkpointResponse(updateId, 0, generate);
    expect((await checkpointResponse(updateId, 0, generate)).content).toBe(
      "saved",
    );
    expect(calls).toBe(1);
  });
  it("commits an expense with its receipt and does not repeat it on retry", async () => {
    const execute = async () =>
      JSON.stringify(
        await createExpenseForUser(userId, {
          amount: 12,
          currency: "USD",
          date: "2026-10-14",
          categoryId,
          description: "Durable expense",
        }),
      );
    const first = await executeDurableTool(updateId, "0:0", execute);
    expect(await executeDurableTool(updateId, "0:0", execute)).toBe(first);
    expect(await prisma.expense.count({ where: { userId } })).toBe(1);
  });
  it("rolls back expense writes if the tool fails before its receipt", async () => {
    await expect(
      executeDurableTool(updateId, "0:1", async () => {
        await createExpenseForUser(userId, {
          amount: 22,
          currency: "USD",
          date: "2026-10-14",
          categoryId,
          description: "Rollback",
        });
        throw new Error("interrupted");
      }),
    ).rejects.toThrow("interrupted");
    expect(await prisma.expense.count({ where: { userId } })).toBe(1);
    expect(
      await prisma.telegramToolReceipt.findUnique({
        where: { key: `${updateId}:0:1` },
      }),
    ).toBeNull();
    await finishUpdate(updateId, true);
    expect(await claimUpdate(updateId)).toBe("complete");
  });
  it("replays a consumed link token's successful result on webhook retry", async () => {
    const token = randomUUID();
    const chatId = `99${updateId}`;
    await prisma.telegramLinkToken.create({
      data: { userId, token, expiresAt: new Date(Date.now() + 60_000) },
    });
    await claimUpdate(updateId + 1);
    const message = {
      chatId,
      senderId: chatId,
      chatType: "private",
      text: `/start ${token}`,
      updateId: updateId + 1,
    };
    await handleMessage(message);
    expect(
      await prisma.telegramLinkToken.findUnique({ where: { token } }),
    ).toBeNull();
    await handleMessage(message);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: userId } }))
        .telegramChatId,
    ).toBe(chatId);
    expect(
      (
        await prisma.telegramToolReceipt.findUniqueOrThrow({
          where: { key: `${updateId + 1}:link` },
        })
      ).result,
    ).toContain("Connected successfully");
  });
});
