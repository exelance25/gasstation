import { MONAD_BRAND } from "@/config/monad-brand";

/** On-chain gas teslimi desteklenen ağlar */
export type GasDeliveryAsset = "ETH" | "MON" | "BASE" | "SOL";

/** UI'da listelenen tüm gas seçenekleri (yakında olanlar dahil) */
export type DepotAssetId = GasDeliveryAsset | "ARB" | "BTC";

export const POOL_CAPACITY_USD = 100;

export type DepotAsset = {
  id: DepotAssetId;
  label: string;
  colorFrom: string;
  colorTo: string;
  accent: string;
  solanaGradient?: boolean;
  /** Seçilemez — yakında entegrasyon */
  comingSoon?: boolean;
};

export const DEPOT_ASSETS: DepotAsset[] = [
  {
    id: "ETH",
    label: "ETH",
    colorFrom: "#627EEA",
    colorTo: "#3B5CCC",
    accent: "rgba(98,126,234,0.35)",
  },
  {
    id: "MON",
    label: "MON",
    colorFrom: MONAD_BRAND.primary,
    colorTo: MONAD_BRAND.primaryDark,
    accent: MONAD_BRAND.accent,
  },
  {
    id: "BASE",
    label: "BASE",
    colorFrom: "#0052FF",
    colorTo: "#0039B3",
    accent: "rgba(0,82,255,0.35)",
  },
  {
    id: "ARB",
    label: "ARB",
    colorFrom: "#28A0F0",
    colorTo: "#1B4F72",
    accent: "rgba(40,160,240,0.35)",
    comingSoon: true,
  },
  {
    id: "BTC",
    label: "BTC",
    colorFrom: "#F7931A",
    colorTo: "#C77800",
    accent: "rgba(247,147,26,0.35)",
    comingSoon: true,
  },
  {
    id: "SOL",
    label: "SOL",
    colorFrom: "#9945FF",
    colorTo: "#14F195",
    accent: "rgba(153,69,255,0.35)",
    solanaGradient: true,
    comingSoon: true,
  },
];

export function getDepotAsset(id: DepotAssetId): DepotAsset {
  return DEPOT_ASSETS.find((a) => a.id === id) ?? DEPOT_ASSETS[0];
}

export function isActiveGasDeliveryAsset(id: DepotAssetId): id is GasDeliveryAsset {
  return id === "ETH" || id === "MON" || id === "BASE" || id === "SOL";
}
