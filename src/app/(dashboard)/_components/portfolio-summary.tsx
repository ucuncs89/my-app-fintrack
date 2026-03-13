'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';

type PortfolioItem = {
  assetId: string;
  asset?: { name: string; type: string } | null;
  totalQuantity: number;
  totalCost: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
};

type PortfolioSummaryProps = {
  holdings: PortfolioItem[];
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const PortfolioSummary = ({
  holdings,
}: PortfolioSummaryProps): React.ReactElement => {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
        <CardDescription>
          Total value: {formatCurrency(totalValue)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No assets yet
          </div>
        ) : (
          <div className="space-y-3">
            {holdings.map((item) => (
              <div
                key={item.assetId}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {item.asset?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.totalQuantity} units @ {formatCurrency(item.currentPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(item.currentValue)}
                  </p>
                  <p
                    className={`text-xs ${
                      item.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {item.profitLoss >= 0 ? '+' : ''}
                    {formatCurrency(item.profitLoss)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
