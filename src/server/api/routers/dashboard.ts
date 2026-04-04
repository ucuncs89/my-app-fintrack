import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const dashboardRouter = createTRPCRouter({
  getSummary: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const [totalBalance, monthlyIncome, monthlyExpense] = await Promise.all([
        ctx.db.account.aggregate({
          where: { userId: input.userId },
          _sum: { balance: true },
        }),
        ctx.db.transaction.aggregate({
          where: {
            userId: input.userId,
            type: 'income',
            transactionDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
        ctx.db.transaction.aggregate({
          where: {
            userId: input.userId,
            type: 'expense',
            transactionDate: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
        }),
      ]);

      return {
        totalBalance: Number(totalBalance._sum.balance ?? 0),
        income: Number(monthlyIncome._sum.amount ?? 0),
        expense: Number(monthlyExpense._sum.amount ?? 0),
        netWorth: Number(totalBalance._sum.balance ?? 0),
      };
    }),

  getRecentTransactions: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const [transactions, transfers] = await Promise.all([
        ctx.db.transaction.findMany({
          where: { userId: input.userId },
          include: { account: true, category: true },
          orderBy: { transactionDate: 'desc' },
          take: input.limit,
        }),
        ctx.db.transferTransaction.findMany({
          where: { userId: input.userId },
          include: { fromAccount: true, toAccount: true },
          orderBy: { transactionDate: 'desc' },
          take: input.limit,
        }),
      ]);

      type UnifiedTransaction = {
        id: string;
        type: string;
        amount: number;
        note: string | null;
        transactionDate: Date;
        accountName: string;
        categoryName: string | null;
        toAccountName?: string;
      };

      const unified: UnifiedTransaction[] = [
        ...transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          note: t.note,
          transactionDate: t.transactionDate,
          accountName: t.account.name,
          categoryName: t.category?.name ?? null,
        })),
        ...transfers.map((t) => ({
          id: t.id,
          type: 'transfer' as const,
          amount: Number(t.amount),
          note: t.note,
          transactionDate: t.transactionDate,
          accountName: t.fromAccount.name,
          categoryName: null,
          toAccountName: t.toAccount.name,
        })),
      ];

      unified.sort(
        (a, b) =>
          b.transactionDate.getTime() - a.transactionDate.getTime()
      );

      return unified.slice(0, input.limit);
    }),

  getMonthlyTrend: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        months: z.number().min(1).max(24).default(6),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const results = [];

      for (let i = input.months - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59
        );

        const [income, expense] = await Promise.all([
          ctx.db.transaction.aggregate({
            where: {
              userId: input.userId,
              type: 'income',
              transactionDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
          ctx.db.transaction.aggregate({
            where: {
              userId: input.userId,
              type: 'expense',
              transactionDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
        ]);

        results.push({
          month: start.toLocaleString('default', { month: 'short' }),
          year: start.getFullYear(),
          income: Number(income._sum.amount ?? 0),
          expense: Number(expense._sum.amount ?? 0),
        });
      }

      return results;
    }),

  getExpenseByCategory: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const expenses = await ctx.db.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: input.userId,
          type: 'expense',
          transactionDate: { gte: startOfMonth, lte: endOfMonth },
          categoryId: { not: null },
        },
        _sum: { amount: true },
      });

      const categoryIds = expenses
        .map((e) => e.categoryId)
        .filter((id): id is string => id !== null);

      const categories = await ctx.db.category.findMany({
        where: { id: { in: categoryIds } },
      });

      return expenses.map((e) => ({
        category:
          categories.find((c) => c.id === e.categoryId)?.name ?? 'Unknown',
        amount: Number(e._sum.amount ?? 0),
      }));
    }),

  getMonthlyTrendByRange: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        startYear: z.number(),
        startMonth: z.number().min(1).max(12),
        endYear: z.number(),
        endMonth: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = [];

      let year = input.startYear;
      let month = input.startMonth;

      while (
        year < input.endYear ||
        (year === input.endYear && month <= input.endMonth)
      ) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59);

        const [income, expense] = await Promise.all([
          ctx.db.transaction.aggregate({
            where: {
              userId: input.userId,
              type: 'income',
              transactionDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
          ctx.db.transaction.aggregate({
            where: {
              userId: input.userId,
              type: 'expense',
              transactionDate: { gte: start, lte: end },
            },
            _sum: { amount: true },
          }),
        ]);

        results.push({
          month: start.toLocaleString('default', { month: 'short' }),
          year,
          income: Number(income._sum.amount ?? 0),
          expense: Number(expense._sum.amount ?? 0),
        });

        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }

      return results;
    }),

  getExpenseByCategoryByRange: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        startYear: z.number(),
        startMonth: z.number().min(1).max(12),
        endYear: z.number(),
        endMonth: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.startYear, input.startMonth - 1, 1);
      const endDate = new Date(input.endYear, input.endMonth, 0, 23, 59, 59);

      const expenses = await ctx.db.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: input.userId,
          type: 'expense',
          transactionDate: { gte: startDate, lte: endDate },
          categoryId: { not: null },
        },
        _sum: { amount: true },
      });

      const categoryIds = expenses
        .map((e) => e.categoryId)
        .filter((id): id is string => id !== null);

      const categories = await ctx.db.category.findMany({
        where: { id: { in: categoryIds } },
      });

      return expenses
        .map((e) => ({
          category:
            categories.find((c) => c.id === e.categoryId)?.name ?? 'Unknown',
          amount: Number(e._sum.amount ?? 0),
        }))
        .sort((a, b) => b.amount - a.amount);
    }),
});

