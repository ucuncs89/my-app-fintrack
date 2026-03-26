import { z } from 'zod';
import { AccountType } from '../../../../generated/prisma';

import { accountController } from '~/server/controllers/account.controller';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

const accountInput = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AccountType),
  currency: z.string().default('IDR'),
  balance: z.number().default(0),
});

const userIdUuid = z.string().uuid();

export const accountRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ userId: userIdUuid }))
    .query(async ({ ctx, input }) => {
      return accountController.getAll(ctx.db, input.userId);
    }),

  getById: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: userIdUuid,
      })
    )
    .query(async ({ ctx, input }) => {
      return accountController.getById(ctx.db, input.id, input.userId);
    }),

  create: publicProcedure
    .input(accountInput.extend({ userId: userIdUuid }))
    .mutation(async ({ ctx, input }) => {
      return accountController.create(ctx.db, input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: userIdUuid,
        name: z.string().min(1).optional(),
        type: z.nativeEnum(AccountType).optional(),
        currency: z.string().optional(),
        balance: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return accountController.update(ctx.db, input);
    }),

  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        userId: userIdUuid,
      })
    )
    .mutation(async ({ ctx, input }) => {
      return accountController.delete(ctx.db, input.id, input.userId);
    }),

  getTotalBalance: publicProcedure
    .input(z.object({ userId: userIdUuid }))
    .query(async ({ ctx, input }) => {
      return accountController.getTotalBalance(ctx.db, input.userId);
    }),
});
