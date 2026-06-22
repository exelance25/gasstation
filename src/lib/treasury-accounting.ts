import type { GasDeliveryAsset } from "@/config/depot-assets";
import type { AmountOption } from "@/lib/pricing";
import {
  getEffectiveNetworkFeeUsd,
  getEffectiveProtocolProfitRate,
  ORACLE_CONSERVATIVE_BUFFER,
  type LivePrices,
} from "@/lib/oracle/live-prices";

export type PackageAccounting = {
  packageUsd: number;
  protocolFeeUsd: number;
  networkFeeUsd: number;
  netUsdForGas: number;
  treasuryRetainedUsd: number;
};

export type TreasuryVaultNetworks = {
  ethereum: { vaultLabel: string };
  base: { vaultLabel: string };
  monad: { vaultLabel: string };
  solana: { vaultLabel: string };
};

/** USDC girişi → kasada kalan + gas için ayrılan net tutar */
export function computePackageAccounting(packageUsd: AmountOption): PackageAccounting {
  const protocolRate = getEffectiveProtocolProfitRate();
  const protocolFeeUsd = packageUsd * protocolRate;
  const networkFeeUsd = getEffectiveNetworkFeeUsd();
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
    case "USDC":
      return 1;
    case "ETH":
    default:
      return prices.ETH_Price * buffer;
  }
}

export function computeGasAmountFromPackage(
  packageUsd: AmountOption,
  asset: GasDeliveryAsset,
  prices: LivePrices,
  conservative: boolean,
): { gasAmount: number; accounting: PackageAccounting } {
  const accounting = computePackageAccounting(packageUsd);
  const price = getAssetUsdPrice(asset, prices, conservative);
  const gasAmount = price > 0 ? accounting.netUsdForGas / price : 0;
  return { gasAmount: Math.max(0, gasAmount), accounting };
}

/** Teslimat öncesi: piyasa değeri net gas bütçesini aşamaz */
export function assertProfitableDispense(
  packageUsd: AmountOption,
  gasAmount: number,
  asset: GasDeliveryAsset,
  prices: LivePrices,
): void {
  const accounting = computePackageAccounting(packageUsd);
  const marketPrice = getAssetUsdPrice(asset, prices, false);
  const gasUsdAtMarket = gasAmount * marketPrice;
  const maxAllowed = accounting.netUsdForGas + 0.0001;

  if (gasUsdAtMarket > maxAllowed) {
    throw new Error(
      `Kasa koruması: ${asset} teslimatı $${gasUsdAtMarket.toFixed(4)} > net bütçe $${accounting.netUsdForGas.toFixed(2)}`,
    );
  }
}
