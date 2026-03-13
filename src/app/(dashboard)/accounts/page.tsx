import { api, HydrateClient } from '~/trpc/server';
import { DEMO_USER_ID } from '~/lib/format';
import { AccountList } from './_components/account-list';

export default async function AccountsPage(): Promise<React.ReactElement> {
  let accounts: Awaited<ReturnType<typeof api.account.getAll>> = [];

  try {
    accounts = await api.account.getAll({ userId: DEMO_USER_ID });
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

        <AccountList accounts={accounts} />
      </div>
    </HydrateClient>
  );
}
