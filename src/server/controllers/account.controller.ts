import { TRPCError } from "@trpc/server";
import type { AccountType, PrismaClient } from "../../../generated/prisma";

import { toTrpcError } from "~/server/controllers/trpc-errors";

type AccountCreateInput = {
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  balance: number;
};

type AccountUpdateInput = {
  id: string;
  userId: string;
  name?: string;
  type?: AccountType;
  currency?: string;
  balance?: number;
};

const ensureAccountOwnership = async (
  db: PrismaClient,
  id: string,
  userId: string,
): Promise<void> => {
  const row = await db.account.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Account not found or access denied.",
    });
  }
};

export const accountController = {
  getAll: async (db: PrismaClient, userId: string) => {
    try {
      return await db.account.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
    } catch (error) {
      throw toTrpcError(error, "Failed to load accounts.");
    }
  },

  getById: async (db: PrismaClient, id: string, userId: string) => {
    try {
      const account = await db.account.findFirst({
        where: { id, userId },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found or access denied.",
        });
      }

      return account;
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw toTrpcError(error, "Failed to load account.");
    }
  },

  create: async (db: PrismaClient, input: AccountCreateInput) => {
    try {
      return await db.account.create({
        data: {
          userId: input.userId,
          name: input.name,
          type: input.type,
          currency: input.currency,
          balance: input.balance,
        },
      });
    } catch (error) {
      throw toTrpcError(error, "Failed to create account.");
    }
  },

  update: async (db: PrismaClient, input: AccountUpdateInput) => {
    try {
      await ensureAccountOwnership(db, input.id, input.userId);

      const { id, userId, ...patch } = input;
      void userId;
      return await db.account.update({
        where: { id },
        data: patch,
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw toTrpcError(error, "Failed to update account.");
    }
  },

  delete: async (db: PrismaClient, id: string, userId: string) => {
    try {
      await ensureAccountOwnership(db, id, userId);

      return await db.account.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error;
      }
      throw toTrpcError(error, "Failed to delete account.");
    }
  },

  getTotalBalance: async (db: PrismaClient, userId: string) => {
    try {
      const result = await db.account.aggregate({
        where: { userId },
        _sum: { balance: true },
      });

      return result._sum.balance ?? 0;
    } catch (error) {
      throw toTrpcError(error, "Failed to compute total balance.");
    }
  },
};
