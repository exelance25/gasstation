export type LivePrices = {
  ETH_Price: number;
  /** Base L2 native gas — ETH ile aynı birim */
  BASE_Price: number;
  MON_Price: number;
  SOL_Price: number;
  USDC_Price: number;
};

export {
  NETWORK_FEE_USD,
  ORACLE_CONSERVATIVE_BUFFER,
  PROTOCOL_PROFIT_RATE,
  getEffectiveNetworkFeeUsd,
  getEffectiveProtocolProfitRate,
} from "@config/protocol-fees";

const STUB_PRICES: LivePrices = {
  ETH_Price: 3500,
  BASE_Price: 3500,
  MON_Price: 0.026,
  SOL_Price: 145,
  USDC_Price: 1.0,
};

/** Client → backend oracle API */
export async function getLivePrices(): Promise<LivePrices> {
  try {
    const base =
      typeof window !== "undefined"
        ? ""
        : process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api$/, "") ?? "";
    const res = await fetch(`${base}/api/oracle/prices`, {
      cache: "no-store",
    });
    if (!res.ok) return { ...STUB_PRICES };
    const data = (await res.json()) as LivePrices;
    return normalizeLivePrices(data);
  } catch {
    return { ...STUB_PRICES };
  }
}

export function normalizeLivePrices(data: Partial<LivePrices>): LivePrices {
  const eth = data.ETH_Price && data.ETH_Price > 0 ? data.ETH_Price : STUB_PRICES.ETH_Price;
  const base =
    data.BASE_Price && data.BASE_Price > 0 ? data.BASE_Price : eth;
  return {
    ETH_Price: eth,
    BASE_Price: base,
    MON_Price: data.MON_Price && data.MON_Price > 0 ? data.MON_Price : STUB_PRICES.MON_Price,
    SOL_Price: data.SOL_Price && data.SOL_Price > 0 ? data.SOL_Price : STUB_PRICES.SOL_Price,
    USDC_Price: data.USDC_Price && data.USDC_Price > 0 ? data.USDC_Price : 1,
  };
}
