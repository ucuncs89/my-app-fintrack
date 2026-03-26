import { api, HydrateClient } from '~/trpc/server';
import { getSessionUserId } from '~/lib/auth-session';
import { AccountList } from './_components/account-list';

export default async function AccountsPage(): Promise<React.ReactElement> {
  const userId = await getSessionUserId();
  let accounts: Awaited<ReturnType<typeof api.account.getAll>> = [];
  let totalBalance: Awaited<ReturnType<typeof api.account.getTotalBalance>> = 0;

  try {
    [accounts, totalBalance] = await Promise.all([
      api.account.getAll({ userId }),
      api.account.getTotalBalance({ userId }),
    ]);
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your bank accounts, wallets, and savings.
          </p>
        </div>

        <AccountList
          initialAccounts={accounts}
          initialTotalBalance={totalBalance}
          userId={userId}
        />
      </div>
    </HydrateClient>
  );
}
