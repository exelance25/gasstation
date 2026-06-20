import { parseEther } from "viem";
import { base, baseSepolia, mainnet, sepolia } from "viem/chains";
import { monadMainnet, monadTestnet } from "@config/evm-chains";
import type { PaySymbol } from "@/config/payment-assets";
import type { LivePrices } from "@/lib/oracle/live-prices";

/** Manuel modda kabul edilen ödeme tokenları */
export const MANUAL_PAY_SYMBOLS = ["USDC", "ETH", "BASE", "MON"] as const;
export type ManualPaySymbol = (typeof MANUAL_PAY_SYMBOLS)[number];

export function isManualPaySymbol(symbol: PaySymbol): symbol is ManualPaySymbol {
  return (MANUAL_PAY_SYMBOLS as readonly string[]).includes(symbol);
}

export function nativePaySymbolForChain(chainId: number): "ETH" | "BASE" | "MON" | null {
  if (chainId === sepolia.id || chainId === mainnet.id) return "ETH";
  if (chainId === baseSepolia.id || chainId === base.id) return "BASE";
  if (chainId === monadTestnet.id || chainId === monadMainnet.id) return "MON";
  return null;
}

export function usdPriceForPaySymbol(
  symbol: ManualPaySymbol,
  prices: LivePrices,
): number {
  switch (symbol) {
    case "USDC":
      return prices.USDC_Price;
    case "ETH":
      return prices.ETH_Price;
    case "BASE":
      return prices.BASE_Price;
    case "MON":
      return prices.MON_Price;
    default:
      return 1;
  }
}

export function computeNativePaymentWei(
  packageUsd: number,
  paySymbol: "ETH" | "BASE" | "MON",
  prices: LivePrices,
): bigint {
  const price = usdPriceForPaySymbol(paySymbol, prices);
  const nativeAmount = packageUsd / price;
  const fixed = paySymbol === "MON" ? nativeAmount.toFixed(8) : nativeAmount.toFixed(12);
  return parseEther(fixed);
}
