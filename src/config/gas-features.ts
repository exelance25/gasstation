import type { DepotAsset, DepotAssetId } from "@/config/depot-assets";
import { DEPOT_ASSETS } from "@/config/depot-assets";

/** Solana gas delivery + Phantom — enabled on testnet by default */
export function isSolanaGasEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_SOLANA_GAS_ENABLED;
  if (raw === "false") return false;
  if (raw === "true") return true;
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  return env === "testnet" || env === "development";
}

/** Dropdown — aktif + yakında seçenekler */
export function getDeliveryAssetCatalog(): DepotAsset[] {
  return DEPOT_ASSETS.map((asset) => {
    if (asset.id === "SOL" && isSolanaGasEnabled()) {
      return { ...asset, comingSoon: false };
    }
    if (asset.id === "SOL" && !isSolanaGasEnabled()) {
      return { ...asset, comingSoon: true };
    }
    return asset;
  });
}

/** @deprecated use getDeliveryAssetCatalog */
export function getEnabledDeliveryAssets(): DepotAsset[] {
  return getDeliveryAssetCatalog().filter((a) => !a.comingSoon);
}

export function isDeliveryAssetEnabled(id: DepotAssetId): boolean {
  if (id === "ARB" || id === "BTC") return false;
  if (id === "SOL") return isSolanaGasEnabled();
  return id === "ETH" || id === "MON" || id === "BASE" || id === "USDC";
}

export function isDeliveryAssetSelectable(id: DepotAssetId): boolean {
  const row = getDeliveryAssetCatalog().find((a) => a.id === id);
  return Boolean(row && !row.comingSoon);
}
