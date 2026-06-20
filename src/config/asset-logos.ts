import type { CheckoutAssetId } from "@/config/checkout-assets";
import type { DepotAssetId } from "@/config/depot-assets";

/** Resmi / yaygın token logoları (CoinGecko CDN + yerel Monad) */
export const ASSET_LOGO_SRC: Record<CheckoutAssetId | DepotAssetId, string> = {
  USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "/assets/solana.svg",
  BASE: "/assets/base.svg",
  MON: "/assets/monad.svg",
  ARB: "https://assets.coingecko.com/coins/images/16547/small/arb.png",
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
};
