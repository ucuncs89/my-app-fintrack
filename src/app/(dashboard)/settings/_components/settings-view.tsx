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
import { AccountsInSettings } from './accounts-in-settings';
import { type RouterOutputs } from '~/trpc/react';

type Category = RouterOutputs['category']['getAll'][number];
type Account = RouterOutputs['account']['getAll'][number];

type SettingsViewProps = {
  initialCategories: Category[];
  initialAccounts: Account[];
  userId: string;
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
          <CardDescription>Default currency for your accounts</CardDescription>
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
          <CardDescription>Manage your financial accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <AccountsInSettings
            initialAccounts={initialAccounts}
            userId={userId}
          />
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
