'use client';

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react';

import { cn } from '~/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

type TransactionItem = {
  id: string;
  type: string;
  amount: number;
  note: string | null;
  transactionDate: Date;
  accountName: string;
  categoryName: string | null;
  toAccountName?: string;
};

type RecentTransactionsProps = {
  transactions: TransactionItem[];
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const typeConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    sign: string;
    badge: 'default' | 'secondary' | 'destructive' | 'outline';
  }
> = {
  income: { icon: ArrowDownLeft, color: 'text-green-600', sign: '+', badge: 'secondary' },
  expense: { icon: ArrowUpRight, color: 'text-red-600', sign: '-', badge: 'destructive' },
  transfer: { icon: ArrowLeftRight, color: 'text-blue-600', sign: '', badge: 'outline' },
  investment: { icon: ArrowUpRight, color: 'text-amber-600', sign: '-', badge: 'default' },
};

export const RecentTransactions = ({
  transactions,
}: RecentTransactionsProps): React.ReactElement => {
  return (
    <Card className="lg:col-span-4">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Last 10 transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const config = typeConfig[tx.type] ?? typeConfig.expense;
              const Icon = config.icon;

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                      <Icon className={cn('size-4', config.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">
                        {tx.note ?? tx.categoryName ?? tx.type}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge variant={config.badge} className="text-[10px]">
                          {tx.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {tx.accountName}
                          {tx.toAccountName ? ` → ${tx.toAccountName}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={cn('text-sm font-medium', config.color)}>
                    {config.sign}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
