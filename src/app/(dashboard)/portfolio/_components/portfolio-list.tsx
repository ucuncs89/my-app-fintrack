'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

import { cn } from '~/lib/utils';
import { formatCurrency } from '~/lib/format';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import { Badge } from '~/components/ui/badge';

type PortfolioItem = {
  assetId: string;
  asset?: {
    name: string;
    symbol?: string | null;
    type: string;
  } | null;
  totalQuantity: number;
  totalCost: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  profitLoss: number;
};

type PortfolioListProps = {
  holdings: PortfolioItem[];
};

export const PortfolioList = ({
  holdings,
}: PortfolioListProps): React.ReactElement => {
  const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalCost = holdings.reduce((sum, h) => sum + h.totalCost, 0);
  const totalPL = totalValue - totalCost;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Profit/Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-2xl font-bold',
                totalPL >= 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {totalPL >= 0 ? '+' : ''}
              {formatCurrency(totalPL)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>
            {holdings.length} asset{holdings.length !== 1 ? 's' : ''} in
            portfolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              No assets in portfolio. Start investing to see your holdings.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">P/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((item) => {
                  const isPositive = item.profitLoss >= 0;

                  return (
                    <TableRow key={item.assetId}>
                      <TableCell className="font-medium">
                        {item.asset?.name ?? 'Unknown'}
                        {item.asset?.symbol && (
                          <span className="ml-1 text-muted-foreground">
                            ({item.asset.symbol})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.asset?.type ?? '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.totalQuantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.avgBuyPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.currentPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.currentValue)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'text-right font-semibold',
                          isPositive ? 'text-green-600' : 'text-red-600'
                        )}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? (
                            <TrendingUp className="size-3" />
                          ) : (
                            <TrendingDown className="size-3" />
                          )}
                          {isPositive ? '+' : ''}
                          {formatCurrency(item.profitLoss)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
};
