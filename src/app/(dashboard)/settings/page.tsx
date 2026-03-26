import { api, HydrateClient } from '~/trpc/server';
import { getSessionUserId } from '~/lib/auth-session';
import { SettingsView } from './_components/settings-view';

export default async function SettingsPage(): Promise<React.ReactElement> {
  const userId = await getSessionUserId();
  let categories: Awaited<ReturnType<typeof api.category.getAll>> = [];
  let accounts: Awaited<ReturnType<typeof api.account.getAll>> = [];

  try {
    [categories, accounts] = await Promise.all([
      api.category.getAll({ userId }),
      api.account.getAll({ userId }),
    ]);
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences.
          </p>
        </div>

        <SettingsView
          initialCategories={categories}
          initialAccounts={accounts}
          userId={userId}
        />
      </div>
    </HydrateClient>
  );
}
