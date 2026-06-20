import type { DepotAssetId } from "@/config/depot-assets";
import { MONAD_BRAND } from "@/config/monad-brand";

/** UI ödeme seçenekleri — on-chain token eşlemesi pool-tokens üzerinden */
export type CheckoutAssetId = "USDC" | DepotAssetId;

export type CheckoutAsset = {
  id: CheckoutAssetId;
  label: string;
  symbol: string;
  colorFrom: string;
  colorTo: string;
  accent: string;
  idleColor: string;
};

export const CHECKOUT_ASSETS: CheckoutAsset[] = [
  {
    id: "USDC",
    label: "USDC",
    symbol: "USDC",
    colorFrom: "#2775CA",
    colorTo: "#1E5AA8",
    accent: "rgba(39,117,202,0.28)",
    idleColor: "#2775CA",
  },
  {
    id: "ETH",
    label: "ETH",
    symbol: "ETH",
    colorFrom: "#627EEA",
    colorTo: "#3B5CCC",
    accent: "rgba(98,126,234,0.32)",
    idleColor: "#627EEA",
  },
  {
    id: "MON",
    label: "MON",
    symbol: "MON",
    colorFrom: MONAD_BRAND.primary,
    colorTo: MONAD_BRAND.primaryDark,
    accent: MONAD_BRAND.accent,
    idleColor: MONAD_BRAND.primary,
  },
  {
    id: "BASE",
    label: "BASE",
    symbol: "BASE",
    colorFrom: "#0052FF",
    colorTo: "#0039B3",
    accent: "rgba(0,82,255,0.28)",
    idleColor: "#0052FF",
  },
  {
    id: "SOL",
    label: "SOL",
    symbol: "SOL",
    colorFrom: "#9945FF",
    colorTo: "#14F195",
    accent: "rgba(153,69,255,0.28)",
    idleColor: "#9945FF",
  },
];

export function getCheckoutAsset(id: CheckoutAssetId): CheckoutAsset {
  return CHECKOUT_ASSETS.find((a) => a.id === id) ?? CHECKOUT_ASSETS[0];
}

export function checkoutToDeliveryAsset(id: CheckoutAssetId): DepotAssetId {
  if (id === "USDC") return "ETH";
  return id;
}
