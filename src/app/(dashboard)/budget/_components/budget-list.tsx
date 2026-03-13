'use client';

import { cn } from '~/lib/utils';
import { formatCurrency } from '~/lib/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Badge } from '~/components/ui/badge';

type BudgetItem = {
  id: string;
  amount: unknown;
  category: { name: string };
  used: number;
  remaining: number;
};

type BudgetListProps = {
  budgets: BudgetItem[];
};

export const BudgetList = ({
  budgets,
}: BudgetListProps): React.ReactElement => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Budget</CardTitle>
        <CardDescription>
          {budgets.length} budget{budgets.length !== 1 ? 's' : ''} set for this
          month
        </CardDescription>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No budgets set for this month. Create budgets to start tracking.
          </div>
        ) : (
          <div className="space-y-6">
            {budgets.map((budget) => {
              const budgetAmount = Number(budget.amount);
              const percentage =
                budgetAmount > 0
                  ? Math.min((budget.used / budgetAmount) * 100, 100)
                  : 0;
              const isOverBudget = budget.remaining < 0;

              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        {budget.category.name}
                      </p>
                      {isOverBudget && (
                        <Badge variant="destructive">Over budget</Badge>
                      )}
                      {!isOverBudget && percentage > 80 && (
                        <Badge variant="outline">Almost full</Badge>
                      )}
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {formatCurrency(budget.used)} / {formatCurrency(budgetAmount)}
                    </p>
                  </div>
                  <Progress
                    value={percentage}
                    className={cn(
                      'h-2',
                      isOverBudget
                        ? '[&>[data-slot=progress-indicator]]:bg-destructive'
                        : percentage > 80
                          ? '[&>[data-slot=progress-indicator]]:bg-amber-500'
                          : '[&>[data-slot=progress-indicator]]:bg-green-500'
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used: {formatCurrency(budget.used)}</span>
                    <span className={cn(isOverBudget && 'text-destructive')}>
                      {isOverBudget ? 'Over: ' : 'Left: '}
                      {formatCurrency(Math.abs(budget.remaining))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
