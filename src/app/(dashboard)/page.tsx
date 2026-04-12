import { api, HydrateClient } from '~/trpc/server';
import { getSessionUserId } from '~/lib/auth-session';
import { SummaryCards } from './_components/summary-cards';
import { AIInsight } from './_components/ai-insight';
import { MonthlyChart } from './_components/monthly-chart';
import { ExpenseCategoryChart } from './_components/expense-category-chart';
import { RecentTransactions } from './_components/recent-transactions';
import { PortfolioSummary } from './_components/portfolio-summary';

export default async function DashboardPage(): Promise<React.ReactElement> {
  const userId = await getSessionUserId();
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
    const [summaryData, recentTx, trend, cat, port] =
      await Promise.all([
        api.dashboard.getSummary({ userId }),
        api.dashboard.getRecentTransactions({
          userId,
          limit: 10,
        }),
        api.dashboard.getMonthlyTrend({ userId, months: 6 }),
        api.dashboard.getExpenseByCategory({ userId }),
        api.assetTransaction.getPortfolioSummary({ userId }),
      ]);

    // Serialize to plain objects to avoid Decimal serialization issues between Server and Client Components
    summary = JSON.parse(JSON.stringify(summaryData)) as typeof summary;
    recentTransactions = JSON.parse(JSON.stringify(recentTx)) as typeof recentTransactions;
    monthlyTrend = JSON.parse(JSON.stringify(trend)) as typeof monthlyTrend;
    expenseByCategory = JSON.parse(JSON.stringify(cat)) as typeof expenseByCategory;
    portfolio = JSON.parse(JSON.stringify(port)) as typeof portfolio;
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

        <AIInsight userId={userId} />

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
