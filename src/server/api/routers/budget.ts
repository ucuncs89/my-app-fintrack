import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const budgetRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        month: z.number().min(1).max(12),
        year: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const budgets = await ctx.db.budget.findMany({
        where: {
          userId: input.userId,
          month: input.month,
          year: input.year,
        },
        include: { category: true },
      });

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0, 23, 59, 59);

      const spent = await ctx.db.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId: input.userId,
          type: 'expense',
          transactionDate: { gte: startDate, lte: endDate },
          categoryId: { in: budgets.map((b) => b.categoryId) },
        },
        _sum: { amount: true },
      });

      return budgets.map((budget) => {
        const spentEntry = spent.find((s) => s.categoryId === budget.categoryId);
        const used = Number(spentEntry?._sum.amount ?? 0);
        const budgetAmount = Number(budget.amount);

        return {
          ...budget,
          used,
          remaining: budgetAmount - used,
        };
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        categoryId: z.string().uuid(),
        amount: z.number().positive(),
        month: z.number().min(1).max(12),
        year: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.budget.create({ data: input });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        amount: z.number().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.budget.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.budget.delete({ where: { id: input.id } });
    }),
});
