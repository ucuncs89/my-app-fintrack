import { HydrateClient } from '~/trpc/server';
import { getSessionUserId } from '~/lib/auth-session';
import { ReportsView } from './_components/reports-view';

export default async function ReportsPage(): Promise<React.ReactElement> {
  const userId = await getSessionUserId();

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Financial analysis and trends. Select a date range to explore.
          </p>
        </div>

        <ReportsView userId={userId} />
      </div>
    </HydrateClient>
  );
}
