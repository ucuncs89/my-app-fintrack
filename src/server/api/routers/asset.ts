import { z } from 'zod';
import { AssetType } from '../../../../generated/prisma';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const assetRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.asset.findMany({
      orderBy: { name: 'asc' },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.asset.findUnique({
        where: { id: input.id },
        include: {
          assetPrices: {
            orderBy: { priceDate: 'desc' },
            take: 1,
          },
        },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        symbol: z.string().optional(),
        type: z.nativeEnum(AssetType),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.asset.create({ data: input });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        symbol: z.string().optional(),
        type: z.nativeEnum(AssetType).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.asset.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.asset.delete({ where: { id: input.id } });
    }),

  updatePrice: publicProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        price: z.number().positive(),
        priceDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.assetPrice.create({ data: input });
    }),

  getPriceHistory: publicProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        limit: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.assetPrice.findMany({
        where: { assetId: input.assetId },
        orderBy: { priceDate: 'desc' },
        take: input.limit,
      });
    }),
});
