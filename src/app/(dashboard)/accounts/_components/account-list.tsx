'use client';

import {
  Banknote,
  Bitcoin,
  CircleDollarSign,
  Coins,
  Wallet,
} from 'lucide-react';

import { formatCurrency } from '~/lib/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';

type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: unknown;
};

type AccountListProps = {
  accounts: Account[];
};

const accountTypeConfig: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  }
> = {
  cash: { icon: Banknote, label: 'Cash' },
  bank: { icon: CircleDollarSign, label: 'Bank' },
  crypto_wallet: { icon: Bitcoin, label: 'Crypto Wallet' },
  gold_wallet: { icon: Coins, label: 'Gold Wallet' },
  investment: { icon: Wallet, label: 'Investment' },
};

export const AccountList = ({
  accounts,
}: AccountListProps): React.ReactElement => {
  const totalBalance = accounts.reduce(
    (sum, acc) => sum + Number(acc.balance),
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Total Balance</CardTitle>
          <CardDescription>Across all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalBalance)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <CardContent className="flex h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No accounts yet. Add your first account to start tracking.
              </p>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => {
            const config =
              accountTypeConfig[account.type] ?? accountTypeConfig.cash;
            const Icon = config.icon;

            return (
              <Card key={account.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">{account.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        <Icon className="size-3" />
                        {config.label}
                      </Badge>
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatCurrency(Number(account.balance))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {account.currency}
                  </p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </>
  );
};
