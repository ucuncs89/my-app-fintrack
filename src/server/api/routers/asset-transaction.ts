import { z } from 'zod';
import { AssetTransactionType } from '../../../../generated/prisma';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const assetTransactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        assetId: z.string().uuid().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.assetTransaction.findMany({
        where: {
          userId: input.userId,
          ...(input.assetId && { assetId: input.assetId }),
        },
        include: { asset: true, account: true },
        orderBy: { transactionDate: 'desc' },
        take: input.limit,
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        assetId: z.string().uuid(),
        accountId: z.string().uuid(),
        type: z.nativeEnum(AssetTransactionType),
        quantity: z.number().positive(),
        price: z.number().positive(),
        total: z.number().positive(),
        transactionDate: z.date(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const assetTx = await tx.assetTransaction.create({ data: input });

        const balanceChange =
          input.type === 'buy' ? -input.total : input.total;

        await tx.account.update({
          where: { id: input.accountId },
          data: { balance: { increment: balanceChange } },
        });

        return assetTx;
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.$transaction(async (tx) => {
        const assetTx = await tx.assetTransaction.findUniqueOrThrow({
          where: { id: input.id },
        });

        const balanceRevert =
          assetTx.type === 'buy'
            ? Number(assetTx.total)
            : -Number(assetTx.total);

        await tx.account.update({
          where: { id: assetTx.accountId },
          data: { balance: { increment: balanceRevert } },
        });

        return tx.assetTransaction.delete({ where: { id: input.id } });
      });
    }),

  getPortfolioSummary: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const holdings = await ctx.db.assetTransaction.groupBy({
        by: ['assetId'],
        where: { userId: input.userId },
        _sum: {
          quantity: true,
          total: true,
        },
      });

      const assets = await ctx.db.asset.findMany({
        where: { id: { in: holdings.map((h) => h.assetId) } },
        include: {
          assetPrices: {
            orderBy: { priceDate: 'desc' },
            take: 1,
          },
        },
      });

      return holdings.map((holding) => {
        const asset = assets.find((a) => a.id === holding.assetId);
        const currentPrice = asset?.assetPrices[0]?.price ?? 0;
        const totalQuantity = Number(holding._sum.quantity ?? 0);
        const totalCost = Number(holding._sum.total ?? 0);
        const currentValue = totalQuantity * Number(currentPrice);

        return {
          assetId: holding.assetId,
          asset,
          totalQuantity,
          totalCost,
          avgBuyPrice: totalQuantity > 0 ? totalCost / totalQuantity : 0,
          currentPrice: Number(currentPrice),
          currentValue,
          profitLoss: currentValue - totalCost,
        };
      });
    }),
});
