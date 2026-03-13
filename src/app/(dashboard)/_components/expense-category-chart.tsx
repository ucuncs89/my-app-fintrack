'use client';

import { Cell, Pie, PieChart } from 'recharts';

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

type CategoryData = {
  category: string;
  amount: number;
};

type ExpenseCategoryChartProps = {
  data: CategoryData[];
};

const CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export const ExpenseCategoryChart = ({
  data,
}: ExpenseCategoryChartProps): React.ReactElement => {
  const chartConfig = data.reduce<ChartConfig>((acc, item, index) => {
    acc[item.category] = {
      label: item.category,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    };
    return acc;
  }, {});

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Expense by Category</CardTitle>
        <CardDescription>This month breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No expenses yet
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto min-h-[250px] w-full"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
              <Pie
                data={data}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ category, percent }) =>
                  `${category} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {data.map((item, index) => (
                  <Cell
                    key={item.category}
                    fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};
