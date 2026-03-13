import { api, HydrateClient } from '~/trpc/server';
import { DEMO_USER_ID } from '~/lib/format';
import { SettingsView } from './_components/settings-view';

export default async function SettingsPage(): Promise<React.ReactElement> {
  let categories: Awaited<ReturnType<typeof api.category.getAll>> = [];
  let accounts: Awaited<ReturnType<typeof api.account.getAll>> = [];

  try {
    [categories, accounts] = await Promise.all([
      api.category.getAll({ userId: DEMO_USER_ID }),
      api.account.getAll({ userId: DEMO_USER_ID }),
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

        <SettingsView categories={categories} accounts={accounts} />
      </div>
    </HydrateClient>
  );
}
