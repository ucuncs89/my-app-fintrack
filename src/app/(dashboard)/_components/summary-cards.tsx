'use client';

import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { StatCard } from '~/components/ui/stat-card';

type SummaryCardsProps = {
  totalBalance: number;
  income: number;
  expense: number;
  netWorth: number;
};

export const SummaryCards = ({
  totalBalance,
  income,
  expense,
  netWorth,
}: SummaryCardsProps): React.ReactElement => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-2">
      <StatCard
        title="Total Balance"
        amount={totalBalance}
        icon={<DollarSign className="size-4" />}
        type="neutral"
        delay={0}
      />
      <StatCard
        title="Income"
        amount={income}
        icon={<ArrowDownLeft className="size-4 text-emerald-500" />}
        type="income"
        trend={{ value: 12.5, label: "from last month", isPositive: true }}
        delay={0.1}
      />
      <StatCard
        title="Expense"
        amount={expense}
        icon={<ArrowUpRight className="size-4 text-destructive" />}
        type="expense"
        trend={{ value: 8.2, label: "from last month", isPositive: false }}
        delay={0.2}
      />
      <StatCard
        title="Net Worth"
        amount={netWorth}
        icon={<TrendingUp className="size-4 text-primary" />}
        type="neutral"
        delay={0.3}
      />
    </div>
  );
};
