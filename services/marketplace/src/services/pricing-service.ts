import type { DeliveryAsset, DeliveryChain, PackageAmount } from "../types/order.js";
import { DELIVERY_ASSET_BY_CHAIN } from "../types/order.js";
import { fetchQuoteEnginePricing } from "./quote-bridge.js";
import { getEnv } from "../config/env.js";

const STUB_PRICES: Record<DeliveryAsset, number> = {
  ETH: 3500,
  BASE: 3500,
  MON: 0.026,
  SOL: 180,
};

const PROTOCOL_FEE_RATE = 0.1; // @config/protocol-fees PROTOCOL_PROFIT_RATE ile uyumlu
const NETWORK_FEE_USD = 0.02;

export type PricingQuote = {
  packageUsd: PackageAmount;
  deliveryAsset: DeliveryAsset;
  deliveryAmount: number;
  protocolFeeUsd: number;
  networkFeeUsd: number;
  netUsdForGas: number;
};

export async function fetchOracleQuote(
  packageUsd: PackageAmount,
  deliveryAsset: DeliveryAsset,
  destinationChain?: DeliveryChain,
): Promise<PricingQuote> {
  if (destinationChain) {
    const fromQuoteEngine = await fetchQuoteEnginePricing({
      packageUsd,
      destinationChain,
      deliveryAsset,
    });
    if (fromQuoteEngine) {
      const protocolFeeUsd = packageUsd * PROTOCOL_FEE_RATE;
      return {
        packageUsd,
        deliveryAsset,
        deliveryAmount: fromQuoteEngine.deliveryAmount,
        protocolFeeUsd,
        networkFeeUsd: NETWORK_FEE_USD,
        netUsdForGas: packageUsd - protocolFeeUsd - NETWORK_FEE_USD,
      };
    }
  }

  try {
    const url = new URL(getEnv().ORACLE_API_URL);
    url.searchParams.set("package", String(packageUsd));
    url.searchParams.set("asset", deliveryAsset);
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = (await res.json()) as {
        estimatedGasAmount?: number;
        netUsdForGas?: number;
        protocolFeeUsd?: number;
        networkFeeUsd?: number;
      };
      if (data.estimatedGasAmount && data.estimatedGasAmount > 0) {
        return {
          packageUsd,
          deliveryAsset,
          deliveryAmount: data.estimatedGasAmount,
          protocolFeeUsd: data.protocolFeeUsd ?? packageUsd * PROTOCOL_FEE_RATE,
          networkFeeUsd: data.networkFeeUsd ?? NETWORK_FEE_USD,
          netUsdForGas: data.netUsdForGas ?? packageUsd - NETWORK_FEE_USD,
        };
      }
    }
  } catch {
    // fallback below
  }
  return computeLocalQuote(packageUsd, deliveryAsset);
}

export function computeLocalQuote(
  packageUsd: PackageAmount,
  deliveryAsset: DeliveryAsset,
): PricingQuote {
  const protocolFeeUsd = packageUsd * PROTOCOL_FEE_RATE;
  const netUsdForGas = packageUsd - protocolFeeUsd - NETWORK_FEE_USD;
  const price = STUB_PRICES[deliveryAsset];
  const deliveryAmount =
    deliveryAsset === "BASE"
      ? netUsdForGas / STUB_PRICES.ETH
      : netUsdForGas / price;

  return {
    packageUsd,
    deliveryAsset,
    deliveryAmount: Math.max(deliveryAmount, 0.000001),
    protocolFeeUsd,
    networkFeeUsd: NETWORK_FEE_USD,
    netUsdForGas,
  };
}

export function resolveDeliveryAsset(chain: DeliveryChain): DeliveryAsset {
  return DELIVERY_ASSET_BY_CHAIN[chain];
}
