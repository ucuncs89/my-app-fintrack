"use client";

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, FileText } from "lucide-react";

import { cn } from "~/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { FinancialDisplay } from "~/components/ui/financial-display";
import { EmptyState } from "~/components/ui/empty-state";

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

type TxVisualConfig = {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  type: "income" | "expense" | "neutral";
  badge: "default" | "secondary" | "destructive" | "outline";
};

const defaultTxConfig: TxVisualConfig = {
  icon: ArrowUpRight,
  color: "text-destructive",
  type: "expense",
  badge: "destructive",
};

const typeConfig: Record<string, TxVisualConfig> = {
  income: {
    icon: ArrowDownLeft,
    color: "text-emerald-500",
    type: "income",
    badge: "secondary",
  },
  expense: defaultTxConfig,
  transfer: {
    icon: ArrowLeftRight,
    color: "text-blue-500",
    type: "neutral",
    badge: "outline",
  },
  investment: {
    icon: ArrowUpRight,
    color: "text-amber-500",
    type: "expense",
    badge: "default",
  },
};

export const RecentTransactions = ({
  transactions,
}: RecentTransactionsProps): React.ReactElement => {
  return (
    <Card className="lg:col-span-4 glass border-white/5 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest monetary movements</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
           <EmptyState
            icon={FileText}
            title="No transactions yet"
            description="You haven't recorded any transactions. They will appear here once added."
            className="min-h-[250px] border-none"
          />
        ) : (
          <div className="space-y-3 pt-2">
            {transactions.map((tx) => {
              const config = typeConfig[tx.type] ?? defaultTxConfig;
              const Icon = config.icon;

              return (
                <div
                  key={tx.id}
                  className="group flex items-center justify-between gap-4 rounded-xl p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background border shadow-sm">
                      <Icon className={cn("size-4.5", config.color)} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium leading-none">
                        {tx.note ?? tx.categoryName ?? tx.type}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge variant={config.badge} className="text-[9px] uppercase px-1.5 py-0 leading-tight">
                          {tx.type}
                        </Badge>
                        <span className="truncate text-xs text-muted-foreground">
                          {tx.accountName}
                          {tx.toAccountName ? ` → ${tx.toAccountName}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <FinancialDisplay
                    amount={tx.amount}
                    type={config.type}
                    className="text-sm shrink-0"
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
