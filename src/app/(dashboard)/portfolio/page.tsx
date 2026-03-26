import { api, HydrateClient } from '~/trpc/server';
import { getSessionUserId } from '~/lib/auth-session';
import { PortfolioList } from './_components/portfolio-list';

export default async function PortfolioPage(): Promise<React.ReactElement> {
  const userId = await getSessionUserId();
  let holdings: Awaited<
    ReturnType<typeof api.assetTransaction.getPortfolioSummary>
  > = [];

  try {
    holdings = await api.assetTransaction.getPortfolioSummary({
      userId,
    });
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-muted-foreground">
            Track your investment assets: Crypto, Gold, Stocks, and more.
          </p>
        </div>

        <PortfolioList holdings={holdings} />
      </div>
    </HydrateClient>
  );
}
