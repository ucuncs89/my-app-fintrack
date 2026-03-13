'use client';

import {
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

type SummaryCardsProps = {
  totalBalance: number;
  income: number;
  expense: number;
  netWorth: number;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const SummaryCards = ({
  totalBalance,
  income,
  expense,
  netWorth,
}: SummaryCardsProps): React.ReactElement => {
  const cards = [
    {
      title: 'Total Balance',
      value: formatCurrency(totalBalance),
      description: 'Across all accounts',
      icon: DollarSign,
    },
    {
      title: 'Income',
      value: formatCurrency(income),
      description: 'This month',
      icon: ArrowDownLeft,
    },
    {
      title: 'Expense',
      value: formatCurrency(expense),
      description: 'This month',
      icon: ArrowUpRight,
    },
    {
      title: 'Net Worth',
      value: formatCurrency(netWorth),
      description: 'Total assets',
      icon: TrendingUp,
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
