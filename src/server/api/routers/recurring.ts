import { z } from 'zod';
import {
  RecurringFrequency,
  TransactionType,
} from '../../../../generated/prisma';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const recurringRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.recurringTransaction.findMany({
        where: { userId: input.userId },
        include: { account: true, category: true },
        orderBy: { nextRun: 'asc' },
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
        frequency: z.nativeEnum(RecurringFrequency),
        nextRun: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.recurringTransaction.create({ data: input });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        type: z.nativeEnum(TransactionType).optional(),
        amount: z.number().positive().optional(),
        frequency: z.nativeEnum(RecurringFrequency).optional(),
        nextRun: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.recurringTransaction.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.recurringTransaction.delete({
        where: { id: input.id },
      });
    }),
});
