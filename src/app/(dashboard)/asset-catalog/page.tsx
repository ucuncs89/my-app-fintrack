import { api, HydrateClient } from '~/trpc/server';
import { AssetCatalogTable } from './_components/asset-catalog-table';

export default async function AssetCatalogPage(): Promise<React.ReactElement> {
  let assets: Awaited<ReturnType<typeof api.asset.getAll>> = [];

  try {
    const assetsData = await api.asset.getAll();
    assets = JSON.parse(JSON.stringify(assetsData)) as typeof assets;
  } catch {
    // DB not available
  }

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Asset catalog</h1>
          <p className="text-muted-foreground">
            Manage global instruments (crypto, gold, stocks) used in portfolios.
          </p>
        </div>

        <AssetCatalogTable initialAssets={assets} />
      </div>
    </HydrateClient>
  );
}
