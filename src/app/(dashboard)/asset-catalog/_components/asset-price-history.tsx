'use client';

import { History } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';

import { formatCurrency } from '~/lib/format';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '~/components/ui/chart';
import { api, type RouterOutputs } from '~/trpc/react';

type Asset = RouterOutputs['asset']['getAll'][number];

type AssetPriceHistoryDialogProps = {
  asset: Asset | null;
  onClose: () => void;
};

const priceConfig = {
  price: {
    label: 'Price',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

export const AssetPriceHistoryDialog = ({
  asset,
  onClose,
}: AssetPriceHistoryDialogProps): React.ReactElement => {
  const { data: priceHistory = [], isFetching } =
    api.asset.getPriceHistory.useQuery(
      { assetId: asset?.id ?? '', limit: 30 },
      { enabled: !!asset },
    );

  const chartData = [...priceHistory]
    .sort(
      (a, b) =>
        new Date(a.priceDate).getTime() - new Date(b.priceDate).getTime(),
    )
    .map((p) => ({
      date: new Date(p.priceDate).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      }),
      price: Number(p.price),
    }));

  const latestPrice =
    priceHistory.length > 0
      ? Math.max(
          ...priceHistory.map((p) =>
            new Date(p.priceDate).getTime(),
          ),
        )
      : null;

  const latestEntry =
    latestPrice !== null
      ? priceHistory.find(
          (p) => new Date(p.priceDate).getTime() === latestPrice,
        )
      : null;

  return (
    <Dialog open={!!asset} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="size-4" />
            Price History — {asset?.name ?? ''}
          </DialogTitle>
          <DialogDescription>
            {asset?.symbol ? `${asset.symbol} · ` : ''}Last 30 recorded price points
            {latestEntry
              ? ` · Current: ${formatCurrency(Number(latestEntry.price))}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : priceHistory.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <p>No price data recorded yet.</p>
            <p className="text-xs">
              Use the &ldquo;Update Price&rdquo; button (
              <History className="inline size-3" />) in the asset catalog to add
              price points.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Chart */}
            <ChartContainer config={priceConfig} className="min-h-[160px] w-full">
              <LineChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                        ? `${(v / 1_000).toFixed(0)}K`
                        : String(v)
                  }
                  tick={{ fontSize: 11 }}
                  width={50}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="var(--color-price)"
                  strokeWidth={2}
                  dot={chartData.length <= 10}
                />
              </LineChart>
            </ChartContainer>

            {/* Table */}
            <div className="max-h-52 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...priceHistory]
                    .sort(
                      (a, b) =>
                        new Date(b.priceDate).getTime() -
                        new Date(a.priceDate).getTime(),
                    )
                    .map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="text-sm">
                          {new Date(entry.priceDate).toLocaleDateString(
                            'id-ID',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(Number(entry.price))}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
