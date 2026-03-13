import { api, HydrateClient } from '~/trpc/server';
import { DEMO_USER_ID } from '~/lib/format';
import { BudgetList } from './_components/budget-list';

export default async function BudgetPage(): Promise<React.ReactElement> {
  const now = new Date();
  let budgets: Awaited<ReturnType<typeof api.budget.getAll>> = [];

  try {
    budgets = await api.budget.getAll({
      userId: DEMO_USER_ID,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    });
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

        <BudgetList budgets={budgets} />
      </div>
    </HydrateClient>
  );
}
