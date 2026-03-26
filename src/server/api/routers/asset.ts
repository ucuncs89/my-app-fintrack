import { z } from 'zod';
import { AssetType } from '../../../../generated/prisma';

import { assetController } from '~/server/controllers/asset.controller';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const assetRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return assetController.getAll(ctx.db);
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return assetController.getById(ctx.db, input.id);
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
      return assetController.create(ctx.db, input);
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
      return assetController.update(ctx.db, input);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return assetController.delete(ctx.db, input.id);
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
      return assetController.updatePrice(ctx.db, input);
    }),

  getPriceHistory: publicProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        limit: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      return assetController.getPriceHistory(
        ctx.db,
        input.assetId,
        input.limit
      );
    }),
});
