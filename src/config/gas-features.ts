import type { DepotAsset, DepotAssetId } from "@/config/depot-assets";
import { DEPOT_ASSETS } from "@/config/depot-assets";

/** Solana gas teslimi + Phantom cüzdan — varsayılan kapalı (EVM-only tank) */
export function isSolanaGasEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_SOLANA_GAS_ENABLED;
  return raw === "true";
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
  return id === "ETH" || id === "MON" || id === "BASE";
}

export function isDeliveryAssetSelectable(id: DepotAssetId): boolean {
  const row = getDeliveryAssetCatalog().find((a) => a.id === id);
  return Boolean(row && !row.comingSoon);
}
