'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { CategoriesManager } from './categories-manager';
import { type RouterOutputs } from '~/trpc/react';

type Category = RouterOutputs['category']['getAll'][number];
type Account = RouterOutputs['account']['getAll'][number];

type SettingsViewProps = {
  initialCategories: Category[];
  initialAccounts: Account[];
  userId: string;
};

const typeLabels: Record<string, string> = {
  income: 'Income',
  expense: 'Expense',
  investment: 'Investment',
  cash: 'Cash',
  bank: 'Bank',
  crypto_wallet: 'Crypto Wallet',
  gold_wallet: 'Gold Wallet',
};

export const SettingsView = ({
  initialCategories,
  initialAccounts,
  userId,
}: SettingsViewProps): React.ReactElement => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Set your default currency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 rounded-lg border p-3">
            <Badge variant="secondary">IDR</Badge>
            <span className="text-sm text-muted-foreground">
              Indonesian Rupiah
            </span>
          </div>
        </CardContent>
      </Card>

      <CategoriesManager
        initialCategories={initialCategories}
        userId={userId}
      />

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            {initialAccounts.length} accounts configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {initialAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          ) : (
            <div className="space-y-2">
              {initialAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border p-2.5"
                >
                  <span className="text-sm font-medium">{account.name}</span>
                  <Badge variant="secondary">
                    {typeLabels[account.type] ?? account.type}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup / Export</CardTitle>
          <CardDescription>Export your financial data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Export functionality coming soon. You will be able to export your
            data as JSON or CSV.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
