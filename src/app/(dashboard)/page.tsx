import { api, HydrateClient } from '~/trpc/server';
import { SummaryCards } from './_components/summary-cards';
import { MonthlyChart } from './_components/monthly-chart';
import { ExpenseCategoryChart } from './_components/expense-category-chart';
import { RecentTransactions } from './_components/recent-transactions';
import { PortfolioSummary } from './_components/portfolio-summary';

const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

export default async function DashboardPage(): Promise<React.ReactElement> {
  let summary = { totalBalance: 0, income: 0, expense: 0, netWorth: 0 };
  let recentTransactions: Awaited<
    ReturnType<typeof api.dashboard.getRecentTransactions>
  > = [];
  let monthlyTrend: Awaited<
    ReturnType<typeof api.dashboard.getMonthlyTrend>
  > = [];
  let expenseByCategory: Awaited<
    ReturnType<typeof api.dashboard.getExpenseByCategory>
  > = [];
  let portfolio: Awaited<
    ReturnType<typeof api.assetTransaction.getPortfolioSummary>
  > = [];

  try {
    [summary, recentTransactions, monthlyTrend, expenseByCategory, portfolio] =
      await Promise.all([
        api.dashboard.getSummary({ userId: DEMO_USER_ID }),
        api.dashboard.getRecentTransactions({
          userId: DEMO_USER_ID,
          limit: 10,
        }),
        api.dashboard.getMonthlyTrend({ userId: DEMO_USER_ID, months: 6 }),
        api.dashboard.getExpenseByCategory({ userId: DEMO_USER_ID }),
        api.assetTransaction.getPortfolioSummary({ userId: DEMO_USER_ID }),
      ]);
  } catch {
    // DB not available yet, show empty state
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your financial condition.
          </p>
        </div>

        <SummaryCards
          totalBalance={summary.totalBalance}
          income={summary.income}
          expense={summary.expense}
          netWorth={summary.netWorth}
        />

        <div className="grid gap-4 lg:grid-cols-7">
          <MonthlyChart data={monthlyTrend} />
          <ExpenseCategoryChart data={expenseByCategory} />
        </div>

        <div className="grid gap-4 lg:grid-cols-7">
          <RecentTransactions transactions={recentTransactions} />
          <PortfolioSummary holdings={portfolio} />
        </div>
      </div>
    </HydrateClient>
  );
}
