import {
  getEffectiveNetworkFeeUsd,
  getEffectiveProtocolProfitRate,
  ORACLE_CONSERVATIVE_BUFFER,
  type PricingEnv,
} from "./constants.js";
import type { GasDeliveryAsset, LivePrices } from "./types.js";

export type PackageAccounting = {
  packageUsd: number;
  protocolFeeUsd: number;
  networkFeeUsd: number;
  netUsdForGas: number;
  treasuryRetainedUsd: number;
};

export function computePackageAccounting(
  packageUsd: number,
  env: PricingEnv = "testnet",
): PackageAccounting {
  const protocolRate = getEffectiveProtocolProfitRate(env);
  const protocolFeeUsd = packageUsd * protocolRate;
  const networkFeeUsd = getEffectiveNetworkFeeUsd(env);
  const netUsdForGas = Math.max(0, packageUsd - protocolFeeUsd - networkFeeUsd);
  return {
    packageUsd,
    protocolFeeUsd,
    networkFeeUsd,
    netUsdForGas,
    treasuryRetainedUsd: protocolFeeUsd + networkFeeUsd,
  };
}

export function getAssetUsdPrice(
  asset: GasDeliveryAsset,
  prices: LivePrices,
  conservative = false,
): number {
  const buffer = conservative ? 1 + ORACLE_CONSERVATIVE_BUFFER : 1;
  switch (asset) {
    case "MON":
      return prices.MON_Price * buffer;
    case "SOL":
      return prices.SOL_Price * buffer;
    case "BASE":
      return prices.BASE_Price * buffer;
    case "ETH":
    default:
      return prices.ETH_Price * buffer;
  }
}

export function computeGasAmountFromPackage(
  packageUsd: number,
  asset: GasDeliveryAsset,
  prices: LivePrices,
  conservative: boolean,
  env: PricingEnv = "testnet",
): { gasAmount: number; accounting: PackageAccounting } {
  const accounting = computePackageAccounting(packageUsd, env);
  const price = getAssetUsdPrice(asset, prices, conservative);
  const gasAmount = price > 0 ? accounting.netUsdForGas / price : 0;
  return { gasAmount: Math.max(0, gasAmount), accounting };
}

export function assertProfitableDispense(
  packageUsd: number,
  gasAmount: number,
  asset: GasDeliveryAsset,
  prices: LivePrices,
  env: PricingEnv = "testnet",
): void {
  const accounting = computePackageAccounting(packageUsd, env);
  const marketPrice = getAssetUsdPrice(asset, prices, false);
  const gasUsdAtMarket = gasAmount * marketPrice;
  const maxAllowed = accounting.netUsdForGas + 0.0001;

  if (gasUsdAtMarket > maxAllowed) {
    throw new Error(
      `Treasury guard: ${asset} delivery $${gasUsdAtMarket.toFixed(4)} > net budget $${accounting.netUsdForGas.toFixed(2)}`,
    );
  }
}
