import { z } from 'zod';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const transferRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await ctx.db.transferTransaction.findMany({
        where: { userId: input.userId },
        include: { fromAccount: true, toAccount: true },
        orderBy: { transactionDate: 'desc' },
        take: input.limit,
      });
      // Serialize Prisma Decimal → number
      return results.map((t) => ({
        ...t,
        amount: Number(t.amount),
        fromAccount: { ...t.fromAccount, balance: Number(t.fromAccount.balance) },
        toAccount: { ...t.toAccount, balance: Number(t.toAccount.balance) },
      }));
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        fromAccountId: z.string().uuid(),
        toAccountId: z.string().uuid(),
        amount: z.number().positive(),
        note: z.string().optional(),
        transactionDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const transfer = await tx.transferTransaction.create({ data: input });

        await tx.account.update({
          where: { id: input.fromAccountId },
          data: { balance: { decrement: input.amount } },
        });

        await tx.account.update({
          where: { id: input.toAccountId },
          data: { balance: { increment: input.amount } },
        });

        return transfer;
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const transfer = await tx.transferTransaction.findUniqueOrThrow({
          where: { id: input.id },
        });

        await tx.account.update({
          where: { id: transfer.fromAccountId },
          data: { balance: { increment: Number(transfer.amount) } },
        });

        await tx.account.update({
          where: { id: transfer.toAccountId },
          data: { balance: { decrement: Number(transfer.amount) } },
        });

        return tx.transferTransaction.delete({ where: { id: input.id } });
      });
    }),
});
