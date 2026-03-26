"use client";

import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from "lucide-react";

import { cn } from "~/lib/utils";
import { formatCurrency, formatDate } from "~/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";

type Transaction = {
  id: string;
  type: string;
  amount: unknown;
  note: string | null;
  transactionDate: Date;
  account: { name: string };
  category: { name: string } | null;
};

type TransactionListProps = {
  transactions: Transaction[];
};

type TxRowConfig = {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sign: string;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

const defaultTxConfig: TxRowConfig = {
  icon: ArrowUpRight,
  color: "text-red-600",
  sign: "-",
  label: "Expense",
  variant: "destructive",
};

const typeConfig: Record<string, TxRowConfig> = {
  income: {
    icon: ArrowDownLeft,
    color: "text-green-600",
    sign: "+",
    label: "Income",
    variant: "secondary",
  },
  expense: defaultTxConfig,
  transfer: {
    icon: ArrowLeftRight,
    color: "text-blue-600",
    sign: "",
    label: "Transfer",
    variant: "outline",
  },
  investment: {
    icon: ArrowUpRight,
    color: "text-amber-600",
    sign: "-",
    label: "Investment",
    variant: "default",
  },
};

export const TransactionList = ({
  transactions,
}: TransactionListProps): React.ReactElement => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Transactions</CardTitle>
        <CardDescription>
          {transactions.length} transaction
          {transactions.length !== 1 ? "s" : ""} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
            No transactions yet. Create your first transaction to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => {
                const config = typeConfig[tx.type] ?? defaultTxConfig;

                return (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {tx.note ?? tx.category?.name ?? config.label}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </TableCell>
                    <TableCell>{tx.category?.name ?? "-"}</TableCell>
                    <TableCell>{tx.account.name}</TableCell>
                    <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                    <TableCell
                      className={cn("text-right font-semibold", config.color)}
                    >
                      {config.sign}
                      {formatCurrency(Number(tx.amount))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
