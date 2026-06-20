import { fetchOraclePrices } from "@/lib/oracle/pyth-oracle";
import { STUB_ORACLE_PRICES } from "@/lib/oracle/stub-prices";
import {
  NETWORK_FEE_USD,
  normalizeLivePrices,
  type LivePrices,
} from "@/lib/oracle/live-prices";
import {
  computeGasAmountFromPackage,
  computePackageAccounting,
} from "@/lib/treasury-accounting";
import type { AmountOption } from "@/lib/pricing";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import { parseEther } from "viem";

export type OracleSource = "pyth+coingecko" | "pyth" | "coingecko" | "stub" | string;

export type OracleTick = LivePrices & {
  source: OracleSource;
  updatedAt: string;
  roundId: string;
  lockedUntil: string;
};

export type OraclePackageQuote = {
  packageUsd: AmountOption;
  deliveryAsset: GasDeliveryAsset;
  protocolFeeUsd: number;
  networkFeeUsd: number;
  netUsdForGas: number;
  treasuryRetainedUsd: number;
  estimatedGasAmount: number;
  contractGasWei: string;
  ethPrice: number;
  basePrice: number;
  monPrice: number;
  solPrice: number;
  oracle: OracleTick;
};

const LOCK_MS = 5_000;

let cachedTick: OracleTick | null = null;
let cachedAt = 0;

function nextRoundId(): string {
  return `rnd-${Date.now().toString(36)}`;
}

export async function getOracleTick(force = false): Promise<OracleTick> {
  const now = Date.now();
  if (!force && cachedTick && now - cachedAt < LOCK_MS) {
    return cachedTick;
  }

  let raw: Awaited<ReturnType<typeof fetchOraclePrices>>;
  try {
    raw = await fetchOraclePrices();
  } catch {
    raw = { ...STUB_ORACLE_PRICES, source: "stub" };
  }

  const prices = normalizeLivePrices(raw);

  const tick: OracleTick = {
    ...prices,
    source: (raw.source as OracleSource) || "stub",
    updatedAt: new Date().toISOString(),
    roundId: nextRoundId(),
    lockedUntil: new Date(now + LOCK_MS).toISOString(),
  };

  cachedTick = tick;
  cachedAt = now;
  return tick;
}

export function quoteFromTick(
  packageUsd: AmountOption,
  deliveryAsset: GasDeliveryAsset,
  tick: OracleTick,
  options?: { conservative?: boolean },
): Omit<OraclePackageQuote, "oracle"> {
  const conservative = options?.conservative ?? false;
  const accounting = computePackageAccounting(packageUsd);
  const { gasAmount } = computeGasAmountFromPackage(
    packageUsd,
    deliveryAsset,
    tick,
    conservative,
  );

  const ethForPool =
    deliveryAsset === "MON"
      ? (gasAmount * tick.MON_Price) / tick.ETH_Price
      : deliveryAsset === "SOL"
        ? 0
        : gasAmount;

  let contractGasWei = "0";
  if (ethForPool > 0 && Number.isFinite(ethForPool)) {
    try {
      contractGasWei = parseEther(ethForPool.toFixed(18)).toString();
    } catch {
      contractGasWei = "0";
    }
  }

  return {
    packageUsd,
    deliveryAsset,
    protocolFeeUsd: accounting.protocolFeeUsd,
    networkFeeUsd: NETWORK_FEE_USD,
    netUsdForGas: accounting.netUsdForGas,
    treasuryRetainedUsd: accounting.treasuryRetainedUsd,
    estimatedGasAmount: gasAmount,
    contractGasWei,
    ethPrice: tick.ETH_Price,
    basePrice: tick.BASE_Price,
    monPrice: tick.MON_Price,
    solPrice: tick.SOL_Price,
  };
}

/** UI — canlı piyasa fiyatı ile tahmin */
export async function getOraclePackageQuote(
  packageUsd: AmountOption,
  deliveryAsset: GasDeliveryAsset,
): Promise<OraclePackageQuote> {
  const tick = await getOracleTick();
  return { ...quoteFromTick(packageUsd, deliveryAsset, tick, { conservative: false }), oracle: tick };
}

/** Gas teslimat — muhafazakâr fiyat + kasa koruması */
export async function getConservativeDispenseQuote(
  packageUsd: AmountOption,
  deliveryAsset: GasDeliveryAsset,
): Promise<OraclePackageQuote> {
  const tick = await getOracleTick(true);
  return { ...quoteFromTick(packageUsd, deliveryAsset, tick, { conservative: true }), oracle: tick };
}
