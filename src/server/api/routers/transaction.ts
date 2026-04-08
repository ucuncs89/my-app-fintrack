import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { TransactionType } from '../../../../generated/prisma';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.nativeEnum(TransactionType).optional(),
        categoryId: z.string().uuid().optional(),
        accountId: z.string().uuid().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId, type, categoryId, accountId, startDate, endDate, search, limit, cursor } = input;

      const transactions = await ctx.db.transaction.findMany({
        where: {
          userId,
          ...(type && { type }),
          ...(categoryId && { categoryId }),
          ...(accountId && { accountId }),
          ...(startDate || endDate
            ? {
                transactionDate: {
                  ...(startDate && { gte: startDate }),
                  ...(endDate && { lte: endDate }),
                },
              }
            : {}),
          ...(search && { note: { contains: search, mode: 'insensitive' as const } }),
        },
        include: { account: true, category: true },
        orderBy: { transactionDate: 'desc' },
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (transactions.length > limit) {
        const nextItem = transactions.pop();
        nextCursor = nextItem?.id;
      }

      // Serialize Prisma Decimal → number so Client Components can receive them
      const serialized = transactions.map((tx) => ({
        ...tx,
        amount: Number(tx.amount),
        account: { ...tx.account, balance: Number(tx.account.balance) },
        category: tx.category
          ? { ...tx.category }
          : null,
      }));

      return { transactions: serialized, nextCursor };
    }),

  getById: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.transaction.findFirst({
        where: { id: input.id, userId: input.userId },
        include: { account: true, category: true },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        accountId: z.string().uuid(),
        categoryId: z.string().uuid().optional(),
        type: z.nativeEnum(TransactionType),
        amount: z.number().positive(),
        note: z.string().optional(),
        transactionDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({ data: input });

        const balanceChange =
          input.type === 'income' ? input.amount : -input.amount;

        await tx.account.update({
          where: { id: input.accountId },
          data: { balance: { increment: balanceChange } },
        });

        return transaction;
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional().nullable(),
        type: z.nativeEnum(TransactionType).optional(),
        amount: z.number().positive().optional(),
        note: z.string().optional().nullable(),
        transactionDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, userId, ...patch } = input;

      return ctx.db.$transaction(async (tx) => {
        const old = await tx.transaction.findFirst({
          where: { id, userId },
        });

        if (!old) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transaction not found.',
          });
        }

        const oldAmount = Number(old.amount);
        const revertDelta = old.type === 'income' ? -oldAmount : oldAmount;

        await tx.account.update({
          where: { id: old.accountId },
          data: { balance: { increment: revertDelta } },
        });

        const nextAccountId = patch.accountId ?? old.accountId;
        const nextType = patch.type ?? old.type;
        const nextAmount = patch.amount ?? oldAmount;
        const nextCategoryId =
          patch.categoryId !== undefined ? patch.categoryId : old.categoryId;
        const nextNote = patch.note !== undefined ? patch.note : old.note;
        const nextDate = patch.transactionDate ?? old.transactionDate;

        const updated = await tx.transaction.update({
          where: { id },
          data: {
            accountId: nextAccountId,
            type: nextType,
            amount: nextAmount,
            categoryId: nextCategoryId,
            note: nextNote,
            transactionDate: nextDate,
          },
        });

        const applyDelta = nextType === 'income' ? nextAmount : -nextAmount;

        await tx.account.update({
          where: { id: nextAccountId },
          data: { balance: { increment: applyDelta } },
        });

        return updated;
      });
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const transaction = await tx.transaction.findFirst({
          where: { id: input.id, userId: input.userId },
        });

        if (!transaction) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Transaction not found.',
          });
        }

        const balanceRevert =
          transaction.type === 'income'
            ? -Number(transaction.amount)
            : Number(transaction.amount);

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceRevert } },
        });

        return tx.transaction.delete({ where: { id: input.id } });
      });
    }),

  getMonthlyAggregation: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const [income, expense] = await Promise.all([
        ctx.db.transaction.aggregate({
          where: {
            userId: input.userId,
            type: 'income',
            transactionDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        ctx.db.transaction.aggregate({
          where: {
            userId: input.userId,
            type: 'expense',
            transactionDate: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        income: income._sum.amount ?? 0,
        expense: expense._sum.amount ?? 0,
      };
    }),
});
