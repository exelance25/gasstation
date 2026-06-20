import type { LivePrices } from "@/lib/oracle/live-prices";

/** Oracle stub — canlı feed başarısız olursa (zarar önleme: muhafazakâr varsayılanlar) */
export const STUB_ORACLE_PRICES: LivePrices = {
  ETH_Price: 3500,
  BASE_Price: 3500,
  MON_Price: 0.026,
  SOL_Price: 145,
  USDC_Price: 1.0,
};

export const STUB_ORACLE_SOURCE = "stub" as const;
