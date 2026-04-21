'use client';

import { Briefcase } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { EmptyState } from '~/components/ui/empty-state';
import { FinancialDisplay } from '~/components/ui/financial-display';
import type { RouterOutputs } from '~/trpc/react';

type PortfolioItem = RouterOutputs["assetTransaction"]["getPortfolioSummary"][number];

type PortfolioSummaryProps = {
  holdings: PortfolioItem[];
};

export const PortfolioSummary = ({
  holdings,
}: PortfolioSummaryProps): React.ReactElement => {
  const totalValue = holdings.reduce((sum, h) => sum + Number(h.currentValue), 0);

  return (
    <Card className="lg:col-span-3 glass border-white/5 shadow-sm">
      <CardHeader>
        <CardTitle>Portfolio</CardTitle>
        <CardDescription className="flex items-center gap-1">
          Total value: { }
          <FinancialDisplay amount={totalValue} showSign={false} className="font-medium" />
        </CardDescription>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No assets yet"
            description="Start building your portfolio by recording assets."
            className="min-h-[250px] border-none"
          />
        ) : (
          <div className="space-y-4 pt-2">
            {holdings.map((item) => (
              <div
                key={item.assetId}
                className="group flex flex-row items-center justify-between rounded-xl p-2 transition-colors hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium leading-none mb-1">
                    {item.asset?.name ?? 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.totalQuantity} units @ <FinancialDisplay amount={item.currentPrice} showSign={false} />
                  </p>
                </div>
                <div className="text-right flex flex-col items-end">
                  <FinancialDisplay
                    amount={item.currentValue}
                    showSign={false}
                    className="text-sm"
                  />
                  <FinancialDisplay
                    amount={item.profitLoss}
                    type="auto"
                    className="text-xs mt-1"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
