import { api, HydrateClient } from "~/trpc/server";
import { getSessionUserId } from "~/lib/auth-session";
import { TransactionsPageClient } from "./_components/transactions-page-client";

export default async function TransactionsPage(): Promise<React.ReactElement> {
  const userId = await getSessionUserId();

  let initialTransactionPage: Awaited<
    ReturnType<typeof api.transaction.getAll>
  > = { transactions: [], nextCursor: undefined };
  let initialTransfers: Awaited<ReturnType<typeof api.transfer.getAll>> = [];
  let initialAccounts: Awaited<ReturnType<typeof api.account.getAll>> = [];
  let initialCategories: Awaited<ReturnType<typeof api.category.getAll>> = [];

  try {
    [initialTransactionPage, initialTransfers, initialAccounts, initialCategories] =
      await Promise.all([
        api.transaction.getAll({ userId, limit: 50 }),
        api.transfer.getAll({ userId, limit: 50 }),
        api.account.getAll({ userId }),
        api.category.getAll({ userId }),
      ]);
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage income, expense, and investment entries, or move money
            between accounts.
          </p>
        </div>

        <TransactionsPageClient
          userId={userId}
          initialTransactionPage={initialTransactionPage}
          initialTransfers={initialTransfers}
          initialAccounts={initialAccounts}
          initialCategories={initialCategories}
        />
      </div>
    </HydrateClient>
  );
}
