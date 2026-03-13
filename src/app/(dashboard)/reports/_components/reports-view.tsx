'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';

type MonthlyData = {
  month: string;
  year: number;
  income: number;
  expense: number;
};

type CategoryData = {
  category: string;
  amount: number;
};

type ReportsViewProps = {
  monthlyTrend: MonthlyData[];
  expenseByCategory: CategoryData[];
};

const expenseConfig = {
  expense: {
    label: 'Expense',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

const incomeConfig = {
  income: {
    label: 'Income',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

const netWorthConfig = {
  netWorth: {
    label: 'Net Worth',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig;

const CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const renderEmpty = (text: string): React.ReactElement => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
    {text}
  </div>
);

export const ReportsView = ({
  monthlyTrend,
  expenseByCategory,
}: ReportsViewProps): React.ReactElement => {
  const netWorthData = monthlyTrend.reduce<
    { month: string; netWorth: number }[]
  >((acc, item) => {
    const prev = acc.length > 0 ? acc[acc.length - 1]!.netWorth : 0;
    acc.push({
      month: item.month,
      netWorth: prev + item.income - item.expense,
    });
    return acc;
  }, []);

  const categoryConfig = expenseByCategory.reduce<ChartConfig>(
    (acc, item, index) => {
      acc[item.category] = {
        label: item.category,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      };
      return acc;
    },
    {}
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense</CardTitle>
          <CardDescription>Expense trend over time</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyTrend.length === 0 ? (
            renderEmpty('No data yet')
          ) : (
            <ChartContainer config={expenseConfig} className="min-h-[200px] w-full">
              <BarChart accessibilityLayer data={monthlyTrend}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="expense"
                  fill="var(--color-expense)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Expense by Category</CardTitle>
          <CardDescription>Breakdown by category</CardDescription>
        </CardHeader>
        <CardContent>
          {expenseByCategory.length === 0 ? (
            renderEmpty('No expenses yet')
          ) : (
            <ChartContainer
              config={categoryConfig}
              className="mx-auto min-h-[200px] w-full"
            >
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                <Pie
                  data={expenseByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ category, percent }) =>
                    `${category} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {expenseByCategory.map((item, i) => (
                    <Cell
                      key={item.category}
                      fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income Trend</CardTitle>
          <CardDescription>Income over time</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyTrend.length === 0 ? (
            renderEmpty('No data yet')
          ) : (
            <ChartContainer config={incomeConfig} className="min-h-[200px] w-full">
              <LineChart accessibilityLayer data={monthlyTrend}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="var(--color-income)"
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Net Worth History</CardTitle>
          <CardDescription>Cumulative net worth over time</CardDescription>
        </CardHeader>
        <CardContent>
          {netWorthData.length === 0 ? (
            renderEmpty('No data yet')
          ) : (
            <ChartContainer config={netWorthConfig} className="min-h-[200px] w-full">
              <AreaChart accessibilityLayer data={netWorthData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  stroke="var(--color-netWorth)"
                  fill="var(--color-netWorth)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
