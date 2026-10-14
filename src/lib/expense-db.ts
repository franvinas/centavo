import { AsyncLocalStorage } from "node:async_hooks";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
const context = new AsyncLocalStorage<Prisma.TransactionClient>();
export const getExpenseDb = () => context.getStore() ?? prisma;
export const withExpenseDb = <T>(
  db: Prisma.TransactionClient,
  callback: () => Promise<T>,
) => context.run(db, callback);
