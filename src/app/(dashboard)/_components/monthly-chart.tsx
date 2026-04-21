'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { BarChart as BarChartIcon } from 'lucide-react';

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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import { EmptyState } from '~/components/ui/empty-state';

type MonthlyData = {
  month: string;
  year: number;
  income: number;
  expense: number;
};

type MonthlyChartProps = {
  data: MonthlyData[];
};

const chartConfig = {
  income: {
    label: 'Income',
    color: 'var(--chart-2)',
  },
  expense: {
    label: 'Expense',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig;

export const MonthlyChart = ({
  data,
}: MonthlyChartProps): React.ReactElement => {
  return (
    <Card className="lg:col-span-4 glass border-white/5 shadow-sm">
      <CardHeader>
        <CardTitle>Income vs Expense</CardTitle>
        <CardDescription>Monthly comparison</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState
            icon={BarChartIcon}
            title="No data yet"
            description="Record transactions to see your monthly comparison"
            className="min-h-[250px] border-none"
          />
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <BarChart accessibilityLayer data={data}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="income"
                fill="var(--color-income)"
                radius={4}
              />
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
  );
};
