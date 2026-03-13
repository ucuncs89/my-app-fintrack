import { z } from 'zod';
import { CategoryType } from '../../../../generated/prisma';

import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const categoryRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.category.findMany({
        where: { userId: input.userId },
        orderBy: { name: 'asc' },
      });
    }),

  getByType: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        type: z.nativeEnum(CategoryType),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.category.findMany({
        where: { userId: input.userId, type: input.type },
        orderBy: { name: 'asc' },
      });
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        name: z.string().min(1),
        type: z.nativeEnum(CategoryType),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.create({ data: input });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        type: z.nativeEnum(CategoryType).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.category.update({ where: { id }, data });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.delete({ where: { id: input.id } });
    }),
});
