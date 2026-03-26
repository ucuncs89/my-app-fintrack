import { z } from 'zod';
import { CategoryType } from '../../../../generated/prisma';

import { categoryController } from '~/server/controllers/category.controller';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

const userIdUuid = z.string().uuid();

export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ userId: userIdUuid }))
    .query(async ({ ctx, input }) => {
      return categoryController.getAll(ctx.db, input.userId);
    }),

  getById: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: userIdUuid,
      })
    )
    .query(async ({ ctx, input }) => {
      return categoryController.getById(ctx.db, input.id, input.userId);
    }),

  getByType: publicProcedure
    .input(
      z.object({
        userId: userIdUuid,
        type: z.nativeEnum(CategoryType),
      })
    )
    .query(async ({ ctx, input }) => {
      return categoryController.getByType(ctx.db, input.userId, input.type);
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: userIdUuid,
        name: z.string().min(1),
        type: z.nativeEnum(CategoryType),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return categoryController.create(ctx.db, input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: userIdUuid,
        name: z.string().min(1).optional(),
        type: z.nativeEnum(CategoryType).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return categoryController.update(ctx.db, input);
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: userIdUuid,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return categoryController.delete(ctx.db, input.id, input.userId);
    }),
});
