'use client';

import { useMemo, useState } from 'react';
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
  ResponsiveContainer,
  Sankey,
  Tooltip,
  XAxis,
  YAxis,
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
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { cn } from '~/lib/utils';
import { api } from '~/trpc/react';

type ReportsViewProps = {
  userId: string;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

const budgetConfig = {
  budgeted: { label: 'Budget', color: 'var(--muted-foreground)' },
  actual: { label: 'Actual', color: 'var(--chart-1)' },
} satisfies ChartConfig;

const netWorthConfig = {
  netWorth: { label: 'Net Worth', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const balanceTimelineConfig = {
  balance: { label: 'Total balance', color: 'var(--chart-4)' },
} satisfies ChartConfig;

const savingsRateConfig = {
  rate: { label: 'Savings Rate (%)', color: 'var(--chart-2)' },
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

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDateInput(s: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const mo = Number(match[2]);
  const d = Number(match[3]);
  const dt = new Date(y, mo - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  ) {
    return null;
  }
  return dt;
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

  const [timelineStart, setTimelineStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return toDateInputValue(d);
  });
  const [timelineEnd, setTimelineEnd] = useState(() => toDateInputValue(new Date()));

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

  // Existing Queries
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

  // New Queries
  const { data: budgetVsActual = [], isFetching: budgetFetching } =
    api.dashboard.getBudgetVsActualByRange.useQuery(
      queryInput ?? {
        userId,
        startYear: start.year,
        startMonth: start.month,
        endYear: start.year,
        endMonth: start.month,
      },
      { enabled: isRangeValid },
    );

  const { data: netWorthTrend = [], isFetching: nwFetching } =
    api.dashboard.getNetWorthTrendByRange.useQuery(
      queryInput ?? {
        userId,
        startYear: start.year,
        startMonth: start.month,
        endYear: start.year,
        endMonth: start.month,
      },
      { enabled: isRangeValid },
    );

  const { data: cashFlow = null, isFetching: cfFetching } =
    api.dashboard.getCashFlowSummaryByRange.useQuery(
      queryInput ?? {
        userId,
        startYear: start.year,
        startMonth: start.month,
        endYear: start.year,
        endMonth: start.month,
      },
      { enabled: isRangeValid },
    );

  const tlStart = parseDateInput(timelineStart);
  const tlEnd = parseDateInput(timelineEnd);
  const isTimelineRangeValid =
    tlStart != null && tlEnd != null && tlStart.getTime() <= tlEnd.getTime();
  const isTimelineWithinMax =
    tlStart != null &&
    tlEnd != null &&
    tlEnd.getTime() - tlStart.getTime() <= 731 * 24 * 60 * 60 * 1000;

  const { data: balanceTimeline, isFetching: tlFetching, error: tlError } =
    api.dashboard.getBalanceTimeline.useQuery(
      {
        userId,
        startDate: tlStart ?? new Date(0),
        endDate: tlEnd ?? new Date(0),
      },
      {
        enabled:
          Boolean(isTimelineRangeValid && isTimelineWithinMax && tlStart && tlEnd),
      },
    );

  const { data: accounts = [] } = api.account.getAll.useQuery({ userId });

  const isFetching = trendFetching || catFetching || budgetFetching || nwFetching || cfFetching;

  /* ─── Derived Data ─────────────────────────────────────────────── */
  const savingsRateData = useMemo(() => {
    return monthlyTrend.map((d) => {
      const rate = d.income > 0 ? ((d.income - d.expense) / d.income) * 100 : 0;
      return {
        month: d.month,
        year: d.year,
        rate: Math.max(-100, Math.min(100, rate)), // Cap for display
      };
    });
  }, [monthlyTrend]);

  const allocationData = useMemo(() => {
    const types: Record<string, number> = {};
    accounts.forEach((a) => {
      types[a.type] = (types[a.type] ?? 0) + Number(a.balance);
    });
    return Object.entries(types).map(([type, balance]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' '),
      value: balance,
    })).filter(d => d.value > 0);
  }, [accounts]);

  const sankeyData = useMemo(() => {
    if (!cashFlow || (cashFlow.incomeByCategory.length === 0 && cashFlow.expenseByCategory.length === 0)) return null;
    const nodes: { name: string }[] = [];
    const links: { source: number; target: number; value: number }[] = [];

    // Node 0: Total Income
    nodes.push({ name: 'Total Income' });

    // Nodes for Income Categories
    cashFlow.incomeByCategory.forEach((inc) => {
      nodes.push({ name: inc.category });
      links.push({ source: nodes.length - 1, target: 0, value: Math.max(1, inc.amount) });
    });

    // Node: Total Expense
    const expenseNodeIdx = nodes.length;
    nodes.push({ name: 'Total Expense' });
    links.push({ source: 0, target: expenseNodeIdx, value: Math.max(1, cashFlow.totalExpense) });

    // Node: Savings
    if (cashFlow.netSavings > 0) {
      nodes.push({ name: 'Savings' });
      links.push({ source: 0, target: nodes.length - 1, value: Math.max(1, cashFlow.netSavings) });
    }

    // Nodes for Expense Categories
    cashFlow.expenseByCategory.forEach((exp) => {
      nodes.push({ name: exp.category });
      links.push({ source: expenseNodeIdx, target: nodes.length - 1, value: Math.max(1, exp.amount) });
    });

    return { nodes, links };
  }, [cashFlow]);

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

  const balanceTimelineChartData = useMemo(() => {
    if (!balanceTimeline?.points.length) {
      return [];
    }
    return balanceTimeline.points.map((p) => ({
      t: new Date(p.at).getTime(),
      balance: p.balance,
    }));
  }, [balanceTimeline]);

  /* ─── Shared Components ────────────────────────────────────────── */
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
          <p className="text-sm text-muted-foreground animate-pulse">Loading analysis...</p>
        )}
      </CardContent>
    </Card>
  );

  const summaryRow = (
    <div className="grid gap-4 sm:grid-cols-3">
      {[
        { label: 'Total Income', value: totalIncome, positive: true },
        { label: 'Total Expense', value: totalExpense, positive: false },
        { label: 'Net Savings', value: totalNet, positive: totalNet >= 0 },
      ].map(({ label, value, positive }) => (
        <Card key={label} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription>{label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className={cn('text-2xl font-bold', positive ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
              {formatCurrency(value)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  /* ─── MAIN RENDER ──────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-6">
      {filterBar}
      {isRangeValid && summaryRow}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="wealth">Wealth & Allocation</TabsTrigger>
          <TabsTrigger value="balance">Balance timeline</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Expense</CardTitle>
                <CardDescription>Expense trend over selection</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyTrend.length === 0 ? renderEmpty('No data yet') : (
                  <ChartContainer config={expenseConfig} className="min-h-[220px] w-full">
                    <BarChart accessibilityLayer data={monthlyTrend}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="expense" fill="var(--color-expense)" radius={4} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense by Category</CardTitle>
                <CardDescription>Breakdown for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {expenseByCategory.length === 0 ? renderEmpty('No expenses yet') : (
                  <ChartContainer config={categoryConfig} className="mx-auto min-h-[220px] w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="category" />} />
                      <Pie
                        data={expenseByCategory}
                        dataKey="amount"
                        nameKey="category"
                        cx="50%" cy="50%" outerRadius={70}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {expenseByCategory.map((item, i) => (
                          <Cell key={item.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
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
                <CardDescription>Monthly income over selection</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyTrend.length === 0 ? renderEmpty('No data yet') : (
                  <ChartContainer config={incomeConfig} className="min-h-[220px] w-full">
                    <LineChart accessibilityLayer data={monthlyTrend}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="monotone" dataKey="income" stroke="var(--color-income)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Net Savings</CardTitle>
                <CardDescription>Income minus expense per month</CardDescription>
              </CardHeader>
              <CardContent>
                {netData.length === 0 ? renderEmpty('No data yet') : (
                  <ChartContainer config={netConfig} className="min-h-[220px] w-full">
                    <AreaChart accessibilityLayer data={netData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="net" stroke="var(--color-net)" fill="var(--color-net)" fillOpacity={0.2} />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle>Monthly Summary Table</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right text-green-600">Income</TableHead>
                        <TableHead className="text-right text-red-500">Expense</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyTrend.map((row) => (
                        <TableRow key={`${row.year}-${row.month}`}>
                          <TableCell className="font-medium">{row.month} {row.year}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(row.income)}</TableCell>
                          <TableCell className="text-right text-red-500">{formatCurrency(row.expense)}</TableCell>
                          <TableCell className={cn('text-right font-semibold', row.income - row.expense >= 0 ? 'text-green-600' : 'text-red-500')}>
                            {formatCurrency(row.income - row.expense)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── BUDGET TAB ──────────────────────────────────────────── */}
        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual Spending</CardTitle>
              <CardDescription>Comparison of budgeted amounts vs real expenses per category</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetVsActual.length === 0 ? renderEmpty('No budgets found for this period') : (
                <ChartContainer config={budgetConfig} className="min-h-[400px] w-full">
                  <BarChart data={budgetVsActual} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={100} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="budgeted" fill="var(--color-budgeted)" radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="actual" fill="var(--color-actual)" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── WEALTH TAB ──────────────────────────────────────────── */}
        <TabsContent value="wealth" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="sm:col-span-2">
              <CardHeader>
                <CardTitle>Net Worth Trend</CardTitle>
                <CardDescription>Historical total balance across all accounts</CardDescription>
              </CardHeader>
              <CardContent>
                {netWorthTrend.length === 0 ? renderEmpty('Calculating...') : (
                  <ChartContainer config={netWorthConfig} className="min-h-[300px] w-full">
                    <AreaChart data={netWorthTrend}>
                      <defs>
                        <linearGradient id="colorNW" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-netWorth)" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="var(--color-netWorth)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `Rp${(v / 1000000).toFixed(0)}M`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area type="monotone" dataKey="netWorth" stroke="var(--color-netWorth)" fillOpacity={1} fill="url(#colorNW)" />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings Rate</CardTitle>
                <CardDescription>Percentage of income saved monthly (Target: 20%+)</CardDescription>
              </CardHeader>
              <CardContent>
                {savingsRateData.length === 0 ? renderEmpty('No income data') : (
                  <ChartContainer config={savingsRateConfig} className="min-h-[220px] w-full">
                    <LineChart data={savingsRateData}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis unit="%" tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line type="stepAfter" dataKey="rate" stroke="var(--color-rate)" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Allocation</CardTitle>
                <CardDescription>Current balance distribution by account type</CardDescription>
              </CardHeader>
              <CardContent>
                {allocationData.length === 0 ? renderEmpty('No accounts found') : (
                  <ChartContainer config={{}} className="mx-auto min-h-[220px] w-full">
                    <PieChart>
                      <Pie
                        data={allocationData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {allocationData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── BALANCE TIMELINE TAB ────────────────────────────────── */}
        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Total balance over time</CardTitle>
              <CardDescription>
                Combined cash balance across all accounts after each change (transactions and
                asset trades). Transfers between your own accounts do not change this total.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="timeline-from">From</Label>
                  <Input
                    id="timeline-from"
                    type="date"
                    value={timelineStart}
                    onChange={(e) => {
                      setTimelineStart(e.target.value);
                    }}
                    className="w-[11rem]"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="timeline-to">To</Label>
                  <Input
                    id="timeline-to"
                    type="date"
                    value={timelineEnd}
                    onChange={(e) => {
                      setTimelineEnd(e.target.value);
                    }}
                    className="w-[11rem]"
                  />
                </div>
                {tlFetching && (
                  <p className="text-sm text-muted-foreground animate-pulse pb-2">
                    Loading timeline…
                  </p>
                )}
              </div>
              {!isTimelineRangeValid && (
                <p className="text-sm text-destructive">
                  Start date must be on or before end date.
                </p>
              )}
              {isTimelineRangeValid && !isTimelineWithinMax && (
                <p className="text-sm text-destructive">
                  Date range must be at most 2 years.
                </p>
              )}
              {tlError != null && (
                <p className="text-sm text-destructive">
                  {tlError.message}
                </p>
              )}
              {isTimelineRangeValid && isTimelineWithinMax && !tlFetching && balanceTimelineChartData.length === 0 && (
                renderEmpty('No timeline data for this range')
              )}
              {isTimelineRangeValid && isTimelineWithinMax && balanceTimelineChartData.length > 0 && (
                <ChartContainer config={balanceTimelineConfig} className="min-h-[320px] w-full">
                  <AreaChart data={balanceTimelineChartData} accessibilityLayer>
                    <defs>
                      <linearGradient id="balanceTimelineFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="t"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(ts: number) =>
                        new Date(ts).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) =>
                        formatCurrency(v).replace(/\s/g, ' ')
                      }
                      width={72}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) {
                          return null;
                        }
                        const row = payload[0].payload as {
                          t: number;
                          balance: number;
                        };
                        return (
                          <div className="rounded-md border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
                            <p className="font-medium">
                              {new Date(row.t).toLocaleString()}
                            </p>
                            <p className="text-muted-foreground">
                              {formatCurrency(row.balance)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="stepAfter"
                      dataKey="balance"
                      stroke="var(--color-balance)"
                      strokeWidth={2}
                      fill="url(#balanceTimelineFill)"
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── CASH FLOW TAB ───────────────────────────────────────── */}
        <TabsContent value="cashflow" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Summary</CardTitle>
              <CardDescription>Visualizing how your money flows from income to expenses and savings</CardDescription>
            </CardHeader>
            <CardContent>
              {!sankeyData ? renderEmpty('Data unavailable') : (
                <div className="h-[450px] w-full overflow-x-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <Sankey
                      data={sankeyData}
                      node={{ fill: 'var(--primary)', stroke: 'var(--primary-foreground)' }}
                      link={{ stroke: 'var(--muted)', fillOpacity: 0.2 }}
                      margin={{ top: 20, bottom: 20, left: 10, right: 10 }}
                    >
                      <Tooltip />
                    </Sankey>
                  </ResponsiveContainer>
                </div>
              )}
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                <div className="flex flex-col gap-1 border-l-4 border-green-500 pl-3">
                  <span className="text-muted-foreground">Total Income</span>
                  <span className="text-lg font-bold">{formatCurrency(cashFlow?.totalIncome ?? 0)}</span>
                </div>
                <div className="flex flex-col gap-1 border-l-4 border-red-500 pl-3">
                  <span className="text-muted-foreground">Total Expenses</span>
                  <span className="text-lg font-bold">{formatCurrency(cashFlow?.totalExpense ?? 0)}</span>
                </div>
                <div className="flex flex-col gap-1 border-l-4 border-blue-500 pl-3">
                  <span className="text-muted-foreground">Flow Efficiency</span>
                  <span className="text-lg font-bold">
                    {cashFlow?.totalIncome ? ((cashFlow.totalIncome - cashFlow.totalExpense) / cashFlow.totalIncome * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex flex-col gap-1 border-l-4 border-primary pl-3">
                  <span className="text-muted-foreground">Potential Savings</span>
                  <span className="text-lg font-bold">{formatCurrency(cashFlow?.netSavings ?? 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
