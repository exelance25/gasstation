import type { DeliveryAsset, DeliveryChain, PackageAmount } from "../types/order.js";
import { getEnv, isMainnet } from "../config/env.js";

const DEFAULT_GAS_WEI = String(21_000n * 50_000_000_000n);

function deliveryChainId(chain: DeliveryChain): string {
  if (chain === "solana") return isMainnet() ? "solana" : "solana-devnet";
  if (chain === "monad") return isMainnet() ? "monad" : "monad-testnet";
  if (chain === "base") return isMainnet() ? "base" : "base-sepolia";
  return isMainnet() ? "ethereum" : "ethereum-sepolia";
}

function paymentTokenForAsset(asset: DeliveryAsset): string {
  if (asset === "SOL") return "SOL";
  if (asset === "MON") return "MON";
  if (asset === "BASE") return "BASE";
  return "ETH";
}

/** Katman A — Quote Engine'den canlı fiyat (marketplace siparişleri) */
export async function fetchQuoteEnginePricing(params: {
  packageUsd: PackageAmount;
  destinationChain: DeliveryChain;
  deliveryAsset: DeliveryAsset;
}): Promise<{
  deliveryAmount: number;
  gasCostUsd: number;
  paymentAmountFormatted: number;
} | null> {
  const base = getEnv().QUOTE_ENGINE_URL?.replace(/\/$/, "") ?? "http://localhost:4100";
  try {
    const res = await fetch(`${base}/v1/quote/fee`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chain: deliveryChainId(params.destinationChain),
        paymentToken: paymentTokenForAsset(params.deliveryAsset),
        gasEstimateWei: DEFAULT_GAS_WEI,
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as {
      gasCostUsd?: number;
      paymentAmountFormatted?: number;
      nativeGasToken?: string;
      gasEstimateWei?: string;
      error?: string;
    };
    if (!res.ok) return null;

    const gasCostUsd = data.gasCostUsd ?? params.packageUsd * 0.85;
    const wei = BigInt(data.gasEstimateWei ?? DEFAULT_GAS_WEI);
    const deliveryAmount =
      params.deliveryAsset === "SOL"
        ? Number(wei) / 1e9
        : Number(wei) / 1e18;

    return {
      deliveryAmount: Math.max(deliveryAmount, 0.000001),
      gasCostUsd,
      paymentAmountFormatted: data.paymentAmountFormatted ?? params.packageUsd,
    };
  } catch {
    return null;
  }
}
