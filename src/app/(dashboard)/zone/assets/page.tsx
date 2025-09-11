import { apiClient } from "@/lib/api/client";

export default async function ZoneAssetsPage() {
  const { assets } = await apiClient
    .get("/zone/assets")
    .then((res) => res.data)
    .catch(() => ({ assets: [] }));
  return (
    <div>
      {assets.length ? (
        assets.map((asset) => (
          <div key={asset.id}>
            Asset {asset.id} - {asset.name}
          </div>
        ))
      ) : (
        <div>No assets found</div>
      )}
    </div>
  );
}
