import { z } from 'zod';
import { AccountType } from '../../../../generated/prisma';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

const accountInput = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AccountType),
  currency: z.string().default('IDR'),
  balance: z.number().default(0),
});

export const accountRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.account.findMany({
        where: { userId: input.userId },
        orderBy: { createdAt: 'desc' },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.account.findUnique({
        where: { id: input.id },
      });
    }),

  create: publicProcedure
    .input(accountInput.extend({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.account.create({
        data: {
          userId: input.userId,
          name: input.name,
          type: input.type,
          currency: input.currency,
          balance: input.balance,
        },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        type: z.nativeEnum(AccountType).optional(),
        currency: z.string().optional(),
        balance: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.account.update({
        where: { id },
        data,
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.account.delete({
        where: { id: input.id },
      });
    }),

  getTotalBalance: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.account.aggregate({
        where: { userId: input.userId },
        _sum: { balance: true },
      });
      return result._sum.balance ?? 0;
    }),
});
