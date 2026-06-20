import { STUB_ORACLE_PRICES, STUB_ORACLE_SOURCE } from "@/lib/oracle/stub-prices";
import type { AmountOption } from "@/lib/pricing";
import type { GasDeliveryAsset } from "@/config/depot-assets";
import {
  quoteFromTick,
  type OraclePackageQuote,
  type OracleTick,
} from "@/server/oracle/oracle-service";

const LOCK_MS = 10_000;

/** Senkron stub tick — asla throw etmez */
export function buildStubOracleTick(): OracleTick {
  const now = Date.now();
  return {
    ...STUB_ORACLE_PRICES,
    source: STUB_ORACLE_SOURCE,
    updatedAt: new Date().toISOString(),
    roundId: `rnd-stub-${now.toString(36)}`,
    lockedUntil: new Date(now + LOCK_MS).toISOString(),
  };
}

/** Quote route / API için garantili 200 yanıt */
export function buildFallbackOracleQuote(
  packageUsd: AmountOption,
  deliveryAsset: GasDeliveryAsset,
): OraclePackageQuote {
  const tick = buildStubOracleTick();
  return {
    ...quoteFromTick(packageUsd, deliveryAsset, tick),
    oracle: tick,
  };
}
