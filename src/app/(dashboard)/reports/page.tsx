import { api, HydrateClient } from '~/trpc/server';
import { DEMO_USER_ID } from '~/lib/format';
import { ReportsView } from './_components/reports-view';

export default async function ReportsPage(): Promise<React.ReactElement> {
  let monthlyTrend: Awaited<
    ReturnType<typeof api.dashboard.getMonthlyTrend>
  > = [];
  let expenseByCategory: Awaited<
    ReturnType<typeof api.dashboard.getExpenseByCategory>
  > = [];

  try {
    [monthlyTrend, expenseByCategory] = await Promise.all([
      api.dashboard.getMonthlyTrend({ userId: DEMO_USER_ID, months: 12 }),
      api.dashboard.getExpenseByCategory({ userId: DEMO_USER_ID }),
    ]);
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Financial analysis and trends.
          </p>
        </div>

        <ReportsView
          monthlyTrend={monthlyTrend}
          expenseByCategory={expenseByCategory}
        />
      </div>
    </HydrateClient>
  );
}
