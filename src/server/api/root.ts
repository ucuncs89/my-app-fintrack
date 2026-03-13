import { accountRouter } from '~/server/api/routers/account';
import { assetRouter } from '~/server/api/routers/asset';
import { assetTransactionRouter } from '~/server/api/routers/asset-transaction';
import { budgetRouter } from '~/server/api/routers/budget';
import { categoryRouter } from '~/server/api/routers/category';
import { dashboardRouter } from '~/server/api/routers/dashboard';
import { recurringRouter } from '~/server/api/routers/recurring';
import { transactionRouter } from '~/server/api/routers/transaction';
import { transferRouter } from '~/server/api/routers/transfer';
import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc';

export const appRouter = createTRPCRouter({
  account: accountRouter,
  asset: assetRouter,
  assetTransaction: assetTransactionRouter,
  budget: budgetRouter,
  category: categoryRouter,
  dashboard: dashboardRouter,
  recurring: recurringRouter,
  transaction: transactionRouter,
  transfer: transferRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
