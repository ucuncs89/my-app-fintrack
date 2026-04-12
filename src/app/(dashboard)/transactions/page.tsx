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
    const [txPage, transfers, accounts, categories] =
      await Promise.all([
        api.transaction.getAll({ userId, limit: 50 }),
        api.transfer.getAll({ userId, limit: 50 }),
        api.account.getAll({ userId }),
        api.category.getAll({ userId }),
      ]);

    // Serialize to plain objects to avoid Decimal serialization issues between Server and Client Components
    initialTransactionPage = JSON.parse(JSON.stringify(txPage)) as typeof txPage;
    initialTransfers = JSON.parse(JSON.stringify(transfers)) as typeof transfers;
    initialAccounts = JSON.parse(JSON.stringify(accounts)) as typeof accounts;
    initialCategories = JSON.parse(JSON.stringify(categories)) as typeof categories;
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage income, expenses, investments, and transfers.
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
