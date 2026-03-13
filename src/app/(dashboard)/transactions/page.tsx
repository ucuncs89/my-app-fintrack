import { api, HydrateClient } from '~/trpc/server';
import { DEMO_USER_ID } from '~/lib/format';
import { TransactionList } from './_components/transaction-list';

export default async function TransactionsPage(): Promise<React.ReactElement> {
  let transactions: Awaited<
    ReturnType<typeof api.transaction.getAll>
  > = { transactions: [], nextCursor: undefined };

  try {
    transactions = await api.transaction.getAll({
      userId: DEMO_USER_ID,
      limit: 50,
    });
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage all your income, expense, transfer, and investment
            transactions.
          </p>
        </div>

        <TransactionList transactions={transactions.transactions} />
      </div>
    </HydrateClient>
  );
}
