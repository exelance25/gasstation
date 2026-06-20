import type { LivePrices } from "@/lib/oracle/live-prices";
import { normalizeLivePrices } from "@/lib/oracle/live-prices";
import { STUB_ORACLE_PRICES } from "@/lib/oracle/stub-prices";

/** Pyth Hermes — ETH/USD */
const PYTH_ETH_USD =
  "0xff61491a931112ddf1bd8147cd1b641375f79f5826404a55845f75afb5e8561e";

const HERMES = "https://hermes.pyth.network/v2/updates/price/latest";
const COINGECKO_SIMPLE =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,monad&vs_currencies=usd";

function parsePythPrice(price: number, expo: number): number {
  return price * 10 ** expo;
}

async function fetchPythEthUsd(): Promise<number | null> {
  try {
    const url = `${HERMES}?ids[]=${PYTH_ETH_USD}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      parsed?: Array<{ price?: { price: string; expo: number } }>;
    };
    const tick = json.parsed?.[0]?.price;
    if (!tick) return null;
    const px = parsePythPrice(Number(tick.price), tick.expo);
    return px > 0 ? px : null;
  } catch {
    return null;
  }
}

type CoinGeckoRow = {
  ethereum?: { usd?: number };
  solana?: { usd?: number };
  monad?: { usd?: number };
};

async function fetchCoinGeckoMarket(): Promise<Partial<LivePrices> | null> {
  try {
    const res = await fetch(COINGECKO_SIMPLE, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as CoinGeckoRow;
    const eth = json.ethereum?.usd;
    const sol = json.solana?.usd;
    const mon = json.monad?.usd;
    if (!eth && !sol && !mon) return null;
    const ethPx = eth && eth > 0 ? eth : undefined;
    return {
      ETH_Price: ethPx,
      BASE_Price: ethPx,
      SOL_Price: sol && sol > 0 ? sol : undefined,
      MON_Price: mon && mon > 0 ? mon : undefined,
      USDC_Price: 1,
    };
  } catch {
    return null;
  }
}

/**
 * Canlı piyasa — Pyth (ETH) + CoinGecko (ETH/SOL/MON yedek).
 * BASE native = ETH fiyatı.
 */
export async function fetchOraclePrices(): Promise<LivePrices & { source: string }> {
  try {
    const [pythEth, cg] = await Promise.all([fetchPythEthUsd(), fetchCoinGeckoMarket()]);

    const eth = pythEth ?? cg?.ETH_Price ?? null;
    const sol = cg?.SOL_Price ?? null;
    const mon = cg?.MON_Price ?? null;

    if (!eth) {
      return { ...STUB_ORACLE_PRICES, source: "stub" };
    }

    const normalized = normalizeLivePrices({
      ETH_Price: eth,
      BASE_Price: eth,
      SOL_Price: sol ?? STUB_ORACLE_PRICES.SOL_Price,
      MON_Price: mon ?? STUB_ORACLE_PRICES.MON_Price,
      USDC_Price: 1,
    });

    const sources: string[] = [];
    if (pythEth) sources.push("pyth");
    if (cg) sources.push("coingecko");

    return {
      ...normalized,
      source: sources.length ? sources.join("+") : "stub",
    };
  } catch {
    return { ...STUB_ORACLE_PRICES, source: "stub" };
  }
}
