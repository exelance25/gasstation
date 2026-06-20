import { parseEther } from "viem";
import {
  getEffectiveNetworkFeeUsd,
  getEffectiveProtocolProfitRate,
  ORACLE_CONSERVATIVE_BUFFER,
  PROTOCOL_PROFIT_RATE,
  NETWORK_FEE_USD,
  TESTNET_AMOUNT_OPTIONS,
  type PricingEnv,
} from "./constants.js";
import {
  computeGasAmountFromPackage,
  computePackageAccounting,
  getAssetUsdPrice,
} from "./treasury-accounting.js";
import type { GasDeliveryAsset, LivePrices } from "./types.js";

export {
  PROTOCOL_PROFIT_RATE,
  NETWORK_FEE_USD,
  ORACLE_CONSERVATIVE_BUFFER,
  TESTNET_AMOUNT_OPTIONS,
};

/** @deprecated TESTNET_AMOUNT_OPTIONS kullanın — geriye uyumluluk */
export const AMOUNT_OPTIONS = TESTNET_AMOUNT_OPTIONS;

export type AmountOption = number;

export const DEFAULT_STUB_PRICES: LivePrices = {
  ETH_Price: 3500,
  BASE_Price: 3500,
  MON_Price: 0.026,
  SOL_Price: 145,
  USDC_Price: 1.0,
};

export const MIN_USDC_BALANCE = 0.05;

export interface PackageQuote {
  packageUsd: number;
  protocolFeeUsd: number;
  networkFeeUsd: number;
  netUsdForGas: number;
  treasuryRetainedUsd: number;
  deliveryAsset: GasDeliveryAsset;
  estimatedGasAmount: number;
  /** Muhafazakâr dispense tahmini — kasadan gerçekte gidecek miktar */
  conservativeDeliveryAmount: number;
  contractGasWei: bigint;
  ethPrice: number;
  basePrice: number;
  monPrice: number;
  solPrice: number;
}

export type QuoteOptions = {
  prices?: LivePrices;
  env?: PricingEnv;
  /** true = dispense ile aynı muhafazakâr fiyat */
  conservative?: boolean;
};

export function roundPackageUsd(usd: number): number {
  return Math.round(usd * 1_000_000) / 1_000_000;
}

export function isValidPackageUsd(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isAmountOption(value: number): value is AmountOption {
  return isValidPackageUsd(value);
}

export function isValidDeliveryAmount(amount: number, _asset: GasDeliveryAsset): boolean {
  return Number.isFinite(amount) && amount > 0;
}

export function formatPackageUsd(usd: number): string {
  return usd < 1 ? `$${usd.toFixed(2)}` : `$${usd.toFixed(2)}`;
}

export function formatGasDeliveryAmount(amount: number, asset: GasDeliveryAsset): string {
  return amount.toFixed(asset === "SOL" ? 4 : 6);
}

/** İstenen gas miktarından ödenecek tutar (canlı fiyat + arbitraj buffer) */
export function computePackageUsdFromDeliveryAmount(
  gasAmount: number,
  asset: GasDeliveryAsset,
  prices: LivePrices,
  env: PricingEnv = "testnet",
): number {
  const price = getAssetUsdPrice(asset, prices, true);
  const netUsdForGas = gasAmount * price;
  const protocolRate = getEffectiveProtocolProfitRate(env);
  const networkFee = getEffectiveNetworkFeeUsd(env);
  const packageUsd =
    protocolRate >= 1
      ? netUsdForGas + networkFee
      : (netUsdForGas + networkFee) / (1 - protocolRate);
  return roundPackageUsd(Math.max(0, packageUsd));
}

function contractGasWeiForAsset(
  gasAmount: number,
  deliveryAsset: GasDeliveryAsset,
  prices: LivePrices,
): bigint {
  const ethForPool =
    deliveryAsset === "MON"
      ? (gasAmount * prices.MON_Price) / prices.ETH_Price
      : deliveryAsset === "SOL"
        ? 0
        : gasAmount;

  if (ethForPool <= 0 || !Number.isFinite(ethForPool)) return 0n;
  try {
    return parseEther(ethForPool.toFixed(18));
  } catch {
    return 0n;
  }
}

/** Senkron paket quote — ana uygulama calculatePackageQuote ile uyumlu */
export function calculatePackageQuoteSync(
  packageUsd: number,
  deliveryAsset: GasDeliveryAsset = "ETH",
  options?: QuoteOptions,
): PackageQuote {
  const prices = options?.prices ?? DEFAULT_STUB_PRICES;
  const env = options?.env ?? "testnet";
  const conservative = options?.conservative ?? false;

  const accounting = computePackageAccounting(packageUsd, env);
  const { gasAmount } = computeGasAmountFromPackage(
    packageUsd,
    deliveryAsset,
    prices,
    conservative,
    env,
  );
  const { gasAmount: conservativeAmount } = computeGasAmountFromPackage(
    packageUsd,
    deliveryAsset,
    prices,
    true,
    env,
  );

  return {
    packageUsd,
    protocolFeeUsd: accounting.protocolFeeUsd,
    networkFeeUsd: accounting.networkFeeUsd,
    netUsdForGas: accounting.netUsdForGas,
    treasuryRetainedUsd: accounting.treasuryRetainedUsd,
    deliveryAsset,
    estimatedGasAmount: gasAmount,
    conservativeDeliveryAmount: conservativeAmount,
    contractGasWei: contractGasWeiForAsset(gasAmount, deliveryAsset, prices),
    ethPrice: prices.ETH_Price,
    basePrice: prices.BASE_Price,
    monPrice: prices.MON_Price,
    solPrice: prices.SOL_Price,
  };
}

/** İstenen teslim miktarından quote — UI deliveryAmount sabitlenir */
export function calculatePackageQuoteFromDeliverySync(
  gasAmount: number,
  deliveryAsset: GasDeliveryAsset,
  options?: QuoteOptions,
): PackageQuote {
  const prices = options?.prices ?? DEFAULT_STUB_PRICES;
  const env = options?.env ?? "testnet";
  const packageUsd = computePackageUsdFromDeliveryAmount(gasAmount, deliveryAsset, prices, env);
  const quote = calculatePackageQuoteSync(packageUsd, deliveryAsset, { ...options, prices, env });
  return { ...quote, estimatedGasAmount: gasAmount };
}

export function computeConservativeDeliveryAmount(
  quote: Pick<PackageQuote, "packageUsd" | "deliveryAsset" | "ethPrice" | "basePrice" | "monPrice" | "solPrice">,
  env: PricingEnv = "testnet",
): number {
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
    env,
  );
  return gasAmount;
}
