import { prisma } from "@/lib/db";
import { withExpenseDb } from "@/lib/expense-db";
import type { Prisma } from "@/generated/prisma/client";
import type { ChatCompletionMessage } from "openai/resources/chat/completions";
export async function claimUpdate(updateId: number) {
  const id = BigInt(updateId);
  await prisma.telegramUpdate.createMany({
    data: [{ id }],
    skipDuplicates: true,
  });
  const claimed = await prisma.telegramUpdate.updateMany({
    where: {
      id,
      status: { not: "complete" },
      OR: [{ leaseUntil: null }, { leaseUntil: { lt: new Date() } }],
    },
    data: { status: "processing", leaseUntil: new Date(Date.now() + 600_000) },
  });
  if (claimed.count === 1) return "claimed";
  return (await prisma.telegramUpdate.findUniqueOrThrow({ where: { id } }))
    .status === "complete"
    ? "complete"
    : "busy";
}
export async function finishUpdate(updateId: number, success: boolean) {
  await prisma.telegramUpdate.update({
    where: { id: BigInt(updateId) },
    data: {
      status: success ? "complete" : "pending",
      leaseUntil: null,
      ...(success ? { completedAt: new Date() } : {}),
    },
  });
}
export async function checkpointResponse(
  updateId: number,
  iteration: number,
  generate: () => Promise<ChatCompletionMessage>,
) {
  const update = await prisma.telegramUpdate.findUniqueOrThrow({
    where: { id: BigInt(updateId) },
  });
  const responses = update.responses as unknown as ChatCompletionMessage[];
  if (responses[iteration]) return responses[iteration];
  const response = await generate();
  responses.push(response);
  await prisma.telegramUpdate.update({
    where: { id: BigInt(updateId) },
    data: { responses: responses as unknown as Prisma.InputJsonValue },
  });
  return response;
}
export async function executeDurableTool(
  updateId: number,
  step: string,
  execute: () => Promise<string>,
) {
  const key = `${updateId}:${step}`;
  return prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM telegram_updates WHERE id = ${BigInt(updateId)} FOR UPDATE`;
      const previous = await tx.telegramToolReceipt.findUnique({
        where: { key },
      });
      if (previous) return previous.result;
      let result: string;
      try {
        result = await withExpenseDb(tx, execute);
      } catch (error) {
        // Input/ownership failures are tool results, so the assistant can correct
        // the plan. Infrastructure failures roll back and let Telegram retry.
        if (
          error instanceof Error &&
          (error.name === "ZodError" ||
            ["Category not found", "Expense not found"].includes(error.message))
        )
          result = JSON.stringify({ error: error.message });
        else throw error;
      }
      await tx.telegramToolReceipt.create({
        data: { key, updateId: BigInt(updateId), result },
      });
      return result;
    },
    { timeout: 60_000 },
  );
}
