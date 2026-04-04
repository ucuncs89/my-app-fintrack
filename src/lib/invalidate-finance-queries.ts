import type { api } from "~/trpc/react";

type Utils = ReturnType<typeof api.useUtils>;

const invalidateCoreFinance = async (
  utils: Utils,
  userId: string,
): Promise<void> => {
  await Promise.all([
    utils.dashboard.getSummary.invalidate({ userId }),
    utils.dashboard.getRecentTransactions.invalidate({ userId }),
    utils.dashboard.getMonthlyTrend.invalidate(),
    utils.dashboard.getExpenseByCategory.invalidate({ userId }),
    utils.account.getAll.invalidate({ userId }),
    utils.account.getTotalBalance.invalidate({ userId }),
    utils.budget.getAll.invalidate(),
  ]);
};

export const invalidateAfterTransactionMutation = async (
  utils: Utils,
  userId: string,
): Promise<void> => {
  await Promise.all([
    utils.transaction.getAll.invalidate(),
    invalidateCoreFinance(utils, userId),
  ]);
};

export const invalidateAfterTransferMutation = async (
  utils: Utils,
  userId: string,
): Promise<void> => {
  await Promise.all([
    utils.transfer.getAll.invalidate({ userId }),
    invalidateCoreFinance(utils, userId),
  ]);
};
