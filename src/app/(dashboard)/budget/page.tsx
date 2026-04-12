import { api, HydrateClient } from '~/trpc/server';
import { getSessionUserId } from '~/lib/auth-session';
import { BudgetList } from './_components/budget-list';

export default async function BudgetPage(): Promise<React.ReactElement> {
  const userId = await getSessionUserId();
  const now = new Date();
  let budgets: Awaited<ReturnType<typeof api.budget.getAll>> = [];
  let categories: Awaited<ReturnType<typeof api.category.getAll>> = [];

  try {
    const [budgetsData, categoriesData] = await Promise.all([
      api.budget.getAll({
        userId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      }),
      api.category.getAll({ userId }),
    ]);

    budgets = JSON.parse(JSON.stringify(budgetsData));
    categories = JSON.parse(JSON.stringify(categoriesData));
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budget</h1>
          <p className="text-muted-foreground">
            Set and track monthly budgets by category.
          </p>
        </div>

        <BudgetList
          initialBudgets={budgets}
          initialCategories={categories}
          userId={userId}
        />
      </div>
    </HydrateClient>
  );
}
