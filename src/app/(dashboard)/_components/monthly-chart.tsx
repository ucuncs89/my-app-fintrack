'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

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
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Income vs Expense</CardTitle>
        <CardDescription>Monthly comparison</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
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
