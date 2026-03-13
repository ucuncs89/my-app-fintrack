'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Separator } from '~/components/ui/separator';

type Category = {
  id: string;
  name: string;
  type: string;
};

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
};

type SettingsViewProps = {
  categories: Category[];
  accounts: Account[];
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
  categories,
  accounts,
}: SettingsViewProps): React.ReactElement => {
  const groupedCategories = categories.reduce<Record<string, Category[]>>(
    (acc, cat) => {
      const key = cat.type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(cat);
      return acc;
    },
    {}
  );

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

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            {categories.length} categories configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No categories yet.
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedCategories).map(
                ([type, cats], idx, arr) => (
                  <div key={type}>
                    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                      {typeLabels[type] ?? type}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {cats.map((cat) => (
                        <Badge key={cat.id} variant="outline">
                          {cat.name}
                        </Badge>
                      ))}
                    </div>
                    {idx < arr.length - 1 && <Separator className="mt-3" />}
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            {accounts.length} accounts configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts yet.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
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
