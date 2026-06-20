import {
  getEffectiveNetworkFeeUsd,
  getEffectiveProtocolProfitRate,
  ORACLE_CONSERVATIVE_BUFFER,
  type LivePrices,
} from "@/lib/oracle/live-prices";
import { MAX_ORDER_USD } from "@/config/payment-assets";
import { computeGasAmountFromPackage, computePackageAccounting } from "@/lib/treasury-accounting";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { parseEther } from "viem";

/** Planlanan min/max — henüz UI/API'de zorunlu değil */
export const MIN_PACKAGE_USD = 0;
export const MAX_PACKAGE_USD = MAX_ORDER_USD;

/** @deprecated Sabit paket yok — serbest miktar */
export const AMOUNT_OPTIONS = [] as const;

/** Ödeme / paket tutarı (USDC veya eşdeğeri) */
export type AmountOption = number;

export function roundPackageUsd(usd: number): number {
  return Math.round(usd * 1_000_000) / 1_000_000;
}

/** Pozitif tutar — $1–$50 sınırı sonra eklenecek */
export function isValidPackageUsd(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isAmountOption(value: number): value is AmountOption {
  return isValidPackageUsd(value);
}

/** Serbest miktar — yalnızca > 0 */
export function isValidDeliveryAmount(
  amount: number,
  _asset: GasDeliveryAsset,
): boolean {
  return Number.isFinite(amount) && amount > 0;
}

export function formatPackageUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

export function isPackageAffordable(balanceUsd: number, packageUsd: number): boolean {
  return balanceUsd >= packageUsd - 1e-9;
}

export function getAffordablePackages(balanceUsd: number): number[] {
  if (balanceUsd <= 0) return [];
  return isValidPackageUsd(balanceUsd) ? [balanceUsd] : [];
}

export type { GasDeliveryAsset };

export interface PackageQuote {
  packageUsd: number;
  protocolFeeUsd: number;
  networkFeeUsd: number;
  netUsdForGas: number;
  treasuryRetainedUsd?: number;
  deliveryAsset: GasDeliveryAsset;
  estimatedGasAmount: number;
  contractGasWei: bigint;
  ethPrice: number;
  basePrice: number;
  monPrice: number;
  solPrice: number;
}

function getAssetUsdPrice(
  asset: GasDeliveryAsset,
  prices: LivePrices,
  conservative: boolean,
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

/** İstenen gas miktarından ödenecek tutarı hesapla (canlı fiyat + arbitraj buffer) */
export function computePackageUsdFromDeliveryAmount(
  gasAmount: number,
  asset: GasDeliveryAsset,
  prices: LivePrices,
): number {
  const price = getAssetUsdPrice(asset, prices, true);
  const netUsdForGas = gasAmount * price;
  const protocolRate = getEffectiveProtocolProfitRate();
  const networkFee = getEffectiveNetworkFeeUsd();
  const packageUsd =
    protocolRate >= 1
      ? netUsdForGas + networkFee
      : (netUsdForGas + networkFee) / (1 - protocolRate);
  return roundPackageUsd(Math.max(0, packageUsd));
}

export async function calculatePackageQuote(
  packageUsd: number,
  deliveryAsset: GasDeliveryAsset = "ETH",
  cachedPrices?: Awaited<ReturnType<typeof import("@/lib/oracle/live-prices").getLivePrices>>,
): Promise<PackageQuote> {
  const { getLivePrices } = await import("@/lib/oracle/live-prices");
  const prices = cachedPrices ?? (await getLivePrices());
  const accounting = computePackageAccounting(packageUsd);
  const { gasAmount } = computeGasAmountFromPackage(
    packageUsd,
    deliveryAsset,
    prices,
    false,
  );

  const ethForPool =
    deliveryAsset === "MON"
      ? (gasAmount * prices.MON_Price) / prices.ETH_Price
      : deliveryAsset === "SOL"
        ? 0
        : gasAmount;

  const contractGasWei =
    ethForPool > 0 ? parseEther(ethForPool.toFixed(18)) : 0n;

  return {
    packageUsd,
    protocolFeeUsd: accounting.protocolFeeUsd,
    networkFeeUsd: accounting.networkFeeUsd,
    netUsdForGas: accounting.netUsdForGas,
    treasuryRetainedUsd: accounting.treasuryRetainedUsd,
    deliveryAsset,
    estimatedGasAmount: gasAmount,
    contractGasWei,
    ethPrice: prices.ETH_Price,
    basePrice: prices.BASE_Price,
    monPrice: prices.MON_Price,
    solPrice: prices.SOL_Price,
  };
}

export async function calculatePackageQuoteFromDelivery(
  gasAmount: number,
  deliveryAsset: GasDeliveryAsset,
  cachedPrices?: Awaited<ReturnType<typeof import("@/lib/oracle/live-prices").getLivePrices>>,
): Promise<PackageQuote> {
  const { getLivePrices } = await import("@/lib/oracle/live-prices");
  const prices = cachedPrices ?? (await getLivePrices());
  const packageUsd = computePackageUsdFromDeliveryAmount(gasAmount, deliveryAsset, prices);
  const quote = await calculatePackageQuote(packageUsd, deliveryAsset, prices);
  return { ...quote, estimatedGasAmount: gasAmount };
}

/** Kasadan teslim edilecek tahmini gas — dispense ile aynı muhafazakâr fiyat */
export function computeConservativeDeliveryAmount(quote: PackageQuote): number {
  const { gasAmount } = computeGasAmountFromPackage(
    quote.packageUsd,
    quote.deliveryAsset,
    {
      ETH_Price: quote.ethPrice,
      BASE_Price: quote.basePrice,
      MON_Price: quote.monPrice,
      SOL_Price: quote.solPrice,
    },
    true,
  );
  return gasAmount;
}

export function formatGasDeliveryAmount(
  amount: number,
  asset: GasDeliveryAsset,
): string {
  return amount.toFixed(asset === "SOL" ? 4 : 6);
}

/** @deprecated use calculatePackageQuote */
export interface GasEstimate {
  usdAmount: number;
  netUsd: number;
  estimatedMonad: number;
  rate: number;
  feeUsd: number;
}

/** @deprecated use calculatePackageQuote */
export async function calculateGasEstimate(
  usdAmount: number,
  monUsdRate = 0.026,
): Promise<GasEstimate> {
  const quote = await calculatePackageQuote(usdAmount, "MON");
  return {
    usdAmount,
    netUsd: quote.netUsdForGas,
    estimatedMonad: quote.estimatedGasAmount,
    rate: monUsdRate,
    feeUsd: quote.protocolFeeUsd,
  };
}
