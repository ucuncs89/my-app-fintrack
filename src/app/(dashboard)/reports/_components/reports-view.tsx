'use client';

import { useState } from 'react';
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

import { formatCurrency } from '~/lib/format';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

type ReportsViewProps = {
  userId: string;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ─── chart configs ─────────────────────────────────────────────── */

const expenseConfig = {
  expense: { label: 'Expense', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const incomeConfig = {
  income: { label: 'Income', color: 'var(--chart-2)' },
} satisfies ChartConfig;

const netConfig = {
  net: { label: 'Net Savings', color: 'var(--chart-3)' },
} satisfies ChartConfig;

const CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

const renderEmpty = (text: string): React.ReactElement => (
  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
    {text}
  </div>
);

/* ─── helpers ───────────────────────────────────────────────────── */

function buildMonthOptions(now: Date) {
  const options: { label: string; year: number; month: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    let m = now.getMonth() + 1 - i;
    let y = now.getFullYear();
    while (m <= 0) { m += 12; y -= 1; }
    options.push({ label: `${MONTH_NAMES[m - 1]} ${y}`, year: y, month: m });
  }
  return options;
}

function toKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/* ─── Component ─────────────────────────────────────────────────── */

export const ReportsView = ({ userId }: ReportsViewProps): React.ReactElement => {
  const now = new Date();

  const monthOptions = buildMonthOptions(now);

  // Default: 6 months ago → current month
  const defaultStart = monthOptions[monthOptions.length - 6]!;
  const defaultEnd = monthOptions[monthOptions.length - 1]!;

  const [startKey, setStartKey] = useState(toKey(defaultStart.year, defaultStart.month));
  const [endKey, setEndKey] = useState(toKey(defaultEnd.year, defaultEnd.month));

  const parseKey = (key: string) => {
    const [y, m] = key.split('-').map(Number) as [number, number];
    return { year: y, month: m };
  };

  const start = parseKey(startKey);
  const end = parseKey(endKey);

  // Ensure start <= end
  const isRangeValid =
    start.year < end.year ||
    (start.year === end.year && start.month <= end.month);

  const queryInput = isRangeValid
    ? {
        userId,
        startYear: start.year,
        startMonth: start.month,
        endYear: end.year,
        endMonth: end.month,
      }
    : null;

  const { data: monthlyTrend = [], isFetching: trendFetching } =
    api.dashboard.getMonthlyTrendByRange.useQuery(
      queryInput ?? {
        userId,
        startYear: start.year,
        startMonth: start.month,
        endYear: start.year,
        endMonth: start.month,
      },
      { enabled: isRangeValid },
    );

  const { data: expenseByCategory = [], isFetching: catFetching } =
    api.dashboard.getExpenseByCategoryByRange.useQuery(
      queryInput ?? {
        userId,
        startYear: start.year,
        startMonth: start.month,
        endYear: start.year,
        endMonth: start.month,
      },
      { enabled: isRangeValid },
    );

  const isFetching = trendFetching || catFetching;

  /* derived data */
  const netData = monthlyTrend.map((d) => ({
    month: d.month,
    year: d.year,
    net: d.income - d.expense,
  }));

  const totalIncome = monthlyTrend.reduce((s, d) => s + d.income, 0);
  const totalExpense = monthlyTrend.reduce((s, d) => s + d.expense, 0);
  const totalNet = totalIncome - totalExpense;

  const categoryConfig = expenseByCategory.reduce<ChartConfig>((acc, item, i) => {
    acc[item.category] = {
      label: item.category,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    };
    return acc;
  }, {});

  /* ─── Range filter UI ──────────────────────────────────────────── */
  const filterBar = (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3 pt-4">
        <span className="text-sm font-medium">Period:</span>

        <div className="flex items-center gap-2">
          <Select value={startKey} onValueChange={setStartKey}>
            <SelectTrigger id="reports-from" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={toKey(o.year, o.month)} value={toKey(o.year, o.month)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-sm text-muted-foreground">to</span>

          <Select value={endKey} onValueChange={setEndKey}>
            <SelectTrigger id="reports-to" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={toKey(o.year, o.month)} value={toKey(o.year, o.month)}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isRangeValid && (
          <p className="text-sm text-destructive">Start must be before or equal to end.</p>
        )}
        {isFetching && (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </CardContent>
    </Card>
  );

  /* ─── Summary row ──────────────────────────────────────────────── */
  const summaryRow = (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: 'Total Income', value: totalIncome, positive: true },
        { label: 'Total Expense', value: totalExpense, positive: false },
        { label: 'Net Savings', value: totalNet, positive: totalNet >= 0 },
      ].map(({ label, value, positive }) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardDescription>{label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-2xl font-bold',
                positive ? 'text-green-600 dark:text-green-400' : 'text-red-500',
              )}
            >
              {formatCurrency(value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  /* ─── Income vs Expense table ──────────────────────────────────── */
  const incomeExpenseTable = (
    <Card className="sm:col-span-2">
      <CardHeader>
        <CardTitle>Income vs Expense — Monthly</CardTitle>
        <CardDescription>Summary per month for the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        {monthlyTrend.length === 0 ? (
          renderEmpty('No data for selected period')
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right text-green-600 dark:text-green-400">Income</TableHead>
                  <TableHead className="text-right text-red-500">Expense</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTrend.map((row) => {
                  const net = row.income - row.expense;
                  return (
                    <TableRow key={`${row.year}-${row.month}`}>
                      <TableCell className="font-medium">
                        {MONTH_SHORT.find((_, i) => MONTH_SHORT[i] === row.month) ?? row.month}{' '}
                        {row.year}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600 dark:text-green-400">
                        {formatCurrency(row.income)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-500">
                        {formatCurrency(row.expense)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-mono font-semibold',
                          net >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-500',
                        )}
                      >
                        {net >= 0 ? '+' : ''}
                        {formatCurrency(net)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      {filterBar}
      {isRangeValid && summaryRow}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Monthly Expense Bar */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense</CardTitle>
            <CardDescription>Expense trend over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length === 0
              ? renderEmpty('No data yet')
              : (
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
                    <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
          </CardContent>
        </Card>

        {/* Expense by Category Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Expense by Category</CardTitle>
            <CardDescription>Breakdown for the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseByCategory.length === 0
              ? renderEmpty('No expenses yet')
              : (
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
                      label={({ category, percent }: { category: string; percent: number }) =>
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

        {/* Income Trend Line */}
        <Card>
          <CardHeader>
            <CardTitle>Income Trend</CardTitle>
            <CardDescription>Monthly income over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrend.length === 0
              ? renderEmpty('No data yet')
              : (
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

        {/* Net Savings Area */}
        <Card>
          <CardHeader>
            <CardTitle>Net Savings</CardTitle>
            <CardDescription>Income minus expense per month</CardDescription>
          </CardHeader>
          <CardContent>
            {netData.length === 0
              ? renderEmpty('No data yet')
              : (
                <ChartContainer config={netConfig} className="min-h-[200px] w-full">
                  <AreaChart accessibilityLayer data={netData}>
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
                      dataKey="net"
                      stroke="var(--color-net)"
                      fill="var(--color-net)"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
          </CardContent>
        </Card>

        {/* Income vs Expense Table — full width */}
        {incomeExpenseTable}
      </div>
    </div>
  );
};
